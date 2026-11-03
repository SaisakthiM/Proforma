package com.proforma.market.service;

import com.proforma.market.domain.Product;
import com.proforma.market.dto.ProductCard;
import com.proforma.market.dto.ProductDetail;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.List;

public final class ProductMapper {

    private ProductMapper() {
    }

    public static ProductCard toCard(Product product) {
        return new ProductCard(
                product.getId(),
                product.getName(),
                product.getCategory(),
                product.getCategory().label(),
                product.getCategory().code(),
                product.getSubcategory(),
                product.getPrice(),
                product.getMrp(),
                product.getUnit(),
                product.getStock(),
                round(product.getRating()),
                product.getReviewCount(),
                product.getImageUrl(),
                product.getLocation(),
                product.getSeller().getId(),
                product.getSeller().getName(),
                product.getSeller().getBusinessName(),
                parseTags(product.getTags()),
                product.isFeatured(),
                product.isActive(),
                product.getViewCount(),
                discountPercent(product),
                product.getCreatedAt()
        );
    }

    public static ProductDetail toDetail(Product product) {
        return new ProductDetail(
                product.getId(),
                product.getName(),
                product.getCategory(),
                product.getCategory().label(),
                product.getCategory().code(),
                product.getSubcategory(),
                product.getDescription(),
                product.getPrice(),
                product.getMrp(),
                product.getUnit(),
                product.getStock(),
                round(product.getRating()),
                product.getReviewCount(),
                product.getImageUrl(),
                product.getLocation(),
                parseTags(product.getTags()),
                product.isFeatured(),
                product.isActive(),
                product.getViewCount(),
                product.getCreatedAt(),
                product.getSeller().getId(),
                product.getSeller().getName(),
                product.getSeller().getBusinessName(),
                product.getSeller().locationLabel(),
                product.getSeller().getCreatedAt(),
                discountPercent(product)
        );
    }

    public static List<String> parseTags(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .toList();
    }

    public static int discountPercent(Product product) {
        BigDecimal mrp = product.getMrp();
        if (mrp == null || mrp.compareTo(product.getPrice()) <= 0) {
            return 0;
        }
        return mrp.subtract(product.getPrice())
                .multiply(BigDecimal.valueOf(100))
                .divide(mrp, 0, RoundingMode.HALF_UP)
                .intValue();
    }

    private static double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}