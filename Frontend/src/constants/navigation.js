import { BatteryCharging, Compass, Home, ReceiptText, UserRound } from "lucide-react";

export const bottomNavItems = [
  { label: "Home", path: "/home", icon: Home },
  { label: "Explore", path: "/vehicles", icon: Compass },
  { label: "Bookings", path: "/bookings", icon: ReceiptText },
  { label: "Charging", path: "/charging", icon: BatteryCharging },
  { label: "Profile", path: "/profile", icon: UserRound },
];
