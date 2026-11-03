package com.proforma.market.config;

import com.proforma.market.domain.Category;
import com.proforma.market.domain.EventType;
import com.proforma.market.domain.Order;
import com.proforma.market.domain.OrderItem;
import com.proforma.market.domain.OrderStatus;
import com.proforma.market.domain.Product;
import com.proforma.market.domain.ProductEvent;
import com.proforma.market.domain.Review;
import com.proforma.market.domain.Role;
import com.proforma.market.domain.User;
import com.proforma.market.repo.OrderRepository;
import com.proforma.market.repo.ProductEventRepository;
import com.proforma.market.repo.ProductRepository;
import com.proforma.market.repo.ReviewRepository;
import com.proforma.market.repo.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.Set;

@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String DEMO_PASSWORD = "Proforma@123";

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ProductEventRepository eventRepository;
    private final PasswordEncoder passwordEncoder;

    private final Random random = new Random(42);

    @Value("${app.seed.enabled:true}")
    private boolean enabled;

    public DataSeeder(UserRepository userRepository,
                      ProductRepository productRepository,
                      ReviewRepository reviewRepository,
                      OrderRepository orderRepository,
                      ProductEventRepository eventRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
        this.eventRepository = eventRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("Data seeding is disabled");
            return;
        }
        if (productRepository.count() > 0) {
            log.info("Catalog already populated, skipping seed");
            return;
        }

        List<User> buyers = seedBuyers();
        List<User> sellers = seedSellers();
        List<Product> products = seedProducts(sellers);
        seedReviews(products, buyers);
        seedOrdersAndEvents(products, buyers);

        log.info("Seeded {} users, {} products, {} reviews, {} orders",
                userRepository.count(), products.size(), reviewRepository.count(), orderRepository.count());
    }

    private List<User> seedBuyers() {
        return List.of(
                buyer("Ravi Kumar", "ravi@proforma.dev", "Tamil Nadu", "Erode",
                        "Tropical wet", "Smallholder", "Paddy, Wheat, Vegetables",
                        "2.5 acres", "Canal + borewell", "9876543210", 420),
                buyer("Meera Nair", "meera@proforma.dev", "Kerala", "Palakkad",
                        "Humid tropical", "Organic grower", "Banana, Coconut, Pepper",
                        "4 acres", "Rain-fed + drip", "9847012345", 380),
                buyer("Arjun Singh", "arjun@proforma.dev", "Punjab", "Ludhiana",
                        "Semi-arid", "Commercial", "Wheat, Paddy, Mustard",
                        "18 acres", "Tube well", "9814123456", 350),
                buyer("Priya Deshmukh", "priya@proforma.dev", "Maharashtra", "Nashik",
                        "Tropical dry", "Horticulture", "Grapes, Tomato, Onion",
                        "6 acres", "Drip irrigation", "9822012345", 300)
        );
    }

    private List<User> seedSellers() {
        return List.of(
                seller("Kaveri Agro Seeds", "seller.kaveri@proforma.dev", "Tamil Nadu", "Coimbatore",
                        "Tropical wet", "Certified seeds & seed kits", "Paddy, Pulses, Millets",
                        "45 acres", "Drip", "Kaveri Agro Seeds is a fourth-generation seed house supplying certified, lot-tested seed to farmers across South India.",
                        720),
                seller("Deccan Farm Machinery", "seller.deccan@proforma.dev", "Maharashtra", "Pune",
                        "Tropical dry", "Tractors, tillage & irrigation", "Sugarcane, Vegetables",
                        "60 acres", "Sprinkler", "Deccan Farm Machinery assembles and services field equipment with a 40-point pre-delivery inspection.",
                        680),
                seller("Bharat Krishi Tools", "seller.bharat@proforma.dev", "Punjab", "Ludhiana",
                        "Semi-arid", "Hand tools & implements", "Wheat, Paddy, Mustard",
                        "80 acres", "Tube well", "Bharat Krishi Tools has forged dependable hand tools since 1978, with a lifetime weld guarantee on frames.",
                        650),
                seller("TerraGrow Organics", "seller.terra@proforma.dev", "Maharashtra", "Nashik",
                        "Tropical dry", "Compost, biofertiliser & growing media", "Grapes, Vegetables, Flowers",
                        "12 acres", "Drip", "TerraGrow turns local crop residue and manure into lab-tested organic soil inputs for horticulture.",
                        570)
        );
    }

    private List<Product> seedProducts(List<User> sellers) {
        User kaveri = sellers.get(0);
        User deccan = sellers.get(1);
        User bharat = sellers.get(2);
        User terra = sellers.get(3);

        List<Seed> seeds = List.of(
                new Seed("HD-2967 Certified Wheat Seed", "Cereals",
                        "A rust-resistant bread wheat with strong tillering for timely rabi sowing. Lot-tested at 98% germination and packed in a moisture-barrier bag.",
                        "1850", "2150", "40 kg bag", 120, "wheat, rabi, certified seed, cereals", true),
                new Seed("Pusa Basmati 1121 Paddy Seed", "Cereals",
                        "Long-grain basmati paddy with dependable aroma and milling recovery. Recommended for transplanted kharif fields with assured irrigation.",
                        "980", "1120", "10 kg bag", 200, "paddy, rice, basmati, kharif", true),
                new Seed("DKC-9108 Hybrid Maize Seed", "Hybrids",
                        "A vigorous single-cross maize hybrid with strong stalk strength and broad adaptability. Suited to kharif and early rabi planting.",
                        "1420", "1650", "4 kg pack", 90, "maize, corn, hybrid, kharif", false),
                new Seed("JS-9560 Soybean Seed", "Oilseeds",
                        "Medium-duration soybean with good pod retention and oil content. Treated seed, ready for rain-fed or irrigated blocks.",
                        "1150", "1290", "10 kg bag", 140, "soybean, oilseed, kharif, pulses", false),
                new Seed("Bt Cotton Hybrid Seed", "Fibre",
                        "High-density cotton hybrid with early squaring and good boll opening. Supplied in a sealed 450 g pack with a lot certificate.",
                        "865", "940", "450 g pack", 300, "cotton, fibre, bt, kharif", false),
                new Seed("Arka Rakshak Tomato Seeds", "Vegetables",
                        "A triple-disease-resistant tomato for open fields and protected beds. Firm fruit with good shelf life and uniform ripening.",
                        "320", "380", "10 g tin", 260, "tomato, vegetable, hybrid, protected", false),
                new Seed("Pusa Bold Mustard Seed", "Oilseeds",
                        "Bold-seeded mustard with high oil recovery and tolerance to common aphid pressure. A dependable rabi oilseed for north and central India.",
                        "410", "470", "2 kg pack", 180, "mustard, oilseed, rabi", false),
                new Seed("Green Gram (Moong) Seed", "Pulses",
                        "Short-duration summer moong that fits between rice and wheat. Fixes nitrogen and finishes in about 60 days.",
                        "640", "720", "5 kg bag", 175, "moong, pulses, summer, nitrogen", false),
                new Seed("Bitter Gourd Hybrid Seeds", "Vegetables",
                        "Vigorous vine with uniform dark-green fruit and good picking continuity. Suitable for trellis cultivation.",
                        "240", "290", "50 g pack", 220, "bitter gourd, vegetable, hybrid", false),
                new Seed("Native Millet Seed Mix", "Millets",
                        "A field-ready blend of finger millet, little millet and kodo millet for dryland rotations. Open-pollinated and locally adapted.",
                        "560", "620", "5 kg bag", 80, "millet, ragi, dryland, climate resilient", true)
        );

        List<Seed> machinery = List.of(
                new Seed("Mahindra 275 DI 35 HP Tractor", "Tractors",
                        "A proven 35 HP workhorse for tillage, haulage and spraying. Includes a 40-point dealer inspection and a one-year drivetrain warranty.",
                        "645000", "689000", "unit", 4, "tractor, 35hp, mahindra, tillage", true),
                new Seed("Kubota B2441 Mini Tractor", "Tractors",
                        "A compact 24 HP tractor for orchards, polyhouses and narrow rows. Four-wheel drive with a tight turning radius.",
                        "580000", "620000", "unit", 3, "mini tractor, 24hp, orchard, 4wd", false),
                new Seed("Shaktiman 7-Feet Rotavator", "Tillage",
                        "Heavy-duty gearbox and 42 blades for consistent seedbed preparation. Compatible with 45 HP and above tractors.",
                        "82000", "89500", "unit", 8, "rotavator, tillage, seedbed", false),
                new Seed("Honda GX200 Water Pump", "Irrigation",
                        "Reliable 6.5 HP petrol pump with a cast-iron volute and 2-inch inlet. Delivers strong flow for field channels and tank filling.",
                        "24500", "26900", "unit", 18, "water pump, irrigation, honda, 6.5hp", false),
                new Seed("Kirloskar 5 HP Diesel Engine", "Power",
                        "Air-cooled diesel engine for pumps, threshers and chaff cutters. Easy hand start and low fuel consumption.",
                        "38900", "41500", "unit", 12, "diesel engine, 5hp, pump, power", false),
                new Seed("Balwaan Brush Cutter 2-Stroke", "Crop care",
                        "A balanced 2-stroke brush cutter for bunds, orchards and weed patches. Includes harness, blade and bump-feed head.",
                        "12400", "13900", "unit", 25, "brush cutter, weeding, orchard, 2-stroke", false),
                new Seed("Seed Drill 9-Tyne", "Sowing",
                        "Nine-tyne seed drill with adjustable row spacing and metering for wheat, gram and maize. Three-point linkage mounting.",
                        "48000", "52500", "unit", 7, "seed drill, sowing, 9 tyne", false),
                new Seed("Power Weeder 7 HP", "Crop care",
                        "A walk-behind weeder with a 7 HP engine and adjustable tilling width. Cuts manual weeding time in row crops.",
                        "56000", "61000", "unit", 9, "power weeder, weeding, 7hp", false),
                new Seed("Mini Combine Harvester", "Harvesting",
                        "A compact combine for paddy and wheat on small and medium holdings. Tracked drive for soft-field operation.",
                        "215000", "232000", "unit", 2, "harvester, combine, paddy, tracked", true),
                new Seed("Battery Knapsack Sprayer 16L", "Spraying",
                        "A 16-litre battery sprayer with a 12V pump, four nozzles and a padded harness. Two batteries included for full-day spraying.",
                        "3850", "4400", "unit", 60, "sprayer, battery, 16l, crop care", false)
        );

        List<Seed> tools = List.of(
                new Seed("Tata Agrico Hand Hoe", "Digging",
                        "A forged carbon-steel hoe with a seasoned hardwood handle for inter-row digging and ridge repair.",
                        "520", "590", "unit", 150, "hoe, digging, hand tool, steel", true),
                new Seed("FALCON Pruning Secateur", "Pruning",
                        "Bypass secateurs with a hardened blade and replaceable spring. Comfortable for long pruning sessions in orchards.",
                        "640", "720", "unit", 120, "secateur, pruning, orchard, bypass", false),
                new Seed("Taparia Sickle", "Harvesting",
                        "A sharp serrated sickle with a riveted wooden grip for fodder and small-grain harvesting.",
                        "260", "295", "unit", 240, "sickle, harvesting, hand tool", false),
                new Seed("Digging Fork 4-Tine", "Digging",
                        "A four-tine forged fork for loosening compacted soil and lifting root crops. Powder-coated for rust resistance.",
                        "890", "980", "unit", 85, "fork, digging, soil, hand tool", false),
                new Seed("Khurpi Set of 3", "Weeding",
                        "Three forged khurpis in different widths for weeding, transplanting and shallow cultivation.",
                        "340", "390", "set", 210, "khurpi, weeding, hand tool, set", false),
                new Seed("Wheel Hoe", "Weeding",
                        "A push-type wheel hoe with a steel frame and interchangeable sweeps for fast row weeding.",
                        "4200", "4650", "unit", 35, "wheel hoe, weeding, push, row crop", false),
                new Seed("Garden Tool Kit 10-Piece", "Kits",
                        "A ten-piece kit with trowel, fork, rake, weeder, pruning shears and a canvas roll. Useful for nursery and kitchen gardens.",
                        "1650", "1890", "kit", 64, "garden tools, kit, pruning, nursery", true),
                new Seed("Manual Seed Planter", "Sowing",
                        "A hand-pushed planter with adjustable seed depth and spacing for small plots and intercropping.",
                        "1950", "2200", "unit", 48, "seed planter, sowing, manual, smallholder", false),
                new Seed("Steel Rake", "Land prep",
                        "A 14-tooth steel rake for levelling, clod breaking and collecting crop residue.",
                        "450", "510", "unit", 130, "rake, land prep, steel", false),
                new Seed("Axe with Ash Handle", "Land prep",
                        "A forged axe head on a seasoned ash handle for clearing stumps and firewood. Balanced for controlled swings.",
                        "780", "860", "unit", 95, "axe, wood, land prep", false)
        );

        List<Seed> soils = List.of(
                new Seed("Cocopeat Block 5 kg", "Growing media",
                        "Washed, low-EC cocopeat that expands to about 70 litres. A clean base for nursery trays and potting mixes.",
                        "399", "450", "5 kg block", 300, "cocopeat, growing media, nursery, low ec", true),
                new Seed("Vermicompost 25 kg", "Compost",
                        "Screened vermicompost with visible castings and a neutral pH. Adds organic matter and gentle nutrition to field beds.",
                        "480", "540", "25 kg bag", 180, "vermicompost, organic, compost, soil health", false),
                new Seed("Organic Potting Mix 10 kg", "Growing media",
                        "A ready-to-use blend of cocopeat, compost and neem cake for vegetables, flowers and saplings.",
                        "349", "399", "10 kg bag", 220, "potting mix, organic, nursery, vegetable", false),
                new Seed("Neem Cake 5 kg", "Soil care",
                        "Cold-pressed neem cake for slow nitrogen release and root-zone pest suppression. Suitable for organic systems.",
                        "299", "340", "5 kg bag", 160, "neem cake, organic, pest, nitrogen", false),
                new Seed("Bone Meal 2 kg", "Nutrition",
                        "Steam-treated bone meal supplying slow-release phosphorus and calcium for root development and flowering.",
                        "249", "280", "2 kg pack", 110, "bone meal, phosphorus, calcium, organic", false),
                new Seed("Rock Phosphate 10 kg", "Nutrition",
                        "Finely ground rock phosphate for acidic soils and long-season crops. Best incorporated before planting.",
                        "420", "470", "10 kg bag", 90, "rock phosphate, phosphorus, acidic soil", false),
                new Seed("Gypsum Soil Conditioner 25 kg", "Soil care",
                        "Agricultural-grade gypsum for reclaiming alkaline soil and improving water infiltration in heavy clays.",
                        "380", "430", "25 kg bag", 140, "gypsum, soil conditioner, alkaline, clay", false),
                new Seed("Biochar Soil Amendment 5 kg", "Soil care",
                        "Charged biochar with a high surface area to improve water holding and microbial habitat in sandy or degraded soil.",
                        "550", "620", "5 kg bag", 70, "biochar, soil health, carbon, water holding", false),
                new Seed("Mycorrhiza Granules 4 kg", "Biofertiliser",
                        "Vesicular-arbuscular mycorrhiza granules that extend root reach and improve phosphorus uptake in horticulture.",
                        "680", "760", "4 kg pack", 55, "mycorrhiza, biofertiliser, roots, phosphorus", true),
                new Seed("Red Loam Potting Soil 10 kg", "Growing media",
                        "Screened red loam blended with compost for terrace gardens and nursery bags. Free-flowing and ready to use.",
                        "199", "230", "10 kg bag", 260, "red soil, potting, loam, terrace garden", false)
        );

        List<Product> products = new ArrayList<>();
        addSeeds(products, kaveri, Category.SEEDS, seeds);
        addSeeds(products, deccan, Category.MACHINERY, machinery);
        addSeeds(products, bharat, Category.TOOLS, tools);
        addSeeds(products, terra, Category.SOILS, soils);
        return productRepository.saveAll(products);
    }

    private void addSeeds(List<Product> target, User seller, Category category, List<Seed> seeds) {
        int index = 0;
        for (Seed seed : seeds) {
            Product product = new Product();
            product.setSeller(seller);
            product.setName(seed.name());
            product.setSlug(slug(seed.name()) + "-" + (++index));
            product.setCategory(category);
            product.setSubcategory(seed.subcategory());
            product.setDescription(seed.description());
            product.setPrice(new BigDecimal(seed.price()));
            product.setMrp(new BigDecimal(seed.mrp()));
            product.setUnit(seed.unit());
            product.setStock(seed.stock());
            product.setRating(0);
            product.setReviewCount(0);
            product.setImageUrl(null);
            product.setLocation(seller.locationLabel());
            product.setTags(seed.tags());
            product.setFeatured(seed.featured());
            product.setActive(true);
            product.setViewCount(70 + random.nextInt(430));
            product.setCreatedAt(Instant.now().minus(Duration.ofDays(8 + random.nextInt(150))));
            target.add(product);
        }
    }

    private void seedReviews(List<Product> products, List<User> buyers) {
        String[] titles = {
                "Exactly as described",
                "Solid quality",
                "Good value for the price",
                "Will order again",
                "Works well in the field",
                "Packed carefully, arrived on time"
        };
        String[] bodies = {
                "The lot matched the listing and the packaging was intact. Used it on a small block first and had no issues.",
                "Quality is consistent with what a good local dealer would supply, but delivered without the trip.",
                "The seller answered my questions about dosage and timing the same day. That alone is worth it.",
                "Second season buying from Proforma. The product arrived with a batch certificate and clear instructions.",
                "Works as expected. Delivery took a couple of days to my district, which is reasonable.",
                "Good quality for the price. I would recommend it to farmers in a similar soil and climate."
        };

        for (Product product : products) {
            int count = 2 + (int) (product.getId() % 2);
            int total = 0;
            for (int index = 0; index < count; index++) {
                User buyer = buyers.get((int) ((product.getId() + index) % buyers.size()));
                int rating = 5 - (int) ((product.getId() + index) % 3);
                Review review = new Review();
                review.setProduct(product);
                review.setUser(buyer);
                review.setRating(rating);
                review.setTitle(titles[(int) ((product.getId() + index) % titles.length)]);
                review.setBody(bodies[(int) ((product.getId() + index * 2) % bodies.length)]);
                review.setCreatedAt(Instant.now().minus(Duration.ofDays(4 + index * 9 + product.getId() % 40)));
                reviewRepository.save(review);
                total += rating;
            }
            product.setRating(Math.round((double) total / count * 10.0) / 10.0);
            product.setReviewCount(count);
            productRepository.save(product);
        }
    }

    private void seedOrdersAndEvents(List<Product> products, List<User> buyers) {
        OrderStatus[] recent = {OrderStatus.PAID, OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.DELIVERED};
        int orderNumber = 1;

        for (int month = 5; month >= 0; month--) {
            for (int slot = 0; slot < 4; slot++) {
                User buyer = buyers.get((month + slot) % buyers.size());
                int daysAgo = month * 30 + 4 + slot * 5;
                Instant createdAt = Instant.now().minus(Duration.ofDays(daysAgo));

                Order order = new Order();
                order.setBuyer(buyer);
                order.setStatus(month == 0 ? recent[slot % recent.length] : OrderStatus.DELIVERED);
                order.setPaymentMethod(slot % 2 == 0 ? "card" : "upi");
                order.setPaymentLabel(slot % 2 == 0 ? "Visa •••• 4242" : "UPI • demo@okhdfcbank");
                order.setPaymentRef("PF-SEED-" + String.format("%04d", orderNumber++));
                order.setShipName(buyer.getName());
                order.setShipPhone(buyer.getPhone());
                order.setShipAddress("Door " + (10 + slot) + ", Market Road");
                order.setShipCity(buyer.getDistrict());
                order.setShipState(buyer.getState());
                order.setShipPincode(pincodeFor(buyer.getState()));
                order.setCreatedAt(createdAt);

                BigDecimal total = BigDecimal.ZERO;
                Set<Integer> chosen = new HashSet<>();
                int lines = 1 + random.nextInt(3);
                List<Product> orderProducts = new ArrayList<>();
                while (chosen.size() < lines) {
                    int index = random.nextInt(products.size());
                    if (chosen.add(index)) {
                        orderProducts.add(products.get(index));
                    }
                }
                for (Product product : orderProducts) {
                    int quantity = 1 + random.nextInt(3);
                    OrderItem item = new OrderItem();
                    item.setProduct(product);
                    item.setSeller(product.getSeller());
                    item.setProductName(product.getName());
                    item.setUnitPrice(product.getPrice());
                    item.setQuantity(quantity);
                    order.addItem(item);
                    total = total.add(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
                }
                order.setTotal(total);
                orderRepository.save(order);

                for (Product product : orderProducts) {
                    ProductEvent event = new ProductEvent();
                    event.setUser(buyer);
                    event.setProduct(product);
                    event.setType(EventType.PURCHASE);
                    event.setCreatedAt(createdAt);
                    eventRepository.save(event);
                }
            }
        }

        for (User buyer : buyers) {
            Set<Integer> viewed = new LinkedHashSet<>();
            while (viewed.size() < 18) {
                viewed.add(random.nextInt(products.size()));
            }
            for (int index : viewed) {
                ProductEvent event = new ProductEvent();
                event.setUser(buyer);
                event.setProduct(products.get(index));
                event.setType(EventType.VIEW);
                event.setCreatedAt(Instant.now().minus(Duration.ofDays(1 + random.nextInt(55))));
                eventRepository.save(event);
            }
            for (int index = 0; index < 4; index++) {
                ProductEvent event = new ProductEvent();
                event.setUser(buyer);
                event.setProduct(products.get(random.nextInt(products.size())));
                event.setType(EventType.CART);
                event.setCreatedAt(Instant.now().minus(Duration.ofDays(1 + random.nextInt(30))));
                eventRepository.save(event);
            }
        }
    }

    private User buyer(String name, String email, String state, String district, String climate,
                       String farmerType, String crops, String farmSize, String irrigation,
                       String phone, int daysAgo) {
        User user = baseUser(name, email, Role.BUYER);
        user.setState(state);
        user.setDistrict(district);
        user.setClimate(climate);
        user.setFarmerType(farmerType);
        user.setCrops(crops);
        user.setFarmSize(farmSize);
        user.setIrrigation(irrigation);
        user.setPhone(phone);
        user.setCreatedAt(Instant.now().minus(Duration.ofDays(daysAgo)));
        return userRepository.save(user);
    }

    private User seller(String business, String email, String state, String district, String climate,
                        String focus, String crops, String farmSize, String irrigation,
                        String about, int daysAgo) {
        User user = baseUser(business, email, Role.SELLER);
        user.setState(state);
        user.setDistrict(district);
        user.setClimate(climate);
        user.setFarmerType("Commercial");
        user.setCrops(crops);
        user.setFarmSize(farmSize);
        user.setIrrigation(irrigation);
        user.setBusinessName(business);
        user.setProductFocus(focus);
        user.setSellerAbout(about);
        user.setPhone("9000000000");
        user.setCreatedAt(Instant.now().minus(Duration.ofDays(daysAgo)));
        return userRepository.save(user);
    }

    private User baseUser(String name, String email, Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
        user.setRole(role);
        return user;
    }

    private String pincodeFor(String state) {
        if (state == null) {
            return "600001";
        }
        return switch (state) {
            case "Kerala" -> "678001";
            case "Punjab" -> "141001";
            case "Maharashtra" -> "422001";
            default -> "638001";
        };
    }

    private String slug(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    private record Seed(String name, String subcategory, String description, String price, String mrp,
                        String unit, int stock, String tags, boolean featured) {
    }
}