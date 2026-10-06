import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './routes/Home';
import { Login } from './routes/Login';
import { Profile } from './routes/Profile';
import { About, Privacy, License, Changelog } from './routes/StaticPages';
import { RunestoneDetail } from './routes/RunestoneDetail';

function ScrollToTop() {
  const { pathname } = useLocation();
  // biome-ignore lint/correctness/useExhaustiveDependencies: must re-run on pathname change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden text-gray-900 bg-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/runestones/:slug" element={<RunestoneDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/license" element={<License />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
