import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2, UserCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ConsentModal({ isOpen, onClose, onConfirmConsent, childName = '' }) {
  const { user } = useAuth();
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);
  const [agreedToDataMinimization, setAgreedToDataMinimization] = useState(false);
  const [signatureName, setSignatureName] = useState(user?.name || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreedToDisclaimer || !agreedToDataMinimization) {
      setError('Please acknowledge all consent terms and the non-medical disclaimer.');
      return;
    }
    if (!signatureName.trim()) {
      setError('Please provide your electronic signature (Guardian / Teacher Full Name).');
      return;
    }

    onConfirmConsent(signatureName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl">
              <ShieldCheck className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Informed Parental & Educator Consent</h2>
              <p className="text-xs text-indigo-100/90 mt-0.5">
                Mandatory legal & ethical screening confirmation {childName ? `for ${childName}` : ''}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Non-Medical Disclaimer Card */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Crucial Non-Medical Screening Notice</span>
            </div>
            <p className="leading-relaxed">
              LexiScreen is an educational multimodal screener designed to measure letter-reversal orientation and oral reading fluency indicators. <strong>It is NOT a medical diagnosis of Dyslexia or any neurodivergent condition.</strong>
            </p>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={agreedToDisclaimer}
                onChange={(e) => {
                  setAgreedToDisclaimer(e.target.checked);
                  setError('');
                }}
                className="mt-1 w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <strong>Preliminary Screening Acknowledgment:</strong> I understand that assessment results are preliminary educational indicators intended to guide classroom support and not a substitute for clinical psychological testing.
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={agreedToDataMinimization}
                onChange={(e) => {
                  setAgreedToDataMinimization(e.target.checked);
                  setError('');
                }}
                className="mt-1 w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <strong>Data Minimization & Privacy Protection:</strong> I authorize the recording of numeric assessment features (WPM, pause timing, accuracy %). No raw audio recordings are stored on external cloud servers.
              </span>
            </label>
          </div>

          {/* Guardian Signature Name */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Electronic Signature (Parent / Guardian / Authorized Educator)
            </label>
            <div className="relative">
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="e.g. Sarah Jenkins (Parent)"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <UserCheck className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5" />
            </div>
            <p className="text-[11px] text-zinc-500">
              Timestamp and authorization hash will be cryptographically logged to the child's screening record.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!agreedToDisclaimer || !agreedToDataMinimization || !signatureName.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Consent & Activate Screening</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
