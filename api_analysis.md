# Vegah – Full App API Analysis
> Poore frontend ka analysis (User App + Admin App) aur backend ke existing endpoints se comparison.
> **Legend:** ✅ Exists & Integrated | ⚠️ Exists in Backend but NOT integrated in frontend | ❌ Missing / Needs to be created

---

## 🔵 USER APP (`/user/*`)

---

### 1. Auth Flow — LoginPage, OtpPage, NamePage

| Feature | API Endpoint | Status |
|---|---|---|
| Phone se OTP bhejo | `POST /api/v1/auth/request-otp` | ✅ Exists & Integrated |
| OTP verify karo | `POST /api/v1/auth/verify-otp` | ✅ Exists & Integrated |
| Token refresh | `POST /api/v1/auth/refresh-token` | ✅ Exists |
| Naam/Email update karo | `PATCH /api/v1/users/profile` | ✅ Exists & Integrated |
| Logout | `POST /api/v1/auth/logout` | ✅ Exists & Integrated |

---

### 2. Home Page — `HomePage.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Vehicle categories fetch karo (section) | `GET /api/v1/admin/categories` | ⚠️ Exists, frontend me mock data use ho raha hai |
| Popular vehicles dikhao | `GET /api/v1/vehicles` | ⚠️ Exists, frontend me mock `vehicles` data use ho raha hai |
| Active offers/coupons dikhao | `GET /api/v1/coupons/active` | ❌ Missing — sirf admin coupons list hai, public route nahi |
| Location se pickup zone fetch karo | `GET /api/v1/admin/zones` | ⚠️ Exists (admin only), user-facing zone API nahi |

---

### 3. Vehicles Browse — `VehiclesPage.jsx`, `VehicleDetailsPage.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Vehicles list karo (with search/filter) | `GET /api/v1/vehicles?category=&search=` | ⚠️ Exists, frontend me mock `exploreData` use ho raha hai |
| Single vehicle details | `GET /api/v1/vehicles/:id` | ⚠️ Exists, frontend me mock data use ho raha hai |
| Vehicle images | `GET /api/v1/vehicles/:id` (images array) | ⚠️ Backend me images field hai, frontend connected nahi |

---

### 4. Booking Flow — BookingPage, AadharDetailsPage, LicenseDetailsPage, BatteryPackagePage, UserPhotoPage, PaymentPage

| Feature | API Endpoint | Status |
|---|---|---|
| Booking create karo | `POST /api/v1/bookings` | ✅ Exists — PaymentPage me connected hai |
| Pickup zones/hubs fetch karo | `GET /api/v1/admin/zones` | ⚠️ Exists, but admin-only. User ke liye public zone list nahi. |
| Aadhar document upload | `POST /api/v1/users/documents` | ⚠️ Exists, frontend me integrate nahi |
| License document upload | `POST /api/v1/users/documents` | ⚠️ Exists, frontend me integrate nahi |
| User selfie/photo upload | `POST /api/v1/users/documents` | ⚠️ Exists, frontend me integrate nahi |
| Battery packages fetch karo | ❌ No dedicated endpoint | ❌ Missing — BatteryPackagePage me static data hai |
| Coupon validate karo | `POST /api/v1/coupons/validate` | ⚠️ Exists, PaymentPage me "Apply Promo" button hai but not wired |
| Payment gateway initiate | ❌ No payment gateway API | ❌ Missing — Direct booking create ho raha hai, actual payment nahi |

---

### 5. My Bookings — `BookingsPage.jsx`, `ActiveRentalPage.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| User ki bookings list | `GET /api/v1/bookings` (user ke liye filtered) | ⚠️ Exists, frontend me hardcoded mock `bookings` data hai |
| Single booking details | `GET /api/v1/bookings/:id` | ⚠️ Exists, integrate nahi |
| Booking status update/cancel | `PATCH /api/v1/bookings/:id/status` | ⚠️ Exists, integrate nahi |
| Active rental live data (battery, time, location) | ❌ No real-time API / WebSocket | ❌ Missing — Page me hardcoded static values hain |
| Rental extend | ❌ No API | ❌ Missing |

---

### 6. Charging Stations — `ChargingPage.jsx`, `StationDetailsPage.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Nearby charging stations | ❌ No charging station module in backend | ❌ Missing — Frontend me hardcoded chargingStations mock data |
| Station details | ❌ No charging station module | ❌ Missing |
| Filter stations (type, availability) | ❌ No charging station API | ❌ Missing |

---

