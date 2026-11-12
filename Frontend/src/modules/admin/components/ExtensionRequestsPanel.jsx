import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { adminService } from "../services/adminService";

const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");

/**
 * Cash extensions do not add any time until an admin approves them, so this is
 * the only place the rider's rental actually gets extended.
 */
const ExtensionRequestsPanel = ({ onDecided }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await adminService.getExtensionRequests({ status: "PENDING" });
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load extension requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (request, approve) => {
    if (busyId) return;
    let reason;
    if (!approve) {
      reason = window.prompt("Why is this extension being declined? (optional)") ?? undefined;
    }
    try {
      setBusyId(request._id);
      setError("");
      if (approve) {
        await adminService.approveExtensionRequest(request._id);
      } else {
        await adminService.rejectExtensionRequest(request._id, reason);
      }
      await load();
      onDecided?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update the request.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="animate-spin" size={16} /> Loading extension requests...
      </div>
    );
  }

  if (!requests.length && !error) return null;

  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
        <h3 className="text-sm font-bold text-amber-900">
          Cash extension requests awaiting approval ({requests.length})
        </h3>
        <p className="text-xs text-amber-800 mt-0.5">
          The rider&apos;s time is only added once you approve.
        </p>
      </div>

      {error && <p className="px-4 py-2 text-xs text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-gray-800 text-xs text-white">
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Current deadline</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3 text-center">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((r) => (
              <tr key={r._id} className="hover:bg-amber-50/40">
                <td className="px-4 py-3 font-mono font-bold text-gray-900">
                  {r.booking?.bookingId || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{r.user?.fullName || "Unknown"}</div>
                  <div className="text-xs text-gray-500">{r.user?.phone || ""}</div>
                </td>
                <td className="px-4 py-3">
                  {r.planName || r.planId}
                  <span className="text-xs text-gray-500"> (+{r.durationDays}d)</span>
                </td>
                <td className="px-4 py-3 font-semibold">₹{r.amount}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {fmt(r.booking?.tripEndsAt || r.booking?.endDate)}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{fmt(r.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => decide(r, true)}
                      disabled={busyId === r._id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busyId === r._id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                      Approve
                    </button>
                    <button
                      onClick={() => decide(r, false)}
                      disabled={busyId === r._id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-red-300 text-red-600 text-xs font-bold hover:bg-red-50 disabled:opacity-50"
                    >
                      <X size={14} />
                      Decline
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExtensionRequestsPanel;
