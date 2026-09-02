# VEGAH — MASTER PRODUCT & ENGINEERING PLANNING PROMPT

You are acting as a **Senior Full-Stack Product Engineer, Software Architect, UI/UX Designer and Technical Lead**.

Before writing any production code, create a complete and detailed implementation blueprint for the following product.

The product name is temporarily **EVORA**.

VEGAH is a professional **EV Mobility Platform** where users can rent electric cars, bikes and scooters for hours or days, while also discovering nearby EV charging stations with complete information, availability, distance and navigation.

The application will eventually have three major experiences:

1. USER APPLICATION
2. VENDOR APPLICATION / DASHBOARD
3. ADMIN PANEL

The current development priority is the **USER APPLICATION**, but the architecture must be designed from day one so that Vendor and Admin can be added without restructuring the entire project.

---

# 1. CORE PRODUCT VISION

EVORA should not feel like a simple vehicle-rental website.

It should feel like a complete:

**EV Mobility Platform**

The long-term product should support:

* EV vehicle rental
* Cars
* Bikes
* Scooters
* Hourly rental
* Daily rental
* Vehicle availability
* Pickup and return locations
* Booking management
* Payments
* Active rental tracking
* Nearby charging station discovery
* Charging station details
* Charger availability
* Charger type
* Charging speed
* Pricing
* Amenities
* Reviews
* Navigation
* Road distance
* Estimated travel time
* Vendor vehicle management
* Admin management
* Revenue analytics
* Notifications
* Support

The architecture must remain extensible for future features such as:

* Battery swapping
* EV service/maintenance
* Roadside assistance
* Corporate EV rentals
* Subscription plans
* Fleet management
* Loyalty/reward system

Do NOT implement future features now unless they are required for the architecture.

---

# 2. TECHNOLOGY STACK

Use the following stack unless there is a strong architectural reason to recommend otherwise.

## Frontend

* React
* Vite
* JavaScript
* ES6+
* React Router
* Tailwind CSS
* Axios
* Lucide React
* Context API or Zustand where genuinely useful
* React Hook Form where forms become complex
* Google Maps / Google Maps Platform
* Responsive design

DO NOT use TypeScript for the initial implementation.

Use clean modern ES6+ JavaScript.

Use:

* const / let
* arrow functions
* destructuring
* spread/rest operators
* modules
* async/await
* optional chaining
* nullish coalescing
* map/filter/reduce/find
* reusable functions
* clean component composition

Avoid unnecessary abstraction.

---

# 3. BACKEND ARCHITECTURE

The final system will use:

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT authentication
* bcrypt/password hashing
* Razorpay for payments
* Google Maps APIs
* Socket.IO only where real-time functionality genuinely requires it
* Cloudinary or another suitable object storage solution for images

The frontend should be API-ready from the beginning.

Do not hard-code API logic inside UI components.

Use:

Page
→ Component
→ Hook/Context
→ Service
→ Axios
→ Backend API

---

# 4. IMPORTANT ENTITY / MODEL ARCHITECTURE

There are three primary identity/role models:

## User

Regular customer who:

* registers/logs in
* browses EVs
* books vehicles
* makes payments
* views bookings
* tracks active rentals
* discovers charging stations
* navigates to stations
* reviews vehicles/stations
* manages profile

## Vendor

Vehicle owner/business who:

* registers
* submits verification/KYC
* adds vehicles
* manages vehicle information
* manages pricing
* controls availability
* manages bookings
* sees customers
* sees revenue
* manages profile
* receives payouts

## Admin

Platform administrator who:

* manages users
* manages vendors
* verifies vendors
* manages vehicles
* approves/rejects vehicles
* manages bookings
* manages charging stations
* manages payments/refunds
* manages reports
* manages reviews
* controls platform settings

IMPORTANT:

User, Vendor and Admin are the primary identity models/roles.

However, do NOT assume the database should contain only three total MongoDB models.

Design the complete domain model separately.

Potential domain models include:

* User
* Vendor
* Admin
* Vehicle
* VehicleImage
* Booking
* Payment
* ChargingStation
* Charger
* Review
* Notification
* Location
* Coupon/Promo
* SupportTicket
* VendorPayout

Only create separate models where they provide real value.

Do not over-engineer.

