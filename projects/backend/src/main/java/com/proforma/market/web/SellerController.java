package com.proforma.market.web;

import com.proforma.market.dto.ProductCard;
import com.proforma.market.dto.SellerDtos;
import com.proforma.market.service.CurrentUser;
import com.proforma.market.service.SellerService;
import com.proforma.market.service.UploadService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seller")
@PreAuthorize("hasRole('SELLER')")
public class SellerController {

    private final SellerService sellerService;
    private final UploadService uploadService;
    private final CurrentUser currentUser;

    public SellerController(SellerService sellerService,
                            UploadService uploadService,
                            CurrentUser currentUser) {
        this.sellerService = sellerService;
        this.uploadService = uploadService;
        this.currentUser = currentUser;
    }

    @GetMapping("/overview")
    public SellerDtos.Overview overview(Principal principal) {
        return sellerService.overview(currentUser.require(principal));
    }

    @GetMapping("/analytics")
    public SellerDtos.Analytics analytics(Principal principal) {
        return sellerService.analytics(currentUser.require(principal));
    }

    @GetMapping("/products")
    public List<ProductCard> products(Principal principal) {
        return sellerService.products(currentUser.require(principal));
    }

    @GetMapping("/products/{id}")
    public ProductCard product(@PathVariable Long id, Principal principal) {
        return sellerService.product(id, currentUser.require(principal));
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductCard createProduct(@Valid @RequestBody SellerDtos.ProductUpsert request,
                                     Principal principal) {
        return sellerService.createProduct(currentUser.require(principal), request);
    }

    @PutMapping("/products/{id}")
    public ProductCard updateProduct(@PathVariable Long id,
                                     @Valid @RequestBody SellerDtos.ProductUpsert request,
                                     Principal principal) {
        return sellerService.updateProduct(id, currentUser.require(principal), request);
    }

    @GetMapping("/orders")
    public List<SellerDtos.SellerOrder> orders(Principal principal) {
        return sellerService.orders(currentUser.require(principal));
    }

    @PatchMapping("/orders/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateStatus(@PathVariable Long id,
                             @Valid @RequestBody SellerDtos.StatusUpdate request,
                             Principal principal) {
        sellerService.updateOrderStatus(id, currentUser.require(principal), request.status());
    }

    @PostMapping("/uploads")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) {
        return Map.of("url", uploadService.store(file));
    }
}