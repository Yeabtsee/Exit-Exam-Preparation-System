import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getAttempts, clearAllData } from '../utils/storage';
import { formatDate, getScoreColor, formatTime } from '../utils/helpers';
import {
  BarChart3, Clock, Trash2, ChevronRight, AlertCircle,
  TrendingUp, Target, Award
} from 'lucide-react';
import { toast } from 'sonner';

export default function HistoryPage() {
  const { stats, refreshStats } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);
  const attempts = useMemo(() => getAttempts(), [stats]);

  const handleClear = () => {
    clearAllData();
    refreshStats();
    setShowConfirm(false);
    toast.success('All data has been cleared.');
  };

  // Group attempts by exam
  const grouped = useMemo(() => {
    const map = {};
    attempts.forEach(a => {
      if (!map[a.examId]) map[a.examId] = { title: a.examTitle, attempts: [] };
      map[a.examId].attempts.push(a);
    });
    return Object.entries(map);
  }, [attempts]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Study History</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {attempts.length} total attempts
          </p>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-danger hover:bg-danger/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear All
        </button>
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="glass-card p-5 border-danger/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Clear all data?</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-3">
                This will permanently delete all attempts, bookmarks, settings, and streak data. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  className="px-4 py-1.5 rounded-lg bg-danger text-white text-xs font-medium"
                >
                  Yes, clear everything
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-1.5 rounded-lg border border-[var(--color-border)] text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Attempts', value: stats.totalAttempts, icon: BarChart3, color: '#6366f1' },
          { label: 'Accuracy', value: `${stats.accuracy}%`, icon: Target, color: getScoreColor(stats.accuracy) },
          { label: 'Correct Answers', value: stats.totalCorrect, icon: Award, color: '#10b981' },
          { label: 'Study Days', value: stats.totalStudyDays, icon: Clock, color: '#06b6d4' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center">
            <s.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: s.color }} />
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-[var(--color-text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Attempts Timeline */}
      {attempts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Clock className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)]" />
          <h3 className="font-semibold mb-1">No attempts yet</h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">Start a practice set to begin tracking your progress</p>
          <Link
            to="/exams"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium"
          >
            Browse Exams <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt, i) => {
            const pct = Math.round((attempt.score / attempt.total) * 100);
            return (
              <Link
                key={attempt.id}
                to={`/results/${attempt.id}`}
                className="glass-card p-4 flex items-center gap-4 stagger-item group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                  style={{ background: `${getScoreColor(pct)}15`, color: getScoreColor(pct) }}
                >
                  {pct}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {attempt.examTitle?.split('(')[0]?.trim() || 'Exam'}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5 flex flex-wrap items-center gap-2">
                    <span>{attempt.score}/{attempt.total} correct</span>
                    {attempt.timeElapsed && <span>· {formatTime(attempt.timeElapsed)}</span>}
                    <span>· {formatDate(attempt.date)}</span>
                  </div>
                  {attempt.missedQuestions && attempt.missedQuestions.length > 0 && (
                    <div className="text-xs text-danger/80 mt-1">
                      {attempt.missedQuestions.length} missed
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-primary-light transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
