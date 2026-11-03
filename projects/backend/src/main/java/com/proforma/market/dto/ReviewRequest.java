package com.proforma.market.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
        @Min(1) @Max(5) int rating,
        @Size(max = 140) String title,
        @NotBlank @Size(min = 8, max = 1500) String body
) {
}