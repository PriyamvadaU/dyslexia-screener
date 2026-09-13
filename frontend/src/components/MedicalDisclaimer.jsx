import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export function MedicalDisclaimer({ compact = false, className = '' }) {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs ${className}`}>
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="leading-snug">
          <strong>Non-Medical Screener:</strong> This is a preliminary screening indicator, not a medical diagnosis.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300/80 shadow-sm text-amber-950 ${className}`} role="alert">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 font-bold text-amber-900 tracking-wide uppercase text-xs">
            <span>Official Non-Diagnostic Notice</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Ethical Screening Standard</span>
          </div>
          <p className="font-semibold text-amber-900">
            This tool provides a preliminary behavioral screening indicator, NOT a medical or clinical diagnosis.
          </p>
          <p className="text-amber-800/90 text-xs leading-relaxed">
            Screening metrics identify early developmental risk patterns and literacy friction. If indicators persist, please consult a certified educational psychologist, reading specialist, or speech-language pathologist for a formal multidisciplinary evaluation.
          </p>
        </div>
      </div>
    </div>
  );
}
