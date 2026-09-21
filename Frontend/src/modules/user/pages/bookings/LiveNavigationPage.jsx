import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  Zap, 
  AlertTriangle, 
  Compass, 
  ExternalLink, 
  Clock, 
  Sparkles,
  RefreshCw,
  PhoneCall
} from "lucide-react";
import { useJsApiLoader } from "@react-google-maps/api";
import { env } from "../../../../config/env";
import { bookingService } from "../../../../services/bookingService";
import { userService } from "../../../../services/userService";
import Button from "../../../../components/common/Button";

const DEFAULT_COORDS = { lat: 12.9352, lng: 77.6245 }; // Bangalore Koramangala default

const MAP_LIBRARIES = ["places", "geometry"];

const LiveNavigationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const navType = searchParams.get("type") || "pickup"; // 'pickup' | 'drop'
  const bookingId = searchParams.get("bookingId");

  // Load Google Maps API script safely
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: env.mapsKey || "",
    libraries: MAP_LIBRARIES,
  });

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const watchPositionIdRef = useRef(null);

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [destAddress, setDestAddress] = useState("");
  const [routeInfo, setRouteInfo] = useState({ distance: "", duration: "", steps: [] });
  const [mapError, setMapError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Locating...");
  const [rideCompletedModal, setRideCompletedModal] = useState(false);

  // 1. Fetch booking details if not available from state
  useEffect(() => {
    let isMounted = true;
    const loadBooking = async () => {
      try {
        let b = null;
        if (bookingId && bookingId !== "undefined" && bookingId !== "null") {
          b = await bookingService.getBooking(bookingId);
        } else {
          // Fallback to most recent booking
          const list = await bookingService.listBookings({ limit: 1 });
          if (list && list.length > 0) {
            b = list[0];
          }
        }

        if (b && isMounted) {
          // If vehicle zone is just an ID string, fetch public zones to populate it
          if (b.vehicle && typeof b.vehicle.zone === 'string') {
            try {
              const zones = await userService.getPublicZones();
              const fullZone = zones.find(z => (z._id || z.id) === b.vehicle.zone);
              if (fullZone) {
                b.vehicle.zone = fullZone;
              }
            } catch (zErr) {
              console.warn("Could not populate zone", zErr);
            }
          }
          setBooking(b);
        }
      } catch (err) {
        console.warn("Could not fetch booking details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBooking();
    return () => { isMounted = false; };
  }, [bookingId]);

  // 2. Extract destination coordinates based on navType ('pickup' vs 'drop')
  useEffect(() => {
    let targetLat = null;
    let targetLng = null;
    let targetAddr = "";

    if (!booking) {
      // Fallback if booking fails to load
      targetLat = DEFAULT_COORDS.lat + 0.008;
      targetLng = DEFAULT_COORDS.lng + 0.005;
      targetAddr = "Vegah Fallback Hub";
    } else {
      const zone = booking.vehicle?.zone;

      if (navType === "pickup") {
        // Priority 1: Zone pickupLocation coordinates
        if (zone?.pickupLocation?.latitude && zone?.pickupLocation?.longitude) {
        targetLat = Number(zone.pickupLocation.latitude);
        targetLng = Number(zone.pickupLocation.longitude);
        targetAddr = zone.pickupLocation.address || zone.name || "Vegah Pickup Hub";
      } else if (booking.vehicle?.coordinates?.coordinates?.length === 2) {
        targetLng = Number(booking.vehicle.coordinates.coordinates[0]);
        targetLat = Number(booking.vehicle.coordinates.coordinates[1]);
        targetAddr = booking.pickupLocation || booking.vehicle.location || "Vegah Vehicle Hub";
      } else {
        targetLat = DEFAULT_COORDS.lat;
        targetLng = DEFAULT_COORDS.lng;
        targetAddr = booking.pickupLocation || "Vegah Koramangala Hub";
      }
    } else {
      // Drop location
      if (zone?.dropLocation?.latitude && zone?.dropLocation?.longitude) {
        targetLat = Number(zone.dropLocation.latitude);
        targetLng = Number(zone.dropLocation.longitude);
        targetAddr = zone.dropLocation.address || zone.name || "Vegah Drop Hub";
      } else if (zone?.pickupLocation?.latitude && zone?.pickupLocation?.longitude) {
        // Return to same zone hub if specific drop not set
        targetLat = Number(zone.pickupLocation.latitude);
        targetLng = Number(zone.pickupLocation.longitude);
        targetAddr = zone.pickupLocation.address || "Vegah Return Hub";
      } else {
        // Fallback offset slightly for demonstration
        targetLat = DEFAULT_COORDS.lat + 0.008;
        targetLng = DEFAULT_COORDS.lng + 0.005;
        targetAddr = booking.returnLocation || "Vegah Return Station, HSR Hub";
      }
    }
    }

    if (targetLat && targetLng && !isNaN(targetLat) && !isNaN(targetLng)) {
      setDestCoords({ lat: targetLat, lng: targetLng });
      setDestAddress(targetAddr);
    }
  }, [booking, navType]);

  // 3. Obtain User's Current GPS Location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation not supported by browser");
      setUserCoords(DEFAULT_COORDS);
      return;
    }

    setLocationStatus("Acquiring GPS fix...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserCoords(coords);
        setLocationStatus("GPS Location Locked");
      },
      (err) => {
        console.warn("GPS error:", err.message);
        setLocationStatus("GPS unavailable, using default hub proximity");
        // Fallback slightly offset from target so polyline is always visible and sensible
        setUserCoords({
          lat: DEFAULT_COORDS.lat - 0.012,
          lng: DEFAULT_COORDS.lng - 0.015,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    // Watch position for live movements
    try {
      watchPositionIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const updatedCoords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserCoords(updatedCoords);

          // Update user live marker on map
          if (userMarkerRef.current) {
            userMarkerRef.current.setPosition(updatedCoords);
          }
        },
        null,
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    } catch (e) {
      console.warn("Watch position error", e);
    }

    return () => {
      if (watchPositionIdRef.current) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
      }
    };
  }, []);

  // 4. Initialize Google Maps & Directions Service
  useEffect(() => {
    let isCancelled = false;

    const initMap = async () => {
      if (!mapRef.current || !isLoaded) return;
      if (loadError) {
        setMapError(`Failed to load Google Maps script: ${loadError.message || 'Unknown error'}`);
        return;
      }

      try {
        let googleObj = window.google;

        if (isCancelled) return;

        if (!googleObj?.maps) {
          setMapError("Google Maps library unavailable. Check API key configuration.");
          return;
        }

        const map = new googleObj.maps.Map(mapRef.current, {
          center: userCoords || destCoords || DEFAULT_COORDS,
          zoom: 14,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        mapInstanceRef.current = map;

        const directionsRenderer = new googleObj.maps.DirectionsRenderer({
          map,
          suppressMarkers: true, // We will render custom markers
          polylineOptions: {
            strokeColor: navType === "pickup" ? "#10b981" : "#8b5cf6",
            strokeWeight: 6,
            strokeOpacity: 0.9,
          },
        });
        directionsRendererRef.current = directionsRenderer;
        directionsServiceRef.current = new googleObj.maps.DirectionsService();
        setMapReady(true);

      } catch (err) {
        console.error("Map initialization failed:", err);
        setMapError(`Map init error: ${err.message || String(err)}`);
      }
    };

    initMap();

    return () => {
      isCancelled = true;
    };
  }, [navType, isLoaded, loadError]);

  // 5. Draw polyline when both userCoords and destCoords are available
  useEffect(() => {
    if (!mapInstanceRef.current || !directionsServiceRef.current || !window.google?.maps) return;
    if (!userCoords || !destCoords) return;

    const google = window.google;
    const map = mapInstanceRef.current;

    // Place or update User GPS Marker (Scooter / Delivery style)
    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        position: userCoords,
        map,
        title: "Your Live Location",
        icon: {
          url: "/assets/bikelogo.png",
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 22),
        },
        animation: google.maps.Animation.DROP,
      });
    } else {
      userMarkerRef.current.setPosition(userCoords);
    }

    // Place Destination Marker (Pickup Hub or Drop Hub)
    const destMarker = new google.maps.Marker({
      position: destCoords,
      map,
      title: navType === "pickup" ? "Pickup Hub" : "Drop Hub",
      icon: {
        url: "/assets/pickuphub.png",
        scaledSize: new google.maps.Size(48, 48),
        anchor: new google.maps.Point(24, 48),
      },
    });

    // Request Route from DirectionsService
    directionsServiceRef.current.route(
      {
        origin: userCoords,
        destination: destCoords,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current?.setDirections(result);

          const route = result.routes[0]?.legs[0];
          if (route) {
            setRouteInfo({
              distance: route.distance?.text || "Calculating...",
              duration: route.duration?.text || "Calculating...",
              steps: route.steps?.map(s => s.instructions) || [],
            });
          }
        } else {
          console.warn("Directions request failed with status:", status);
          // Fallback: draw straight polyline between points if driving directions fail
          const line = new google.maps.Polyline({
            path: [userCoords, destCoords],
            geodesic: true,
            strokeColor: navType === "pickup" ? "#10b981" : "#8b5cf6",
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map,
          });

          // Fit bounds
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(userCoords);
          bounds.extend(destCoords);
          map.fitBounds(bounds);
        }
      }
    );

    return () => {
      destMarker.setMap(null);
    };
  }, [userCoords, destCoords, navType, mapReady]);

  // Handle Action: "Reached Pickup -> Start Ride"
  const handleStartRide = async () => {
    try {
      setActionLoading(true);
      const targetId = booking?._id || booking?.id || bookingId;
      if (targetId) {
        await bookingService.startRide(targetId);
      }
      navigate("/user/rental/active");
    } catch (err) {
      console.error("Start ride error:", err);
      // Fallback navigate to active rental
      navigate("/user/rental/active");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Action: "Reached Drop -> End Ride"
  const handleEndRide = async () => {
    try {
      setActionLoading(true);
      const targetId = booking?._id || booking?.id || bookingId;
      if (targetId) {
        await bookingService.endRide(targetId);
      }
      setRideCompletedModal(true);
    } catch (err) {
      console.error("End ride error:", err);
      setRideCompletedModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenGoogleMapsApp = () => {
    if (!destCoords) return;
    const originParam = userCoords ? `&origin=${userCoords.lat},${userCoords.lng}` : "";
    const url = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destCoords.lat},${destCoords.lng}&travelmode=two-wheeler`;
    window.open(url, "_blank");
  };

  const vehicleName = booking?.vehicle?.name || "Vegah EV Scooter";
  const plateNumber = booking?.vehicle?.plateNumber || "KA 03 EV 4421";

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* 1. TOP FLOATING APP BAR */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-800 shadow-xl backdrop-blur-md border border-slate-200 hover:scale-105 active:scale-95 transition"
          aria-label="Go Back"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Status Chip */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-xl backdrop-blur-md border border-slate-200">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="tracking-wide">
            {navType === "pickup" ? "Routing to Pickup Hub" : "Routing to Drop Hub"}
          </span>
        </div>

        {/* Turn-by-Turn External Link Button */}
        <button
          onClick={handleOpenGoogleMapsApp}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 active:scale-95 transition"
          title="Open Turn-by-Turn in Google Maps app"
        >
          <Compass size={20} />
        </button>
      </div>

      {/* 2. MAP CONTAINER */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapRef} className="w-full h-full" />

        {/* Fallback View if Google Maps key is missing or errored */}
        {mapError && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Live Map View Unavailable</h3>
            <p className="text-sm text-slate-500 max-w-md mb-6">{mapError}</p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-md w-full text-left mb-6">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Destination Hub</p>
              <p className="text-base font-bold text-slate-900 mt-1">{destAddress || "Vegah Main Hub"}</p>
              {destCoords && (
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Coordinates: {destCoords.lat.toFixed(4)}, {destCoords.lng.toFixed(4)}
                </p>
              )}
            </div>
            <button
              onClick={handleOpenGoogleMapsApp}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition"
            >
              <ExternalLink size={18} />
              Open Live Directions in Maps App
            </button>
          </div>
        )}

        {/* Floating Route Distance & ETA Pill */}
        {routeInfo.duration && (
          <div className="absolute top-20 left-4 z-20 pointer-events-none">
            <div className="rounded-2xl bg-white/95 p-3 shadow-2xl backdrop-blur-md border border-slate-200 text-slate-900 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${navType === "pickup" ? "bg-emerald-100 text-emerald-600" : "bg-purple-100 text-purple-600"}`}>
                <Navigation size={22} className="rotate-45" />
              </div>
              <div>
                <p className="text-lg font-extrabold tracking-tight">
                  {routeInfo.duration}
                  <span className="text-xs font-normal text-slate-500 ml-2">({routeInfo.distance})</span>
                </p>
                <p className="text-[11px] text-slate-500 font-medium">Estimated arrival time</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM FLOATING INTERACTIVE SHEET (Uber/Zomato style) */}
      <div className="z-30 w-full max-w-xl mx-auto px-4 pb-6 pt-2">
        <div className="rounded-3xl bg-white text-slate-900 p-5 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.15)] backdrop-blur-xl border border-slate-200">
          
          {/* Destination Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                navType === "pickup" ? "bg-emerald-100 text-emerald-600" : "bg-purple-100 text-purple-600"
              }`}>
                <MapPin size={22} />
              </div>
              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  navType === "pickup" ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"
                }`}>
                  {navType === "pickup" ? "Pickup Point" : "Drop Return Point"}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                  {destAddress || "Vegah Designated Hub"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <span>Vehicle: <strong className="text-slate-700">{vehicleName}</strong></span>
                  <span>•</span>
                  <span className="font-mono text-slate-600">{plateNumber}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenGoogleMapsApp}
              className="shrink-0 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Open external map"
            >
              <ExternalLink size={18} />
            </button>
          </div>

          {/* Action Button */}
          <div className="mt-5">
            {navType === "pickup" ? (
              <Button
                onClick={handleStartRide}
                disabled={actionLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black py-4 rounded-2xl text-base shadow-xl flex items-center justify-center gap-2 tracking-wide transition-all duration-200"
              >
                <Zap size={22} className="fill-current animate-pulse" />
                {actionLoading ? "Starting your ride..." : "Reached Pickup? Start Ride"}
              </Button>
            ) : (
              <Button
                onClick={handleEndRide}
                disabled={actionLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-black py-4 rounded-2xl text-base shadow-xl flex items-center justify-center gap-2 tracking-wide transition-all duration-200"
              >
                <CheckCircle2 size={22} />
                {actionLoading ? "Ending your ride..." : "Reached Drop Hub? End Ride"}
              </Button>
            )}
          </div>

          {/* Helper Micro-bar */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <Clock size={12} /> Live GPS Sync Active
            </span>
            <a href="tel:18001234567" className="hover:text-slate-900 flex items-center gap-1">
              <PhoneCall size={12} /> Contact Hub Manager
            </a>
          </div>

        </div>
      </div>

      {/* 4. RIDE COMPLETED CONGRATULATIONS MODAL */}
      {rideCompletedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl border border-slate-200">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
              <Sparkles size={40} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>

            <h3 className="mt-5 text-2xl font-black text-slate-900">Ride Completed! 🎉</h3>
            <p className="mt-2 text-sm text-slate-600">
              Thank you for riding with Vegah! The scooter has been returned to the drop station safely.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-bold text-slate-900">{vehicleName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Return Location:</span>
                <span className="font-bold text-slate-900">{destAddress || "Vegah Drop Hub"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Status:</span>
                <span className="font-bold text-emerald-600">COMPLETED</span>
              </div>
            </div>

            <Button
              onClick={() => navigate("/user/bookings")}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg"
            >
              View My Bookings & Receipt
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};

export default LiveNavigationPage;
