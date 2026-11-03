package com.proforma.market.service;

import com.proforma.market.config.JwtService;
import com.proforma.market.domain.Role;
import com.proforma.market.domain.User;
import com.proforma.market.dto.AuthResponse;
import com.proforma.market.dto.LoginRequest;
import com.proforma.market.dto.RegisterRequest;
import com.proforma.market.dto.UserDto;
import com.proforma.market.repo.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account already exists for this email");
        }
        if (request.role() == Role.SELLER
                && (request.businessName() == null || request.businessName().isBlank())) {
            throw ApiException.badRequest("A business or farm name is required for sellers");
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setPhone(trimToNull(request.phone()));
        user.setFarmerType(trimToNull(request.farmerType()));
        user.setCrops(joinCrops(request.crops()));
        user.setState(trimToNull(request.state()));
        user.setDistrict(trimToNull(request.district()));
        user.setClimate(trimToNull(request.climate()));
        user.setFarmSize(trimToNull(request.farmSize()));
        user.setIrrigation(trimToNull(request.irrigation()));
        user.setBusinessName(trimToNull(request.businessName()));
        user.setProductFocus(trimToNull(request.productFocus()));
        user.setSellerAbout(trimToNull(request.sellerAbout()));
        userRepository.save(user);

        return new AuthResponse(jwtService.generate(user), UserDto.from(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> ApiException.unauthorized("Email or password is incorrect"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Email or password is incorrect");
        }
        return new AuthResponse(jwtService.generate(user), UserDto.from(user));
    }

    private String joinCrops(List<String> crops) {
        if (crops == null) {
            return null;
        }
        List<String> cleaned = crops.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        return cleaned.isEmpty() ? null : String.join(", ", cleaned);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}