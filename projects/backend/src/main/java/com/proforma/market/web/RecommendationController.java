package com.proforma.market.web;

import com.proforma.market.domain.User;
import com.proforma.market.dto.ProductCard;
import com.proforma.market.service.CurrentUser;
import com.proforma.market.service.RecommendationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final CurrentUser currentUser;

    public RecommendationController(RecommendationService recommendationService,
                                    CurrentUser currentUser) {
        this.recommendationService = recommendationService;
        this.currentUser = currentUser;
    }

    @GetMapping("/product/{id}")
    public List<ProductCard> forProduct(@PathVariable Long id, Principal principal) {
        User user = currentUser.optional(principal).orElse(null);
        return recommendationService.forProduct(id, user);
    }

    @GetMapping("/me")
    public List<ProductCard> forMe(Principal principal) {
        User user = currentUser.optional(principal).orElse(null);
        return recommendationService.forUser(user);
    }
}