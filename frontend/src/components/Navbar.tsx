import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar() {
  return (
    <nav className="bg-dark bg-opacity-95 backdrop-blur-md sticky top-0 z-50 border-b border-primary border-opacity-20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-primary"
        >
          <Link to="/">🎤 AI Singing Tutor</Link>
        </motion.div>
        <div className="flex gap-6">
          <Link
            to="/"
            className="text-light hover:text-primary transition-colors"
          >
            Home
          </Link>
          <Link
            to="/songs"
            className="text-light hover:text-primary transition-colors"
          >
            Songs
          </Link>
        </div>
      </div>
    </nav>
  );
}
