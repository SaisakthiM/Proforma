package com.proforma.market.dto;

import java.math.BigDecimal;

public record OrderItemDto(
        Long productId,
        String name,
        String unit,
        String category,
        String imageUrl,
        int quantity,
        BigDecimal unitPrice
) {
}