Explain which models should actually exist and why.

---

# 5. USER APP — COMPLETE FUNCTIONAL SCOPE

The User App is the current priority.

Create a complete screen and feature architecture.

## Authentication

Screens:

* Splash
* Onboarding
* Login
* OTP Verification
* Signup if required
* Session restoration
* Logout

Authentication should eventually use JWT.

The UI should initially be mock/API-ready.

---

# 6. USER HOME

The home screen must immediately communicate the two primary actions:

## Rent a Vehicle

and

## Find Charging Stations

Home should include:

* Current location
* Location selector
* Search
* Rent Vehicle CTA
* Charging Station CTA
* Vehicle categories
* Cars
* Bikes
* Scooters
* Popular EVs
* Nearby charging stations
* Recommended vehicles
* Bottom navigation

Do not overload the home page.

The hierarchy should be:

Location
→ Search
→ Main actions
→ Categories
→ Vehicles
→ Charging stations

---

# 7. VEHICLE DISCOVERY

Create:

* Vehicle listing
* Search
* Category filters
* Price filters
* Distance filters
* Range filters
* Battery filters
* Rating filters
* Availability filter
* Sorting

Categories:

* All
* Cars
* Bikes
* Scooters

Vehicle cards should show only useful information:

* Vehicle image
* Name
* Type
* Range
* Battery
* Rating
* Price/hour
* Price/day
* Distance
* Availability

Avoid information overload.

---

# 8. VEHICLE DETAILS

Vehicle details should include:

* Image gallery
* Vehicle name
* Brand
* Model
* Rating
* Reviews
* Range
* Battery
* Charging time
* Charging capability
* Seats
* Vehicle type
* Features
* Location
* Distance
* Pickup information
* Hourly price
* Daily price
* Security deposit
* Availability

Potential features:

* GPS
* Fast charging
* Bluetooth
* ABS
* Helmet
* Air conditioning
* USB charging

Primary CTA:

BOOK NOW

The CTA should remain easily accessible.

---

# 9. BOOKING SYSTEM

Booking must support both:

* Hourly rental
* Daily rental

Design a clean multi-step booking flow.

Recommended flow:

STEP 1:
Select rental type

Hourly / Daily

STEP 2:
Select date

STEP 3:
Select pickup time

STEP 4:
Select return date/time

STEP 5:
Select pickup location

STEP 6:
Booking summary

Do not make the flow unnecessarily complicated.

Booking state should be centralized.

Example conceptual state:

{
vehicle,
rentalType,
startDate,
startTime,
endDate,
endTime,
pickupLocation,
pricing,
discount,
total
}

---

# 10. BOOKING PRICING

The system must clearly show:

* Rental price
* Security deposit
* Taxes
* Platform/service fee
* Discount
* Coupon
* Total amount

Do not hide important charges.

Create a reusable pricing calculation utility.

The frontend should display calculated values but final pricing must eventually be validated by the backend.

---

# 11. PAYMENT

Payment screen should support:

* UPI
* Cards
* Net Banking
* Wallets

Use Razorpay integration eventually.

For the first frontend stage, create a clean mock payment flow while keeping the architecture ready for real Razorpay integration.

Flow:

Booking Summary
→ Payment
→ Payment Processing
→ Success / Failure

---

# 12. BOOKING SUCCESS

Show:

* Success state
* Booking ID
* Vehicle
* Rental dates
* Pickup location
* Amount
* Booking status

Actions:

* View Booking
* Navigate to Pickup

---

# 13. MY BOOKINGS

Tabs:

* Upcoming
* Active
* Completed
* Cancelled

Each booking card should show:

* Vehicle
* Booking ID
* Dates
* Location
* Amount
* Status

Booking details should include:

* Complete booking information
* Payment information
* Cancellation policy
* Pickup details
* Return details

---

# 14. ACTIVE RENTAL

This is an important screen.

Show:

* Vehicle
* Vehicle number
* Rental timer
* Pickup location
* Return location
* Battery percentage
* Remaining range
* Rental end time
* Extend rental
* End rental
* Support/Emergency

If real-time vehicle tracking is not available, do not fake it.

Design the UI so live tracking can be added later.

---

# 15. CHARGING STATION SYSTEM

Charging stations are a major differentiating feature of EVORA.

