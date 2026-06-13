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
  const totalQuestions = attempts.reduce((s, a) => s + a.total, 0);
  const totalCorrect = attempts.reduce((s, a) => s + a.score, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const streaks = getStreaks();

  return {
    totalAttempts: attempts.length,
    totalQuestions,
    totalCorrect,
    accuracy,
    ...streaks,
  };
}

export function getCategoryStats() {
  const attempts = getAttempts();
  const categoryMap = {};

  attempts.forEach(attempt => {
    if (attempt.categoryBreakdown) {
      Object.entries(attempt.categoryBreakdown).forEach(([cat, data]) => {
        if (!categoryMap[cat]) categoryMap[cat] = { correct: 0, total: 0 };
        categoryMap[cat].correct += data.correct;
        categoryMap[cat].total += data.total;
      });
    }
  });

  return Object.entries(categoryMap).map(([name, data]) => ({
    name,
    correct: data.correct,
    total: data.total,
    accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
  })).sort((a, b) => a.accuracy - b.accuracy);
}
