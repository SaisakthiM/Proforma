package com.proforma.market.dto;

public record OfferDto(
        String code,
        String title,
        String subtitle,
        int discountPercent,
        ProductCard product
) {
}