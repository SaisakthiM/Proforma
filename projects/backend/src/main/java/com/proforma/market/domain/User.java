package com.proforma.market.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Entity
@Table(name = "users", indexes = @Index(name = "idx_users_role", columnList = "role"))
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(length = 30)
    private String phone;

    @Column(length = 60)
    private String farmerType;

    @Column(length = 1000)
    private String crops;

    @Column(length = 80)
    private String state;

    @Column(length = 80)
    private String district;

    @Column(length = 80)
    private String climate;

    @Column(length = 40)
    private String farmSize;

    @Column(length = 80)
    private String irrigation;

    @Column(length = 160)
    private String businessName;

    @Column(length = 160)
    private String productFocus;

    @Column(length = 3000)
    private String sellerAbout;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public String locationLabel() {
        if (district != null && !district.isBlank() && state != null && !state.isBlank()) {
            return district + ", " + state;
        }
        if (state != null && !state.isBlank()) {
            return state;
        }
        return district;
    }

    public List<String> cropList() {
        if (crops == null || crops.isBlank()) {
            return List.of();
        }
        return Arrays.stream(crops.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }
}