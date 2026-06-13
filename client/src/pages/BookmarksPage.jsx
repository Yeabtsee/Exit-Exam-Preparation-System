import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import examData, { CATEGORY_META } from '../data/examData';
import { Link } from 'react-router-dom';
import { QuestionText, ChoiceText } from '../components/QuestionText';
import {
  Bookmark, BookOpen, ChevronDown, ChevronUp, CheckCircle2, BookmarkX
} from 'lucide-react';

export default function BookmarksPage() {
  const { bookmarks, toggleBookmark } = useApp();
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  // Find all bookmarked questions
  const bookmarkedQuestions = useMemo(() => {
    const results = [];
    examData.forEach(exam => {
      exam.questions.forEach(q => {
        if (bookmarks.includes(q.id)) {
          results.push({ ...q, examTitle: exam.title, examId: exam.id });
        }
      });
    });
    return results;
  }, [bookmarks]);

  // Group by category
  const grouped = useMemo(() => {
    const map = {};
    bookmarkedQuestions.forEach(q => {
      if (!map[q.category]) map[q.category] = [];
      map[q.category].push(q);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [bookmarkedQuestions]);

  const toggleExpand = (qId) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-warning" />
          Saved Questions
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {bookmarkedQuestions.length} bookmarked question{bookmarkedQuestions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {bookmarkedQuestions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)]" />
          <h3 className="font-semibold mb-1">No saved questions</h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Bookmark questions during exams to review them later
          </p>
          <Link
            to="/exams"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium"
          >
            Start Practicing
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, questions]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: CATEGORY_META[category]?.color || '#78716c' }}
                />
                <h2 className="font-semibold text-sm">{category}</h2>
                <span className="text-xs text-[var(--color-text-muted)]">({questions.length})</span>
              </div>

              <div className="space-y-2.5">
                {questions.map((q) => {
                  const isExpanded = expandedQuestions.has(q.id);
                  const correctChoice = q.choices.find(c => c.isCorrect);

                  return (
                    <div key={q.id} className="glass-card p-4">
                      <div
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() => toggleExpand(q.id)}
                      >
                        <div className="flex-1">
                          <div className="text-sm leading-relaxed"><QuestionText text={q.question} /></div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-1">
                            {q.examTitle?.split('(')[0]?.trim()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleBookmark(q.id); }}
                            className="p-1.5 rounded-lg text-warning hover:bg-warning/10 transition-colors"
                          >
                            <BookmarkX className="w-4 h-4" />
                          </button>
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
                            : <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                          }
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-2">
                          {q.choices.map(choice => (
                            <div
                              key={choice.id}
                              className={`p-2.5 rounded-lg text-sm flex items-start gap-2 ${
                                choice.isCorrect
                                  ? 'bg-success/10 border border-success/20'
                                  : 'bg-[var(--color-surface)] border border-[var(--color-border)]'
                              }`}
                            >
                              {choice.isCorrect && <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />}
                              <span className="flex-1 break-words"><ChoiceText text={choice.value} /></span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
