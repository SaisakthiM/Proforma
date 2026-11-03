package com.proforma.market.service;

import com.proforma.market.domain.Category;
import com.proforma.market.domain.OrderItem;
import com.proforma.market.domain.OrderStatus;
import com.proforma.market.domain.Product;
import com.proforma.market.domain.User;
import com.proforma.market.dto.ProductCard;
import com.proforma.market.repo.OrderItemRepository;
import com.proforma.market.repo.ProductEventRepository;
import com.proforma.market.repo.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class RecommendationService {

    private final ProductRepository productRepository;
    private final ProductEventRepository eventRepository;
    private final OrderItemRepository orderItemRepository;

    public RecommendationService(ProductRepository productRepository,
                                 ProductEventRepository eventRepository,
                                 OrderItemRepository orderItemRepository) {
        this.productRepository = productRepository;
        this.eventRepository = eventRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductCard> forProduct(Long productId, User user) {
        Product base = productRepository.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> ApiException.notFound("That product is no longer available"));
        List<Product> pool = productRepository.findByActiveTrue();
        Set<Category> purchased = purchasedCategories(user);
        Map<Long, Double> scores = new HashMap<>();

        for (Object[] row : eventRepository.findCoViewedProductIds(productId)) {
            Long otherId = ((Number) row[0]).longValue();
            double coViews = ((Number) row[1]).doubleValue();
            scores.merge(otherId, coViews * 2.2, Double::sum);
        }

        for (Product product : pool) {
            if (product.getId().equals(base.getId())) {
                continue;
            }
            double score = scores.getOrDefault(product.getId(), 0.0);
            if (product.getCategory() == base.getCategory()) {
                score += 0.9;
            }
            if (sameText(product.getSubcategory(), base.getSubcategory())) {
                score += 2.1;
            }
            score += product.getRating() * 0.35;
            if (product.isFeatured()) {
                score += 0.4;
            }
            if (product.getStock() == 0) {
                score -= 4.0;
            }
            if (purchased.contains(product.getCategory())) {
                score += 0.7;
            }
            if (user != null) {
                score += profileScore(product, user);
            }
            scores.put(product.getId(), score);
        }

        return rank(pool, scores, 6, base.getId());
    }

    @Transactional(readOnly = true)
    public List<ProductCard> forUser(User user) {
        List<Product> pool = productRepository.findByActiveTrue();
        if (pool.isEmpty()) {
            return List.of();
        }
        if (user == null) {
            List<Product> ranked = pool.stream()
                    .sorted(Comparator.comparingInt((Product product) -> product.isFeatured() ? 1 : 0).reversed()
                            .thenComparing(Comparator.comparingDouble(Product::getRating).reversed())
                            .thenComparing(Comparator.comparingInt(Product::getReviewCount).reversed()))
                    .limit(8)
                    .toList();
            return ranked.stream().map(ProductMapper::toCard).toList();
        }

        Set<Category> purchased = purchasedCategories(user);
        Map<Long, Double> scores = new HashMap<>();
        for (Product product : pool) {
            double score = product.getRating() * 0.35;
            if (product.isFeatured()) {
                score += 0.4;
            }
            if (product.getStock() == 0) {
                score -= 4.0;
            }
            if (purchased.contains(product.getCategory())) {
                score += 1.4;
            }
            score += profileScore(product, user);
            scores.put(product.getId(), score);
        }
        return rank(pool, scores, 8, null);
    }

    private List<ProductCard> rank(List<Product> pool, Map<Long, Double> scores, int limit, Long excludedId) {
        Map<Long, Product> byId = new HashMap<>();
        for (Product product : pool) {
            byId.put(product.getId(), product);
        }
        List<Map.Entry<Long, Double>> entries = new ArrayList<>(scores.entrySet());
        entries.removeIf(entry -> excludedId != null && entry.getKey().equals(excludedId));
        entries.sort(Map.Entry.<Long, Double>comparingByValue().reversed());

        List<ProductCard> result = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        for (Map.Entry<Long, Double> entry : entries) {
            Product product = byId.get(entry.getKey());
            if (product == null || !seen.add(product.getId())) {
                continue;
            }
            result.add(ProductMapper.toCard(product));
            if (result.size() >= limit) {
                break;
            }
        }
        if (result.size() < limit) {
            pool.stream()
                    .filter(product -> seen.add(product.getId()) && product.getStock() > 0)
                    .sorted(Comparator.comparingDouble(Product::getRating).reversed())
                    .limit(limit - result.size())
                    .forEach(product -> result.add(ProductMapper.toCard(product)));
        }
        return result;
    }

    private double profileScore(Product product, User user) {
        String haystack = (product.getName() + " "
                + safe(product.getSubcategory()) + " "
                + safe(product.getTags()) + " "
                + safe(product.getDescription()) + " "
                + safe(product.getLocation()))
                .toLowerCase(Locale.ROOT);
        double score = 0;
        for (String token : profileTokens(user)) {
            if (haystack.contains(token)) {
                score += 2.0;
            }
        }
        if (user.getState() != null && !user.getState().isBlank()
                && safe(product.getLocation()).toLowerCase(Locale.ROOT).contains(user.getState().toLowerCase(Locale.ROOT))) {
            score += 1.5;
        }
        if (user.getClimate() != null && !user.getClimate().isBlank()) {
            String climate = user.getClimate().toLowerCase(Locale.ROOT);
            if (haystack.contains(climate)) {
                score += 0.8;
            }
        }
        return Math.min(score, 9.0);
    }

    private Set<String> profileTokens(User user) {
        Set<String> tokens = new HashSet<>();
        for (String crop : user.cropList()) {
            for (String token : crop.toLowerCase(Locale.ROOT).split("[^a-z]+")) {
                if (token.length() > 2) {
                    tokens.add(token);
                }
            }
        }
        for (String value : List.of(safe(user.getFarmerType()), safe(user.getIrrigation()))) {
            for (String token : value.toLowerCase(Locale.ROOT).split("[^a-z]+")) {
                if (token.length() > 3) {
                    tokens.add(token);
                }
            }
        }
        return tokens;
    }

    private Set<Category> purchasedCategories(User user) {
        if (user == null) {
            return Set.of();
        }
        Set<Category> categories = new HashSet<>();
        for (OrderItem item : orderItemRepository.findByBuyerId(user.getId())) {
            if (item.getOrder().getStatus() != OrderStatus.CANCELLED) {
                categories.add(item.getProduct().getCategory());
            }
        }
        return categories;
    }

    private boolean sameText(String left, String right) {
        return left != null && right != null && !left.isBlank() && left.equalsIgnoreCase(right);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}