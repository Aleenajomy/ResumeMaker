import React from 'react';
import { motion } from 'framer-motion';

interface ATSScoreProps {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export const ATSScore: React.FC<ATSScoreProps> = ({ score, matchedKeywords, missingKeywords }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">ATS Score</h2>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Match Score</span>
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
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
          <h3 className="font-semibold text-green-700 mb-2">Matched Keywords ({matchedKeywords.length})</h3>
          <div className="flex flex-wrap gap-2">
            {matchedKeywords.slice(0, 10).map((keyword, idx) => (
              <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                {keyword}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-red-700 mb-2">Missing Keywords ({missingKeywords.length})</h3>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.slice(0, 10).map((keyword, idx) => (
              <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
