package com.proforma.market.dto;

import com.proforma.market.domain.EventType;
import jakarta.validation.constraints.NotNull;

public record EventRequest(
        @NotNull Long productId,
        @NotNull EventType type
) {
}