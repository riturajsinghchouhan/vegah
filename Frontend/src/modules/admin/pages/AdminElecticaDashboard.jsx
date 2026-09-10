import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  RefreshCwIcon as RefreshCw,
  ZapIcon as Zap,
  BatteryIcon as Battery,
  ActivityIcon as Activity,
  LayersIcon as Layers,
  ClockIcon as Clock,
  CheckCircleIcon as CheckCircle,
  AlertTriangleIcon as AlertTriangle,
  XCircleIcon as XCircle,
  InfoIcon as Info,
  ArrowRightLeftIcon as SwapIcon,
  CpuIcon as Cpu,
  EyeIcon as Eye,
  XIcon as X,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import electicaService from "../../../services/electicaService";

const formatIST = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch (err) {
    return String(dateStr);
  }
};

const getSocColor = (soc) => {
  const num = Number(soc);
  if (isNaN(num)) return "bg-gray-100 text-gray-800 border-gray-200";
  if (num >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (num >= 40) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
};

const getStatusBadge = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "online" || s === "charging" || s === "ready" || s === "active" || s === "available") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        {status || "Active"}
      </span>
    );
  }
  if (s === "maintenance" || s === "busy" || s === "in_use") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        {status || "Busy"}
      </span>
    );
  }
  if (s === "failed" || s === "error" || s === "offline" || s === "fault") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
      {status || "Offline"}
    </span>
  );
};

