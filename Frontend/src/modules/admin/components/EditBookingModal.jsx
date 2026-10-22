import React, { useEffect, useState } from 'react';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { adminService } from '../services/adminService';

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time.
const toLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const buildForm = (b) => ({
  start: toLocalInput(b?.startDate),
  end: toLocalInput(b?.endDate),
  tripEndsAt: toLocalInput(b?.tripEndsAt),
  pickupLocation: b?.pickupLocation || '',
  assignedPlateNumber: b?.assignedPlateNumber || '',
  paymentMethod: b?.paymentMethod || 'ONLINE',
  depositStatus: b?.depositStatus || 'PENDING',
  totalAmount: b?.totalAmount ?? '',
  securityDeposit: b?.securityDeposit ?? '',
  lateFee: b?.lateFee ?? 0,
  notes: b?.notes || '',
});

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

/**
 * Lets an admin correct a booking's details. Status is not editable here; the
 * table's approve / pickup / return actions own the lifecycle.
 */
export default function EditBookingModal({ booking, onClose, onSaved }) {
  const [form, setForm] = useState(() => buildForm(booking));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(buildForm(booking));
    setError('');
  }, [booking]);

  if (!booking) return null;

  const hasStarted = Boolean(booking.actualPickupAt);
  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const initial = buildForm(booking);
    const payload = {};

    if (form.start !== initial.start) {
      if (!form.start) return setError('Start date & time is required');
      payload.startDate = new Date(form.start).toISOString();
      payload.startTime = form.start.slice(11, 16);
    }
    if (form.end !== initial.end) {
      if (!form.end) return setError('End date & time is required');
      payload.endDate = new Date(form.end).toISOString();
      payload.endTime = form.end.slice(11, 16);
    }
    if (form.start && form.end && new Date(form.end) <= new Date(form.start)) {
      return setError('End must be after start');
    }
    if (hasStarted && form.tripEndsAt !== initial.tripEndsAt) {
      if (!form.tripEndsAt) return setError('Return deadline is required');
      payload.tripEndsAt = new Date(form.tripEndsAt).toISOString();
    }

    ['pickupLocation', 'assignedPlateNumber', 'paymentMethod', 'depositStatus', 'notes'].forEach((f) => {
      if (form[f] !== initial[f]) payload[f] = form[f];
    });
    ['totalAmount', 'securityDeposit', 'lateFee'].forEach((f) => {
      if (String(form[f]) !== String(initial[f])) {
        const num = Number(form[f]);
        if (form[f] === '' || !Number.isFinite(num) || num < 0) {
          payload.__invalid = f;
        } else {
          payload[f] = num;
        }
      }
    });
    if (payload.__invalid) return setError(`${payload.__invalid} must be a positive number`);

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    try {
      setSaving(true);
      const updated = await adminService.updateBooking(booking._id || booking.id, payload);
      onSaved?.(updated);
      onClose();
    } catch (err) {
      const data = err.response?.data;
      const details = Array.isArray(data?.error?.details)
        ? data.error.details.map((d) => d.message || d).join(', ')
        : null;
      setError(details || data?.message || 'Failed to update booking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!booking}
      onClose={() => !saving && onClose()}
      title={`Edit Booking - ${booking.bookingId || ''}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-1">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Schedule</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start (booked pickup)</label>
              <input type="datetime-local" value={form.start} onChange={setField('start')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End (booked return)</label>
              <input type="datetime-local" value={form.end} onChange={setField('end')} className={inputCls} />
            </div>
            {hasStarted && (
              <div className="sm:col-span-2">
                <label className={labelCls}>Return deadline (live trip timer)</label>
                <input type="datetime-local" value={form.tripEndsAt} onChange={setField('tripEndsAt')} className={inputCls} />
                <p className="text-xs text-gray-500 mt-1">
                  The trip has started, so the rider's timer runs against this deadline. Changing it resets the reminder.
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Pickup & Vehicle</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Pickup location</label>
              <input value={form.pickupLocation} onChange={setField('pickupLocation')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Plate number</label>
              <input
                value={form.assignedPlateNumber}
                onChange={setField('assignedPlateNumber')}
                placeholder="e.g. MH 01 AB 1234"
                className={`${inputCls} font-mono uppercase`}
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Payment & Charges</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Payment method</label>
              <select value={form.paymentMethod} onChange={setField('paymentMethod')} className={`${inputCls} bg-white`}>
                <option value="ONLINE">Online</option>
                <option value="WALLET">Wallet</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Deposit status</label>
              <select value={form.depositStatus} onChange={setField('depositStatus')} className={`${inputCls} bg-white`}>
                <option value="PENDING">Pending</option>
                <option value="COLLECTED">Collected</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Total amount (₹)</label>
              <input type="number" min="0" step="0.01" value={form.totalAmount} onChange={setField('totalAmount')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Security deposit (₹)</label>
              <input type="number" min="0" step="0.01" value={form.securityDeposit} onChange={setField('securityDeposit')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Late fee (₹)</label>
              <input type="number" min="0" step="0.01" value={form.lateFee} onChange={setField('lateFee')} className={inputCls} />
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>Admin notes</label>
          <textarea rows={3} value={form.notes} onChange={setField('notes')} className={inputCls} />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" className="text-gray-600 bg-gray-50 border-gray-200" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 flex items-center gap-2" disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
