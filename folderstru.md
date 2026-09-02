evora-user/
│
├── public/
│   ├── images/
│   └── icons/
│
├── src/
│   │
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── EmptyState.jsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── BottomNav.jsx
│   │   │   └── PageHeader.jsx
│   │   │
│   │   ├── vehicle/
│   │   │   ├── VehicleCard.jsx
│   │   │   ├── VehicleFilter.jsx
│   │   │   └── VehicleSpecs.jsx
│   │   │
│   │   ├── booking/
│   │   │   ├── BookingSteps.jsx
│   │   │   ├── DatePicker.jsx
│   │   │   ├── TimePicker.jsx
│   │   │   └── BookingSummary.jsx
│   │   │
│   │   └── charging/
│   │       ├── StationCard.jsx
│   │       ├── StationFilter.jsx
│   │       └── ChargerInfo.jsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── OTP.jsx
│   │   │
│   │   ├── home/
│   │   │   └── Home.jsx
│   │   │
│   │   ├── vehicles/
│   │   │   ├── Vehicles.jsx
│   │   │   └── VehicleDetails.jsx
│   │   │
│   │   ├── booking/
│   │   │   ├── Booking.jsx
│   │   │   ├── Payment.jsx
│   │   │   └── BookingSuccess.jsx
│   │   │
│   │   ├── bookings/
│   │   │   ├── MyBookings.jsx
│   │   │   └── ActiveRental.jsx
│   │   │
│   │   ├── charging/
│   │   │   ├── ChargingStations.jsx
│   │   │   ├── StationDetails.jsx
│   │   │   └── Navigation.jsx
│   │   │
│   │   └── profile/
│   │       └── Profile.jsx
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── BookingContext.jsx
│   │   └── LocationContext.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useLocation.js
│   │   └── useDebounce.js
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── vehicleService.js
│   │   ├── bookingService.js
│   │   └── chargingService.js
│   │
│   ├── utils/
│   │   ├── formatPrice.js
│   │   ├── formatDate.js
│   │   └── constants.js
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .env
├── package.json
└── vite.config.js