import { createContext, useMemo, useState } from "react";

const fallbackLocation = {
  label: "Koramangala, Bengaluru",
  latitude: 12.9352,
  longitude: 77.6245,
};

export const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(fallbackLocation);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({
          label: "Current location",
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setStatus("success");
        setError("");
      },
      () => {
        setError("Location permission denied. Using your saved city.");
        setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const value = useMemo(
    () => ({
      location,
      status,
      error,
      requestLocation,
      setLocation,
    }),
    [error, location, status]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
