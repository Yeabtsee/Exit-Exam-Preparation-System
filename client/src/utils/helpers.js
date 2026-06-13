export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getScoreMessage(percentage) {
  if (percentage >= 90) return { text: "Outstanding! You're crushing it! 🏆", type: 'success' };
  if (percentage >= 75) return { text: "Great job! Strong performance! 💪", type: 'success' };
  if (percentage >= 60) return { text: "Good effort! Keep practicing! 📚", type: 'warning' };
  if (percentage >= 40) return { text: "Room for improvement. You got this! 🎯", type: 'warning' };
  return { text: "Keep studying, you'll get better! 💡", type: 'error' };
}

export function getScoreColor(percentage) {
  if (percentage >= 80) return '#10b981';
  if (percentage >= 60) return '#f59e0b';
  return '#f43f5e';
}

export function getCategoryColor(category, meta) {
  return meta?.[category]?.color || '#78716c';
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
