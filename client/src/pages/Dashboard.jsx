import { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import examData, { CATEGORY_META } from '../data/examData';
import { getAttempts, getBestScore, getStreaks, getAllDrafts, deleteDraft } from '../utils/storage';
import {
  GraduationCap, Target, Flame, TrendingUp, Clock, BookOpen,
  ChevronRight, Zap, Award, ArrowRight, Play, Trash2
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { formatDate, formatTime, getScoreColor } from '../utils/helpers';

function DynamicIcon({ name, ...props }) {
  const Icon = Icons[name] || Icons.BookOpen;
  return <Icon {...props} />;
}

export default function Dashboard() {
  const { stats, refreshStats } = useApp();
  const attempts = useMemo(() => getAttempts(), [stats]);
  const streaks = useMemo(() => getStreaks(), [stats]);
  const recentAttempts = attempts.slice(0, 5);
  const [drafts, setDrafts] = useState(() => getAllDrafts());

  const handleDeleteDraft = useCallback((examId, e) => {
    e.preventDefault();
    e.stopPropagation();
    deleteDraft(examId);
    setDrafts(getAllDrafts());
  }, []);

  const totalAvailableQuestions = useMemo(
    () => examData.reduce((sum, e) => sum + e.questionCount, 0),
    []
  );

  const categoryStats = useMemo(() => {
    const cats = {};
    examData.forEach(exam => {
      exam.questions.forEach(q => {
        if (!cats[q.category]) cats[q.category] = 0;
        cats[q.category]++;
      });
    });
    return Object.entries(cats)
      .map(([name, count]) => ({ name, count, meta: CATEGORY_META[name] }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const statCards = [
    {
      label: 'Questions Attempted',
      value: stats.totalQuestions,
      icon: BookOpen,
      color: '#6366f1',
      sub: `of ${totalAvailableQuestions} total`,
    },
    {
      label: 'Accuracy',
      value: `${stats.accuracy}%`,
      icon: Target,
      color: getScoreColor(stats.accuracy),
      sub: `${stats.totalCorrect} correct`,
    },
    {
      label: 'Study Streak',
      value: `${streaks.currentStreak}`,
      icon: Flame,
      color: '#f59e0b',
      sub: `Best: ${streaks.longestStreak} days`,
    },
    {
      label: 'Exams Taken',
      value: stats.totalAttempts,
      icon: Award,
      color: '#06b6d4',
      sub: `${streaks.totalStudyDays} study days`,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-[var(--color-surface)] to-accent/10 p-8 border border-[var(--color-border)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Exit Exam Preparation</h1>
              <p className="text-[var(--color-text-secondary)] text-sm sm:text-base">
                {totalAvailableQuestions} questions · {examData.length} practice sets · {categoryStats.length} categories
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/exams"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
            >
              <Zap className="w-4 h-4" /> Start Practicing
            </Link>
            <Link
              to="/history"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-primary/50 font-medium transition-all"
            >
              <TrendingUp className="w-4 h-4" /> View Progress
            </Link>
          </div>
        </div>
      </div>

      {/* Ongoing Exams */}
      {drafts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse-soft" />
            <h2 className="text-lg font-semibold">Ongoing Exams</h2>
            <span className="text-xs text-[var(--color-text-muted)]">{drafts.length} in progress</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {drafts.map((draft) => {
              const pct = Math.round((draft.answeredCount / draft.totalQuestions) * 100);
              return (
                <Link
                  key={draft.examId}
                  to={`/exam/${draft.examId}`}
                  className="glass-card p-4 group border-warning/20 hover:border-warning/50 stagger-item"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center">
                        <Play className="w-4 h-4 text-warning" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate leading-tight">
                          {draft.examTitle?.split('(')[0]?.trim() || 'Exam'}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)]">
                          {formatDate(draft.savedAt)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteDraft(draft.examId, e)}
                      className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Discard draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-light)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-warning to-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-warning">{pct}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <span>{draft.answeredCount}/{draft.totalQuestions} answered</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(draft.timeElapsed || 0)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={card.label} className="glass-card p-5 stagger-item group">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: `${card.color}20` }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold mb-0.5">{card.value}</div>
            <div className="text-xs text-[var(--color-text-muted)]">{card.label}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1 opacity-70">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Categories Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Browse by Category</h2>
          <span className="text-xs text-[var(--color-text-muted)]">{categoryStats.length} categories</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categoryStats.map((cat, i) => (
            <Link
              key={cat.name}
              to={`/exams?mode=categories&category=${encodeURIComponent(cat.name)}`}
              className="glass-card p-4 stagger-item group cursor-pointer"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                style={{ background: `${cat.meta?.color || '#78716c'}20` }}
              >
                <DynamicIcon
                  name={cat.meta?.icon || 'BookOpen'}
                  className="w-4.5 h-4.5"
                  style={{ color: cat.meta?.color || '#78716c' }}
                />
              </div>
              <div className="font-medium text-sm mb-0.5 leading-tight">{cat.name}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{cat.count} questions</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Exam Sets + Recent Activity */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Exam Sets */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Practice Sets</h2>
            <Link to="/exams" className="text-xs text-primary-light hover:text-primary flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {examData.slice(0, 6).map((exam, i) => {
              const best = getBestScore(exam.id);
              return (
                <Link
                  key={exam.id}
                  to={`/exam/${exam.id}`}
                  className="glass-card p-4 flex items-center gap-4 stagger-item group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center text-sm font-bold text-primary-light shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{exam.title}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {exam.questionCount} questions · {exam.categories.length} categories
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {best !== null && (
                      <div className="text-xs font-medium px-2 py-1 rounded-lg" style={{ color: getScoreColor(best), background: `${getScoreColor(best)}15` }}>
                        Best: {Math.round(best)}%
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-primary-light transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {recentAttempts.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Clock className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-muted)]">No attempts yet</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Start a practice set to see your history here</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentAttempts.map((attempt, i) => {
                const pct = Math.round((attempt.score / attempt.total) * 100);
                return (
                  <div key={attempt.id} className="glass-card p-3.5 stagger-item">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium truncate mr-2" title={attempt.examTitle}>
                        {attempt.examTitle?.split('(')[0]?.trim() || 'Exam'}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">{formatDate(attempt.date)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-light)] overflow-hidden">
                        <div
                          className="h-full rounded-full progress-bar-fill transition-all"
                          style={{ width: `${pct}%`, background: getScoreColor(pct) }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: getScoreColor(pct) }}>{pct}%</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">
                      {attempt.score}/{attempt.total} correct
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
