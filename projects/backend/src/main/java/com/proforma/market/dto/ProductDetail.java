package com.proforma.market.dto;

import com.proforma.market.domain.Category;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ProductDetail(
        Long id,
        String name,
        Category category,
        String categoryLabel,
        String categoryCode,
        String subcategory,
        String description,
        BigDecimal price,
        BigDecimal mrp,
        String unit,
        int stock,
        double rating,
        int reviewCount,
        String imageUrl,
        String location,
        List<String> tags,
        boolean featured,
        boolean active,
        long viewCount,
        Instant createdAt,
        Long sellerId,
        String sellerName,
        String sellerBusiness,
        String sellerLocation,
        Instant sellerJoined,
        int discountPercent
) {
}