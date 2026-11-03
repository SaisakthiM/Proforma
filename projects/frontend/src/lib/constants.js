export const CATEGORIES = [
  {
    value: 'SEEDS',
    label: 'Seeds & planting material',
    short: 'Seeds',
    code: 'D-01',
    slug: 'seeds',
    copy: 'Certified, lot-tested seed for cereals, pulses, oilseeds and vegetables.'
  },
  {
    value: 'MACHINERY',
    label: 'Machinery & equipment',
    short: 'Machinery',
    code: 'D-02',
    slug: 'machinery',
    copy: 'Tractors, tillage, irrigation and harvesting equipment with service support.'
  },
  {
    value: 'TOOLS',
    label: 'Tools & implements',
    short: 'Tools',
    code: 'D-03',
    slug: 'tools',
    copy: 'Forged hand tools and implements that survive a full season in the field.'
  },
  {
    value: 'SOILS',
    label: 'Soils & nutrition',
    short: 'Soils',
    code: 'D-04',
    slug: 'soils',
    copy: 'Compost, biofertiliser, growing media and conditioners for living soil.'
  }
]

export const categoryByValue = CATEGORIES.reduce((map, category) => {
  map[category.value] = category
  return map
}, {})

export const FARMER_TYPES = [
  'Smallholder',
  'Commercial',
  'Organic grower',
  'Horticulture',
  'Home garden',
  'Cooperative / FPO'
]

export const CROP_OPTIONS = [
  'Paddy',
  'Wheat',
  'Maize',
  'Cotton',
  'Soybean',
  'Sugarcane',
  'Groundnut',
  'Pulses',
  'Millets',
  'Vegetables',
  'Fruits',
  'Coconut',
  'Banana',
  'Grapes',
  'Flowers',
  'Spices'
]

export const CLIMATES = [
  'Tropical wet',
  'Humid tropical',
  'Semi-arid',
  'Tropical dry',
  'Subtropical',
  'Temperate highland'
]

export const IRRIGATION = [
  'Rain-fed',
  'Canal',
  'Borewell / tube well',
  'Drip irrigation',
  'Sprinkler',
  'Mixed sources'
]

export const STATES = [
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Maharashtra',
  'Punjab',
  'Haryana',
  'Uttar Pradesh',
  'Gujarat',
  'Rajasthan',
  'Madhya Pradesh',
  'West Bengal',
  'Odisha',
  'Bihar',
  'Assam',
  'Other'
]

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'popular', label: 'Most reviewed' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest listings' }
]

export const DEMO_ACCOUNTS = {
  buyer: { email: 'ravi@proforma.dev', password: 'Proforma@123', name: 'Ravi Kumar' },
  seller: { email: 'seller.kaveri@proforma.dev', password: 'Proforma@123', name: 'Kaveri Agro Seeds' }
}

export const ORDER_STATUSES = ['PAID', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']