Create a premium charging discovery experience.

The charging screen should primarily be a map.

Show:

* User's current location
* Charging station markers
* Nearby stations
* Station clusters
* Search
* Filters

Filters:

* Available now
* Fast charging
* AC
* DC
* Connector type
* Price
* Distance

---

# 16. CHARGING STATION CARD

Show:

* Station name
* Rating
* Distance
* Road travel time
* Availability
* Number of chargers
* Charging speed
* Price
* Open/closed status

Example:

ChargeGrid Station

2.4 km away
7 min drive
6/8 chargers available

---

# 17. CHARGING STATION DETAILS

Show:

* Station image
* Name
* Rating
* Address
* Distance
* Estimated driving time
* Open/closed status

Live-style charger section:

DC Fast Charger
120 kW
CCS2
₹XX/kWh
Available

AC Charger
22 kW
Type 2
₹XX/kWh
Occupied

Also show:

* Number of chargers
* Connector types
* Charging speeds
* Pricing
* Opening hours
* Amenities
* Payment methods
* Supported vehicles
* Reviews

Primary action:

NAVIGATE

Secondary:

START CHARGING

If real charging-start APIs are unavailable, clearly design it as an integration-ready feature instead of pretending it is functional.

---

# 18. LOCATION AND NAVIGATION

Location functionality must distinguish:

AIR DISTANCE

from

ROAD DISTANCE.

Never display straight-line distance as driving distance.

Use Google Maps / Directions API for:

* Road distance
* Estimated travel time
* Route
* Navigation

User location should be requested using browser/device geolocation.

Handle:

* Permission denied
* Location unavailable
* Loading
* Incorrect/stale location
* Location timeout

Provide a fallback location selection mechanism.

---

# 19. PROFILE

Profile should contain:

* Profile information
* Phone number
* Email
* Payment methods
* Saved locations
* Booking history
* Refer & Earn
* Notifications
* Help & Support
* Terms & Privacy
* Settings
* Logout

---

# 20. USER APP NAVIGATION

Use a simple bottom navigation.

Recommended:

HOME
EXPLORE
BOOKINGS
CHARGING
PROFILE

Do not add unnecessary navigation items.

---

# 21. VENDOR EXPERIENCE

The current priority is User App, but create an architectural plan for Vendor.

Vendor dashboard should eventually contain:

Dashboard
Vehicles
Bookings
Calendar
Customers
Revenue
Reviews
Profile
Support

Vendor vehicle management:

* Add vehicle
* Edit vehicle
* Delete/deactivate
* Upload images
* Brand
* Model
* Vehicle type
* Battery
* Range
* Charging
* Pricing
* Deposit
* Location
* Availability
* Documents
* Approval status

Vendor booking management:

* Pending
* Confirmed
* Active
* Completed
* Cancelled

Revenue:

* Daily
* Weekly
* Monthly
* Vehicle performance
* Payouts

---

# 22. ADMIN EXPERIENCE

Admin panel should eventually contain:

Dashboard
Users
Vendors
Vehicles
Bookings
Charging Stations
Payments
Reviews
Reports
Settings

Admin capabilities:

* User management
* Vendor management
* Vendor KYC
* Vendor approval
* Vehicle approval
* Vehicle moderation
* Booking management
* Refund management
* Charging station management
* Reviews moderation
* Revenue analytics
* Platform analytics

---

# 23. FRONTEND FOLDER ARCHITECTURE

Create a modular architecture.

Recommended:

src/

assets/
components/
pages/
layouts/
routes/
context/
hooks/
services/
utils/
constants/
data/
config/

Within components use domain-based organization:

components/
common/
layout/
vehicle/
booking/
charging/
payment/
profile/

Pages should be feature/domain based.

Do not create one giant components folder.

Do not create one giant App.jsx.

---

# 24. COMPONENT DESIGN RULE

Every component must have a single responsibility.

Bad:

VehicleDetails.jsx
containing:

* API calls
* booking calculations
* gallery
* reviews
* payment
* navigation
* 500 lines of JSX

Good:

VehicleDetails
├── VehicleGallery
├── VehicleInfo
├── VehicleSpecs
├── VehicleFeatures
├── VehicleLocation
├── VehiclePricing
└── BookingCTA

Extract components when it improves readability.

