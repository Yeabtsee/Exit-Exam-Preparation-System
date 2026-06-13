import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import examData, { CATEGORY_META, ALL_CATEGORIES } from '../data/examData';
import { getBestScore, getAttemptsByExam, getDraft } from '../utils/storage';
import { getScoreColor } from '../utils/helpers';
import { ChevronRight, Filter, Search, BookOpen, X, Play } from 'lucide-react';
import * as Icons from 'lucide-react';

function DynamicIcon({ name, ...props }) {
  const Icon = Icons[name] || Icons.BookOpen;
  return <Icon {...props} />;
}

export default function ExamListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExams = useMemo(() => {
    return examData.filter(exam => {
      const matchesCategory = !selectedCategory || exam.categories.includes(selectedCategory);
      const matchesSearch = !searchQuery ||
        exam.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    if (cat) {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Practice Sets</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Choose an exam set to begin practicing. Each set contains questions from multiple categories.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <select
            value={selectedCategory}
            onChange={e => handleCategoryChange(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter */}
      {selectedCategory && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Filtered by:</span>
          <button
            onClick={() => handleCategoryChange('')}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border"
            style={{
              borderColor: CATEGORY_META[selectedCategory]?.color || '#78716c',
              color: CATEGORY_META[selectedCategory]?.color || '#78716c',
              background: `${CATEGORY_META[selectedCategory]?.color || '#78716c'}15`,
            }}
          >
            {selectedCategory}
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Exam List */}
      <div className="space-y-3">
        {filteredExams.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)]" />
            <p className="text-[var(--color-text-muted)]">No exams match your filters</p>
          </div>
        ) : (
          filteredExams.map((exam, i) => {
            const best = getBestScore(exam.id);
            const attemptCount = getAttemptsByExam(exam.id).length;
            const draft = getDraft(exam.id);
            // Count questions per category
            const catCounts = {};
            exam.questions.forEach(q => {
              if (!selectedCategory || q.category === selectedCategory) {
                catCounts[q.category] = (catCounts[q.category] || 0) + 1;
              }
            });
            const filteredCount = selectedCategory
              ? (catCounts[selectedCategory] || 0)
              : exam.questionCount;

            return (
              <Link
                key={exam.id}
                to={`/exam/${exam.id}${selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : ''}`}
                className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 stagger-item group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center text-lg font-bold text-primary-light shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1">{exam.title}</div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {Object.entries(catCounts).slice(0, 5).map(([cat, count]) => (
                      <span
                        key={cat}
                        className="category-badge"
                        style={{
                          color: CATEGORY_META[cat]?.color || '#78716c',
                          background: `${CATEGORY_META[cat]?.color || '#78716c'}15`,
                        }}
                      >
                        {cat} ({count})
                      </span>
                    ))}
                    {Object.keys(catCounts).length > 5 && (
                      <span className="category-badge text-[var(--color-text-muted)] bg-[var(--color-surface-light)]">
                        +{Object.keys(catCounts).length - 5} more
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {filteredCount} questions · {attemptCount} attempt{attemptCount !== 1 ? 's' : ''}
                    {exam.questions.some(q => q.isFlashcard) && ' · Includes flashcards'}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {draft && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning/15 text-warning text-xs font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse-soft" />
                      Resume
                    </div>
                  )}
                  {best !== null && (
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: getScoreColor(best) }}>
                        {Math.round(best)}%
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">Best</div>
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-primary-light transition-colors" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
