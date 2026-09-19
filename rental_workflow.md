# EV Rental End-to-End Workflow

This document outlines the correct, logical flow for an EV rental booking, handover, and drop-off process.

## 1. Booking & Document Approval (`CONFIRMED` state)
* **Action:** User books the EV, uploads KYC documents (Aadhar, License), and completes payment. 
* **System:** Booking status becomes `RESERVED` (or `PENDING_VERIFICATION`).
* **Admin:** Receives a real-time popup alert. Admin reviews the documents and clicks **"Approve"**.
* **Result:** Booking status updates to `CONFIRMED`. 
* **Important:** ⏳ **The Trip Timer DOES NOT START here.**
* **User UI:** The user sees a success screen with a **"Navigate to Pickup Hub"** button so they can travel to the physical location.

## 2. User Reaches Hub & Admin Verifies (The Handover)
* **Action:** The user physically arrives at the Hub and shows their Booking ID to the Admin.
* **Admin UI:** The Admin opens the "Upcoming Pickups" tab (`/admin/bookings?ops=pickups`), locates the booking, and clicks a new **"Confirm Pickup & Start Trip"** (Handover) button.

## 3. Trip Starts & Timer Begins (`ACTIVE` state)
* **System:** Upon Admin's handover confirmation, the booking status changes to `ACTIVE`.
* **Important:** ⏱️ **The Live Timer starts STRICTLY from this exact moment.**
* **User UI:** The user's app transitions to the Active Ride screen (`/user/rental/active`), and the timer begins ticking on their device.

## 4. Active Ride & Drop Navigation
* **User UI:** On the Active Ride screen, the user now sees a **"Navigate to Drop Location"** button instead of the pickup navigation. This guides them to return the vehicle to the correct hub when they are done.

---

## ❓ Open Question: "Admin Snapshot Feature"
The requirement states: *"admin ko har time ka ek snap short show hona chiye"*

Need clarification on which of the following is required before implementation:
* **Option A (Photo Evidence):** When the Admin hands over the vehicle (Starts Trip) or when the user drops it off, the Admin must capture and upload a **Live Photo (Snapshot)** of the EV/User as proof.
* **Option B (Timeline/History):** The Admin panel should display a timestamped **Timeline Snapshot** for each booking (e.g., `Created: 10:00 AM` -> `Approved: 10:15 AM` -> `Picked Up/Started: 10:45 AM`).

