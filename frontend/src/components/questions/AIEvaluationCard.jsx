import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';

export const AIEvaluationCard = ({ aiEvaluation, accuracyScore }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!aiEvaluation) return null;

  const score = accuracyScore || aiEvaluation.accuracyScore || 85;

  return (
    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-4 my-3 text-slate-100 shadow-md">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Gemini AI Grade & Feedback
              </h4>
              <span className="text-[10px] font-extrabold bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                {score}% Accuracy
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {aiEvaluation.shortSummary || 'AI Automated evaluation summary'}
            </p>
          </div>
        </div>

        <button className="text-slate-400 hover:text-white">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-indigo-500/20 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Covered Concepts */}
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <h5 className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
              <CheckCircle className="w-4 h-4" /> Concept Coverage
            </h5>
            <p className="text-slate-300 leading-relaxed">
              {aiEvaluation.conceptCoverage || 'Good coverage of core logic.'}
            </p>
          </div>

          {/* Missing Points */}
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <h5 className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4" /> Recommended Additions
            </h5>
            {aiEvaluation.missingPoints && aiEvaluation.missingPoints.length > 0 ? (
              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                {aiEvaluation.missingPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-300">No major missing concepts detected!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