export default function AdminElecticaDashboard() {
  const [station, setStation] = useState(null);
  const [pods, setPods] = useState([]);
  const [batteries, setBatteries] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Selected battery telemetry modal state
  const [selectedBatteryId, setSelectedBatteryId] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);

  const fetchAllData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      setError(null);
      const [stationRes, podsRes, batteriesRes, swapsRes] = await Promise.allSettled([
        electicaService.getStation(),
        electicaService.getPods(),
        electicaService.getBatteries(),
        electicaService.getSwaps(100),
      ]);

      if (stationRes.status === "fulfilled") setStation(stationRes.value);
      if (podsRes.status === "fulfilled") setPods(Array.isArray(podsRes.value) ? podsRes.value : podsRes.value?.pods || []);
      if (batteriesRes.status === "fulfilled") setBatteries(Array.isArray(batteriesRes.value) ? batteriesRes.value : batteriesRes.value?.batteries || []);
      if (swapsRes.status === "fulfilled") setSwaps(Array.isArray(swapsRes.value) ? swapsRes.value : swapsRes.value?.swaps || []);

      // Check if all failed
      if (
        stationRes.status === "rejected" &&
        podsRes.status === "rejected" &&
        batteriesRes.status === "rejected"
      ) {
        const errObj = stationRes.reason || podsRes.reason || batteriesRes.reason;
        setError(errObj?.response?.data?.message || errObj?.message || "Failed to load Electica Partner API data");
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching Electica data:", err);
      setError(err?.response?.data?.message || err?.message || "Error connecting to Electica service");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // Handle viewing battery telemetry detail
  const handleOpenTelemetry = async (batteryId) => {
    setSelectedBatteryId(batteryId);
    setTelemetryLoading(true);
    setTelemetryHistory([]);
    setLatestTelemetry(null);

    try {
      const [latestRes, historyRes] = await Promise.allSettled([
        electicaService.getLatestTelemetry(batteryId),
        electicaService.getTelemetry(batteryId, 50),
      ]);

      if (latestRes.status === "fulfilled") {
        setLatestTelemetry(latestRes.value);
      }
      if (historyRes.status === "fulfilled") {
        setTelemetryHistory(Array.isArray(historyRes.value) ? historyRes.value : historyRes.value?.telemetry || []);
      }
    } catch (err) {
      console.error(`Error loading telemetry for battery ${batteryId}:`, err);
    } finally {
      setTelemetryLoading(false);
    }
  };

  // Convert telemetry history into format for Recharts area chart
  const formattedChartData = telemetryHistory.map((item, idx) => ({
    time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `#${idx + 1}`,
    soc: Number(item.soc ?? item.socPercentage ?? 0),
    voltage: Number(item.voltage ?? item.packVoltage ?? 0),
    temperature: Number(item.temperature ?? item.cellTemp ?? 0),
  }));

  if (loading && !station && pods.length === 0 && batteries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <RefreshCw size={36} className="animate-spin text-purple-600" />
        <p className="text-gray-600 font-medium text-sm">Connecting to Electica Partner API...</p>
      </div>
    );
  }

  // Derive station stats safely
  const stationName = station?.name || station?.stationName || "BLR001 - Electica Swapping Hub";
  const stationId = station?.id || station?.stationId || "BLR001";
  const locationName = station?.location?.address || station?.location || station?.address || "Bengaluru Hub, Karnataka";
  const isOnline = station?.status ? String(station.status).toLowerCase() === "online" : true;
  const podCount = pods.length || station?.totalPods || station?.podCount || 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              Electica BSS Partner Dashboard
            </h1>
            <span className="px-3 py-1 text-xs font-bold bg-purple-100 text-purple-700 rounded-full">
              Live Monitoring
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time Battery Swapping Station, Pod status, and Battery Telemetry stream.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAllData(false)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800">
          <AlertTriangle size={20} className="shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-bold">Electica Service Warning</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Station Information Card */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <Zap size={24} className="text-yellow-400" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">
                  Station ID: {stationId}
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">{stationName}</h2>
              </div>
            </div>

            <p className="text-sm text-purple-200/90 mt-4 flex items-center gap-2">
              <Info size={16} className="text-purple-300 shrink-0" />
              Location: <span className="font-medium text-white">{locationName}</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
            <span className="text-xs font-medium text-purple-200">Station Status</span>
            <div className="mt-2 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`}></span>
              <span className="text-lg font-bold text-white uppercase">{isOnline ? "ONLINE" : "OFFLINE"}</span>
            </div>
            <span className="text-xs text-purple-300 mt-1">Rate limit 120 req/min</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
            <span className="text-xs font-medium text-purple-200">Total Pods & Batteries</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{podCount}</span>
              <span className="text-xs text-purple-200">Pods</span>
              <span className="text-2xl font-black text-yellow-300 ml-3">{batteries.length}</span>
              <span className="text-xs text-purple-200">Batteries</span>
            </div>
            <span className="text-xs text-purple-300 mt-1">
              Last Sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Just now"}
            </span>
          </div>
        </div>
      </div>

      {/* Pod Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Pod Overview ({pods.length})</h2>
          </div>
          <span className="text-xs text-gray-500 font-medium">Live pod slots monitoring</span>
        </div>

        {pods.length === 0 ? (
          <div className="p-8 bg-white border border-gray-100 rounded-2xl text-center text-gray-500 text-sm">
            No pod data available for station {stationId}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pods.map((pod, idx) => {
              const podNumber = pod.podNumber ?? pod.number ?? pod.podId ?? `#${idx + 1}`;
              const state = pod.state || pod.status || "Ready";
              const podHealth = pod.health !== undefined ? `${pod.health}%` : "100%";
              const bmsId = pod.bmsId || pod.batteryId || pod.bms || "N/A";
              const updatedTime = formatIST(pod.updatedAt || pod.updatedTime || pod.lastUpdated);

              return (
                <div
                  key={pod.id || idx}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                        {podNumber}
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">Pod {podNumber}</span>
                    </div>
                    {getStatusBadge(state)}
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>State:</span>
                      <span className="font-semibold text-gray-900">{state}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Health:</span>
                      <span className="font-semibold text-emerald-600">{podHealth}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>BMS ID:</span>
                      <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                        {bmsId}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500 pt-2 border-t border-gray-50 text-[11px]">
                      <span>Updated:</span>
                      <span>{updatedTime}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Battery Overview Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Battery size={20} className="text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Battery Fleet Overview ({batteries.length})
            </h2>
          </div>
          <span className="text-xs text-gray-500 font-medium">Click battery to view telemetry</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {batteries.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No batteries currently recorded at this station.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Battery ID</th>
                    <th className="py-3.5 px-4">Station</th>
                    <th className="py-3.5 px-4">Pod #</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">SOC</th>
                    <th className="py-3.5 px-4">Health</th>
                    <th className="py-3.5 px-4">Voltage</th>
                    <th className="py-3.5 px-4">Current</th>
                    <th className="py-3.5 px-4">Temp</th>
                    <th className="py-3.5 px-4">Cycles</th>
                    <th className="py-3.5 px-4">Last Telemetry</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {batteries.map((b) => {
                    const bId = b.id || b.batteryId || b._id;
                    const socVal = b.soc ?? b.socPercentage ?? "N/A";
                    const healthVal = b.health !== undefined ? `${b.health}%` : "N/A";
                    const voltageVal = b.voltage !== undefined ? `${b.voltage} V` : "N/A";
                    const currentVal = b.currentDraw !== undefined ? `${b.currentDraw} A` : "N/A";
                    const tempVal = b.temperature !== undefined ? `${b.temperature} °C` : "N/A";

                    return (
                      <tr key={bId} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-purple-900">
                          {bId}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 text-xs">
                          {b.stationId || stationId}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-700">
                          {b.podNumber ?? b.podId ?? "—"}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(b.status || "Ready")}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getSocColor(
                              socVal
                            )}`}
                          >
                            {socVal !== "N/A" ? `${socVal}%` : "N/A"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-semibold text-xs">
                          {healthVal}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 text-xs font-mono">{voltageVal}</td>
                        <td className="py-3.5 px-4 text-gray-700 text-xs font-mono">{currentVal}</td>
                        <td className="py-3.5 px-4 text-gray-700 text-xs">{tempVal}</td>
                        <td className="py-3.5 px-4 text-gray-700 text-xs font-mono">
                          {b.cycleCount ?? "—"}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-xs">
                          {formatIST(b.lastTelemetry || b.updatedAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenTelemetry(bId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            <Eye size={14} />
                            Telemetry
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Swap Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SwapIcon size={20} className="text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Swap Activity ({swaps.length})
            </h2>
          </div>
          <span className="text-xs text-gray-500 font-medium">Recent battery swapping events</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {swaps.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No recent swap activity recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Swap ID / Event</th>
                    <th className="py-3.5 px-4">Station</th>
                    <th className="py-3.5 px-4">Battery Out</th>
                    <th className="py-3.5 px-4">Battery In</th>
                    <th className="py-3.5 px-4">Pod #</th>
                    <th className="py-3.5 px-4">State / Status</th>
                    <th className="py-3.5 px-4">Swap Time (IST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {swaps.map((s, idx) => (
                    <tr key={s.id || s.swapId || idx} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-800">
                        {s.id || s.swapId || `SWAP-${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">{s.stationId || stationId}</td>
                      <td className="py-3 px-4 font-mono text-xs text-rose-700 font-medium">
                        {s.batteryOut || s.batteryOutId || s.oldBatteryId || "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-emerald-700 font-medium">
                        {s.batteryIn || s.batteryInId || s.newBatteryId || "—"}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-gray-700">
                        {s.podNumber ?? s.podId ?? s.pod ?? "—"}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(s.status || "Completed")}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {formatIST(s.timestamp || s.createdAt || s.swapTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Telemetry Detail Modal */}
      {selectedBatteryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
                  <Cpu size={22} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-purple-600 tracking-wider">
                    Battery Telemetry Analytics
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 font-mono">
                    ID: {selectedBatteryId}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedBatteryId(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              {telemetryLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <RefreshCw size={28} className="animate-spin text-purple-600" />
                  <p className="text-sm font-medium text-gray-600">Loading battery stream...</p>
                </div>
              ) : (
                <>
                  {/* Latest Telemetry Cards */}
                  {latestTelemetry && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                        <span className="text-xs text-purple-600 font-medium">State of Charge</span>
                        <p className="text-xl font-bold text-purple-900 mt-1">
                          {latestTelemetry.soc ?? latestTelemetry.socPercentage ?? "N/A"}%
                        </p>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <span className="text-xs text-blue-600 font-medium">Pack Voltage</span>
                        <p className="text-xl font-bold text-blue-900 mt-1">
                          {latestTelemetry.voltage ?? latestTelemetry.packVoltage ?? "N/A"} V
                        </p>
                      </div>

                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <span className="text-xs text-emerald-600 font-medium">Current Draw</span>
                        <p className="text-xl font-bold text-emerald-900 mt-1">
                          {latestTelemetry.currentDraw ?? "N/A"} A
                        </p>
                      </div>

                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <span className="text-xs text-amber-600 font-medium">Temperature</span>
                        <p className="text-xl font-bold text-amber-900 mt-1">
                          {latestTelemetry.temperature ?? latestTelemetry.cellTemp ?? "N/A"} °C
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Telemetry Chart */}
                  {formattedChartData.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <h4 className="text-sm font-bold text-gray-800 mb-4">
                        SOC % Stream History
                      </h4>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={formattedChartData}>
                            <defs>
                              <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} />
                            <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={11} />
                            <RechartsTooltip />
                            <Area
                              type="monotone"
                              dataKey="soc"
                              stroke="#9333ea"
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill="url(#socGradient)"
                              name="SOC %"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Telemetry Log Table */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-3">Telemetry Log Stream</h4>
                    {telemetryHistory.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No history log recorded for this battery.</p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-100 text-gray-600 sticky top-0">
                            <tr>
                              <th className="py-2 px-3">Timestamp (IST)</th>
                              <th className="py-2 px-3">SOC</th>
                              <th className="py-2 px-3">Voltage</th>
                              <th className="py-2 px-3">Current</th>
                              <th className="py-2 px-3">Temp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {telemetryHistory.map((t, idx) => (
                              <tr key={t.id || idx} className="hover:bg-gray-50">
                                <td className="py-2 px-3 font-mono text-gray-600">
                                  {formatIST(t.timestamp || t.createdAt)}
                                </td>
                                <td className="py-2 px-3 font-bold text-purple-700">
                                  {t.soc ?? t.socPercentage ?? "N/A"}%
                                </td>
                                <td className="py-2 px-3">{t.voltage ?? t.packVoltage ?? "N/A"} V</td>
                                <td className="py-2 px-3">{t.currentDraw ?? "N/A"} A</td>
                                <td className="py-2 px-3">{t.temperature ?? t.cellTemp ?? "N/A"} °C</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
