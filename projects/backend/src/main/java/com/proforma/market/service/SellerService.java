package com.proforma.market.service;

import com.proforma.market.domain.Category;
import com.proforma.market.domain.EventType;
import com.proforma.market.domain.Order;
import com.proforma.market.domain.OrderItem;
import com.proforma.market.domain.OrderStatus;
import com.proforma.market.domain.Product;
import com.proforma.market.domain.Role;
import com.proforma.market.domain.User;
import com.proforma.market.dto.ProductCard;
import com.proforma.market.dto.SellerDtos;
import com.proforma.market.repo.OrderItemRepository;
import com.proforma.market.repo.OrderRepository;
import com.proforma.market.repo.ProductEventRepository;
import com.proforma.market.repo.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SellerService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductEventRepository eventRepository;

    public SellerService(ProductRepository productRepository,
                         OrderRepository orderRepository,
                         OrderItemRepository orderItemRepository,
                         ProductEventRepository eventRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional(readOnly = true)
    public SellerDtos.Overview overview(User seller) {
        requireSeller(seller);
        List<Product> products = productRepository.findBySellerIdOrderByCreatedAtDesc(seller.getId());
        List<OrderItem> items = orderItemRepository.findBySellerId(seller.getId());
        List<OrderItem> live = liveItems(items);
        Set<Long> orderIds = live.stream().map(item -> item.getOrder().getId()).collect(Collectors.toSet());
        long views = products.stream().mapToLong(Product::getViewCount).sum();
        long carts = eventRepository.countByProduct_Seller_IdAndType(seller.getId(), EventType.CART);
        double conversion = views == 0 ? 0 : round2(orderIds.size() * 100.0 / views);

        return new SellerDtos.Overview(
                sum(live),
                orderIds.size(),
                products.size(),
                views,
                conversion,
                round1(products.stream().mapToDouble(Product::getRating).average().orElse(0)),
                revenueByMonth(live),
                topProducts(live, products, 5),
                buildOrders(items, 6)
        );
    }

    @Transactional(readOnly = true)
    public SellerDtos.Analytics analytics(User seller) {
        requireSeller(seller);
        List<Product> products = productRepository.findBySellerIdOrderByCreatedAtDesc(seller.getId());
        List<OrderItem> items = orderItemRepository.findBySellerId(seller.getId());
        List<OrderItem> live = liveItems(items);
        Set<Long> orderIds = live.stream().map(item -> item.getOrder().getId()).collect(Collectors.toSet());
        long views = products.stream().mapToLong(Product::getViewCount).sum();
        long carts = eventRepository.countByProduct_Seller_IdAndType(seller.getId(), EventType.CART);
        BigDecimal revenue = sum(live);
        double conversion = views == 0 ? 0 : round2(orderIds.size() * 100.0 / views);

        return new SellerDtos.Analytics(
                revenueByMonth(live),
                topProducts(live, products, 6),
                categoryShare(live, revenue),
                buyerRegions(live, revenue),
                List.of(
                        new SellerDtos.NamedValue("Product views", views),
                        new SellerDtos.NamedValue("Added to cart", carts),
                        new SellerDtos.NamedValue("Paid orders", orderIds.size())
                ),
                views,
                carts,
                orderIds.size(),
                conversion
        );
    }

    @Transactional(readOnly = true)
    public List<ProductCard> products(User seller) {
        requireSeller(seller);
        return productRepository.findBySellerIdOrderByCreatedAtDesc(seller.getId())
                .stream()
                .map(ProductMapper::toCard)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductCard product(Long id, User seller) {
        requireSeller(seller);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Product not found"));
        if (!product.getSeller().getId().equals(seller.getId())) {
            throw ApiException.forbidden("This listing belongs to another seller");
        }
        return ProductMapper.toCard(product);
    }

    @Transactional
    public ProductCard createProduct(User seller, SellerDtos.ProductUpsert request) {
        requireSeller(seller);
        Product product = new Product();
        product.setSeller(seller);
        applyFields(product, request, seller);
        product.setSlug(uniqueSlug(request.name()));
        product.setRating(0);
        product.setReviewCount(0);
        product.setViewCount(0);
        productRepository.save(product);
        return ProductMapper.toCard(product);
    }

    @Transactional
    public ProductCard updateProduct(Long id, User seller, SellerDtos.ProductUpsert request) {
        requireSeller(seller);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Product not found"));
        if (!product.getSeller().getId().equals(seller.getId())) {
            throw ApiException.forbidden("This listing belongs to another seller");
        }
        applyFields(product, request, seller);
        productRepository.save(product);
        return ProductMapper.toCard(product);
    }

    @Transactional(readOnly = true)
    public List<SellerDtos.SellerOrder> orders(User seller) {
        requireSeller(seller);
        return buildOrders(orderItemRepository.findBySellerId(seller.getId()), 100);
    }

    @Transactional
    public void updateOrderStatus(Long orderId, User seller, String status) {
        requireSeller(seller);
        OrderStatus next;
        try {
            next = OrderStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw ApiException.badRequest("Unknown order status");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Order not found"));
        boolean ownsLine = order.getItems().stream()
                .anyMatch(item -> item.getSeller().getId().equals(seller.getId()));
        if (!ownsLine) {
            throw ApiException.forbidden("This order does not include your products");
        }
        order.setStatus(next);
        orderRepository.save(order);
    }

    private void applyFields(Product product, SellerDtos.ProductUpsert request, User seller) {
        String name = request.name().trim();
        BigDecimal price = request.price();
        if (request.mrp() != null && request.mrp().compareTo(price) < 0) {
            throw ApiException.badRequest("MRP cannot be lower than the selling price");
        }
        product.setName(name);
        product.setCategory(request.category());
        product.setSubcategory(trimToNull(request.subcategory()));
        product.setDescription(request.description().trim());
        product.setPrice(price.setScale(2, RoundingMode.HALF_UP));
        product.setMrp(request.mrp() == null ? null : request.mrp().setScale(2, RoundingMode.HALF_UP));
        product.setUnit(request.unit().trim());
        product.setStock(request.stock());
        product.setImageUrl(safeImageUrl(request.imageUrl()));
        product.setLocation(trimToNull(request.location()) == null ? seller.locationLabel() : request.location().trim());
        product.setTags(joinTags(request.tags()));
        product.setFeatured(request.featured());
        product.setActive(request.active());
    }

    private List<SellerDtos.MonthPoint> revenueByMonth(List<OrderItem> items) {
        YearMonth now = YearMonth.now(ZoneOffset.UTC);
        YearMonth start = now.minusMonths(5);
        Map<String, BigDecimal> buckets = new LinkedHashMap<>();
        for (int index = 0; index < 6; index++) {
            buckets.put(start.plusMonths(index).toString(), BigDecimal.ZERO);
        }
        for (OrderItem item : items) {
            YearMonth month = YearMonth.from(item.getOrder().getCreatedAt().atZone(ZoneOffset.UTC));
            String key = month.toString();
            if (buckets.containsKey(key)) {
                buckets.merge(key, lineRevenue(item), BigDecimal::add);
            }
        }
        List<SellerDtos.MonthPoint> points = new ArrayList<>();
        buckets.forEach((month, value) -> points.add(
                new SellerDtos.MonthPoint(month, value.setScale(2, RoundingMode.HALF_UP))));
        return points;
    }

    private List<SellerDtos.TopProduct> topProducts(List<OrderItem> items, List<Product> products, int limit) {
        Map<Long, Long> units = new HashMap<>();
        Map<Long, BigDecimal> revenue = new HashMap<>();
        for (OrderItem item : items) {
            Long productId = item.getProduct().getId();
            units.merge(productId, (long) item.getQuantity(), Long::sum);
            revenue.merge(productId, lineRevenue(item), BigDecimal::add);
        }
        Map<Long, Product> byId = products.stream()
                .collect(Collectors.toMap(Product::getId, product -> product, (left, right) -> left));
        return revenue.entrySet().stream()
                .sorted(Map.Entry.<Long, BigDecimal>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Product product = byId.get(entry.getKey());
                    if (product == null) {
                        return null;
                    }
                    return new SellerDtos.TopProduct(
                            product.getId(),
                            product.getName(),
                            product.getCategory().label(),
                            units.getOrDefault(product.getId(), 0L),
                            entry.getValue().setScale(2, RoundingMode.HALF_UP),
                            product.getViewCount()
                    );
                })
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    private List<SellerDtos.NamedValue> categoryShare(List<OrderItem> items, BigDecimal revenue) {
        Map<Category, BigDecimal> byCategory = new HashMap<>();
        for (OrderItem item : items) {
            byCategory.merge(item.getProduct().getCategory(), lineRevenue(item), BigDecimal::add);
        }
        return byCategory.entrySet().stream()
                .sorted(Map.Entry.<Category, BigDecimal>comparingByValue().reversed())
                .map(entry -> new SellerDtos.NamedValue(
                        entry.getKey().label(),
                        revenue.signum() == 0 ? 0
                                : round1(entry.getValue().doubleValue() * 100.0 / revenue.doubleValue())))
                .toList();
    }

    private List<SellerDtos.NamedValue> buyerRegions(List<OrderItem> items, BigDecimal revenue) {
        Map<String, BigDecimal> byState = new HashMap<>();
        for (OrderItem item : items) {
            String state = item.getOrder().getShipState();
            byState.merge(state == null ? "Unknown" : state, lineRevenue(item), BigDecimal::add);
        }
        return byState.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .map(entry -> new SellerDtos.NamedValue(
                        entry.getKey(),
                        revenue.signum() == 0 ? 0
                                : round1(entry.getValue().doubleValue() * 100.0 / revenue.doubleValue())))
                .toList();
    }

    private List<SellerDtos.SellerOrder> buildOrders(List<OrderItem> items, int limit) {
        Map<Long, List<OrderItem>> grouped = items.stream()
                .collect(Collectors.groupingBy(
                        item -> item.getOrder().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()));

        return grouped.values().stream()
                .limit(limit)
                .map(lines -> {
                    Order order = lines.get(0).getOrder();
                    BigDecimal total = lines.stream().map(this::lineRevenue).reduce(BigDecimal.ZERO, BigDecimal::add);
                    List<SellerDtos.SellerOrderItem> orderItems = lines.stream()
                            .map(item -> new SellerDtos.SellerOrderItem(
                                    item.getProduct().getId(),
                                    item.getProductName(),
                                    item.getQuantity(),
                                    item.getUnitPrice(),
                                    item.getProduct().getImageUrl()))
                            .toList();
                    return new SellerDtos.SellerOrder(
                            order.getId(),
                            order.getBuyer().getName(),
                            order.getStatus().name(),
                            total.setScale(2, RoundingMode.HALF_UP),
                            order.getCreatedAt(),
                            order.getShipCity(),
                            order.getShipState(),
                            orderItems);
                })
                .toList();
    }

    private List<OrderItem> liveItems(List<OrderItem> items) {
        return items.stream()
                .filter(item -> item.getOrder().getStatus() != OrderStatus.CANCELLED)
                .toList();
    }

    private BigDecimal sum(List<OrderItem> items) {
        return items.stream()
                .map(this::lineRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal lineRevenue(OrderItem item) {
        return item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
    }

    private String uniqueSlug(String name) {
        String base = name.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (base.isBlank()) {
            base = "listing";
        }
        if (base.length() > 150) {
            base = base.substring(0, 150);
        }
        String slug = base;
        int suffix = 2;
        while (productRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }

    private String safeImageUrl(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String url = value.trim();
        if (url.startsWith("https://") || url.startsWith("http://") || url.startsWith("/media/")) {
            return url;
        }
        throw ApiException.badRequest("Image must be an https link or an uploaded /media path");
    }

    private String joinTags(List<String> tags) {
        if (tags == null) {
            return null;
        }
        Set<String> cleaned = new LinkedHashSet<>();
        for (String tag : tags) {
            if (tag != null && !tag.isBlank()) {
                cleaned.add(tag.trim());
            }
        }
        return cleaned.isEmpty() ? null : String.join(", ", cleaned);
    }

    private void requireSeller(User seller) {
        if (seller.getRole() != Role.SELLER) {
            throw ApiException.forbidden("Seller access only");
        }
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private double round2(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private double round1(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}