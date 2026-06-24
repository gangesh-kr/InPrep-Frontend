import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import type { RevisionItem } from '../types';
import { 
  CheckCircle, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  Calendar
} from 'lucide-react';

export const Revision: React.FC = () => {
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Study states
  const [showAnswer, setShowAnswer] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState('8');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const fetchRevisionList = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/intelligence/revision-list');
      setItems(data);
      setCurrentIndex(0);
      setSessionCompleted(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevisionList();
  }, []);

  const handleCompleteRevision = async () => {
    if (items.length === 0) return;
    const currentItem = items[currentIndex];
    setSubmitting(true);
    
    try {
      await apiRequest(`/intelligence/revision-list/${currentItem.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          confidenceLevel: confidenceScore,
          answerNotes: notes || undefined,
        }),
      });

      // Move to next item or complete session
      if (currentIndex + 1 < items.length) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
        setNotes('');
        setConfidenceScore('8');
      } else {
        setSessionCompleted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 animate-pulse font-medium">Generating revision queue...</div>
      </div>
    );
  }

  const activeItem = items[currentIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Revision Center</h1>
        <p className="text-slate-500 text-sm">Spaced repetition engine. Lower confidence questions are surfaced more frequently.</p>
      </div>

      {sessionCompleted || items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">All caught up!</h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            You have completed all scheduled revisions. New items will surface as you log more interview rounds.
          </p>
          <button
            onClick={fetchRevisionList}
            className="px-4 py-2 bg-black hover:bg-slate-900 text-white rounded text-sm font-semibold transition"
          >
            Check Again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Progress Indicator */}
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Question {currentIndex + 1} of {items.length}</span>
            <span>{items.length - currentIndex} Remaining Today</span>
          </div>

          {/* Active Question Flash Card */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            
            {/* Header info */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Category: {activeItem.question.category}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                activeItem.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {activeItem.priority} Priority
              </span>
            </div>

            {/* Content body */}
            <div className="p-8 space-y-6">
              
              {/* Question Text */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>QUESTION</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {activeItem.question.text}
                </h2>
              </div>

              {/* Skills linked */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {activeItem.question.skills?.map(s => (
                  <span key={s.id} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {s.name}
                  </span>
                ))}
              </div>

              {/* Toggle Answer */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold focus:outline-none"
                >
                  {showAnswer ? (
                    <>
                      <EyeOff className="w-4 h-4" /> Hide Reference Answer
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" /> Reveal Reference Answer
                    </>
                  )}
                </button>

                {showAnswer && (
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                    {activeItem.question.answerDraft || 'No reference answer logged yet. Add one in the notes below.'}
                  </div>
                )}
              </div>

              {/* Scoring Panel */}
              <div className="pt-6 border-t border-slate-100 space-y-4 bg-slate-50/50 p-4 rounded-lg">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">How was your recall?</h4>
                
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setConfidenceScore(String(score))}
                      className={`py-2 rounded font-semibold text-xs border transition duration-150 ${
                        confidenceScore === String(score)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase px-1">
                  <span>Struggled (1)</span>
                  <span>Perfect Recall (10)</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Update Answer Draft / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Refine explanation, add code corrections, or insert thoughts..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleCompleteRevision}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-black hover:bg-slate-900 text-white font-semibold text-sm rounded shadow transition disabled:opacity-50"
                  >
                    <span>Log Recall & Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* Spaced repetition indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
            <Calendar className="w-3.5 h-3.5" />
            <span>Perfect scores (8+) schedule next review in 7 days. Low scores schedule reviews in 2 days.</span>
          </div>

        </div>
      )}

    </div>
  );
};
