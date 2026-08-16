export const carCategories = [
  { id: "all", name: "All Cars", icon: "layout-grid", isActive: true },
  { id: "hatchback", name: "Hatchback", icon: "car", isActive: false },
  { id: "sedan", name: "Sedan", icon: "car", isActive: false },
  { id: "suv", name: "SUV", icon: "car", isActive: false },
  { id: "luxury", name: "Luxury", icon: "crown", isActive: false },
  { id: "muv", name: "MUV", icon: "car", isActive: false }
];

export const popularCars = [
  {
    id: "swift-01",
    name: "Maruti Swift",
    category: "Hatchback",
    seats: 4,
    transmission: "Manual",
    price: 1199,
    discount: "20% OFF",
    image: "/assets/category/18ab8fbf-0957-4003-a27b-d1cf1ce9d68f.png"
  },
  {
    id: "city-02",
    name: "Honda City",
    category: "Sedan",
    seats: 4,
    transmission: "Manual",
    price: 2199,
    discount: "15% OFF",
    image: "/assets/category/2fc37eaa-6b55-4703-bf9c-3d02ce3674e4.png"
  },
  {
    id: "creta-03",
    name: "Hyundai Creta",
    category: "SUV",
    seats: 5,
    transmission: "Manual",
    price: 2999,
    discount: "10% OFF",
    image: "/assets/category/80403236-3851-41fd-af84-1f5f53514bdc.png"
  },
  {
    id: "nexon-04",
    name: "Tata Nexon",
    category: "SUV",
    seats: 5,
    transmission: "Manual",
    price: 2499,
    discount: "10% OFF",
    image: "/assets/category/a8d84954-c85d-4a06-82d1-3ef9587e9844.png"
  }
];

export const benefits = [
  {
    id: "safe",
    title: "Safe & Secure",
    description: "Well maintained cars for your safety",
    icon: "shield",
    color: "text-[#FF5A1F]",
    bgColor: "bg-[#FFF0EB]"
  },
  {
    id: "price",
    title: "Best Prices",
    description: "Competitive prices and great offers",
    icon: "indian-rupee",
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  {
    id: "support",
    title: "24/7 Support",
    description: "Our team is always here to help you",
    icon: "headphones",
    color: "text-green-500",
    bgColor: "bg-green-50"
  },
  {
    id: "easy",
    title: "Easy Booking",
    description: "Quick & easy booking in just a few steps",
    icon: "check-circle",
    color: "text-purple-500",
    bgColor: "bg-purple-50"
  }
];

export const destinations = [
  {
    id: "ooty",
    name: "Ooty",
    description: "Perfect for a weekend getaway",
    distance: "120 km",
    image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80"
  },
  {
    id: "goa",
    name: "Goa",
    description: "Sun, sand and beautiful beaches",
    distance: "245 km",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80"
  },
  {
    id: "manali",
    name: "Manali",
    description: "Explore the hills and serenity",
    distance: "310 km",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80"
  },
  {
    id: "jaipur",
    name: "Jaipur",
    description: "Discover royalty and rich culture",
    distance: "180 km",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&q=80"
  }
];

export const filterOptions = {
  carType: ["Hatchback", "Sedan", "SUV", "Luxury", "MUV"],
  transmission: ["Manual", "Automatic"],
  fuel: ["Petrol", "Diesel", "Electric", "CNG"],
  seats: ["4 Seats", "5 Seats", "7 Seats"],
  price: ["Under ₹1,000/day", "₹1,000–₹2,000/day", "₹2,000+/day"],
  features: ["AC", "GPS", "Bluetooth", "Sunroof"]
};
