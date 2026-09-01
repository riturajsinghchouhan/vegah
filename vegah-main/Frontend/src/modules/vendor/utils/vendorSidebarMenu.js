import {
  BarChart3,
  Car,
  Building2,
  CalendarClock,
  ClipboardCheck,
  History,
  IndianRupee,
  LayoutDashboard,
  ListChecks,
  Map,
  Receipt,
  Settings,
  Tag,
  Tags,
  Wallet,
} from "lucide-react";

export const vendorSidebarMenu = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/vendor/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Inventory",
    items: [
      { label: "Zones", path: "/vendor/zones", icon: Map },
      { label: "Hubs", path: "/vendor/hubs", icon: Building2 },
      { label: "EVs", path: "/vendor/evs", icon: Car },
      { label: "Categories", path: "/vendor/categories", icon: Tags },
    ],
  },
  {
    title: "Bookings",
    items: [
      { label: "Bookings", path: "/vendor/bookings", icon: ListChecks },
      { label: "Fleet Timeline", path: "/vendor/fleet-timeline", icon: CalendarClock },
      { label: "Inspections", path: "/vendor/inspections", icon: ClipboardCheck },
      { label: "Coupons", path: "/vendor/coupons", icon: Tag },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Wallet", path: "/vendor/wallet", icon: Wallet },
      { label: "Transactions", path: "/vendor/transactions", icon: History },
      { label: "Settlements", path: "/vendor/settlements", icon: IndianRupee },
      { label: "Tax & Billing", path: "/vendor/tax-billing", icon: Receipt },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Reports", path: "/vendor/reports", icon: BarChart3 },
      { label: "Settings", path: "/vendor/settings", icon: Settings },
    ],
  },
];
