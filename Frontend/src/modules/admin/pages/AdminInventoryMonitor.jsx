import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  Layers,
  Battery,
  Users,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Eye,
  X,
  Cpu,
  ArrowRightLeft as SwapIcon,
  Radio,
  Sparkles,
  Copy,
  ChevronRight,
  TrendingUp,
  MapPin,
  Flame,
  Award
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

const getSocBarColor = (soc) => {
  const num = Number(soc);
  if (num >= 80) return "bg-emerald-500";
  if (num >= 40) return "bg-amber-500";
  return "bg-rose-500";
};

const getPortStateBadge = (state) => {
  const s = String(state || "").toLowerCase();
  if (s === "available" || s === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Available
      </span>
    );
  }
  if (s === "charging" || s === "busy" || s === "in_use") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
        Charging
      </span>
    );
  }
  if (s === "empty") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
        Empty Slot
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
      {state || "Fault"}
    </span>
  );
};

export default function AdminInventoryMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [activeTab, setActiveTab] = useState("ports"); // "ports" | "users" | "batteries" | "logs"
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [batterySearchTerm, setBatterySearchTerm] = useState("");
  const [selectedUserFilter, setSelectedUserFilter] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Telemetry modal state
  const [selectedBatteryId, setSelectedBatteryId] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);

  const fetchMonitoringData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      setError(null);
      const res = await electicaService.getInventoryMonitoring();
      setData(res);
      setLastUpdated(new Date());
      setCountdown(10);
    } catch (err) {
      console.error("Failed to load inventory monitoring data", err);
      setError(err?.response?.data?.message || err?.message || "Failed to connect to BSS live stream");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMonitoringData(true);
  }, [fetchMonitoringData]);

  // Auto-refresh interval (10 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchMonitoringData(false);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, fetchMonitoringData]);

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Telemetry Modal
  const handleOpenTelemetry = async (batteryId) => {
    setSelectedBatteryId(batteryId);
    setTelemetryLoading(true);
    setTelemetryHistory([]);
    setLatestTelemetry(null);

    try {
      const [latestRes, historyRes] = await Promise.allSettled([
        electicaService.getLatestTelemetry(batteryId),
        electicaService.getTelemetry(batteryId, 40),
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

  const formattedChartData = useMemo(() => {
    return telemetryHistory.map((item, idx) => ({
      time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `#${idx + 1}`,
      soc: Number(item.soc ?? item.socPercentage ?? 0),
      voltage: Number(item.voltage ?? item.packVoltage ?? 0),
      temperature: Number(item.temperature ?? item.cellTemp ?? 0),
    }));
  }, [telemetryHistory]);

  const filteredUsers = useMemo(() => {
    if (!data?.userUsage) return [];
    if (!userSearchTerm.trim()) return data.userUsage;
    const term = userSearchTerm.toLowerCase();
    return data.userUsage.filter(
      u =>
        u.userName?.toLowerCase().includes(term) ||
        u.userPhone?.includes(term) ||
        u.userEmail?.toLowerCase().includes(term) ||
        u.currentBatteryId?.toLowerCase().includes(term)
    );
  }, [data?.userUsage, userSearchTerm]);

  const filteredBatteries = useMemo(() => {
    if (!data?.batteries) return [];
    if (!batterySearchTerm.trim()) return data.batteries;
    const term = batterySearchTerm.toLowerCase();
    return data.batteries.filter(
      b =>
        b.id?.toLowerCase().includes(term) ||
        b.bmsId?.toLowerCase().includes(term) ||
        String(b.podNumber).includes(term) ||
        b.status?.toLowerCase().includes(term)
    );
  }, [data?.batteries, batterySearchTerm]);

  const filteredSwaps = useMemo(() => {
    if (!data?.recentSwaps) return [];
    if (selectedUserFilter) {
      return data.recentSwaps.filter(s => String(s.userId) === String(selectedUserFilter));
    }
    return data.recentSwaps;
  }, [data?.recentSwaps, selectedUserFilter]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <RefreshCw size={36} className="animate-spin text-purple-600" />
        <p className="text-gray-600 font-semibold text-sm">Connecting to Real-time Hub Stream & Telemetry...</p>
      </div>
    );
  }

  const station = data?.station || null;
  const pods = data?.pods || [];
  const stats = data?.stats || {
    totalPods: 0,
    availablePods: 0,
    chargingPods: 0,
    emptyPods: 0,
    totalBatteries: 0,
    totalSwaps: 0,
    uniqueUsersServed: 0,
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-xl shadow-md">
              <Activity size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">
                Port & Battery Live Monitor
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time port slots, customer port usage frequencies, and battery lifecycle analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Station Badge */}
          <div className="flex items-center gap-2 bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-xl text-xs font-bold">
            <MapPin size={14} className="text-purple-600" />
            <span>{station?.name || "Station unavailable"}</span>
            <span className={`w-2 h-2 rounded-full ml-1 ${station ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`}></span>
          </div>

          {/* Auto Refresh Switch */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              autoRefresh
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-gray-50 text-gray-600 border-gray-200"
            }`}
          >
            <Radio size={14} className={autoRefresh ? "text-emerald-600 animate-spin" : "text-gray-400"} />
            <span>{autoRefresh ? `Live (${countdown}s)` : "Paused"}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchMonitoringData(false)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Syncing..." : "Sync Now"}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <span>Notice: {error}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Ports</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-gray-900">{stats.totalPods}</span>
            <span className="text-xs text-gray-400 font-medium">Slots</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
            <Layers size={13} className="text-purple-600" />
            <span>Hardware Pods</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between bg-emerald-50/20">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Ready Ports</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700">{stats.availablePods}</span>
            <span className="text-xs text-emerald-600 font-medium">Available</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1">
            <CheckCircle size={13} />
            <span>Charge Ready</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between bg-blue-50/20">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Charging Ports</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-700">{stats.chargingPods}</span>
            <span className="text-xs text-blue-600 font-medium">Active</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-700 flex items-center gap-1">
            <Zap size={13} className="animate-pulse" />
            <span>Power Flowing</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Empty Slots</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-gray-700">{stats.emptyPods}</span>
            <span className="text-xs text-gray-400 font-medium">Vacant</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
            <span>Ready for Inward Drop</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex flex-col justify-between bg-purple-50/20">
          <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Total Batteries</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-900">{stats.totalBatteries}</span>
            <span className="text-xs text-purple-600 font-medium">Packs</span>
          </div>
          <div className="mt-2 text-[11px] text-purple-700 flex items-center gap-1">
            <Battery size={13} />
            <span>Tracked in System</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-between bg-orange-50/20">
          <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">Riders Served</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-orange-900">{stats.uniqueUsersServed}</span>
            <span className="text-xs text-orange-600 font-medium">Users</span>
          </div>
          <div className="mt-2 text-[11px] text-orange-700 flex items-center gap-1">
            <Users size={13} />
            <span>{stats.totalSwaps} Total Swaps</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-3 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("ports")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "ports"
              ? "bg-purple-700 text-white shadow-md shadow-purple-200"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Layers size={16} />
          <span>Real-Time Ports Grid ({pods.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "users"
              ? "bg-purple-700 text-white shadow-md shadow-purple-200"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Users size={16} />
          <span>User Port Usage Frequency ({data?.userUsage?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("batteries")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "batteries"
              ? "bg-purple-700 text-white shadow-md shadow-purple-200"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Battery size={16} />
          <span>Battery Registry & Live Telemetry ({data?.batteries?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "logs"
              ? "bg-purple-700 text-white shadow-md shadow-purple-200"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <SwapIcon size={16} />
          <span>Live Swap Logs ({filteredSwaps.length})</span>
          {selectedUserFilter && (
            <span className="text-[10px] bg-yellow-400 text-gray-900 px-1.5 py-0.5 rounded font-black">Filtered</span>
          )}
        </button>
      </div>

      {/* TAB 1: REAL-TIME PORTS GRID */}
      {activeTab === "ports" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Live Station Port Slots (BLR001 Hub)</h2>
              <p className="text-xs text-gray-500">Every port slot state, docked battery ID, and charge progress.</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Available ({stats.availablePods})
              </span>
              <span className="flex items-center gap-1.5 text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Charging ({stats.chargingPods})
              </span>
              <span className="flex items-center gap-1.5 text-gray-600 font-semibold bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                Empty ({stats.emptyPods})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pods.map((pod) => {
              const pNum = pod.podNumber;
              const hasBattery = Boolean(pod.battery);
              const socKnown = hasBattery && pod.battery.soc != null;
              const soc = socKnown ? Number(pod.battery.soc) : 0;
              const bId = pod.battery?.id || "None";
              const isAvailable = pod.state === "available";
              const isCharging = pod.state === "charging";

              return (
                <div
                  key={pNum}
                  className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md relative overflow-hidden ${
                    isAvailable
                      ? "border-emerald-200 ring-1 ring-emerald-100"
                      : isCharging
                      ? "border-blue-200 ring-1 ring-blue-100"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shadow-sm ${
                          isAvailable
                            ? "bg-emerald-600 text-white"
                            : isCharging
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        P{pNum}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">Port Slot #{pNum}</div>
                        <div className="text-[11px] text-gray-400">Hardware Bay #{pNum}</div>
                      </div>
                    </div>
                    {getPortStateBadge(pod.state)}
                  </div>

                  {hasBattery ? (
                    <div className="mt-4 space-y-3">
                      <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-600">Docked Battery:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded text-xs">
                              {bId}
                            </span>
                            <button
                              onClick={() => copyToClipboard(bId)}
                              className="text-gray-400 hover:text-purple-600 p-1"
                              title="Copy Battery ID"
                            >
                              <Copy size={12} />
                            </button>
                            {copiedId === bId && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                          </div>
                        </div>

                        <div className="mt-2.5 space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-500">Charge Level (SOC)</span>
                            <span className={socKnown ? (soc >= 80 ? "text-emerald-700" : soc >= 40 ? "text-amber-700" : "text-rose-700") : "text-gray-400"}>
                              {socKnown ? `${soc.toFixed(1)}%` : "N/A"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${socKnown ? getSocBarColor(soc) : "bg-gray-300"}`}
                              style={{ width: `${socKnown ? Math.min(100, Math.max(0, soc)) : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-500 block">Voltage</span>
                          <span className="font-bold text-gray-800">{pod.battery?.voltage != null ? `${pod.battery.voltage} V` : "N/A"}</span>
                        </div>
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-500 block">Temperature</span>
                          <span className="font-bold text-gray-800">{pod.battery?.temperature != null ? `${pod.battery.temperature} °C` : "N/A"}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenTelemetry(bId)}
                        className="w-full mt-2 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-purple-200"
                      >
                        <Eye size={14} />
                        <span>Inspect Live Battery Telemetry</span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-2">
                      <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                        <Layers size={22} />
                      </div>
                      <p className="text-xs font-bold text-gray-600">No Battery Docked</p>
                      <p className="text-[11px] text-gray-400 max-w-[200px] mx-auto">
                        This port is vacant and ready to receive a depleted battery from a rider.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Health: {pod.health ?? "N/A"}</span>
                    <span>Updated: {formatIST(pod.updatedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: USER PORT USAGE FREQUENCY */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search user name, phone number, or battery ID..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-purple-600 transition"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Award className="text-amber-500" size={16} />
              <span>Port Breakdown reveals repeat visits per user on individual hub ports</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <th className="py-4 px-5">Rider / Customer Details</th>
                    <th className="py-4 px-5 text-center">Total Swaps</th>
                    <th className="py-4 px-5">Port Usage Breakdown ("कितनी बार कौन सा पोर्ट यूज़ किया")</th>
                    <th className="py-4 px-5 text-center">Most Used Port</th>
                    <th className="py-4 px-5">Current Battery ID</th>
                    <th className="py-4 px-5">Last Swap Time</th>
                    <th className="py-4 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-400 text-sm">
                        No user usage records found matching "{userSearchTerm}".
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => (
                      <tr key={u.userId || idx} className="hover:bg-purple-50/20 transition">
                        <td className="py-4 px-5">
                          <div className="font-bold text-gray-900">{u.userName}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{u.userPhone}</div>
                          <div className="text-[11px] text-gray-400">{u.userEmail}</div>
                        </td>

                        <td className="py-4 px-5 text-center">
                          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-900 font-black rounded-full text-xs">
                            {u.totalSwaps} visits
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {Object.entries(u.portCounts || {}).map(([portNum, count]) => {
                              if (count === 0) return null;
                              return (
                                <span
                                  key={portNum}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                    count >= 3
                                      ? "bg-purple-50 text-purple-800 border-purple-300"
                                      : "bg-gray-50 text-gray-700 border-gray-200"
                                  }`}
                                >
                                  <span>Port #{portNum}:</span>
                                  <span className="font-black text-purple-700">{count}x</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-4 px-5 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <Sparkles size={12} className="text-amber-500" />
                            {u.mostUsedPort}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
                            {u.currentBatteryId || "None"}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-xs text-gray-500">
                          {formatIST(u.lastSwapAt)}
                        </td>

                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => {
                              setSelectedUserFilter(u.userId);
                              setActiveTab("logs");
                            }}
                            className="inline-flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 font-bold bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition"
                          >
                            <span>View Logs</span>
                            <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BATTERY REGISTRY & LIVE TELEMETRY */}
      {activeTab === "batteries" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by Battery ID or BMS serial..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-purple-600 transition"
                value={batterySearchTerm}
                onChange={(e) => setBatterySearchTerm(e.target.value)}
              />
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Battery size={16} className="text-purple-600" />
              <span>Real-time battery location (Docked in Hub vs In circulation with Rider)</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Battery ID</th>
                    <th className="py-3.5 px-4">Location / Current Slot</th>
                    <th className="py-3.5 px-4">Charge Status (SOC)</th>
                    <th className="py-3.5 px-4">Voltage</th>
                    <th className="py-3.5 px-4">Temp</th>
                    <th className="py-3.5 px-4">BMS Serial</th>
                    <th className="py-3.5 px-4">Cycles</th>
                    <th className="py-3.5 px-4">State</th>
                    <th className="py-3.5 px-4 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredBatteries.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-gray-400 text-sm">
                        No battery records found matching "{batterySearchTerm}".
                      </td>
                    </tr>
                  ) : (
                    filteredBatteries.map((b) => {
                      const socKnown = b.soc != null;
                      const soc = socKnown ? Number(b.soc) : 0;
                      return (
                        <tr key={b.id} className="hover:bg-purple-50/20 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-purple-900">
                            {b.id}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                            {b.podNumber ? (
                              <span className="inline-flex items-center gap-1 font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                <Layers size={12} />
                                Docked in Port #{b.podNumber}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                <Users size={12} />
                                In Circulation / With Rider
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${socKnown ? getSocColor(soc) : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                              {socKnown ? `${soc.toFixed(1)}%` : "N/A"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-bold text-gray-800">
                            {b.voltage != null ? `${Number(b.voltage).toFixed(1)} V` : "N/A"}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-bold text-gray-800">
                            {b.temperature != null ? `${Number(b.temperature).toFixed(1)} °C` : "N/A"}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-gray-500 max-w-[150px] truncate" title={b.bmsId}>
                            {b.bmsId || "N/A"}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-gray-700 font-bold">
                            {b.cycleCount || 0}
                          </td>
                          <td className="py-3.5 px-4">
                            {b.status ? getPortStateBadge(b.status) : <span className="text-xs text-gray-400 font-semibold">N/A</span>}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleOpenTelemetry(b.id)}
                              className="p-1.5 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded-lg transition"
                              title="Inspect Live Telemetry"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE SWAP & PORT LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Live Port Swap Stream ({filteredSwaps.length})
              </h2>
              <p className="text-xs text-gray-500">Chronological history of port visits, inward and outward battery IDs.</p>
            </div>
            {selectedUserFilter && (
              <button
                onClick={() => setSelectedUserFilter(null)}
                className="text-xs bg-yellow-100 text-yellow-900 hover:bg-yellow-200 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5"
              >
                <span>Clear User Filter</span>
                <X size={13} />
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Event ID</th>
                    <th className="py-3.5 px-4">Rider / Customer</th>
                    <th className="py-3.5 px-4 text-center">Port / Pod #</th>
                    <th className="py-3.5 px-4">Battery Returned (In)</th>
                    <th className="py-3.5 px-4">Battery Dispensed (Out)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Timestamp (IST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredSwaps.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-400 text-sm">
                        No swap events recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredSwaps.map((s) => (
                      <tr key={s.swapId} className="hover:bg-purple-50/20 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-gray-800">
                          {s.swapId || "N/A"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900 text-xs">{s.userName || "N/A"}</div>
                          <div className="text-[11px] text-gray-500 font-mono">{s.userPhone || ""}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-900 font-black rounded-lg text-xs">
                            {s.podNumber != null ? `Pod #${s.podNumber}` : "N/A"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              {s.batteryIn || "N/A"}
                            </span>
                            {s.batteryInSoc != null && (
                              <span className="text-[11px] text-gray-500 font-semibold">({s.batteryInSoc}%)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {s.batteryOut || "N/A"}
                            </span>
                            {s.batteryOutSoc != null && (
                              <span className="text-[11px] text-emerald-600 font-semibold">({s.batteryOutSoc}%)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {s.status ? getPortStateBadge(s.status) : <span className="text-xs text-gray-400 font-semibold">N/A</span>}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-500 font-mono">
                          {formatIST(s.timestamp)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TELEMETRY MODAL FOR SELECTED BATTERY */}
      {selectedBatteryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
                  <Cpu size={22} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-purple-600 tracking-wider">
                    Battery Telemetry & Live Stream
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

            <div className="p-6 space-y-6 flex-1">
              {telemetryLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <RefreshCw size={28} className="animate-spin text-purple-600" />
                  <p className="text-sm font-medium text-gray-600">Loading battery stream...</p>
                </div>
              ) : (
                <>
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
                          {latestTelemetry.currentDraw ?? "N/A"}{latestTelemetry.currentDraw != null ? " A" : ""}
                        </p>
                      </div>

                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <span className="text-xs text-amber-600 font-medium">Temperature</span>
                        <p className="text-xl font-bold text-amber-900 mt-1">
                          {latestTelemetry.temperature ?? latestTelemetry.cellTemp ?? "N/A"}{(latestTelemetry.temperature ?? latestTelemetry.cellTemp) != null ? " °C" : ""}
                        </p>
                      </div>
                    </div>
                  )}

                  {formattedChartData.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <h4 className="text-sm font-bold text-gray-800 mb-4">
                        Live SOC % Stream History
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
