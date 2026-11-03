package com.proforma.market.repo;

import com.proforma.market.domain.Category;
import com.proforma.market.domain.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("""
            select p from Product p
            where p.active = true
              and (:q is null or lower(p.name) like lower(concat('%', :q, '%'))
                   or lower(p.description) like lower(concat('%', :q, '%'))
                   or lower(p.tags) like lower(concat('%', :q, '%'))
                   or lower(p.subcategory) like lower(concat('%', :q, '%'))
                   or lower(p.location) like lower(concat('%', :q, '%')))
              and (:category is null or p.category = :category)
              and (:minPrice is null or p.price >= :minPrice)
              and (:maxPrice is null or p.price <= :maxPrice)
              and (:minRating is null or p.rating >= :minRating)
              and (:sellerId is null or p.seller.id = :sellerId)
            """)
    Page<Product> search(@Param("q") String q,
                         @Param("category") Category category,
                         @Param("minPrice") BigDecimal minPrice,
                         @Param("maxPrice") BigDecimal maxPrice,
                         @Param("minRating") Double minRating,
                         @Param("sellerId") Long sellerId,
                         Pageable pageable);

    Optional<Product> findByIdAndActiveTrue(Long id);

    boolean existsBySlug(String slug);

    List<Product> findByActiveTrueAndFeaturedTrueOrderByRatingDescReviewCountDesc();

    List<Product> findByActiveTrue();

    List<Product> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    List<Product> findBySellerIdAndActiveTrue(Long sellerId);

    long countByActiveTrue();

    long countByCategoryAndActiveTrue(Category category);

    long countBySellerIdAndActiveTrue(Long sellerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id in :ids")
    List<Product> findAllForUpdate(@Param("ids") Collection<Long> ids);
}