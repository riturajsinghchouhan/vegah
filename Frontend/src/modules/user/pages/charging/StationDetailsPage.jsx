import { Clock3, Navigation, Star, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../../components/common/Button";
import PageHeader from "../../../../components/layout/PageHeader";
import { chargingService } from "../../../../services/chargingService";
import { bookingService } from "../../../../services/bookingService";
import { distanceInMeters, formatDistance } from "../../../../utils/geo";

// An expired rental cannot swap, so OVERDUE is deliberately not in this list.
const IN_TRIP_STATUSES = "ACTIVE,PENDING_RETURN";

// A rider has to physically be at the station to swap a battery. The backend
// enforces this too; the gate here just stops a pointless round trip.
const SWAP_RADIUS_METERS = 100;

const StationDetailsPage = () => {
  const { stationId } = useParams();
  const [station, setStation] = useState(null);
  const [pods, setPods] = useState(null);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [rentalDeadline, setRentalDeadline] = useState(null);

  const [swapState, setSwapState] = useState(null); // null, 'starting', 'polling', 'completed', 'failed'
  const [swapData, setSwapData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [imgError, setImgError] = useState(false);
  const [position, setPosition] = useState(null);
  const [positionError, setPositionError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  // Keeps the rental-expiry gate honest while the rider sits on this screen.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    chargingService.getStationById(stationId).then(setStation);
    chargingService.getPods(stationId).then(setPods);
  }, [stationId]);

  // A battery swap only makes sense tied to the rider's own running rental -
  // this is what lets the admin panel count real per-user swap history.
  useEffect(() => {
    bookingService.listBookings({ status: IN_TRIP_STATUSES, limit: 1 })
      .then((bookings) => {
        const current = Array.isArray(bookings) && bookings.length ? bookings[0] : null;
        setActiveBookingId(current?._id || current?.id || null);
        setRentalDeadline(current?.tripEndsAt || current?.endDate || null);
      })
      .catch((err) => console.error("Failed to load active booking:", err));
  }, []);

  // Live GPS so the button unlocks on its own as the rider walks up to the station.
  useEffect(() => {
    if (!station?.isElectica) return undefined;
    if (!navigator.geolocation) {
      setPositionError("This device cannot share its location.");
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setPositionError(null);
        setPosition({
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
        });
      },
      (err) => {
        setPositionError(
          err.code === err.PERMISSION_DENIED
            ? "Turn on location access to start a battery swap."
            : "Could not read your location. Move to an open area and try again."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [station?.isElectica]);

  useEffect(() => {
    let interval;
    const swapId = swapData?.id || swapData?.swapId || swapData?.swap_id;
    if (swapState === 'polling' && swapId) {
      interval = setInterval(async () => {
        try {
          const res = await chargingService.getSwapStatus(swapId);
          const data = res.data || res;
          setSwapData(data);
          // A swap the rider never completes expires at the station (about ten
          // minutes), so expiry and cancellation have to end the poll too -
          // otherwise the modal spins on a swap that is already closed.
          if (data.status === 'completed') {
            setSwapState('completed');
          } else if (['failed', 'expired', 'cancelled', 'canceled'].includes(data.status)) {
            setSwapState('failed');
            setErrorMessage(
              data.failReason
                || data.failure_reason
                || (data.status === 'expired'
                  ? "The station closed this swap because the pod door was not used in time. Please start again."
                  : "Swap failed")
            );
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [swapState, swapData]);

  const handleStartSwap = async () => {
    if (!activeBookingId) {
      setSwapState('failed');
      setErrorMessage("Battery swap is only available while you have an active rental.");
      return;
    }
    if (rentalDeadline && new Date(rentalDeadline).getTime() <= Date.now()) {
      setSwapState('failed');
      setErrorMessage("Your rental time has run out. Extend your rental to swap a battery.");
      return;
    }
    try {
      setSwapState('starting');
      setErrorMessage("");
      const res = await chargingService.startSwap(station.id, activeBookingId, position);
      setSwapData(res.data || res);
      setSwapState('polling');
    } catch (err) {
      setSwapState('failed');
      setErrorMessage(err?.response?.data?.message || err.message || "Failed to start swap");
    }
  };

  const closeSwapModal = () => {
    setSwapState(null);
    setSwapData(null);
  };

  if (!station) {
    return null;
  }

  const stationHasCoords = Number.isFinite(station.lat) && Number.isFinite(station.lng);
  const distanceToStation =
    position && stationHasCoords
      ? distanceInMeters(position.lat, position.lng, station.lat, station.lng)
      : null;
  // GPS is noisy, so the reading's own accuracy counts in the rider's favour -
  // capped at the radius so a vague fix can't open the gate from anywhere.
  const isAtStation =
    distanceToStation !== null &&
    distanceToStation - Math.min(position.accuracy || 0, SWAP_RADIUS_METERS) <= SWAP_RADIUS_METERS;
  // Without station coordinates there is nothing to measure against, so the
  // gate stays open and the backend makes the final call.
  const rentalExpired = rentalDeadline ? new Date(rentalDeadline).getTime() <= now : false;
  const canSwap = (!stationHasCoords || isAtStation) && !rentalExpired;

  const proximityMessage = rentalExpired
    ? "Your rental time has run out. Extend your rental to swap a battery."
    : !stationHasCoords
    ? null
    : positionError
      ? positionError
      : !position
        ? "Finding your location..."
        : isAtStation
          ? null
          : `You are ${formatDistance(distanceToStation)} from the station. Come within ${SWAP_RADIUS_METERS} m to start a swap.`;

  // The station hardware numbers its pods from 1, and /electica/pods already
  // returns them sorted by that number - so the rider sees the same pod number
  // that is painted on the slot, never an array index.
  const podList = (Array.isArray(pods)
    ? pods.map((pod) => ({ ...pod, podNumber: Number(pod?.podNumber ?? pod?.pod) }))
    : Object.entries(pods ?? {}).map(([key, pod]) => ({
        ...pod,
        podNumber: Number(pod?.podNumber ?? pod?.pod ?? key),
      }))
  )
    .filter((pod) => Number.isFinite(pod.podNumber))
    .sort((a, b) => a.podNumber - b.podNumber);

  // Only name a pod number the station actually reported - a guessed "Pod 1"
  // sends the rider to the wrong slot.
  const swapPod = Number(swapData?.pod ?? swapData?.podNumber) || null;

  const connectorTypes = station.connectorTypes ?? (station.connector ? [station.connector] : []);
  const chargers = station.chargers ?? [];
  const supportedVehicles = station.supportedVehicles ?? [];
  const paymentMethods = station.paymentMethods ?? [];
  const amenities = station.amenities ?? [];

  // Only an admin-set location is ever shown, so a station without one has
  // nothing to navigate to.
  const hasLocation = Boolean(station.lat && station.lng) || (Boolean(station.address) && station.address !== 'Location not set');

  const handleNavigate = () => {
    if (station.lat && station.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`, '_blank');
    } else if (hasLocation) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(station.address)}`, '_blank');
    }
  };

  return (
    <main className="page-padding relative">
      <PageHeader showBack subtitle="Station details and battery availability" title={station.name} showBell={false} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="surface-card overflow-hidden p-4">
            <div className="rounded-[1.75rem] bg-[#0B1320] p-4 flex items-center justify-center min-h-[240px]">
              {station.image && !imgError ? (
                <img 
                  alt={station.name} 
                  className="h-64 w-full object-contain sm:h-80" 
                  src={station.image} 
                  onError={() => setImgError(true)} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-orange-500 py-10">
                  <Zap size={64} />
                  <span className="mt-3 text-xs font-semibold text-slate-400">Battery Swapping Station</span>
                </div>
              )}
            </div>
          </section>

          <section className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
                  {station.isElectica ? 'Battery Swapping Hub' : 'EV Charging Station'}
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-app-text">{station.name}</h2>
                <p className="mt-1 text-sm text-app-subtle">{station.address}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-orange-500/15 px-4 py-2.5">
                  <p className="text-xs text-orange-400 font-medium">Pricing</p>
                  <p className="mt-0.5 text-lg font-bold text-[#D1FF42]">
                    ₹{(Number(station.pricePerKwh || station.price) || 18.0).toFixed(2)}
                    <span className="text-xs font-normal text-app-subtle">/kWh</span>
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-500/15 px-4 py-2.5">
                  <p className="text-xs text-emerald-400 font-medium">{station.openStatus || 'Operational'}</p>
                  <p className="mt-0.5 text-lg font-bold text-emerald-400">
                    {station.availableChargers ?? station.availablePorts ?? 0}/{station.totalChargers ?? station.totalPorts ?? 0} Available
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-app-subtle sm:grid-cols-2 lg:grid-cols-3">
              {station.rating > 0 && (
                <div className="rounded-2xl border border-app-border bg-app-card p-3.5">
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                    <Star size={16} fill="currentColor" />
                    <span>{station.rating} / 5</span>
                  </div>
                  <p className="mt-1 text-xs text-app-subtle">User Satisfaction Score</p>
                </div>
              )}
              {station.distanceKm > 0 && (
                <div className="rounded-2xl border border-app-border bg-app-card p-3.5">
                  <p className="text-xs text-app-subtle font-medium">Distance</p>
                  <p className="mt-1 text-sm font-bold text-app-text">{station.distanceKm} km away</p>
                </div>
              )}
              {station.speedLabel && (
                <div className="rounded-2xl border border-app-border bg-app-card p-3.5">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <Zap size={16} />
                    <span>{station.speedLabel}</span>
                  </div>
                  {connectorTypes.length > 0 && (
                    <p className="mt-1 text-xs text-app-subtle">Type: {connectorTypes.join(", ")}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="surface-card p-5">
            <h3 className="text-lg font-semibold text-app-text">Live Battery Status</h3>
            <div className="mt-4 space-y-3">
              {podList.length > 0 ? (
                podList.map((podData) => {
                  const podNumber = podData.podNumber;
                  const rawState = (podData.state || podData.status || 'unknown').toLowerCase();
                  const bmsId = podData.bmsId || podData.battery_id || null;
                  const isAvailable = rawState === 'available' || rawState === 'fully_charged' || rawState === 'ready';
                  const isCharging = rawState === 'charging';
                  const isEmpty = rawState === 'empty';

                  const statusText = isAvailable 
                    ? 'Available for Swap' 
                    : isCharging 
                      ? 'Charging' 
                      : isEmpty 
                        ? 'Empty (Ready for battery insertion)' 
                        : rawState.replace('_', ' ');

                  const badgeColor = isAvailable 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : isCharging 
                      ? 'bg-blue-500/20 text-[#D1FF42]' 
                      : 'bg-app-muted text-app-text';

                  const badgeText = (podData.soc !== undefined && podData.soc !== null)
                    ? `${podData.soc}%` 
                    : isAvailable 
                      ? 'Available' 
                      : isCharging 
                        ? 'Charging' 
                        : 'Empty';

                  return (
                    <div key={podNumber} className="rounded-2xl border border-app-border bg-app-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-app-text">Pod {podNumber}</p>
                          <p className="mt-0.5 text-xs text-app-subtle capitalize">
                            Status: <span className="font-semibold text-app-text">{statusText}</span>
                            {bmsId ? ` • Tag: ${bmsId.slice(-8)}` : ''}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${badgeColor}`}>
                          {badgeText}
                        </span>
                      </div>
                      {podData.health && podData.health !== 'unknown' && (
                        <p className="mt-2 text-xs text-app-subtle">
                          Health Condition: <span className="font-semibold text-app-text">{podData.health}</span>
                        </p>
                      )}
                    </div>
                  );
                })
              ) : chargers.length > 0 ? (
                chargers.map((charger) => (
                  <div key={charger.name + charger.connector} className="rounded-2xl border border-app-border bg-app-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-app-text">{charger.name}</p>
                        <p className="mt-0.5 text-xs text-app-subtle">
                          {charger.speed} • {charger.connector}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">{charger.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-app-muted rounded-2xl text-center">
                  <p className="text-xs text-app-subtle font-medium">All charging pods online & operational</p>
                </div>
              )}
            </div>
          </section>

          <section className="surface-card p-5">
            <h3 className="text-lg font-semibold text-app-text">Station Overview</h3>
            <div className="mt-4 space-y-2 text-sm text-app-subtle">
              {amenities.length > 0 && <p><span className="font-semibold text-app-text">Amenities:</span> {amenities.join(", ")}</p>}
              {supportedVehicles.length > 0 && <p><span className="font-semibold text-app-text">Supported EVs:</span> {supportedVehicles.join(", ")}</p>}
              {paymentMethods.length > 0 && <p><span className="font-semibold text-app-text">Payment Modes:</span> {paymentMethods.join(", ")}</p>}
              <p><span className="font-semibold text-app-text">Pricing:</span> ₹{(Number(station.pricePerKwh || station.price) || 18.0).toFixed(2)}/kWh</p>
            </div>

            <div className="mt-5 grid gap-3">
              <Button onClick={handleNavigate} disabled={!hasLocation}>
                <Navigation className="mr-2" size={16} />
                {hasLocation ? "Get Directions on Map" : "Location not set yet"}
              </Button>
              {station.isElectica ? (
                <div className="grid gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleStartSwap}
                    disabled={swapState !== null || !canSwap}
                  >
                    {swapState === 'starting' ? 'Connecting to Station...' : 'Start Battery Swap'}
                  </Button>
                  {proximityMessage && (
                    <p className="text-xs text-app-subtle text-center">{proximityMessage}</p>
                  )}
                </div>
              ) : (
                <Button variant="secondary" onClick={handleNavigate}>View Station Details</Button>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Live Swap Modal */}
      {swapState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-app-card rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold mb-3 text-app-text">Battery Swap Process</h2>
            
            {swapState === 'starting' && (
              <div className="p-4 bg-blue-500/15 text-[#D1FF42] rounded-2xl text-sm font-medium animate-pulse">
                Initiating handshake with station hardware...
              </div>
            )}
            
            {swapState === 'polling' && swapData && (
              <div className="space-y-3">
                <div className="p-4 bg-indigo-500/15 text-indigo-400 rounded-2xl text-sm font-bold border border-indigo-100">
                  {swapData.step === 'insert' && (swapPod
                    ? `📥 Put your discharged battery in Pod ${swapPod}`
                    : '📥 Put your discharged battery in the pod the station unlocks')}
                  {swapData.step === 'pickup' && (swapPod
                    ? `📤 Take your fully charged battery from Pod ${swapPod}`
                    : '📤 Take your fully charged battery from the pod the station unlocks')}
                  {!swapData.step && `Swap Status: ${swapData.status}`}
                </div>
                <p className="text-xs text-app-subtle text-center">Do not close window until swap completes.</p>
              </div>
            )}
            
            {swapState === 'completed' && (
              <div className="p-4 bg-emerald-500/15 text-emerald-400 rounded-2xl text-sm font-bold border border-emerald-200">
                🎉 Battery Swap Complete! You're good to go.
              </div>
            )}
            
            {swapState === 'failed' && (
              <div className="p-4 bg-red-500/15 text-red-400 rounded-2xl text-sm font-medium border border-red-200">
                ⚠️ Swap Error: {errorMessage}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button onClick={closeSwapModal}>
                {swapState === 'completed' || swapState === 'failed' ? 'Close' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default StationDetailsPage;
