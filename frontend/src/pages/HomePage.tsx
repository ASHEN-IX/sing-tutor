import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-2xl"
      >
        <h1 className="text-6xl font-bold text-primary mb-4">
          🎤 AI Singing Tutor
        </h1>
        <p className="text-2xl text-light mb-8">
          Learn to sing with personalized AI feedback
        </p>
        <p className="text-light opacity-75 mb-12 text-lg">
          Perfect your pitch, improve your timing, and master your favorite songs
          with real-time AI analysis.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/songs"
            className="px-8 py-4 bg-primary text-dark font-bold rounded-lg hover:bg-secondary transition-colors text-lg"
          >
            Get Started
          </Link>
          <button className="px-8 py-4 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-dark transition-colors text-lg">
            Learn More
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <FeatureCard
            icon="🎯"
            title="Real-time Feedback"
            description="Get instant pitch and timing corrections as you sing"
          />
          <FeatureCard
            icon="📊"
            title="Detailed Analysis"
            description="See comprehensive reports of your vocal performance"
          />
          <FeatureCard
            icon="🎵"
            title="Favorite Songs"
            description="Practice with a library of songs across all genres"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-gray-800 bg-opacity-50 rounded-lg p-6 backdrop-blur-md border border-primary border-opacity-20"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-light mb-2">{title}</h3>
      <p className="text-light opacity-75">{description}</p>
    </motion.div>
  );
}
