import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, X, AlertCircle, Sparkles } from 'lucide-react';

interface EditWorkingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStartTime: string;
  initialEndTime: string;
  onSave: (startTime: string, endTime: string) => Promise<void>;
}

export const EditWorkingHoursModal: React.FC<EditWorkingHoursModalProps> = ({
  isOpen,
  onClose,
  initialStartTime,
  initialEndTime,
  onSave,
}) => {
  // Normalize "07:00:00" to "07:00"
  const cleanTime = (t: string, fallback: string) => {
    if (!t) return fallback;
    const parts = t.split(':');
    return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
  };

  const [startTime, setStartTime] = useState(() => cleanTime(initialStartTime, '07:00'));
  const [endTime, setEndTime] = useState(() => cleanTime(initialEndTime, '18:00'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStartTime(cleanTime(initialStartTime, '07:00'));
      setEndTime(cleanTime(initialEndTime, '18:00'));
      setError(null);
    }
  }, [isOpen, initialStartTime, initialEndTime]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      setError('Both start and end time are required.');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be later than start time.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(startTime, endTime);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update working hours.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPreset = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border-2 border-amber-300 w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-linear-to-r from-amber-700 via-amber-800 to-amber-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-200" />
            <h3 className="font-serif font-bold text-base text-amber-50">
              Configure Standard Working Hours
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white transition-colors p-1 rounded-full hover:bg-amber-800/50 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-stone-600">
            Define your daily standard availability window. This will apply automatically to all rolling calendar days unless you mark leaves or partial blackouts.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">
              Quick Working Window Presets:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('07:00', '18:00')}
                className="text-left p-2 rounded border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-xs text-stone-800 transition-colors cursor-pointer"
              >
                <div className="font-bold text-amber-950">7 AM – 6 PM</div>
                <div className="text-[10px] text-stone-500">11-hour standard window</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('07:00', '21:00')}
                className="text-left p-2 rounded border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-xs text-stone-800 transition-colors cursor-pointer"
              >
                <div className="font-bold text-amber-950">7 AM – 9 PM</div>
                <div className="text-[10px] text-stone-500">14-hour extended window</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('06:00', '18:00')}
                className="text-left p-2 rounded border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-xs text-stone-800 transition-colors cursor-pointer"
              >
                <div className="font-bold text-amber-950">6 AM – 6 PM</div>
                <div className="text-[10px] text-stone-500">Early morning dawn shift</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('08:00', '20:00')}
                className="text-left p-2 rounded border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-xs text-stone-800 transition-colors cursor-pointer"
              >
                <div className="font-bold text-amber-950">8 AM – 8 PM</div>
                <div className="text-[10px] text-stone-500">12-hour balanced window</div>
              </button>
            </div>
          </div>

          {/* Time Range Inputs */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-md focus:outline-none focus:border-amber-600 font-semibold"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-md focus:outline-none focus:border-amber-600 font-semibold"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Update Hours</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
