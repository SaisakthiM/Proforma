package com.proforma.market.service;

import com.proforma.market.domain.Product;
import com.proforma.market.domain.Review;
import com.proforma.market.domain.User;
import com.proforma.market.dto.ReviewDto;
import com.proforma.market.dto.ReviewRequest;
import com.proforma.market.dto.ReviewSummary;
import com.proforma.market.repo.ProductRepository;
import com.proforma.market.repo.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    public ReviewService(ReviewRepository reviewRepository, ProductRepository productRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public ReviewSummary summary(Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        return buildSummary(productId, reviews);
    }

    @Transactional
    public ReviewSummary add(Long productId, ReviewRequest request, User user) {
        Product product = productRepository.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> ApiException.notFound("That product is no longer available"));

        Review review = reviewRepository.findByProductIdAndUserId(productId, user.getId())
                .orElseGet(() -> {
                    Review created = new Review();
                    created.setProduct(product);
                    created.setUser(user);
                    return created;
                });
        review.setRating(request.rating());
        review.setTitle(blankToNull(request.title()));
        review.setBody(request.body().trim());
        reviewRepository.save(review);

        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        double average = reviews.stream().mapToInt(Review::getRating).average().orElse(0);
        product.setRating(BigDecimal.valueOf(average).setScale(1, RoundingMode.HALF_UP).doubleValue());
        product.setReviewCount(reviews.size());
        productRepository.save(product);

        return buildSummary(productId, reviews);
    }

    private ReviewSummary buildSummary(Long productId, List<Review> reviews) {
        Map<Integer, Long> counts = reviews.stream()
                .collect(Collectors.groupingBy(Review::getRating, Collectors.counting()));
        List<ReviewSummary.RatingBucket> distribution = new ArrayList<>();
        for (int stars = 5; stars >= 1; stars--) {
            distribution.add(new ReviewSummary.RatingBucket(stars, counts.getOrDefault(stars, 0L)));
        }
        double average = reviews.stream().mapToInt(Review::getRating).average().orElse(0);
        double rounded = BigDecimal.valueOf(average).setScale(1, RoundingMode.HALF_UP).doubleValue();
        List<ReviewDto> body = reviews.stream()
                .limit(24)
                .map(ReviewDto::from)
                .toList();
        return new ReviewSummary(rounded, reviews.size(), distribution, body);
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}