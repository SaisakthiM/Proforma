package com.proforma.market.dto;

import com.proforma.market.domain.Category;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class SellerDtos {

    private SellerDtos() {
    }

    public record Overview(
            BigDecimal revenue,
            long orders,
            long products,
            long views,
            double conversion,
            double avgRating,
            List<MonthPoint> revenueByMonth,
            List<TopProduct> topProducts,
            List<SellerOrder> recentOrders
    ) {
    }

    public record Analytics(
            List<MonthPoint> revenueByMonth,
            List<TopProduct> topProducts,
            List<NamedValue> categoryShare,
            List<NamedValue> buyerRegions,
            List<NamedValue> funnel,
            long views,
            long carts,
            long orders,
            double conversion
    ) {
    }

    public record MonthPoint(String month, BigDecimal value) {
    }

    public record TopProduct(
            Long id,
            String name,
            String category,
            long units,
            BigDecimal revenue,
            long views
    ) {
    }

    public record NamedValue(String label, double value) {
    }

    public record SellerOrder(
            Long id,
            String buyerName,
            String status,
            BigDecimal total,
            Instant createdAt,
            String city,
            String state,
            List<SellerOrderItem> items
    ) {
    }

    public record SellerOrderItem(
            Long productId,
            String name,
            int quantity,
            BigDecimal unitPrice,
            String imageUrl
    ) {
    }

    public record ProductUpsert(
            @NotBlank @Size(max = 180) String name,
            @NotNull Category category,
            @Size(max = 100) String subcategory,
            @NotBlank @Size(max = 4000) String description,
            @NotNull @DecimalMin("1.00") BigDecimal price,
            BigDecimal mrp,
            @NotBlank @Size(max = 40) String unit,
            @Min(0) int stock,
            @Size(max = 600) String imageUrl,
            @Size(max = 160) String location,
            List<String> tags,
            boolean featured,
            boolean active
    ) {
    }

    public record StatusUpdate(@NotNull String status) {
    }
}