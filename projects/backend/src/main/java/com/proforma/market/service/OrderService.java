package com.proforma.market.service;

import com.proforma.market.domain.EventType;
import com.proforma.market.domain.Order;
import com.proforma.market.domain.OrderItem;
import com.proforma.market.domain.OrderStatus;
import com.proforma.market.domain.Product;
import com.proforma.market.domain.ProductEvent;
import com.proforma.market.domain.User;
import com.proforma.market.dto.CheckoutRequest;
import com.proforma.market.dto.OrderDto;
import com.proforma.market.dto.OrderItemDto;
import com.proforma.market.repo.OrderRepository;
import com.proforma.market.repo.ProductEventRepository;
import com.proforma.market.repo.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class OrderService {

    private static final Set<String> PAYMENT_METHODS = Set.of("card", "upi", "netbanking");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductEventRepository eventRepository;

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        ProductEventRepository eventRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional
    public OrderDto create(User buyer, CheckoutRequest request) {
        String method = request.paymentMethod().trim().toLowerCase(Locale.ROOT);
        if (!PAYMENT_METHODS.contains(method)) {
            throw ApiException.badRequest("Choose a supported payment method");
        }

        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (CheckoutRequest.Line line : request.items()) {
            quantities.merge(line.productId(), line.quantity(), Integer::sum);
        }
        List<Product> locked = productRepository.findAllForUpdate(quantities.keySet());
        if (locked.size() != quantities.size()) {
            throw ApiException.notFound("One or more products are no longer available");
        }

        Map<Long, Product> products = new LinkedHashMap<>();
        for (Product product : locked) {
            products.put(product.getId(), product);
        }

        Order order = new Order();
        order.setBuyer(buyer);
        order.setStatus(OrderStatus.PAID);
        order.setPaymentMethod(method);
        order.setPaymentLabel(request.paymentLabel());
        order.setPaymentRef("PF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
        order.setShipName(request.shipping().name().trim());
        order.setShipPhone(request.shipping().phone().trim());
        order.setShipAddress(request.shipping().address().trim());
        order.setShipCity(request.shipping().city().trim());
        order.setShipState(request.shipping().state().trim());
        order.setShipPincode(request.shipping().pincode().trim());

        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
            Product product = products.get(entry.getKey());
            int quantity = entry.getValue();
            if (!product.isActive()) {
                throw ApiException.conflict(product.getName() + " is no longer available");
            }
            if (product.getStock() < quantity) {
                throw ApiException.conflict("Only " + product.getStock() + " " + product.getUnit()
                        + " of " + product.getName() + " left in stock");
            }

            product.setStock(product.getStock() - quantity);
            productRepository.save(product);

            OrderItem item = new OrderItem();
            item.setProduct(product);
            item.setSeller(product.getSeller());
            item.setProductName(product.getName());
            item.setUnitPrice(product.getPrice());
            item.setQuantity(quantity);
            order.addItem(item);

            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
        }
        BigDecimal payable = total.compareTo(new BigDecimal("999.00")) < 0
                ? total.add(new BigDecimal("79.00"))
                : total;
        order.setTotal(payable.setScale(2, RoundingMode.HALF_UP));
        orderRepository.save(order);

        List<ProductEvent> events = new ArrayList<>();
        for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
            ProductEvent event = new ProductEvent();
            event.setUser(buyer);
            event.setProduct(products.get(entry.getKey()));
            event.setType(EventType.PURCHASE);
            events.add(event);
        }
        eventRepository.saveAll(events);

        return toDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> mine(User buyer) {
        return orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    private OrderDto toDto(Order order) {
        List<OrderItemDto> items = order.getItems().stream()
                .map(item -> new OrderItemDto(
                        item.getProduct().getId(),
                        item.getProductName(),
                        item.getProduct().getUnit(),
                        item.getProduct().getCategory().label(),
                        item.getProduct().getImageUrl(),
                        item.getQuantity(),
                        item.getUnitPrice()
                ))
                .toList();
        return new OrderDto(
                order.getId(),
                order.getTotal(),
                order.getStatus().name(),
                order.getPaymentMethod(),
                order.getPaymentRef(),
                order.getPaymentLabel(),
                order.getCreatedAt(),
                order.getShipName(),
                order.getShipCity(),
                order.getShipState(),
                items
        );
    }
}