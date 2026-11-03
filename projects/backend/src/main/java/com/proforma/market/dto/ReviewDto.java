package com.proforma.market.dto;

import com.proforma.market.domain.Review;

import java.time.Instant;

public record ReviewDto(
        Long id,
        String author,
        int rating,
        String title,
        String body,
        Instant createdAt
) {
    public static ReviewDto from(Review review) {
        return new ReviewDto(
                review.getId(),
                review.getUser().getName(),
                review.getRating(),
                review.getTitle(),
                review.getBody(),
                review.getCreatedAt()
        );
    }
}