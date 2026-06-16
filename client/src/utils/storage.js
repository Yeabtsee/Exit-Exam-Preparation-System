const KEYS = {
  ATTEMPTS: 'examprep_attempts',
  BOOKMARKS: 'examprep_bookmarks',
  SETTINGS: 'examprep_settings',
  STREAKS: 'examprep_streaks',
  DRAFTS: 'examprep_drafts',
};

function safeGet(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

// --- Attempts ---
export function getAttempts() {
  return safeGet(KEYS.ATTEMPTS, []);
}

export function saveAttempt(attempt) {
  const attempts = getAttempts();
  attempts.unshift({
    ...attempt,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: new Date().toISOString(),
  });
  // Keep only last 200 attempts
  if (attempts.length > 200) attempts.length = 200;
  safeSet(KEYS.ATTEMPTS, attempts);
  updateStreak();
  return attempts;
}

export function getAttemptsByExam(examId) {
  return getAttempts().filter(a => a.examId === examId);
}

export function getBestScore(examId) {
  const attempts = getAttemptsByExam(examId);
  if (attempts.length === 0) return null;
  return Math.max(...attempts.map(a => (a.score / a.total) * 100));
}

export function clearAllData() {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}

// --- Drafts (Ongoing Exams) ---
export function getDrafts() {
  return safeGet(KEYS.DRAFTS, {});
}

export function getDraft(examId) {
  const drafts = getDrafts();
  return drafts[examId] || null;
}

export function saveDraft(examId, draftData) {
  const drafts = getDrafts();
  drafts[examId] = {
    ...draftData,
    examId,
    savedAt: new Date().toISOString(),
  };
  safeSet(KEYS.DRAFTS, drafts);
  return drafts;
}

export function deleteDraft(examId) {
  const drafts = getDrafts();
  delete drafts[examId];
  safeSet(KEYS.DRAFTS, drafts);
  return drafts;
}

export function getAllDrafts() {
  const drafts = getDrafts();
  return Object.values(drafts).sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
}

// --- Bookmarks ---
export function getBookmarks() {
  return safeGet(KEYS.BOOKMARKS, []);
}

export function toggleBookmark(questionId) {
  const bookmarks = getBookmarks();
  const idx = bookmarks.indexOf(questionId);
  if (idx === -1) {
    bookmarks.push(questionId);
  } else {
    bookmarks.splice(idx, 1);
  }
  safeSet(KEYS.BOOKMARKS, bookmarks);
  return bookmarks;
}

export function isBookmarked(questionId) {
  return getBookmarks().includes(questionId);
}

// --- Settings ---
export function getSettings() {
  return safeGet(KEYS.SETTINGS, {
    darkMode: true,
    shuffleQuestions: false,
    showTimer: true,
    questionMode: 'all', // 'all' or 'one'
  });
}

export function updateSettings(updates) {
  const settings = { ...getSettings(), ...updates };
  safeSet(KEYS.SETTINGS, settings);
  return settings;
}

// --- Streaks ---
export function getStreaks() {
  return safeGet(KEYS.STREAKS, {
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    totalStudyDays: 0,
  });
}

function updateStreak() {
  const streaks = getStreaks();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (streaks.lastStudyDate === today) return streaks;

  if (streaks.lastStudyDate === yesterday) {
    streaks.currentStreak += 1;
  } else if (streaks.lastStudyDate !== today) {
    streaks.currentStreak = 1;
  }

  streaks.lastStudyDate = today;
  streaks.totalStudyDays += 1;
  if (streaks.currentStreak > streaks.longestStreak) {
    streaks.longestStreak = streaks.currentStreak;
  }

  safeSet(KEYS.STREAKS, streaks);
  return streaks;
}

// --- Analytics ---
export function getOverallStats() {
  const attempts = getAttempts();
  const streaks = getStreaks();

  const uniqueAttempted = new Set();
  const uniqueCorrect = new Set();

  attempts.forEach(a => {
    // New format with explicit metadata
    if (a.attemptedQuestionMetadata && a.correctQuestionMetadata) {
      a.attemptedQuestionMetadata.forEach(q => uniqueAttempted.add(q.id));
      a.correctQuestionMetadata.forEach(q => uniqueCorrect.add(q.id));
    }
    // Middle format (IDs only)
    else if (a.attemptedQuestionIds && a.correctQuestionIds) {
      a.attemptedQuestionIds.forEach(id => uniqueAttempted.add(id));
      a.correctQuestionIds.forEach(id => uniqueCorrect.add(id));
    } else {
      // Fallback for older attempts: we only know missed IDs for sure
      if (a.missedQuestions) {
        a.missedQuestions.forEach(mq => uniqueAttempted.add(mq.questionId));
      }
    }
  });

  const totalQuestions = uniqueAttempted.size;
  const totalCorrect = uniqueCorrect.size;
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return {
    totalAttempts: attempts.length,
    totalQuestions, // This is now unique count
    totalCorrect,   // This is now unique correct count
    accuracy,       // This is now unique accuracy
    ...streaks,
  };
}

export function getCategoryStats() {
  const attempts = getAttempts();
  const categoryMap = {}; // { categoryName: { attemptedSets: Set, correctSets: Set } }

  attempts.forEach(attempt => {
    // Priority: New metadata
    if (attempt.attemptedQuestionMetadata && attempt.correctQuestionMetadata) {
      attempt.attemptedQuestionMetadata.forEach(q => {
        if (!categoryMap[q.category]) categoryMap[q.category] = { attempted: new Set(), correct: new Set() };
        categoryMap[q.category].attempted.add(q.id);
      });
      attempt.correctQuestionMetadata.forEach(q => {
        if (!categoryMap[q.category]) categoryMap[q.category] = { attempted: new Set(), correct: new Set() };
        categoryMap[q.category].correct.add(q.id);
      });
    }
    // Fallback: Use missedQuestions to at least get attempted IDs for some categories
    else if (attempt.missedQuestions) {
      attempt.missedQuestions.forEach(mq => {
        if (!categoryMap[mq.category]) categoryMap[mq.category] = { attempted: new Set(), correct: new Set() };
        categoryMap[mq.category].attempted.add(mq.questionId);
      });
      // For correct ones in fallback, we lack IDs, so check categoryBreakdown for raw counts if unique not possible
    }
  });

  return Object.entries(categoryMap).map(([name, data]) => ({
    name,
    correct: data.correct.size,
    total: data.attempted.size,
    accuracy: data.attempted.size > 0 ? Math.round((data.correct.size / data.attempted.size) * 100) : 0,
  })).sort((a, b) => a.accuracy - b.accuracy);
}
