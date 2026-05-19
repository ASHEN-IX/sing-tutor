import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import UploadSongPage from './pages/UploadSongPage';
import SongProcessingPage from './pages/SongProcessingPage';
import SongPreviewPage from './pages/SongPreviewPage';
import SongLearningPage from './pages/SongLearningPage';
import SongSelectionPage from './pages/SongSelectionPage';
import RecordingPage from './pages/RecordingPage';
import ResultsPage from './pages/ResultsPage';
import './index.css';

function App() {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 20,
    mass: 0.25,
  });

  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="app-shell grain-overlay">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-[4.1rem] z-50 h-1 bg-primary/15"
        >
          <motion.div
            className="h-full origin-left bg-gradient-to-r from-primary via-fuchsia-400 to-secondary"
            style={{ scaleX: smoothProgress }}
          />
        </motion.div>
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed -left-20 top-16 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
          animate={shouldReduceMotion ? undefined : { y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed right-0 top-1/3 -z-10 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"
          animate={shouldReduceMotion ? undefined : { y: [0, 14, 0] }}
          transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
        />
        <Navbar />
        <main id="main-content" className="relative z-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/upload" element={<UploadSongPage />} />
            <Route path="/processing/:songId" element={<SongProcessingPage />} />
            <Route path="/preview/:songId" element={<SongPreviewPage />} />
            <Route path="/learning" element={<SongSelectionPage />} />
            <Route path="/learn/:songId" element={<SongLearningPage />} />
            <Route path="/songs" element={<SongSelectionPage />} />
            <Route path="/recording/:songId" element={<RecordingPage />} />
            <Route path="/results/:recordingId" element={<ResultsPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
