package com.proforma.market.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CheckoutRequest(
        @NotEmpty @Valid List<Line> items,
        @NotNull @Valid Shipping shipping,
        @NotBlank @Size(max = 40) String paymentMethod,
        @Size(max = 60) String paymentLabel
) {
    public record Line(
            @NotNull Long productId,
            @Min(1) int quantity
    ) {
    }

    public record Shipping(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(max = 30) String phone,
            @NotBlank @Size(max = 300) String address,
            @NotBlank @Size(max = 80) String city,
            @NotBlank @Size(max = 80) String state,
            @NotBlank @Size(max = 12) String pincode
    ) {
    }
}