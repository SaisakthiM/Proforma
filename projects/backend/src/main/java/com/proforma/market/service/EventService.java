package com.proforma.market.service;

import com.proforma.market.domain.EventType;
import com.proforma.market.domain.Product;
import com.proforma.market.domain.ProductEvent;
import com.proforma.market.domain.User;
import com.proforma.market.repo.ProductEventRepository;
import com.proforma.market.repo.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {

    private final ProductRepository productRepository;
    private final ProductEventRepository eventRepository;

    public EventService(ProductRepository productRepository, ProductEventRepository eventRepository) {
        this.productRepository = productRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional
    public void record(User user, Long productId, EventType type) {
        if (type != EventType.VIEW && type != EventType.CART) {
            throw ApiException.badRequest("Unsupported event type");
        }
        Product product = productRepository.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> ApiException.notFound("That product is no longer available"));

        ProductEvent event = new ProductEvent();
        event.setUser(user);
        event.setProduct(product);
        event.setType(type);
        eventRepository.save(event);

        if (type == EventType.VIEW) {
            product.setViewCount(product.getViewCount() + 1);
            productRepository.save(product);
        }
    }
}