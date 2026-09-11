import { createContext, useEffect, useMemo, useState } from "react";
import { locationStorageService } from "../services/locationStorageService";

const defaultFallbackLocation = {
  title: "Gokul road",
  subtitle: "Madhya Pradesh, India",
  primaryAddress: "Gokul Road",
  secondaryAddress: "Madhya Pradesh",
  city: "Indore",
  state: "Madhya Pradesh",
  pincode: "452001",
  formattedAddress: "Gokul road, Madhya Pradesh, India",
  latitude: 22.7196,
  longitude: 75.8577,
};

export const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [location, setLocationState] = useState(() => {
    return locationStorageService.getCurrentLocation() || defaultFallbackLocation;
  });

  const [savedAddresses, setSavedAddressesState] = useState(() => {
    return locationStorageService.getSavedAddresses();
  });

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  // Update & Persist active location
  const setLocation = (newLoc) => {
    const updated = { ...defaultFallbackLocation, ...newLoc };
    setLocationState(updated);
    locationStorageService.saveCurrentLocation(updated);
  };

  // Add a new saved address
  const addSavedAddress = (newAddr) => {
    const id = `addr-${Date.now()}`;
    const addressObj = { id, ...newAddr };
    const updatedList = [addressObj, ...savedAddresses];
    setSavedAddressesState(updatedList);
    locationStorageService.saveSavedAddresses(updatedList);
    setLocation(addressObj);
  };

  // Delete a saved address
  const deleteSavedAddress = (id) => {
    const updatedList = savedAddresses.filter((a) => a.id !== id);
    setSavedAddressesState(updatedList);
    locationStorageService.saveSavedAddresses(updatedList);
  };

  // Request current GPS location and reverse geocode via Google Maps API
  const requestCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const geoLoc = await locationStorageService.reverseGeocode(
            coords.latitude,
            coords.longitude
          );
          setLocation(geoLoc);
          setStatus("success");
        } catch (err) {
          console.error("Geocoding failed:", err);
          setLocation({
            ...defaultFallbackLocation,
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
          setStatus("success");
        }
      },
      (geoError) => {
        console.warn("Geolocation permission error:", geoError);
        setError("Location permission denied. Using selected location.");
        setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Auto-detect GPS on first launch if no cached location in localStorage
  useEffect(() => {
    const cached = locationStorageService.getCurrentLocation();
    if (!cached) {
      requestCurrentLocation();
    }
  }, []);

  const value = useMemo(
    () => ({
      location,
      savedAddresses,
      status,
      error,
      requestCurrentLocation,
      setLocation,
      addSavedAddress,
      deleteSavedAddress,
    }),
    [location, savedAddresses, status, error]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
