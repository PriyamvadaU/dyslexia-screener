import React, { useState } from 'react';
import { useChild } from '../context/ChildContext';
import { useAuth } from '../context/AuthContext';
import { User, Sparkles, AlertCircle, ShieldCheck, X } from 'lucide-react';
import { ConsentModal } from './ConsentModal';

export function ChildModal({ isOpen, onClose }) {
  const { createChildWithConsent } = useChild();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [age, setAge] = useState(7);
  const [grade, setGrade] = useState('2');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Consent submodal step
  const [showConsentModal, setShowConsentModal] = useState(false);

  if (!isOpen) return null;

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter child name or pseudonym.');
      return;
    }
    setError('');
    // Open mandatory consent confirmation
    setShowConsentModal(true);
  };

  const handleConfirmWithConsent = async (signatureName) => {
    try {
      setLoading(true);
      setError('');
      await createChildWithConsent({
        name: name.trim(),
        age: Number(age),
        grade: String(grade),
        notes: notes.trim()
      }, signatureName);

      setShowConsentModal(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create child profile.');
      setShowConsentModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
          
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Create Child Screening Profile</h3>
                <p className="text-xs text-indigo-100">Add a child or student to begin screening</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-white/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleInitialSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Child Name or Identifier
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Leo or Student-B2"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <p className="text-[11px] text-zinc-400 mt-1">Pseudonyms are welcome to preserve privacy.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Age (Years)
                </label>
                <input
                  type="number"
                  min="4"
                  max="16"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Grade Level
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                >
                  <option value="K">Kindergarten (K)</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6+</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Notes / Teacher Observations (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Frequently pauses on b/d letters, enjoys picture stories..."
                className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs">
                {error}
              </div>
            )}

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Continue to Parental Consent</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mandatory Consent Step */}
      <ConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConfirmConsent={handleConfirmWithConsent}
        childName={name}
      />
    </>
  );
}
