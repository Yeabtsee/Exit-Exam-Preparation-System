import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import examData, { CATEGORY_META, ALL_CATEGORIES } from '../data/examData';
import { getBestScore, getAttemptsByExam, getDraft } from '../utils/storage';
import { getScoreColor } from '../utils/helpers';
import { ChevronRight, Filter, Search, BookOpen, X, Play, History } from 'lucide-react';
import * as Icons from 'lucide-react';

function DynamicIcon({ name, ...props }) {
  const Icon = Icons[name] || Icons.BookOpen;
  return <Icon {...props} />;
}

export default function ExamListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialMode = searchParams.get('mode') || 'sets';
  
  const [mode, setMode] = useState(initialMode);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  // Scroll to selected category when coming from dashboard
  useEffect(() => {
    if (mode === 'categories' && initialCategory) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`cat-${initialCategory.replace(/\s+/g, '-').toLowerCase()}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [mode, initialCategory]);

  const filteredExams = useMemo(() => {
    return examData.filter(exam => {
      const matchesCategory = !selectedCategory || exam.categories.includes(selectedCategory);
      const matchesSearch = !searchQuery ||
        exam.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const categoryExams = useMemo(() => {
    return ALL_CATEGORIES.map(cat => {
      // Calculate total unique questions for this category
      let count = 0;
      const seenIds = new Set();
      examData.forEach(set => {
        set.questions.forEach(q => {
          if (q.category === cat && !seenIds.has(q.id)) {
            count++;
            seenIds.add(q.id);
          }
        });
      });

      return {
        id: `cat_${cat}`,
        title: cat,
        questionCount: count,
        category: cat
      };
    }).filter(ce => {
      if (!searchQuery) return ce.questionCount > 0;
      return ce.title.toLowerCase().includes(searchQuery.toLowerCase()) && ce.questionCount > 0;
    }).sort((a, b) => b.questionCount - a.questionCount);
  }, [searchQuery]);

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    const params = {};
    if (cat) params.category = cat;
    if (mode !== 'sets') params.mode = mode;
    setSearchParams(params);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    const params = { mode: newMode };
    if (selectedCategory) params.category = selectedCategory;
    setSearchParams(params);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Practice Center</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {mode === 'sets' 
              ? 'Choose an exam set. Each contains questions from multiple topics.' 
              : 'Focus on a single category. These exams combine all questions for that topic.'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl self-start">
          <button
            onClick={() => handleModeChange('sets')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'sets' 
                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Exam Sets
          </button>
          <button
            onClick={() => handleModeChange('categories')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'categories' 
                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Category Mastery
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder={mode === 'sets' ? "Search exam sets..." : "Search categories..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        
        {mode === 'sets' && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <select
              value={selectedCategory}
              onChange={e => handleCategoryChange(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="">All Topics</option>
              {ALL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Exam List */}
      <div className="space-y-3">
        {mode === 'sets' ? (
          filteredExams.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)]" />
              <p className="text-[var(--color-text-muted)]">No exams match your filters</p>
            </div>
          ) : (
            filteredExams.map((exam, i) => {
              const best = getBestScore(exam.id);
              const attemptCount = getAttemptsByExam(exam.id).length;
              const draft = getDraft(exam.id);
              const catCounts = {};
              exam.questions.forEach(q => {
                if (!selectedCategory || q.category === selectedCategory) {
                  catCounts[q.category] = (catCounts[q.category] || 0) + 1;
                }
              });

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
                    <div className="font-semibold mb-1 uppercase tracking-tight text-sm opacity-60">Set {i+1}</div>
                    <div className="font-bold text-lg mb-2">{exam.title}</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {Object.keys(catCounts).slice(0, 4).map(cat => (
                        <span
                          key={cat}
                          className="category-badge"
                          style={{
                            color: CATEGORY_META[cat]?.color || '#78716c',
                            background: `${CATEGORY_META[cat]?.color || '#78716c'}15`,
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {exam.questionCount} questions</span>
                      <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
                      <span className="flex items-center gap-1"><History className="w-3 h-3" /> {attemptCount} attempts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {draft && (
                      <span className="px-2 py-1 rounded bg-warning/10 text-warning text-[10px] font-bold uppercase tracking-wider">Draft</span>
                    )}
                    {best !== null && (
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{ color: getScoreColor(best) }}>{Math.round(best)}%</div>
                        <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Best</div>
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-surface-light)] group-hover:bg-primary group-hover:text-white transition-all">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                </Link>
              );
            })
          )
        ) : (
          /* Category Mastery List */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryExams.map((ce) => {
              const best = getBestScore(ce.id);
              const attemptCount = getAttemptsByExam(ce.id).length;
              const meta = CATEGORY_META[ce.category];
              const isSelected = selectedCategory === ce.category;
              
              return (
                <Link
                  key={ce.id}
                  id={`cat-${ce.category.replace(/\s+/g, '-').toLowerCase()}`}
                  to={`/exam/${ce.id}`}
                  className={`glass-card p-6 flex flex-col gap-4 group hover:ring-2 transition-all relative overflow-hidden ${
                    isSelected ? 'ring-2' : ''
                  }`}
                  style={{ 
                    '--ring-color': meta?.color || 'var(--color-primary)',
                    borderColor: isSelected ? meta?.color : 'var(--color-border)'
                  }}
                >
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 opacity-5 translate-x-8 -translate-y-8"
                    style={{ color: meta?.color }}
                  >
                    <DynamicIcon name={meta?.icon} className="w-full h-full" />
                  </div>

                  {isSelected && (
                    <div className="absolute top-4 right-4 z-10 px-2 py-0.5 rounded-full bg-primary text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                      Selected
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: `${meta?.color}15`, color: meta?.color }}
                    >
                      <DynamicIcon name={meta?.icon} className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{ce.title}</h3>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">{meta?.description}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-sm font-bold text-[var(--color-text-primary)]">{ce.questionCount}</div>
                        <div className="text-[10px] uppercase text-[var(--color-text-muted)]">Questions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-[var(--color-text-primary)]">{attemptCount}</div>
                        <div className="text-[10px] uppercase text-[var(--color-text-muted)]">Attempts</div>
                      </div>
                    </div>
                    
                    {best !== null ? (
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{ color: getScoreColor(best) }}>{Math.round(best)}%</div>
                        <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Max Score</div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-primary-light text-xs font-bold uppercase tracking-wider">
                        Start <ChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