### 7. User Profile — `ProfilePage.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| User profile fetch karo | `GET /api/v1/users/me` | ✅ Exists & Integrated |
| Wallet balance fetch | `GET /api/v1/wallet/user` | ⚠️ Exists, ProfilePage me hardcoded walletBalance: 0 hai |
| Profile update (naam, email) | `PATCH /api/v1/users/profile` | ✅ Exists |
| KYC documents list | `GET /api/v1/users/documents` | ⚠️ Exists, Profile page me dikhaya nahi |
| Logout | `POST /api/v1/auth/logout` | ✅ Exists & Integrated |

---

## 🔴 ADMIN APP (`/admin/*`)

---

### 8. Admin Login — `AdminLogin.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Admin login (email/password) | `POST /api/v1/admin/auth/login` | ✅ Exists & Integrated |
| Admin token refresh | `POST /api/v1/admin/auth/refresh` | ✅ Exists |

---

### 9. Admin Dashboard — `AdminDashboard.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Inventory summary (total/available/booked) | `GET /api/v1/admin/inventory/summary` | ✅ Exists & Integrated |
| Recent bookings list (top 5) | `GET /api/v1/bookings?limit=5` | ✅ Exists & Integrated |
| Recent users list (top 5) | `GET /api/v1/users?limit=5` | ✅ Exists & Integrated |
| Total users count | ❌ No dedicated count API | ❌ Missing — Dashboard shows "--" |
| Total bookings count | ❌ No dedicated count API | ❌ Missing — Dashboard shows "--" |
| Today's revenue | ❌ No API | ❌ Missing — Dashboard shows "--" |
| Revenue chart data (daily/weekly) | ❌ No time-series API | ❌ Missing — Hardcoded mock chart data |
| Monthly bookings chart | ❌ No time-series API | ❌ Missing — Hardcoded mock chart data |

---

### 10. Zones Management — `AdminZones.jsx`, `AdminZoneForm.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Zones list | `GET /api/v1/admin/zones` | ✅ Exists & Integrated |
| Zone create | `POST /api/v1/admin/zones` | ✅ Exists & Integrated |
| Zone update | `PUT /api/v1/admin/zones/:id` | ✅ Exists & Integrated |
| Zone delete | `DELETE /api/v1/admin/zones/:id` | ✅ Exists & Integrated |
| Zone vehicle availability | `GET /api/v1/admin/inventory/zones/:id/availability` | ✅ Exists |

---

### 11. Categories Management — `AdminCategories.jsx`, `AdminCategoryForm.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Categories list | `GET /api/v1/admin/categories` | ✅ Exists & Integrated |
| Category create | `POST /api/v1/admin/categories` | ✅ Exists & Integrated |
| Category update | `PUT /api/v1/admin/categories/:id` | ✅ Exists & Integrated |
| Category delete | `DELETE /api/v1/admin/categories/:id` | ✅ Exists & Integrated |

---

### 12. EV Management — `AdminEVs.jsx`, `AdminEVForm.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Vehicles list | `GET /api/v1/vehicles` | ✅ Exists & Integrated |
| Vehicle create (with images) | `POST /api/v1/vehicles` | ✅ Exists & Integrated |
| Vehicle update | `PUT /api/v1/vehicles/:id` | ✅ Exists & Integrated |
| Vehicle delete | `DELETE /api/v1/vehicles/:id` | ✅ Exists & Integrated |
| Vehicle status update | `PATCH /api/v1/admin/inventory/vehicles/:id/status` | ✅ Exists & Integrated |
| Delete specific vehicle image | `DELETE /api/v1/vehicles/:id/images/:imageId` | ✅ Exists |

---

### 13. Fleet Timeline — `AdminFleetTimeline.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Fleet timeline (vehicle schedules) | `GET /api/v1/admin/fleet-timeline` | ✅ Exists & Integrated |

---

### 14. Inspections — `AdminInspections.jsx`, `AdminInspectionDetails.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Inspections list | `GET /api/v1/admin/inspections` | ✅ Exists & Integrated |
| Inspection details | `GET /api/v1/admin/inspections/:id` | ✅ Exists & Integrated |
| Inspection create | `POST /api/v1/admin/inspections` | ✅ Exists & Integrated |
| Inspection update | `PUT /api/v1/admin/inspections/:id` | ✅ Exists & Integrated |

---

### 15. Customers — `AdminCustomers.jsx`, `AdminCustomerDetails.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Users/Customers list | `GET /api/v1/users` | ✅ Exists & Integrated |
| User details | `GET /api/v1/users/:id` | ✅ Exists & Integrated |
| Block user | `PATCH /api/v1/users/:id/block` | ✅ Exists & Integrated |
| Unblock user | `PATCH /api/v1/users/:id/unblock` | ✅ Exists & Integrated |
| User's KYC documents | `GET /api/v1/users/documents` | ⚠️ Exists, admin customer detail me integrate nahi |

