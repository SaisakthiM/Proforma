package com.proforma.market.repo;

import com.proforma.market.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("""
            select i from OrderItem i
            join fetch i.order o
            join fetch i.product p
            where i.seller.id = :sellerId
            order by o.createdAt desc
            """)
    List<OrderItem> findBySellerId(@Param("sellerId") Long sellerId);

    @Query("""
            select i from OrderItem i
            join fetch i.order o
            where o.buyer.id = :buyerId
            order by o.createdAt desc
            """)
    List<OrderItem> findByBuyerId(@Param("buyerId") Long buyerId);
}