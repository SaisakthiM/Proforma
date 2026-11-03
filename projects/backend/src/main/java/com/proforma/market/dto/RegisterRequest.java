package com.proforma.market.dto;

import com.proforma.market.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record RegisterRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotNull Role role,
        @Size(max = 30) String phone,
        @Size(max = 60) String farmerType,
        List<String> crops,
        @Size(max = 80) String state,
        @Size(max = 80) String district,
        @Size(max = 80) String climate,
        @Size(max = 40) String farmSize,
        @Size(max = 80) String irrigation,
        @Size(max = 160) String businessName,
        @Size(max = 160) String productFocus,
        @Size(max = 3000) String sellerAbout
) {
}