---

### 16. Reports — `AdminReports.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Analytics data fetch | `GET /api/v1/admin/reports/analytics` | ✅ Exists & Integrated |

---

### 17. Wallet & Refunds — `AdminWallet.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Admin wallet summary | `GET /api/v1/wallet/admin/summary` | ✅ Exists & Integrated |
| Refunds list | `GET /api/v1/wallet/admin/refunds` | ✅ Exists & Integrated |
| Refund status update | `PATCH /api/v1/wallet/admin/refunds/:id/status` | ✅ Exists & Integrated |
| User wallet add funds | `POST /api/v1/wallet/user/add-funds` | ✅ Exists & Integrated |

---

### 18. Coupons — `AdminCoupons.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Coupons list | `GET /api/v1/coupons/admin` | ✅ Exists & Integrated |
| Coupon create | `POST /api/v1/coupons/admin` | ✅ Exists & Integrated |
| Coupon update | `PUT /api/v1/coupons/admin/:id` | ✅ Exists & Integrated |
| Coupon delete | `DELETE /api/v1/coupons/admin/:id` | ✅ Exists & Integrated |
| Coupon status toggle | `PATCH /api/v1/coupons/admin/:id/status` | ✅ Exists & Integrated |

---

### 19. Finance, Settlements, Tax Billing

| Feature | API Endpoint | Status |
|---|---|---|
| Finance summary | `GET /api/v1/admin/finance/summary` | ✅ Exists & Integrated |
| Settlements list | `GET /api/v1/admin/finance/settlements` | ✅ Exists & Integrated |
| Tax & billing data | `GET /api/v1/admin/finance/tax-billing` | ✅ Exists & Integrated |

---

### 20. Settings — `AdminSettings.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Settings fetch | `GET /api/v1/admin/settings` | ✅ Exists & Integrated |
| Settings update | `PUT /api/v1/admin/settings` | ✅ Exists & Integrated |

---

### 21. Admin Profile — `AdminProfile.jsx`

| Feature | API Endpoint | Status |
|---|---|---|
| Admin profile fetch | `GET /api/v1/admin/profile` | ✅ Exists & Integrated |

---

## 🚨 APIs Jo BANANA Padenge (Missing — Priority Order)

| Priority | Feature | Suggested Endpoint |
|---|---|---|
| 🔴 HIGH | Public coupons/offers (User Home Page) | `GET /api/v1/coupons/active` |
| 🔴 HIGH | Charging Stations list | `GET /api/v1/charging-stations` |
| 🔴 HIGH | Charging Station details | `GET /api/v1/charging-stations/:id` |
| 🔴 HIGH | Battery packages pricing list | `GET /api/v1/battery-packages` |
| 🔴 HIGH | Payment gateway initiate | `POST /api/v1/payments/initiate` |
| 🔴 HIGH | Payment gateway verify | `POST /api/v1/payments/verify` |
| 🟡 MEDIUM | Public zone/hub list for User booking | `GET /api/v1/zones/public` |
| 🟡 MEDIUM | Active rental live status | `GET /api/v1/bookings/:id/live` |
| 🟡 MEDIUM | Dashboard stats (total counts + today's revenue) | `GET /api/v1/admin/dashboard/stats` |
| 🟡 MEDIUM | Revenue & booking time-series (chart data) | `GET /api/v1/admin/reports/charts` |
| 🟢 LOW | Rental extend | `PATCH /api/v1/bookings/:id/extend` |

---

## 📋 Frontend Pages Jo Abhi Mock Data Use Kar Rahe Hain

| Page | Mock Data File | Real API Available? |
|---|---|---|
| `HomePage` | `data/vehicles.js` | ⚠️ Yes — `GET /api/v1/vehicles` |
| `VehiclesPage` | `data/exploreData.js` | ⚠️ Yes — `GET /api/v1/vehicles` |
| `BookingsPage` | `data/bookings.js` | ⚠️ Yes — `GET /api/v1/bookings` |
| `ChargingPage` | `data/chargingStations.js` | ❌ No — API banana padega |
| `ProfilePage` (wallet) | Hardcoded `walletBalance: 0` | ⚠️ Yes — `GET /api/v1/wallet/user` |
| `AdminDashboard` (charts) | Hardcoded `revenueData`, `bookingData` | ❌ No — Chart API banana padega |
