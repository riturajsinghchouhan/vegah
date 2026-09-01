import { BatteryCharging, Compass, Home, ReceiptText, UserRound } from "lucide-react";

export const bottomNavItems = [
  { label: "Home", path: "/user/home", icon: Home },
  { label: "Explore", path: "/user/vehicles", icon: Compass },
  { label: "Bookings", path: "/user/bookings", icon: ReceiptText },
  { label: "Charging", path: "/user/charging", icon: BatteryCharging },
  { label: "Profile", path: "/user/profile", icon: UserRound },
];
