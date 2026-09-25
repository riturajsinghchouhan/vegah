import { Clock3, Navigation, Star, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../../components/common/Button";
import PageHeader from "../../../../components/layout/PageHeader";
import { chargingService } from "../../../../services/chargingService";

const StationDetailsPage = () => {
  const { stationId } = useParams();
  const [station, setStation] = useState(null);
  const [pods, setPods] = useState(null);

  const [swapState, setSwapState] = useState(null); // null, 'starting', 'polling', 'completed', 'failed'
  const [swapData, setSwapData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    chargingService.getStationById(stationId).then(setStation);
    chargingService.getPods(stationId).then(setPods);
  }, [stationId]);

  useEffect(() => {
    let interval;
    if (swapState === 'polling' && swapData?.swap_id) {
      interval = setInterval(async () => {
        try {
          const res = await chargingService.getSwapStatus(swapData.swap_id);
          const data = res.data || res;
          setSwapData(data);
          if (data.status === 'completed') {
            setSwapState('completed');
          } else if (data.status === 'failed') {
            setSwapState('failed');
            setErrorMessage(data.failure_reason || "Swap failed");
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [swapState, swapData]);

  const handleStartSwap = async () => {
    try {
      setSwapState('starting');
      setErrorMessage("");
      const res = await chargingService.startSwap(station.id, "TEST-PLAN-123");
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

  const connectorTypes = station.connectorTypes ?? (station.connector ? [station.connector] : []);
  const chargers = station.chargers ?? [];
  const supportedVehicles = station.supportedVehicles ?? [];
  const paymentMethods = station.paymentMethods ?? [];
  const amenities = station.amenities ?? [];

  const handleNavigate = () => {
    if (station.lat && station.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`, '_blank');
    } else if (station.address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(station.address)}`, '_blank');
    }
  };

  return (
    <main className="page-padding relative">
      <PageHeader showBack subtitle="Station details and battery availability" title={station.name} showBell={false} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="surface-card overflow-hidden p-4">
            <div className="rounded-[1.75rem] bg-[#0B1320] p-4 flex items-center justify-center">
              <img alt={station.name} className="h-64 w-full object-contain sm:h-80" src={station.image || '/assets/battery_swap.png'} />
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
                <div className="rounded-2xl bg-orange-50 px-4 py-2.5">
                  <p className="text-xs text-orange-600 font-medium">Pricing</p>
                  <p className="mt-0.5 text-lg font-bold text-[#272664]">
                    ₹{(Number(station.pricePerKwh || station.price) || 18.0).toFixed(2)}
                    <span className="text-xs font-normal text-gray-500">/kWh</span>
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-2.5">
                  <p className="text-xs text-emerald-700 font-medium">{station.openStatus || 'Operational'}</p>
                  <p className="mt-0.5 text-lg font-bold text-emerald-600">
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
                  <p className="mt-1 text-xs text-gray-500">User Satisfaction Score</p>
                </div>
              )}
              {station.distanceKm > 0 && (
                <div className="rounded-2xl border border-app-border bg-app-card p-3.5">
                  <p className="text-xs text-gray-500 font-medium">Distance</p>
                  <p className="mt-1 text-sm font-bold text-app-text">{station.distanceKm} km away</p>
                </div>
              )}
              {station.speedLabel && (
                <div className="rounded-2xl border border-app-border bg-app-card p-3.5">
                  <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                    <Zap size={16} />
                    <span>{station.speedLabel}</span>
                  </div>
                  {connectorTypes.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">Type: {connectorTypes.join(", ")}</p>
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
              {pods && Object.keys(pods).length > 0 ? (
                Object.entries(pods).map(([podNumber, podData]) => {
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
                    ? 'bg-emerald-100 text-emerald-800' 
                    : isCharging 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-700';

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
                            Status: <span className="font-semibold text-gray-700">{statusText}</span>
                            {bmsId ? ` • Tag: ${bmsId.slice(-8)}` : ''}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${badgeColor}`}>
                          {badgeText}
                        </span>
                      </div>
                      {podData.health && podData.health !== 'unknown' && (
                        <p className="mt-2 text-xs text-app-subtle">
                          Health Condition: <span className="font-semibold text-gray-700">{podData.health}</span>
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
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{charger.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <p className="text-xs text-gray-500 font-medium">All charging pods online & operational</p>
                </div>
              )}
            </div>
          </section>

          <section className="surface-card p-5">
            <h3 className="text-lg font-semibold text-app-text">Station Overview</h3>
            <div className="mt-4 space-y-2 text-sm text-app-subtle">
              {amenities.length > 0 && <p><span className="font-semibold text-gray-700">Amenities:</span> {amenities.join(", ")}</p>}
              {supportedVehicles.length > 0 && <p><span className="font-semibold text-gray-700">Supported EVs:</span> {supportedVehicles.join(", ")}</p>}
              {paymentMethods.length > 0 && <p><span className="font-semibold text-gray-700">Payment Modes:</span> {paymentMethods.join(", ")}</p>}
              <p><span className="font-semibold text-gray-700">Pricing:</span> ₹{(Number(station.pricePerKwh || station.price) || 18.0).toFixed(2)}/kWh</p>
            </div>

            <div className="mt-5 grid gap-3">
              <Button onClick={handleNavigate}>
                <Navigation className="mr-2" size={16} />
                Get Directions on Map
              </Button>
              {station.isElectica ? (
                <Button variant="secondary" onClick={handleStartSwap} disabled={swapState !== null}>
                  {swapState === 'starting' ? 'Connecting to Station...' : 'Start Battery Swap'}
                </Button>
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
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold mb-3 text-gray-900">Battery Swap Process</h2>
            
            {swapState === 'starting' && (
              <div className="p-4 bg-blue-50 text-blue-800 rounded-2xl text-sm font-medium animate-pulse">
                Initiating handshake with station hardware...
              </div>
            )}
            
            {swapState === 'polling' && swapData && (
              <div className="space-y-3">
                <div className="p-4 bg-indigo-50 text-indigo-900 rounded-2xl text-sm font-bold border border-indigo-100">
                  {swapData.step === 'insert' && `📥 Put your discharged battery in Pod ${swapData.pod || 1}`}
                  {swapData.step === 'pickup' && `📤 Take your fully charged battery from Pod ${swapData.pod || 2}`}
                  {!swapData.step && `Swap Status: ${swapData.status}`}
                </div>
                <p className="text-xs text-gray-500 text-center">Do not close window until swap completes.</p>
              </div>
            )}
            
            {swapState === 'completed' && (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-sm font-bold border border-emerald-200">
                🎉 Battery Swap Complete! You're good to go.
              </div>
            )}
            
            {swapState === 'failed' && (
              <div className="p-4 bg-red-50 text-red-800 rounded-2xl text-sm font-medium border border-red-200">
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
