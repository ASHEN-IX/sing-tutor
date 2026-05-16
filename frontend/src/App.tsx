import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SongSelectionPage from './pages/SongSelectionPage';
import RecordingPage from './pages/RecordingPage';
import ResultsPage from './pages/ResultsPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-dark to-gray-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/songs" element={<SongSelectionPage />} />
          <Route path="/recording/:songId" element={<RecordingPage />} />
          <Route path="/results/:recordingId" element={<ResultsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
