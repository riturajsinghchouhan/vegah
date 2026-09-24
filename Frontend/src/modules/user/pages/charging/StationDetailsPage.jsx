import { Clock3, Navigation, Star, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../../components/common/Button";
import PageHeader from "../../../../components/layout/PageHeader";
import { chargingService } from "../../../../services/chargingService";

const StationDetailsPage = () => {
  const { stationId } = useParams();
  const [station, setStation] = useState(null);

  const [swapState, setSwapState] = useState(null); // null, 'starting', 'polling', 'completed', 'failed'
  const [swapData, setSwapData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    chargingService.getStationById(stationId).then(setStation);
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

  const connectorTypes = station.connectorTypes ?? [station.connector].filter(Boolean);
  const chargers = station.chargers ?? [];
  const supportedVehicles = station.supportedVehicles ?? ["All electric scoots"];
  const paymentMethods = station.paymentMethods ?? ["UPI"];

  return (
    <main className="page-padding relative">
      <PageHeader showBack subtitle="Station details and battery availability" title={station.name} showBell={false} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="surface-card overflow-hidden p-4">
            <div className="rounded-[1.75rem] bg-[#0B1320] p-4">
              <img alt={station.name} className="h-72 w-full object-contain sm:h-96" src={station.image} />
            </div>
          </section>

          <section className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">Battery swapping hub</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-app-text">{station.name}</h2>
                <p className="mt-2 text-sm text-app-subtle">{station.address}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-[1.5rem] bg-orange-50 px-4 py-3">
                  <p className="text-sm text-orange-600 font-medium">Price</p>
                  <p className="mt-1 text-xl font-semibold text-[#272664]">
                    ₹{station.pricePerKwh?.toFixed(2) || "0.00"}<span className="text-sm font-medium text-orange-600/70">/kWh</span>
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-emerald-50 px-4 py-3">
                  <p className="text-sm text-emerald-700 font-medium">{station.openStatus}</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-600">{station.availableChargers}/{station.totalChargers} open</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-app-subtle sm:grid-cols-3">
              <div className="rounded-3xl border border-app-border bg-app-card p-4">
                <Star size={18} className="text-amber-500" />
                <p className="mt-3 text-sm font-medium text-app-text">{station.rating} rating</p>
                <p className="mt-1">{station.distanceKm} km away</p>
              </div>
              <div className="rounded-3xl border border-app-border bg-app-card p-4">
                <Clock3 size={18} className="text-app-primary" />
                <p className="mt-3 text-sm font-medium text-app-text">{station.driveMinutes} min drive</p>
                <p className="mt-1">Route-ready travel estimate</p>
              </div>
              <div className="rounded-3xl border border-app-border bg-app-card p-4">
                <Zap size={18} className="text-app-primary" />
                <p className="mt-3 text-sm font-medium text-app-text">{station.speedLabel}</p>
                <p className="mt-1">Connector types: {connectorTypes.join(", ")}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="surface-card p-5">
            <h3 className="text-lg font-semibold text-app-text">Battery status</h3>
            <div className="mt-4 space-y-3">
              {chargers.map((charger) => (
                <div key={charger.name + charger.connector} className="rounded-3xl border border-app-border bg-app-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-app-text">{charger.name}</p>
                      <p className="mt-1 text-sm text-app-subtle">
                        {charger.speed} • {charger.connector}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-app-primary">{charger.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-app-subtle">Rs {charger.price}/kWh</p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card p-5">
            <h3 className="text-lg font-semibold text-app-text">Station info</h3>
            <div className="mt-4 space-y-3 text-sm text-app-subtle">
              <p>Amenities: {station.amenities.join(", ")}</p>
              <p>Supported vehicles: {supportedVehicles.join(", ")}</p>
              <p>Payment methods: {paymentMethods.join(", ")}</p>
              <p>Pricing starts at Rs {station.pricePerKwh}/kWh</p>
            </div>

            <div className="mt-5 grid gap-3">
              <Button>
                <Navigation className="mr-2" size={16} />
                Navigate
              </Button>
              {station.isElectica ? (
                <Button variant="secondary" onClick={handleStartSwap} disabled={swapState !== null}>
                  {swapState === 'starting' ? 'Starting...' : 'Start swapping'}
                </Button>
              ) : (
                <Button variant="secondary">Start charging</Button>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Live Swap Modal */}
      {swapState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Battery Swap</h2>
            
            {swapState === 'starting' && <p>Connecting to station...</p>}
            
            {swapState === 'polling' && swapData && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 text-blue-800 rounded-xl font-medium">
                  {swapData.step === 'insert' && `Put your battery in pod ${swapData.pod}`}
                  {swapData.step === 'pickup' && `Take the battery from pod ${swapData.pod}`}
                </div>
                <p className="text-sm text-gray-500">Status: {swapData.status}</p>
              </div>
            )}
            
            {swapState === 'completed' && (
              <div className="p-4 bg-green-50 text-green-800 rounded-xl font-medium">
                Swap complete!
              </div>
            )}
            
            {swapState === 'failed' && (
              <div className="p-4 bg-red-50 text-red-800 rounded-xl font-medium">
                Swap failed: {errorMessage}
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
