package com.proforma.market.domain;

public enum Category {
    SEEDS("Seeds & planting material", "D-01", "seeds"),
    MACHINERY("Machinery & equipment", "D-02", "machinery"),
    TOOLS("Tools & implements", "D-03", "tools"),
    SOILS("Soils & nutrition", "D-04", "soils");

    private final String label;
    private final String code;
    private final String slug;

    Category(String label, String code, String slug) {
        this.label = label;
        this.code = code;
        this.slug = slug;
    }

    public String label() {
        return label;
    }

    public String code() {
        return code;
    }

    public String slug() {
        return slug;
    }
}