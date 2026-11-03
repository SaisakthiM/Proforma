package com.proforma.market.service;

import com.proforma.market.domain.Category;
import com.proforma.market.domain.Product;
import com.proforma.market.dto.CategoryInfo;
import com.proforma.market.dto.OfferDto;
import com.proforma.market.dto.PageResponse;
import com.proforma.market.dto.ProductCard;
import com.proforma.market.dto.ProductDetail;
import com.proforma.market.repo.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class ProductService {

    private static final Map<Category, String> OFFER_TITLES = Map.of(
            Category.SEEDS, "Seed bank reset",
            Category.MACHINERY, "Field-ready machinery",
            Category.TOOLS, "Tool room upgrade",
            Category.SOILS, "Soil first, yield second"
    );

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductCard> search(String q,
                                            Category category,
                                            BigDecimal minPrice,
                                            BigDecimal maxPrice,
                                            Double minRating,
                                            String sort,
                                            int page,
                                            int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 48);
        Pageable pageable = PageRequest.of(safePage, safeSize, sortFor(sort));
        Page<Product> result = productRepository.search(
                blankToNull(q), category, minPrice, maxPrice, minRating, null, pageable);
        return PageResponse.from(result.map(ProductMapper::toCard));
    }

    @Transactional(readOnly = true)
    public ProductDetail detail(Long id) {
        Product product = productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> ApiException.notFound("That product is no longer available"));
        return ProductMapper.toDetail(product);
    }

    @Transactional(readOnly = true)
    public List<ProductCard> featured(int limit) {
        return productRepository.findByActiveTrueAndFeaturedTrueOrderByRatingDescReviewCountDesc()
                .stream()
                .limit(Math.max(limit, 1))
                .map(ProductMapper::toCard)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryInfo> categories() {
        List<CategoryInfo> categories = new ArrayList<>();
        for (Category category : Category.values()) {
            categories.add(new CategoryInfo(
                    category.name(),
                    category.label(),
                    category.code(),
                    category.slug(),
                    productRepository.countByCategoryAndActiveTrue(category)
            ));
        }
        return categories;
    }

    @Transactional(readOnly = true)
    public List<OfferDto> offers() {
        List<Product> discounted = productRepository.findByActiveTrue().stream()
                .filter(product -> ProductMapper.discountPercent(product) > 0)
                .sorted(Comparator
                        .comparingInt(ProductMapper::discountPercent).reversed()
                        .thenComparing(Comparator.comparingDouble(Product::getRating).reversed()))
                .limit(4)
                .toList();

        List<Product> source = discounted.isEmpty()
                ? productRepository.findByActiveTrueAndFeaturedTrueOrderByRatingDescReviewCountDesc().stream().limit(4).toList()
                : discounted;

        return source.stream()
                .map(product -> new OfferDto(
                        "PF-" + product.getCategory().code() + "-" + product.getId(),
                        OFFER_TITLES.get(product.getCategory()),
                        product.getCategory().label() + " from " + sellerBusiness(product),
                        ProductMapper.discountPercent(product),
                        ProductMapper.toCard(product)
                ))
                .toList();
    }

    private String sellerBusiness(Product product) {
        String business = product.getSeller().getBusinessName();
        return business == null || business.isBlank() ? product.getSeller().getName() : business;
    }

    private Sort sortFor(String sort) {
        if (sort == null) {
            sort = "relevance";
        }
        return switch (sort) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "rating" -> Sort.by(Sort.Direction.DESC, "rating")
                    .and(Sort.by(Sort.Direction.DESC, "reviewCount"));
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "popular" -> Sort.by(Sort.Direction.DESC, "reviewCount")
                    .and(Sort.by(Sort.Direction.DESC, "rating"));
            default -> Sort.by(Sort.Direction.DESC, "featured")
                    .and(Sort.by(Sort.Direction.DESC, "rating"))
                    .and(Sort.by(Sort.Direction.DESC, "reviewCount"));
        };
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}