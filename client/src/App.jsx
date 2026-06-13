import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import ExamListPage from './pages/ExamListPage';
import ExamPage from './pages/ExamPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import BookmarksPage from './pages/BookmarksPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/exams" element={<ExamListPage />} />
          <Route path="/exam/:examId" element={<ExamPage />} />
          <Route path="/results/:attemptId" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
        </Routes>
      </main>
    </div>
  );
}
