package com.proforma.market.web;

import com.proforma.market.domain.Category;
import com.proforma.market.dto.PageResponse;
import com.proforma.market.dto.ProductCard;
import com.proforma.market.dto.ProductDetail;
import com.proforma.market.dto.ReviewRequest;
import com.proforma.market.dto.ReviewSummary;
import com.proforma.market.service.CurrentUser;
import com.proforma.market.service.ProductService;
import com.proforma.market.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final ReviewService reviewService;
    private final CurrentUser currentUser;

    public ProductController(ProductService productService,
                             ReviewService reviewService,
                             CurrentUser currentUser) {
        this.productService = productService;
        this.reviewService = reviewService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public PageResponse<ProductCard> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "relevance") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return productService.search(q, category, minPrice, maxPrice, minRating, sort, page, size);
    }

    @GetMapping("/featured")
    public List<ProductCard> featured(@RequestParam(defaultValue = "8") int limit) {
        return productService.featured(limit);
    }

    @GetMapping("/{id}")
    public ProductDetail detail(@PathVariable Long id) {
        return productService.detail(id);
    }

    @GetMapping("/{id}/reviews")
    public ReviewSummary reviews(@PathVariable Long id) {
        return reviewService.summary(id);
    }

    @PostMapping("/{id}/reviews")
    public ReviewSummary addReview(@PathVariable Long id,
                                   @Valid @RequestBody ReviewRequest request,
                                   Principal principal) {
        return reviewService.add(id, request, currentUser.require(principal));
    }
}