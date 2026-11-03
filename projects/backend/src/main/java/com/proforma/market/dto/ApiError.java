package com.proforma.market.dto;

import java.time.Instant;
import java.util.Map;

public record ApiError(
        int status,
        String message,
        Map<String, String> fields,
        Instant timestamp
) {
    public static ApiError of(int status, String message) {
        return new ApiError(status, message, Map.of(), Instant.now());
    }
}