Do NOT split tiny components unnecessarily.

---

# 25. CODE SIZE RULE

Keep code maintainable.

Preferred approximate limits:

Component:
50–200 lines

Page:
100–300 lines

Service:
30–100 lines

Hook:
20–100 lines

Utility:
10–80 lines

If a file approaches 400–500 lines, review whether it should be split.

Do not create artificial files merely to satisfy line limits.

---

# 26. UI/UX DIRECTION

The UI must look like a REAL production product.

Not:

* AI-generated dashboard
* childish app
* excessive gradients
* neon cyberpunk
* glassmorphism everywhere
* excessive animations
* random colors
* inconsistent typography
* oversized cards
* unnecessary illustrations

Use the attached EVORA reference UI as inspiration for the overall product direction.

The final design should be more polished and professional than the reference.

---

# 27. COLOR SYSTEM

Use a LIGHT premium theme.

Recommended direction:

Primary:
Deep Emerald / EV Green

Secondary:
Muted Green

Background:
Warm Off-White / Very Light Gray

Surface:
White

Text:
Dark Charcoal

Secondary Text:
Neutral Gray

Borders:
Soft Neutral Gray

Success:
Green

Warning:
Amber

Error:
Soft Red

Do not use bright neon green.

Do not use too many accent colors.

The primary green should mainly be used for:

* Primary CTA
* Active navigation
* Selected states
* Important status
* Map markers
* Key highlights

Create centralized design tokens so the color theme can be changed globally.

---

# 28. TYPOGRAPHY

Use ONE primary font family throughout the entire application.

Recommended:

Inter

Alternative only if necessary:

Manrope

Do NOT mix multiple unrelated fonts.

Typography hierarchy must remain consistent:

H1
H2
H3
Body
Caption
Label

Avoid random font sizes.

Avoid excessive bold text.

The UI should feel professional, clean and mature.

---

# 29. SPACING SYSTEM

Create a consistent spacing system.

Use predictable spacing values.

Do not randomly use:

17px here
23px there
31px somewhere else

Maintain consistent:

* Page padding
* Card padding
* Section spacing
* Input spacing
* Button height
* Border radius

---

# 30. RESPONSIVE DESIGN

The User App is primarily mobile-first.

It must work correctly on:

* Small mobile
* Standard mobile
* Large mobile
* Tablet
* Desktop web if required

Do not simply shrink the mobile UI for desktop.

Adapt layouts intelligently.

---

# 31. UI STATES

Every important feature must account for:

Loading
Success
Error
Empty
Disabled
Offline/unavailable
Permission denied

Examples:

Vehicle loading:
Skeleton

No vehicles:
Empty state

Location permission denied:
Location fallback

Charging station unavailable:
Clear unavailable state

Payment failed:
Retry flow

Booking successful:
Success state

---

# 32. ACCESSIBILITY

Use:

* Semantic HTML
* Proper labels
* Keyboard navigation where applicable
* Accessible buttons
* Good contrast
* Focus states
* Proper form validation
* Meaningful error messages

Do not rely only on color to communicate status.

---

# 33. PERFORMANCE

Plan for:

* Lazy-loaded routes
* Lazy-loaded images
* Optimized images
* Reusable components
* Avoid unnecessary re-renders
* Debounced search
* Pagination/infinite scroll where appropriate
* API caching where useful
* Minimal dependencies

Do not add libraries without a reason.

---

# 34. SECURITY

Frontend must never contain:

* JWT secrets
* Razorpay secret key
* Google private server credentials
* Database credentials

Only public client-side keys/configuration should be exposed.

Sensitive operations must happen on backend.

---

# 35. API SERVICE ARCHITECTURE

Do not make Axios requests directly inside every component.

Create:

api.js

Then domain services:

authService.js
vehicleService.js
bookingService.js
paymentService.js
chargingService.js
userService.js

Example architecture:

Component
→ Hook
→ Service
→ API Client
→ Backend

Keep API URLs centralized.

Use environment variables.

---

# 36. STATE MANAGEMENT

Do not put everything into global state.

Use local state for:

* Modal
* Input
* Tabs
* Temporary UI state

Use Context/Zustand for:

* Authentication
* User session
* Booking flow
* Location where necessary

Avoid creating global state for every component.

