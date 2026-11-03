package com.proforma.market.dto;

import java.util.List;

public record ReviewSummary(
        double average,
        long count,
        List<RatingBucket> distribution,
        List<ReviewDto> reviews
) {
    public record RatingBucket(int stars, long count) {
    }
}