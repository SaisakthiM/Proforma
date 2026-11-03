package com.proforma.market.dto;

import com.proforma.market.domain.Category;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ProductCard(
        Long id,
        String name,
        Category category,
        String categoryLabel,
        String categoryCode,
        String subcategory,
        BigDecimal price,
        BigDecimal mrp,
        String unit,
        int stock,
        double rating,
        int reviewCount,
        String imageUrl,
        String location,
        Long sellerId,
        String sellerName,
        String sellerBusiness,
        List<String> tags,
        boolean featured,
        boolean active,
        int viewCount,
        int discountPercent,
        Instant createdAt
) {
}