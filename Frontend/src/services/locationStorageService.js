const STORAGE_KEY_LOCATION = "vegah_user_current_location";
const STORAGE_KEY_ADDRESSES = "vegah_user_saved_addresses";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

export const locationStorageService = {
  // 1. Get current active location from localStorage
  getCurrentLocation() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LOCATION);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error("Failed to read location from localStorage:", err);
      return null;
    }
  },

  // 2. Save active location to localStorage & Firebase stub
  saveCurrentLocation(locationObj) {
    try {
      localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(locationObj));
      this.syncLocationToFirebase(locationObj);
    } catch (err) {
      console.error("Failed to save location to localStorage:", err);
    }
  },

  // 3. Get saved addresses list
  getSavedAddresses() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ADDRESSES);
      if (data) return JSON.parse(data);
      
      // Default initial mock saved addresses (like in Image 2)
      const defaultAddresses = [
        {
          id: "addr-home-1",
          type: "Home",
          phone: "9755633147",
          primaryAddress: "Pawar Villa, N-430, Singapore Green View",
          secondaryAddress: "Risi Nagar, Talawali Chanda",
          city: "Indore",
          state: "Madhya Pradesh",
          pincode: "452007",
          formattedAddress: "Pawar Villa, N-430, Singapore Green View, Risi Nagar, Talawali Chanda, Indore, Madhya Pradesh - 452007",
          latitude: 22.7196,
          longitude: 75.8577,
        }
      ];
      localStorage.setItem(STORAGE_KEY_ADDRESSES, JSON.stringify(defaultAddresses));
      return defaultAddresses;
    } catch (err) {
      console.error("Failed to read saved addresses:", err);
      return [];
    }
  },

  // 4. Save entire addresses list
  saveSavedAddresses(addressesList) {
    try {
      localStorage.setItem(STORAGE_KEY_ADDRESSES, JSON.stringify(addressesList));
      this.syncSavedAddressesToFirebase(addressesList);
    } catch (err) {
      console.error("Failed to save addresses list:", err);
    }
  },

  // 5. Reverse Geocode Lat/Lng using Google Maps Geocoding API
  async reverseGeocode(lat, lng) {
    if (!GOOGLE_MAPS_KEY) {
      return {
        title: "Indore Central",
        subtitle: "Madhya Pradesh, India",
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452001",
        formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}, Indore, MP`,
        latitude: lat,
        longitude: lng,
      };
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        const addressComponents = firstResult.address_components || [];

        let street = "";
        let area = "";
        let city = "";
        let state = "";
        let pincode = "";

        addressComponents.forEach((comp) => {
          const types = comp.types || [];
          if (types.includes("route") || types.includes("premise") || types.includes("street_number")) {
            street += comp.long_name + " ";
          }
          if (types.includes("sublocality") || types.includes("neighborhood") || types.includes("locality")) {
            if (!area) area = comp.long_name;
            else if (!city) city = comp.long_name;
          }
          if (types.includes("administrative_area_level_2") && !city) {
            city = comp.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            state = comp.long_name;
          }
          if (types.includes("postal_code")) {
            pincode = comp.long_name;
          }
        });

        const title = area || street.trim() || city || "Selected Location";
        const subtitle = [city, state, "India"].filter(Boolean).join(", ");

        return {
          title,
          subtitle,
          primaryAddress: street.trim() || area || title,
          secondaryAddress: area,
          city: city || "Indore",
          state: state || "Madhya Pradesh",
          pincode: pincode || "452001",
          formattedAddress: firstResult.formatted_address,
          latitude: lat,
          longitude: lng,
        };
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }

    // Fallback if Geocoding API fails or key quota limited
    return {
      title: "Indore",
      subtitle: "Madhya Pradesh, India",
      city: "Indore",
      state: "Madhya Pradesh",
      pincode: "452001",
      formattedAddress: "Indore, Madhya Pradesh, India",
      latitude: lat,
      longitude: lng,
    };
  },

  // 6. Firebase Realtime Database Sync Stub (Ready for Firebase Integration)
  syncLocationToFirebase(locationObj) {
    // When Firebase Realtime DB is initialized:
    // import { getDatabase, ref, set } from "firebase/database";
    // const db = getDatabase();
    // set(ref(db, `users/${userId}/currentLocation`), locationObj);
    if (window.__VEGAH_FIREBASE_DB__) {
      try {
        window.__VEGAH_FIREBASE_DB__.ref("currentLocation").set(locationObj);
      } catch (e) {
        // silent
      }
    }
  },

  syncSavedAddressesToFirebase(addressesList) {
    if (window.__VEGAH_FIREBASE_DB__) {
      try {
        window.__VEGAH_FIREBASE_DB__.ref("savedAddresses").set(addressesList);
      } catch (e) {
        // silent
      }
    }
  }
};
