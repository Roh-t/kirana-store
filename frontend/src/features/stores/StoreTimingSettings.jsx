import React, { useEffect, useState } from 'react';
import { Clock, Save, Users, Store as StoreIcon, Power } from 'lucide-react';
import { storeService } from '../../services/storeService';

export const StoreTimingSettings = ({ store, onStoreUpdated }) => {
  const [formData, setFormData] = useState({
    preparationMinutes: 10,
    bufferMinutes: 0,
    workerCount: 1,
    isAcceptingOrders: true,
    weeklySchedule: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setFormData({
      preparationMinutes: store?.businessConfig?.preparationMinutes || 10,
      bufferMinutes: store?.businessConfig?.bufferMinutes || 0,
      workerCount: store?.businessConfig?.workerCount || 1
      ,isAcceptingOrders: store?.businessConfig?.isAcceptingOrders ?? true
      ,weeklySchedule: store?.businessConfig?.weeklySchedule || Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, isOpen: true, openTime: '09:00', closeTime: '21:00' }))
    });
  }, [store]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await storeService.updateStore(store._id, {
        businessConfig: {
          preparationMinutes: Number(formData.preparationMinutes),
          bufferMinutes: Number(formData.bufferMinutes),
          workerCount: Number(formData.workerCount)
          ,isAcceptingOrders: formData.isAcceptingOrders
          ,weeklySchedule: formData.weeklySchedule
        }
      });
      onStoreUpdated(res.data);
      setMessage({ type: 'success', text: 'Order timing saved.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save order timing.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    const isAcceptingOrders = !formData.isAcceptingOrders;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await storeService.updateStore(store._id, { businessConfig: { isAcceptingOrders } });
      setFormData({ ...formData, isAcceptingOrders });
      onStoreUpdated(res.data);
      setMessage({ type: 'success', text: isAcceptingOrders ? 'Shop opened.' : 'Shop closed. Customers can still order.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to change shop status.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-5 shadow-2xs">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-3">
        <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-gray-900">Order Timing</h3>
          <p className="text-[11px] text-gray-500">Customer completion estimates</p>
        </div>
      </div>

      <div className={`mb-4 rounded-xl border p-3 flex items-center justify-between gap-3 ${formData.isAcceptingOrders ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-2">
          <StoreIcon className={`w-4 h-4 ${formData.isAcceptingOrders ? 'text-green-700' : 'text-amber-700'}`} />
          <div>
            <p className="text-xs font-extrabold text-gray-900">{formData.isAcceptingOrders ? 'Shop is open' : 'Shop is closed'}</p>
            <p className="text-[11px] text-gray-600">Customers can still place orders while closed.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAvailabilityToggle}
          disabled={submitting}
          className={`px-3 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 ${formData.isAcceptingOrders ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          <Power className="w-3.5 h-3.5" />
          {formData.isAcceptingOrders ? 'Close Shop' : 'Open Shop'}
        </button>
      </div>

      {message && (
        <div className={`mb-3 p-2.5 rounded-xl text-xs font-semibold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="text-xs font-semibold text-gray-700">
            Preparation per customer (minutes)
            <input
              type="number"
              min="1"
              step="1"
              required
              value={formData.preparationMinutes}
              onChange={(event) => setFormData({ ...formData, preparationMinutes: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
            />
          </label>
          <label className="text-xs font-semibold text-gray-700">
            Buffer per customer (minutes)
            <input
              type="number"
              min="0"
              step="1"
              required
              value={formData.bufferMinutes}
              onChange={(event) => setFormData({ ...formData, bufferMinutes: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
            />
          </label>
          <label className="text-xs font-semibold text-gray-700">
            Workers handling orders
            <input
              type="number"
              min="1"
              step="1"
              required
              value={formData.workerCount}
              onChange={(event) => setFormData({ ...formData, workerCount: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
            />
          </label>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-extrabold text-gray-800 mb-2">Weekly shop hours</p>
          <div className="space-y-1.5">
            {formData.weeklySchedule.map((day) => {
              const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.dayOfWeek];
              return (
                <div key={day.dayOfWeek} className="grid grid-cols-[5.5rem_3.5rem_1fr_1fr] items-center gap-2 text-xs">
                  <span className="font-semibold text-gray-700">{dayName}</span>
                  <input type="checkbox" checked={day.isOpen} onChange={(event) => setFormData({ ...formData, weeklySchedule: formData.weeklySchedule.map((item) => item.dayOfWeek === day.dayOfWeek ? { ...item, isOpen: event.target.checked } : item) })} />
                  <input type="time" disabled={!day.isOpen} value={day.openTime} onChange={(event) => setFormData({ ...formData, weeklySchedule: formData.weeklySchedule.map((item) => item.dayOfWeek === day.dayOfWeek ? { ...item, openTime: event.target.value } : item) })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg disabled:bg-gray-100" />
                  <input type="time" disabled={!day.isOpen} value={day.closeTime} onChange={(event) => setFormData({ ...formData, weeklySchedule: formData.weeklySchedule.map((item) => item.dayOfWeek === day.dayOfWeek ? { ...item, closeTime: event.target.value } : item) })} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg disabled:bg-gray-100" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Estimates use the current pending queue.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {submitting ? 'Saving...' : 'Save Timing'}
          </button>
        </div>
      </form>
    </section>
  );
};
