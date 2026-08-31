export const carCategories = [
  { id: "all", name: "All Scoots", icon: "layout-grid", isActive: true },
  { id: "electric", name: "Electric", icon: "car", isActive: false },
  { id: "city", name: "City", icon: "car", isActive: false },
  { id: "premium", name: "Premium", icon: "crown", isActive: false },
  { id: "performance", name: "Performance", icon: "car", isActive: false },
];

export const popularCars = [
  {
    id: "ather-450x",
    name: "Ather 450X",
    category: "Electric",
    seats: 2,
    transmission: "Twist & Go",
    price: 899,
    discount: "20% OFF",
    image: "/assets/category/18ab8fbf-0957-4003-a27b-d1cf1ce9d68f.png",
  },
  {
    id: "ola-s1-pro",
    name: "Ola S1 Pro",
    category: "Performance",
    seats: 2,
    transmission: "Twist & Go",
    price: 999,
    discount: "15% OFF",
    image: "/assets/category/2fc37eaa-6b55-4703-bf9c-3d02ce3674e4.png",
  },
  {
    id: "tvs-iqube-st",
    name: "TVS iQube ST",
    category: "City",
    seats: 2,
    transmission: "Twist & Go",
    price: 949,
    discount: "10% OFF",
    image: "/assets/category/80403236-3851-41fd-af84-1f5f53514bdc.png",
  },
  {
    id: "chetak-3501",
    name: "Bajaj Chetak 3501",
    category: "Premium",
    seats: 2,
    transmission: "Twist & Go",
    price: 1099,
    discount: "10% OFF",
    image: "/assets/category/a8d84954-c85d-4a06-82d1-3ef9587e9844.png",
  },
];

export const benefits = [
  {
    id: "safe",
    title: "Safe & Secure",
    description: "Well maintained scoots for your safety",
    icon: "shield",
    color: "text-[#FF5A1F]",
    bgColor: "bg-[#FFF0EB]",
  },
  {
    id: "price",
    title: "Best Prices",
    description: "Competitive prices and great offers",
    icon: "indian-rupee",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    id: "support",
    title: "24/7 Support",
    description: "Our team is always here to help you",
    icon: "headphones",
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  {
    id: "easy",
    title: "Easy Booking",
    description: "Quick & easy booking in just a few steps",
    icon: "check-circle",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
];

export const destinations = [
  {
    id: "ooty",
    name: "Ooty",
    description: "Perfect for a weekend getaway",
    distance: "120 km",
    image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80",
  },
  {
    id: "goa",
    name: "Goa",
    description: "Sun, sand and beautiful beaches",
    distance: "245 km",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80",
  },
  {
    id: "manali",
    name: "Manali",
    description: "Explore the hills and serenity",
    distance: "310 km",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80",
  },
  {
    id: "jaipur",
    name: "Jaipur",
    description: "Discover royalty and rich culture",
    distance: "180 km",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&q=80",
  },
];

export const filterOptions = {
  carType: ["Electric", "City", "Premium", "Performance"],
  transmission: ["Twist & Go", "Auto Ride"],
  fuel: ["Electric"],
  seats: ["1 Rider", "2 Riders"],
  price: ["Under Rs 1,000/day", "Rs 1,000-Rs 1,500/day", "Rs 1,500+/day"],
  features: ["Fast Charging", "Bluetooth", "Reverse Mode", "GPS"],
};
