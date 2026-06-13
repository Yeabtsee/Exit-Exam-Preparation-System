import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAttempts } from '../utils/storage';
import { CATEGORY_META } from '../data/examData';
import { getScoreColor, getScoreMessage, formatTime } from '../utils/helpers';
import { QuestionText } from '../components/QuestionText';
import {
  Trophy, Clock, Target, CheckCircle2, XCircle, ArrowLeft,
  RotateCcw, ChevronRight, BookOpen, AlertCircle, List
} from 'lucide-react';

function ScoreCircle({ percentage }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (percentage / 100) * circumference;
  const color = getScoreColor(percentage);

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-surface-light)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="52" fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-circle"
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{percentage}%</span>
        <span className="text-xs text-[var(--color-text-muted)]">Score</span>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const attempt = useMemo(() => {
    const attempts = getAttempts();
    return attempts.find(a => a.id === attemptId);
  }, [attemptId]);

  if (!attempt) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-warning" />
        <h2 className="text-xl font-bold mb-2">Result Not Found</h2>
        <Link to="/history" className="text-primary-light hover:underline text-sm">View all history →</Link>
      </div>
    );
  }

  const pct = Math.round((attempt.score / attempt.total) * 100);
  const { text: message } = getScoreMessage(pct);
  const missed = attempt.missedQuestions || [];

  // Category breakdown
  const catBreakdown = attempt.categoryBreakdown
    ? Object.entries(attempt.categoryBreakdown)
        .map(([name, data]) => ({
          name,
          correct: data.correct,
          total: data.total,
          pct: Math.round((data.correct / data.total) * 100),
        }))
        .sort((a, b) => a.pct - b.pct)
    : [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Score Card */}
      <div className="glass-card p-8 text-center">
        <div className="flex justify-center mb-4">
          <ScoreCircle percentage={pct} />
        </div>
        <h1 className="text-xl font-bold mb-1">{attempt.examTitle?.split('(')[0]?.trim()}</h1>
        <p className="text-lg mb-3">{message}</p>

        <div className="flex justify-center gap-6 text-sm text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span><b className="text-success">{attempt.score}</b> correct</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-danger" />
            <span><b className="text-danger">{attempt.total - attempt.score}</b> wrong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{formatTime(attempt.timeElapsed || 0)}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => navigate(`/exam/${attempt.examId}`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
          <button
            onClick={() => navigate('/exams')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium shadow-lg shadow-primary/25 transition-all"
          >
            <List className="w-4 h-4" /> More Exams
          </button>
        </div>
      </div>

      {/* Category Breakdown */}
      {catBreakdown.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-light" />
            Performance by Category
          </h2>
          <div className="space-y-3">
            {catBreakdown.map(cat => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{cat.name}</span>
                  <span className="text-xs font-bold" style={{ color: getScoreColor(cat.pct) }}>
                    {cat.correct}/{cat.total} ({cat.pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-surface-light)] overflow-hidden">
                  <div
                    className="h-full rounded-full progress-bar-fill"
                    style={{ width: `${cat.pct}%`, background: getScoreColor(cat.pct) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missed Questions */}
      {missed.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-danger" />
            Missed Questions ({missed.length})
          </h2>
          <div className="space-y-4">
            {missed.map((mq, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-xs font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-md shrink-0">
                    #{idx + 1}
                  </span>
                  <span
                    className="category-badge shrink-0"
                    style={{
                      color: CATEGORY_META[mq.category]?.color || '#78716c',
                      background: `${CATEGORY_META[mq.category]?.color || '#78716c'}15`,
                    }}
                  >
                    {mq.category}
                  </span>
                </div>
                <div className="text-sm mb-3 leading-relaxed"><QuestionText text={mq.question} /></div>
                {mq.selectedAnswer && (
                  <div className="flex items-start gap-2 mb-2 text-xs">
                    <XCircle className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
                    <div className="flex-1 break-words">
                      <span className="text-[var(--color-text-muted)]">Your answer: </span>
                      <span className="text-danger"><ChoiceText text={mq.selectedAnswer} /></span>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                  <div className="flex-1 break-words">
                    <span className="text-[var(--color-text-muted)]">Correct answer: </span>
                    <span className="text-success font-medium"><ChoiceText text={mq.correctAnswer} /></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
