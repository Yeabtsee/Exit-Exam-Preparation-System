import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import examData, { CATEGORY_META } from "../data/examData";
import {
  saveAttempt,
  getDraft,
  saveDraft,
  deleteDraft,
} from "../utils/storage";
import { shuffleArray, formatTime } from "../utils/helpers";
import { QuestionText, ChoiceText } from "../components/QuestionText";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  BookmarkCheck,
  Clock,
  Shuffle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Send,
  RotateCcw,
  Eye,
  EyeOff,
  Filter,
  Play,
  Trash2,
} from "lucide-react";

export default function ExamPage() {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings, bookmarks, toggleBookmark, refreshStats } = useApp();
  const categoryFilter = searchParams.get("category") || "";

  const exam = useMemo(() => {
    if (examId?.startsWith("cat_")) {
      const category = decodeURIComponent(examId.replace("cat_", ""));
      const allQuestions = [];
      const seenIds = new Set();

      // Collect all unique questions for this category across all sets
      examData.forEach((set) => {
        set.questions.forEach((q) => {
          if (q.category === category && !seenIds.has(q.id)) {
            allQuestions.push(q);
            seenIds.add(q.id);
          }
        });
      });

      return {
        id: examId,
        title: `${category} Mastery`,
        questionCount: allQuestions.length,
        questions: allQuestions,
        isCategoryMastery: true,
        category: category,
      };
    }
    return examData.find((e) => e.id === examId);
  }, [examId]);

  const questions = useMemo(() => {
    if (!exam) return [];
    let qs = exam.questions.filter((q) => !q.isFlashcard);
    if (categoryFilter) {
      qs = qs.filter((q) => q.category === categoryFilter);
    }
    return settings.shuffleQuestions ? shuffleArray(qs) : qs;
  }, [exam, categoryFilter, settings.shuffleQuestions]);

  // --- Draft restoration ---
  const existingDraft = useMemo(() => {
    if (!examId) return null;
    return getDraft(examId);
  }, [examId]);

  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAllMode, setShowAllMode] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(!!existingDraft);
  const timerRef = useRef(null);
  const questionRefs = useRef({});
  const answersRef = useRef(answers);
  const timeRef = useRef(timeElapsed);
  const isSubmittedRef = useRef(isSubmitted);

  // Keep refs in sync
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    timeRef.current = timeElapsed;
  }, [timeElapsed]);
  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
  }, [isSubmitted]);

  // Load draft if user chooses to resume
  const handleResume = useCallback(() => {
    if (existingDraft) {
      setAnswers(existingDraft.answers || {});
      setTimeElapsed(existingDraft.timeElapsed || 0);
      toast.success("Draft restored! Continue where you left off.");
    }
    setShowResumePrompt(false);
    setDraftLoaded(true);
  }, [existingDraft]);

  // Start fresh (discard draft)
  const handleStartFresh = useCallback(() => {
    deleteDraft(examId);
    setAnswers({});
    setTimeElapsed(0);
    setShowResumePrompt(false);
    setDraftLoaded(true);
    toast.info("Starting fresh. Good luck!");
  }, [examId]);

  // Auto-start if no draft exists
  useEffect(() => {
    if (!existingDraft) {
      setShowResumePrompt(false);
      setDraftLoaded(true);
    }
  }, [existingDraft]);

  // Timer — only runs after draft decision is made
  useEffect(() => {
    if (!isSubmitted && draftLoaded && !showResumePrompt) {
      timerRef.current = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isSubmitted, draftLoaded, showResumePrompt]);

  // --- Auto-save draft on unmount / navigation ---
  useEffect(() => {
    const saveDraftOnExit = () => {
      // Only save if there are answers and exam hasn't been submitted
      if (
        Object.keys(answersRef.current).length > 0 &&
        !isSubmittedRef.current &&
        exam
      ) {
        saveDraft(examId, {
          answers: answersRef.current,
          timeElapsed: timeRef.current,
          examTitle: exam.title,
          totalQuestions: questions.length,
          answeredCount: Object.keys(answersRef.current).length,
          categoryFilter: categoryFilter || null,
        });
      }
    };

    // Save on beforeunload (tab close / browser close)
    window.addEventListener("beforeunload", saveDraftOnExit);

    // Save on component unmount (navigation away)
    return () => {
      window.removeEventListener("beforeunload", saveDraftOnExit);
      saveDraftOnExit();
    };
  }, [examId, exam, questions.length, categoryFilter]);

  const handleAnswer = useCallback(
    (questionId, choiceId) => {
      if (isSubmitted) return;
      setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
    },
    [isSubmitted],
  );

  const handleSubmit = useCallback(() => {
    try {
      if (Object.keys(answers).length === 0) {
        toast.warning("Please answer at least one question before submitting.");
        return;
      }

      clearInterval(timerRef.current);
      setIsSubmitted(true);

      // Delete the draft since it's now submitted
      deleteDraft(examId);

      // Calculate score
      let correct = 0;
      const missedQuestions = [];
      const categoryBreakdown = {};

      questions.forEach((q) => {
        const cat = q.category;
        if (!categoryBreakdown[cat])
          categoryBreakdown[cat] = { correct: 0, total: 0 };
        categoryBreakdown[cat].total++;

        const selectedChoiceId = answers[q.id];
        const correctChoice = q.choices.find((c) => c.isCorrect);
        const isCorrect =
          selectedChoiceId &&
          q.choices.find((c) => c.id === selectedChoiceId)?.isCorrect;

        if (isCorrect) {
          correct++;
          categoryBreakdown[cat].correct++;
        } else {
          missedQuestions.push({
            questionId: q.id,
            question: q.question,
            selectedAnswer: selectedChoiceId
              ? q.choices.find((c) => c.id === selectedChoiceId)?.value
              : null,
            correctAnswer: correctChoice?.value,
            category: q.category,
          });
        }
      });

      const attempt = {
        examId: exam.id,
        examTitle: exam.title,
        score: correct,
        total: questions.length,
        timeElapsed,
        missedQuestions,
        categoryBreakdown,
        categoryFilter: categoryFilter || null,
      };

      const attempts = saveAttempt(attempt);
      refreshStats();

      const newAttemptId = attempts[0]?.id;
      const pct = Math.round((correct / questions.length) * 100);

      if (pct >= 80) {
        toast.success(`Excellent! You scored ${pct}%! 🎉`);
      } else if (pct >= 60) {
        toast.info(`Good job! You scored ${pct}%. Keep going! 💪`);
      } else {
        toast.warning(`You scored ${pct}%. Keep practicing! 📚`);
      }

      if (newAttemptId) {
        setTimeout(() => {
          navigate(`/results/${newAttemptId}`);
        }, 1500);
      } else {
        throw new Error("Failed to retrieve new attempt ID");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        "An error occurred while submitting your exam. Please try again.",
      );
      setIsSubmitted(false); // Let them try again if it failed
    }
  }, [
    answers,
    questions,
    exam,
    timeElapsed,
    categoryFilter,
    navigate,
    refreshStats,
    examId,
  ]);

  const handleReset = useCallback(() => {
    deleteDraft(examId);
    setAnswers({});
    setIsSubmitted(false);
    setCurrentIndex(0);
    setTimeElapsed(0);
    window.scrollTo(0, 0);
  }, [examId]);

  if (!exam) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <XCircle className="w-12 h-12 mx-auto mb-3 text-danger" />
        <h2 className="text-xl font-bold mb-2">Exam Not Found</h2>
        <button
          onClick={() => navigate("/exams")}
          className="text-primary-light hover:underline text-sm"
        >
          ← Back to exam list
        </button>
      </div>
    );
  }

  // --- Resume Prompt ---
  if (showResumePrompt && existingDraft) {
    const draftPct = Math.round(
      (existingDraft.answeredCount / existingDraft.totalQuestions) * 100,
    );
    return (
      <div className="max-w-lg mx-auto mt-12 animate-fade-in">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warning/20 to-primary/10 flex items-center justify-center mx-auto mb-5">
            <Play className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-xl font-bold mb-2">You have an ongoing exam</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">
            {existingDraft.examTitle?.split("(")[0]?.trim()}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-[var(--color-text-muted)] mb-6">
            <span>
              {existingDraft.answeredCount}/{existingDraft.totalQuestions}{" "}
              answered
            </span>
            <span>·</span>
            <span>{formatTime(existingDraft.timeElapsed || 0)} elapsed</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-[var(--color-surface-light)] overflow-hidden mb-6 max-w-xs mx-auto">
            <div
              className="h-full rounded-full bg-gradient-to-r from-warning to-primary"
              style={{ width: `${draftPct}%` }}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={handleResume}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
            >
              <Play className="w-4 h-4" /> Continue Exam
            </button>
            <button
              onClick={handleStartFresh}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Start Fresh
            </button>
          </div>

          <button
            onClick={() => navigate("/exams")}
            className="mt-4 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            ← Back to exams
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progressPct = (answeredCount / questions.length) * 100;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate("/exams")}
            className="p-2 rounded-lg hover:bg-[var(--color-glass-light)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg">{exam.title}</h1>
            <div className="text-xs text-[var(--color-text-muted)] flex flex-wrap items-center gap-2">
              <span>{questions.length} questions</span>
              {categoryFilter && (
                <span
                  className="category-badge"
                  style={{
                    color: CATEGORY_META[categoryFilter]?.color,
                    background: `${CATEGORY_META[categoryFilter]?.color}15`,
                  }}
                >
                  {categoryFilter}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface)] px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(timeElapsed)}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-light)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
            {answeredCount}/{questions.length}
          </span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const selectedChoiceId = answers[q.id];
          const correctChoice = q.choices.find((c) => c.isCorrect);
          const isAnswered = !!selectedChoiceId;
          const bookmarked = bookmarks.includes(q.id);
          const isRevealed = revealedAnswers.has(q.id);
          const showFeedback = isSubmitted || isRevealed;

          return (
            <div
              key={q.id}
              ref={(el) => (questionRefs.current[q.id] = el)}
              className="glass-card p-5 stagger-item"
              id={`q-${idx}`}
            >
              {/* Question header */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-primary-light bg-primary/10 px-2 py-0.5 rounded-md">
                      Q{idx + 1}
                    </span>
                    <span
                      className="category-badge"
                      style={{
                        color: CATEGORY_META[q.category]?.color || "#78716c",
                        background: `${CATEGORY_META[q.category]?.color || "#78716c"}15`,
                      }}
                    >
                      {q.category}
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed font-medium">
                    <QuestionText text={q.question} />
                  </div>
                </div>
                <button
                  onClick={() => toggleBookmark(q.id)}
                  className={`p-1.5 rounded-lg transition-all shrink-0 ${
                    bookmarked
                      ? "text-warning bg-warning/10"
                      : "text-[var(--color-text-muted)] hover:text-warning hover:bg-warning/10"
                  }`}
                >
                  {bookmarked ? (
                    <BookmarkCheck className="w-4 h-4" />
                  ) : (
                    <BookmarkPlus className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Choices */}
              <div className="space-y-2">
                {q.choices.map((choice) => {
                  const isSelected = selectedChoiceId === choice.id;
                  let stateClass = "";

                  if (showFeedback) {
                    if (choice.isCorrect) {
                      stateClass = "choice-correct";
                    } else if (isSelected && !choice.isCorrect) {
                      stateClass = "choice-incorrect";
                    }
                  } else if (isSelected) {
                    stateClass = "choice-selected";
                  }

                  return (
                    <button
                      key={choice.id}
                      onClick={() => handleAnswer(q.id, choice.id)}
                      disabled={isSubmitted || isRevealed}
                      className={`choice-btn w-full text-left p-3 rounded-xl border border-[var(--color-border)] text-sm flex items-start gap-3 ${stateClass} ${isSubmitted || isRevealed ? "choice-disabled" : ""}`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? showFeedback
                              ? choice.isCorrect
                                ? "border-success bg-success"
                                : "border-danger bg-danger"
                              : "border-primary bg-primary"
                            : showFeedback && choice.isCorrect
                              ? "border-success"
                              : "border-[var(--color-border)]"
                        }`}
                      >
                        {showFeedback && choice.isCorrect && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        )}
                        {showFeedback && isSelected && !choice.isCorrect && (
                          <XCircle className="w-3.5 h-3.5 text-white" />
                        )}
                        {!showFeedback && isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="flex-1 break-words whitespace-normal">
                        <ChoiceText text={choice.value} />
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* View Answer button — only show before submit and when not yet revealed */}
              {!isSubmitted && !isRevealed && (
                <button
                  onClick={() =>
                    setRevealedAnswers((prev) => new Set([...prev, q.id]))
                  }
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-muted)] hover:text-accent hover:bg-accent/10 border border-[var(--color-border)] hover:border-accent/30 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" /> View Answer
                </button>
              )}

              {/* Hide Answer button — show when revealed but not submitted */}
              {!isSubmitted && isRevealed && (
                <button
                  onClick={() =>
                    setRevealedAnswers((prev) => {
                      const next = new Set(prev);
                      next.delete(q.id);
                      return next;
                    })
                  }
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent bg-accent/10 border border-accent/30 transition-all"
                >
                  <EyeOff className="w-3.5 h-3.5" /> Hide Answer
                </button>
              )}

              {/* Show correct answer feedback */}
              {showFeedback &&
                selectedChoiceId &&
                !q.choices.find((c) => c.id === selectedChoiceId)
                  ?.isCorrect && (
                  <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20 text-xs">
                    <span className="font-medium text-success">
                      Correct answer:{" "}
                    </span>
                    <span className="text-[var(--color-text-primary)]">
                      {correctChoice?.value}
                    </span>
                  </div>
                )}
              {showFeedback && !selectedChoiceId && (
                <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/20 text-xs">
                  <span className="font-medium text-warning">
                    Not answered.{" "}
                  </span>
                  <span className="text-[var(--color-text-primary)]">
                    Correct: {correctChoice?.value}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit / Reset Bar */}
      {!isSubmitted ? (
        <div className="sticky bottom-4 glass-card p-4 flex items-center justify-between gap-4 border-[var(--color-primary)]/30">
          <div className="text-sm text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-text-primary)]">
              {answeredCount}
            </span>{" "}
            of {questions.length} answered
          </div>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
          >
            <Send className="w-4 h-4" /> Submit
          </button>
        </div>
      ) : (
        <div className="sticky bottom-4 glass-card p-4 flex items-center justify-center gap-3 border-[var(--color-success)]/30">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
          <button
            onClick={() => navigate("/exams")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium shadow-lg shadow-primary/25 transition-all"
          >
            Next Exam <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
