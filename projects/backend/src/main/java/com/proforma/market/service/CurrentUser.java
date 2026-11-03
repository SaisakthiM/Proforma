package com.proforma.market.service;

import com.proforma.market.domain.User;
import com.proforma.market.repo.UserRepository;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.Optional;

@Service
public class CurrentUser {

    private final UserRepository userRepository;

    public CurrentUser(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User require(Principal principal) {
        return optional(principal).orElseThrow(() -> ApiException.unauthorized("Please sign in to continue"));
    }

    public Optional<User> optional(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return Optional.empty();
        }
        return userRepository.findByEmailIgnoreCase(principal.getName());
    }
}