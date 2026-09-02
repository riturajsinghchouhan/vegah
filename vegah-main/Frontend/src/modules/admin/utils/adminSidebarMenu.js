import {
  AlertTriangle,
  Building2,
  Calendar,
  Car,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileText,
  FolderTree,
  IndianRupee,
  LayoutDashboard,
  MapPin,
  PiggyBank,
  Receipt,
  RefreshCw,
  Settings,
  Tag,
  Timer,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

export const adminSidebarMenu = [
  {
    type: "section",
    title: "Main Menu",
    permissionKey: "main",
    items: [
      {
        type: "link",
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/admin/dashboard",
        permissionKey: "dashboard",
      },
    ],
  },

  {
    type: "section",
    title: "Inventory",
    permissionKey: "inventory",
    items: [
      {
        type: "link",
        label: "EV Rent Zones",
        icon: MapPin,
        path: "/admin/zones",
        permissionKey: "zones",
      },
      {
        type: "link",
        label: "EV Categories",
        icon: FolderTree,
        path: "/admin/categories",
        permissionKey: "categories",
      },
      {
        type: "link",
        label: "EV Management",
        icon: Car,
        path: "/admin/evs",
        permissionKey: "bikes",
      },
    ],
  },
  {
    type: "section",
    title: "Booking Management",
    permissionKey: "bookings",
    items: [
      {
        type: "collapse",
        label: "Bookings",
        icon: ClipboardList,
        path: "/admin/bookings", // Base path for exact match checks
        items: [
          {
            type: "link",
            label: "All Bookings",
            path: "/admin/bookings",
          },
          {
            type: "link",
            label: "Live Rentals",
            path: "/admin/bookings?ops=live",
          },
          {
            type: "link",
            label: "Upcoming Pickups",
            path: "/admin/bookings?ops=pickups",
          },
          {
            type: "link",
            label: "Upcoming Returns",
            path: "/admin/bookings?ops=returns",
          },
          {
            type: "link",
            label: "Late Returns",
            path: "/admin/bookings?ops=late",
          },
          {
            type: "link",
            label: "Extension Requests",
            path: "/admin/bookings?ops=extensions",
          },
          {
            type: "link",
            label: "Pending Deposits",
            path: "/admin/bookings?depositStatus=pending_collection",
          },
          {
            type: "link",
            label: "Pending Approvals",
            path: "/admin/bookings?status=pending_approval",
          }
        ],
      },
      {
        type: "link",
        label: "Fleet Timeline",
        icon: Calendar,
        path: "/admin/fleet-timeline",
        permissionKey: "list",
      },
      {
        type: "link",
        label: "EV Inspections",
        icon: ClipboardCheck,
        path: "/admin/inspections",
        permissionKey: "list",
      }
    ],
  },
  {
    type: "section",
    title: "Customers",
    permissionKey: "customers",
    items: [
      {
        type: "link",
        label: "Customers",
        icon: Users,
        path: "/admin/customers",
        permissionKey: "list",
      },
    ],
  },
  {
    type: "section",
    title: "Operations",
    permissionKey: "operations",
    items: [
      {
        type: "link",
        label: "Reports",
        icon: FileText,
        path: "/admin/reports",
        permissionKey: "reports",
      },
      {
        type: "link",
        label: "Wallet & Refunds",
        icon: Wallet,
        path: "/admin/wallet",
        permissionKey: "reports",
      },
      {
        type: "link",
        label: "Coupons",
        icon: Tag,
        path: "/admin/coupons",
        permissionKey: "coupons",
      },
      {
        type: "link",
        label: "Finance",
        icon: PiggyBank,
        path: "/admin/finance",
        permissionKey: "reports",
      },
      {
        type: "link",
        label: "Settlements",
        icon: IndianRupee,
        path: "/admin/settlements",
        permissionKey: "reports",
      },
      {
        type: "link",
        label: "Tax & Billing",
        icon: Receipt,
        path: "/admin/tax-billing",
        permissionKey: "settings",
      },
      {
        type: "link",
        label: "Settings",
        icon: Settings,
        path: "/admin/settings",
        permissionKey: "settings",
      },
    ],
  },
];
