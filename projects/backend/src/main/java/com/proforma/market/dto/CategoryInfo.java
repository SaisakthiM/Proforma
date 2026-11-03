package com.proforma.market.dto;

public record CategoryInfo(
        String value,
        String label,
        String code,
        String slug,
        long count
) {
}