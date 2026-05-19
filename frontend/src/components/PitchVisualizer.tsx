import { motion } from 'framer-motion';

interface PitchVisualizerProps {
  currentFrequency: number;
  targetFrequency: number;
  confidence: number;
}

export default function PitchVisualizer({
  currentFrequency,
  targetFrequency,
  confidence,
}: PitchVisualizerProps) {
  const deviation = ((currentFrequency - targetFrequency) / targetFrequency) * 100;
  const accuracy = Math.max(0, 100 - Math.abs(deviation));

  return (
    <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 backdrop-blur-md">
      <div className="text-center mb-4">
        <p className="text-light text-sm opacity-75">Current Frequency</p>
        <p className="text-3xl font-bold text-primary">
          {currentFrequency.toFixed(1)} Hz
        </p>
      </div>

      {/* Frequency bars */}
      <div className="flex items-end justify-center gap-1 mb-6 h-24">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-2 bg-gradient-to-t from-secondary to-primary rounded-sm"
            initial={{ height: '20%' }}
            animate={{
              height: `${20 + Math.sin(Date.now() / 100 + i) * 30}%`,
            }}
            transition={{ duration: 0.1 }}
          />
        ))}
      </div>

      {/* Accuracy meter */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-light opacity-75 mb-2">
          <span>Accuracy</span>
          <span className="font-bold text-primary">{accuracy.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            animate={{ width: `${accuracy}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Confidence indicator */}
      <div className="text-sm text-light opacity-75">
        Confidence: <span className="text-primary font-bold">{(confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
