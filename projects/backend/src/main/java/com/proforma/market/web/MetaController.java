package com.proforma.market.web;

import com.proforma.market.domain.Role;
import com.proforma.market.dto.CategoryInfo;
import com.proforma.market.dto.OfferDto;
import com.proforma.market.repo.ProductRepository;
import com.proforma.market.repo.UserRepository;
import com.proforma.market.service.ProductService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meta")
public class MetaController {

    private final ProductService productService;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public MetaController(ProductService productService,
                          ProductRepository productRepository,
                          UserRepository userRepository) {
        this.productService = productService;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/categories")
    public List<CategoryInfo> categories() {
        return productService.categories();
    }

    @GetMapping("/offers")
    public List<OfferDto> offers() {
        return productService.offers();
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("products", productRepository.countByActiveTrue());
        stats.put("sellers", userRepository.countByRole(Role.SELLER));
        stats.put("buyers", userRepository.countByRole(Role.BUYER));
        stats.put("categories", 4);
        return stats;
    }
}