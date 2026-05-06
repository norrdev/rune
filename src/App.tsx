import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import { Login } from './routes/Login';
import { Profile } from './routes/Profile';
import { About, Privacy, License } from './routes/StaticPages';
import { RunestoneDetail } from './routes/RunestoneDetail';

function App() {
  return (
    <Router>
      <div className="w-full h-screen overflow-y-auto overflow-x-hidden text-gray-900 bg-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/runestones/:slug" element={<RunestoneDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/license" element={<License />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
