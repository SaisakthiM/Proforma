package com.proforma.market.dto;

import com.proforma.market.domain.Role;
import com.proforma.market.domain.User;

import java.time.Instant;
import java.util.List;

public record UserDto(
        Long id,
        String name,
        String email,
        Role role,
        String phone,
        String farmerType,
        List<String> crops,
        String state,
        String district,
        String climate,
        String farmSize,
        String irrigation,
        String businessName,
        String productFocus,
        String sellerAbout,
        Instant createdAt
) {
    public static UserDto from(User user) {
        return new UserDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getPhone(),
                user.getFarmerType(),
                user.cropList(),
                user.getState(),
                user.getDistrict(),
                user.getClimate(),
                user.getFarmSize(),
                user.getIrrigation(),
                user.getBusinessName(),
                user.getProductFocus(),
                user.getSellerAbout(),
                user.getCreatedAt()
        );
    }
}