package com.proforma.market.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderDto(
        Long id,
        BigDecimal total,
        String status,
        String paymentMethod,
        String paymentRef,
        String paymentLabel,
        Instant createdAt,
        String shipName,
        String shipCity,
        String shipState,
        List<OrderItemDto> items
) {
}