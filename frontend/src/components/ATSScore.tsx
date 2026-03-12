import React from 'react';
import { motion } from 'framer-motion';

interface ATSScoreProps {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export const ATSScore: React.FC<ATSScoreProps> = ({ score, matchedKeywords, missingKeywords }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-[0_12px_40px_-28px_rgba(16,185,129,0.7)]">
      <h2 className="mb-4 font-['Manrope'] text-2xl font-bold text-slate-800">ATS Score</h2>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Match Score</span>
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-4 rounded-full ${getProgressColor(score)}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-emerald-700 mb-2">Matched Keywords ({matchedKeywords.length})</h3>
          <div className="flex flex-wrap gap-2">
            {matchedKeywords.slice(0, 10).map((keyword, idx) => (
              <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded">
                {keyword}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-rose-700 mb-2">Missing Keywords ({missingKeywords.length})</h3>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.slice(0, 10).map((keyword, idx) => (
              <span key={idx} className="px-2 py-1 bg-rose-100 text-rose-800 text-xs rounded">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
