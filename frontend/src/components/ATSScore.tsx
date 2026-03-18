import React from 'react';
import { motion } from 'framer-motion';

interface ATSScoreProps {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summaryText?: string;
}

function highlightKeywordsInText(text: string, matched: string[], missing: string[]): React.ReactNode[] {
  if (!text) return [];

  // Build a map of normalized keyword -> type for fast lookup
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchedSet = new Map(matched.map((k) => [normalize(k), k]));
  const missingSet = new Map(missing.map((k) => [normalize(k), k]));

  // Split text into words preserving whitespace/punctuation
  const tokens = text.split(/(\s+)/);
  return tokens.map((token, i) => {
    const norm = normalize(token);
    if (!norm) return <span key={i}>{token}</span>;
    if (matchedSet.has(norm)) {
      return (
        <mark key={i} title={`Matched: ${matchedSet.get(norm)}`}
          className="bg-emerald-200 text-emerald-900 rounded-sm px-0.5 font-medium">
          {token}
        </mark>
      );
    }
    if (missingSet.has(norm)) {
      return (
        <mark key={i} title={`Missing: ${missingSet.get(norm)}`}
          className="bg-rose-200 text-rose-900 rounded-sm px-0.5 font-medium">
          {token}
        </mark>
      );
    }
    return <span key={i}>{token}</span>;
  });
}

export const ATSScore: React.FC<ATSScoreProps> = ({ score, matchedKeywords, missingKeywords, summaryText }) => {
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

      <div className="grid grid-cols-2 gap-4 mb-4">
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

      {summaryText && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-slate-700 text-sm">Summary — Keyword Highlights</h3>
            <span className="text-xs text-slate-500">
              (<span className="text-emerald-700 font-medium">green</span> = matched,{' '}
              <span className="text-rose-700 font-medium">red</span> = missing)
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-7">
            {highlightKeywordsInText(summaryText, matchedKeywords, missingKeywords)}
          </p>
        </div>
      )}
    </div>
  );
};
