package com.proforma.market.web;

import com.proforma.market.dto.CheckoutRequest;
import com.proforma.market.dto.OrderDto;
import com.proforma.market.service.CurrentUser;
import com.proforma.market.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final CurrentUser currentUser;

    public OrderController(OrderService orderService, CurrentUser currentUser) {
        this.orderService = orderService;
        this.currentUser = currentUser;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDto create(@Valid @RequestBody CheckoutRequest request, Principal principal) {
        return orderService.create(currentUser.require(principal), request);
    }

    @GetMapping("/mine")
    public List<OrderDto> mine(Principal principal) {
        return orderService.mine(currentUser.require(principal));
    }
}