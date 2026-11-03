package com.proforma.market.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class UploadService {

    private static final long MAX_BYTES = 6L * 1024 * 1024;
    private static final Map<String, String> ALLOWED = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "image/avif", "avif"
    );

    private final Path root;

    public UploadService(@Value("${app.uploads.dir}") String uploadsDir) {
        this.root = Paths.get(uploadsDir).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Choose an image to upload");
        }
        if (file.getSize() > MAX_BYTES) {
            throw ApiException.badRequest("Image must be smaller than 6 MB");
        }
        String extension = ALLOWED.get(file.getContentType());
        if (extension == null) {
            throw ApiException.badRequest("Only JPG, PNG, WEBP or AVIF images are supported");
        }

        String filename = UUID.randomUUID() + "." + extension;
        try {
            Files.createDirectories(root);
            try (InputStream stream = file.getInputStream()) {
                Files.copy(stream, root.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new ApiException(500, "Could not save the uploaded image");
        }
        return "/media/" + filename;
    }
}