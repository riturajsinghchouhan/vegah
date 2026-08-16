export const userProfile = {
  name: "Rituraj Singh",
  membership: "Premium Member",
  phone: "+91 6262 123 456",
  email: "riturajsingh@gmail.com",
  location: "Indore, Madhya Pradesh",
  avatar: "https://xsgames.co/randomusers/assets/avatars/male/74.jpg",
  walletBalance: 1250.00,
  totalBookings: 12,
  completedTrips: 8,
  savedCars: 5
};

export const latestBooking = {
  id: "#CB12345",
  status: "Upcoming", // Upcoming, Completed, Cancelled
  carName: "Hyundai Creta",
  carImage: "/assets/category/80403236-3851-41fd-af84-1f5f53514bdc.png",
  dateRange: "20 May 2024 - 22 May 2024",
  pickup: "Indore Airport, Indore, MP",
  amount: 2999
};

export const quickActions = [
  { id: "bookings", label: "My Bookings", icon: "calendar", color: "text-[#FF5A1F]", bg: "bg-[#FFF0EB]" },
  { id: "payments", label: "Payments", icon: "credit-card", color: "text-blue-500", bg: "bg-blue-50" },
  { id: "offers", label: "Offers & Coupons", icon: "badge-percent", color: "text-green-500", bg: "bg-green-50" },
  { id: "saved", label: "Saved Cars", icon: "heart", color: "text-purple-500", bg: "bg-purple-50" }
];

export const accountSettings = [
  { id: "personal", label: "Personal Information", icon: "user" },
  { id: "addresses", label: "Saved Addresses", icon: "map-pin" },
  { id: "payment", label: "Payment Methods", icon: "wallet" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "help", label: "Help & Support", icon: "circle-help" },
  { id: "privacy", label: "Privacy Policy", icon: "shield-check" }
];

export const preferences = [
  { id: "language", label: "Language", value: "English", isToggle: false },
  { id: "currency", label: "Currency", value: "INR (₹)", isToggle: false },
  { id: "notifications_pref", label: "Push Notifications", isToggle: true, defaultState: true },
  { id: "location", label: "Location Access", isToggle: true, defaultState: true },
  { id: "dark_mode", label: "Dark Mode", isToggle: true, defaultState: false }
];