Explain in the plan why each state belongs where it does.

---

# 37. DATA ARCHITECTURE

Create mock data initially.

Mock data should resemble real backend responses.

Do NOT hard-code vehicle data directly into JSX.

Example:

data/
vehicles.js
chargingStations.js

Later these can be replaced by API services without redesigning components.

---

# 38. ERROR HANDLING

Create a consistent error-handling approach.

Handle:

* API failure
* Network failure
* Unauthorized
* Session expired
* Validation error
* Payment error
* Location error
* Maps error

Create reusable error UI where appropriate.

---

# 39. ROUTING

Create a dedicated route architecture.

Example conceptual routes:

/
/login
/otp
/home
/vehicles
/vehicles/:id
/booking
/booking/payment
/booking/success
/bookings
/bookings/:id
/rental/active
/charging
/charging/:id
/navigation
/profile

Protected routes should require authentication.

---

# 40. ENVIRONMENT CONFIGURATION

Plan:

.env

Example conceptual variables:

VITE_API_URL
VITE_GOOGLE_MAPS_KEY

Never expose server secrets.

Create separate configuration strategy for:

development
production

---

# 41. DEVELOPMENT STRATEGY

Do NOT build everything at once.

Follow:

PHASE 1
Project setup

PHASE 2
Design system

PHASE 3
Routing + layouts

PHASE 4
Authentication UI

PHASE 5
Home

PHASE 6
Vehicle discovery

PHASE 7
Vehicle details

PHASE 8
Booking

PHASE 9
Payment

PHASE 10
Bookings

PHASE 11
Active rental

PHASE 12
Charging stations

PHASE 13
Navigation

PHASE 14
Profile

PHASE 15
API integration

PHASE 16
Error/loading/empty states

PHASE 17
Responsive optimization

PHASE 18
Performance and final polish

---

# 42. IMPORTANT DEVELOPMENT RULE

Do not start coding immediately.

FIRST produce a complete technical plan.

The plan must include:

1. Product overview
2. Feature list
3. User flows
4. Screen list
5. Navigation structure
6. Component hierarchy
7. Folder structure
8. State management strategy
9. API service architecture
10. Domain model architecture
11. Database model recommendations
12. Authentication architecture
13. Booking architecture
14. Payment architecture
15. Location architecture
16. Charging station architecture
17. Google Maps integration strategy
18. Error handling strategy
19. Loading/skeleton strategy
20. Responsive strategy
21. Accessibility strategy
22. Performance strategy
23. Security strategy
24. Environment variables
25. Development phases
26. Testing strategy
27. Deployment strategy
28. Future scalability considerations

For every major architectural decision, explain:

* WHY we need it
* WHERE it belongs
* HOW it should communicate with other modules
* Whether it is required now or later

---

# 43. TESTING PLAN

Include:

* Component testing
* Form validation testing
* Authentication testing
* Booking calculation testing
* Payment flow testing
* Location permission testing
* Charging station testing
* Responsive testing
* Error state testing

Focus especially on booking and pricing correctness.

---

# 44. FINAL EXPECTATION

The final application should feel like a serious professional EV mobility startup.

Design characteristics:

* Premium
* Clean
* Minimal
* Mature
* Consistent
* Fast
* Easy to understand
* Mobile-first
* Production-ready
* Scalable

It should NOT look like a generic AI-generated application.

Do not randomly introduce new colors, fonts, card styles or design patterns.

Use one consistent visual language throughout the entire application.

Use the attached EVORA reference UI as visual inspiration, but improve its hierarchy, spacing, typography and information architecture where necessary.

---

# YOUR FIRST TASK

Do NOT write application code yet.

Create the complete **EVORA Technical + UI/UX Implementation Blueprint** first.

At the end, provide:

A. Recommended final folder structure

B. Complete screen inventory

C. Component inventory

D. Context/hooks inventory

E. Service/API inventory

F. Recommended database models

G. User/Vendor/Admin role architecture

H. Complete user journey

I. Booking state architecture

J. Charging station architecture

K. Color and typography design system

L. Development phase checklist

M. Dependencies/package list with the reason for each dependency

N. Potential technical risks and how to avoid them

O. Exact recommended implementation order

Only after this blueprint is reviewed and approved should implementation begin.
