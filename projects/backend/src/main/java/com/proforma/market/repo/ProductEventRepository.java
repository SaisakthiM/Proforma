package com.proforma.market.repo;

import com.proforma.market.domain.EventType;
import com.proforma.market.domain.ProductEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductEventRepository extends JpaRepository<ProductEvent, Long> {

    long countByProductIdAndType(Long productId, EventType type);

    long countByProduct_Seller_IdAndType(Long sellerId, EventType type);

    long countByType(EventType type);

    @Query(value = """
            select e2.product_id, count(*) as score
            from product_events e1
            join product_events e2 on e1.user_id = e2.user_id
            where e1.product_id = :productId
              and e2.product_id <> :productId
              and e1.user_id is not null
              and e1.type = 'VIEW'
              and e2.type = 'VIEW'
            group by e2.product_id
            order by score desc
            limit 12
            """, nativeQuery = true)
    List<Object[]> findCoViewedProductIds(@Param("productId") Long productId);
}