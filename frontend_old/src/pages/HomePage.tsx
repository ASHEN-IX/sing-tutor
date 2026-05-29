import React from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';

const featureCards = [
  {
    icon: '🎯',
    title: 'Real-time Vocal Guidance',
    description:
      'Hear where your pitch drifts and get immediate correction cues while you practice.',
  },
  {
    icon: '📈',
    title: 'Progress You Can See',
    description:
      'Track pitch stability, timing consistency, and confidence over every session.',
  },
  {
    icon: '🎧',
    title: 'Song-first Learning',
    description:
      'Practice with tracks you love, then repeat targeted sections until they feel natural.',
  },
];

const journeySteps = [
  {
    step: '01',
    title: 'Choose your song',
    description:
      'Browse your library and pick a track that fits your range and your next milestone.',
  },
  {
    step: '02',
    title: 'Train with feedback',
    description:
      'Sing line by line while AI feedback highlights timing and pitch opportunities instantly.',
  },
  {
    step: '03',
    title: 'Review and improve',
    description:
      'Use session analysis to focus practice where it matters most and progress faster.',
  },
];

const platformHighlights = [
  { label: 'Pitch points analyzed', value: '10Hz' },
  { label: 'Typical alignment window', value: '±50-200ms' },
  { label: 'Setup time to first session', value: '< 2 min' },
];

export default function HomePage() {
  const pageRef = React.useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 24,
    mass: 0.3,
  });

  const heroRotateX = useTransform(smoothProgress, [0, 0.35], [16, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.35], [0.92, 1]);
  const heroY = useTransform(smoothProgress, [0, 0.35], [40, 0]);

  const glowOneY = useTransform(smoothProgress, [0, 1], [0, -220]);
  const glowTwoY = useTransform(smoothProgress, [0, 1], [0, 180]);
  const glowThreeY = useTransform(smoothProgress, [0, 1], [0, -120]);

  const heroMotionStyle = shouldReduceMotion
    ? undefined
    : {
        rotateX: heroRotateX,
        scale: heroScale,
        y: heroY,
        transformPerspective: 1200,
      };

  return (
    <section
      ref={pageRef}
      aria-labelledby="landing-title"
      className="relative isolate overflow-x-clip px-4 pb-20 sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          aria-hidden="true"
          style={shouldReduceMotion ? undefined : { y: glowOneY }}
          className="absolute -left-24 top-20 h-[22rem] w-[22rem] rounded-full bg-primary/30 blur-3xl"
        />
        <motion.div
          aria-hidden="true"
          style={shouldReduceMotion ? undefined : { y: glowTwoY }}
          className="absolute right-0 top-[32rem] h-[24rem] w-[24rem] rounded-full bg-secondary/25 blur-3xl"
        />
        <motion.div
          aria-hidden="true"
          style={shouldReduceMotion ? undefined : { y: glowThreeY }}
          className="absolute left-1/3 top-[62rem] h-[18rem] w-[18rem] rounded-full bg-indigo-400/20 blur-3xl"
        />
      </div>

      <header className="mx-auto flex min-h-[80svh] w-full max-w-6xl items-center pt-8 sm:pt-14">
        <motion.div
          style={heroMotionStyle}
          className="w-full rounded-3xl border border-primary/35 bg-gray-900/65 p-6 shadow-[0_0_80px_rgba(139,92,246,0.22)] backdrop-blur-xl [transform-style:preserve-3d] sm:p-10 lg:p-14"
        >
          <p className="mb-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            AI-Powered Vocal Coaching
          </p>
          <h1
            id="landing-title"
            className="text-balance text-4xl font-bold leading-tight text-light sm:text-5xl lg:text-6xl"
          >
            Where every note finds its rhythm, every practice finds its purpose, and every voice finds its light.

          </h1>
          <p
            id="landing-description"
            className="mt-5 max-w-2xl text-base text-light/85 sm:text-lg lg:text-xl"
          >
            Track your vocal progress, master difficult notes, and receive personalized exercises powered by intelligent audio analysis.
          </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/songs"
                className="btn-primary"
              >
                Start Learning
              </Link>
              <a
                href="#experience-section"
                className="btn-secondary"
              >
                Explore the Experience
              </a>
            </div>
        </motion.div>
      </header>

      <section
        id="experience-section"
        aria-labelledby="experience-title"
        className="mx-auto mt-12 w-full max-w-6xl scroll-mt-32"
      >
        <h2
          id="experience-title"
          className="text-center text-3xl font-bold text-light sm:text-4xl"
        >
          Built to make practice feel immersive and focused
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-light/80">
          Scroll-driven depth effects keep attention on the learning flow while
          preserving readability and interaction clarity.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {featureCards.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="group rounded-2xl border border-primary/25 bg-gray-800/55 p-6 backdrop-blur-md transition-colors hover:border-primary/50"
            >
              <div className="text-3xl" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-light">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-light/80 sm:text-base">
                {feature.description}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="journey-title"
        className="mx-auto mt-20 w-full max-w-6xl rounded-3xl border border-primary/25 bg-gray-900/55 p-6 backdrop-blur-lg sm:p-10"
      >
        <h2 id="journey-title" className="text-2xl font-bold text-light sm:text-3xl">
          Your guided training journey
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {journeySteps.map((item, index) => (
            <motion.article
              key={item.step}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="tilt-card rounded-xl border border-primary/20 bg-dark/50 p-5"
            >
              <p className="text-sm font-semibold text-primary">{item.step}</p>
              <h3 className="mt-2 text-xl font-semibold text-light">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-light/80 sm:text-base">
                {item.description}
              </p>
            </motion.article>
          ))}
        </div>

        <div className="mt-8">
          <Link
            to="/upload"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-secondary/60 bg-secondary/10 px-6 py-3 text-base font-semibold text-light transition-colors hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-dark"
          >
            Upload a song and start now
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="highlights-title"
        className="mx-auto mt-20 w-full max-w-6xl rounded-3xl border border-primary/25 bg-gray-900/45 p-6 backdrop-blur-lg sm:p-10"
      >
        <h2 id="highlights-title" className="text-2xl font-bold text-light sm:text-3xl">
          Built for repeatable, data-driven vocal growth
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {platformHighlights.map((item, index) => (
            <motion.article
              key={item.label}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="tilt-card rounded-xl border border-primary/20 bg-dark/55 p-5"
            >
              <p className="text-sm text-light/70">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-primary">{item.value}</p>
            </motion.article>
          ))}
        </div>
        <div className="mt-8">
          <Link to="/about" className="btn-secondary">
            Learn about our approach
          </Link>
        </div>
      </section>
    </section>
  );
}
