import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

const principles = [
  {
    title: 'Accurate pitch feedback',
    copy: 'We map your vocal pitch against song references so practice feels specific and measurable.',
  },
  {
    title: 'Progressive learning flow',
    copy: 'Upload, process, preview, learn, record, and review in one clear sequence.',
  },
  {
    title: 'Accessible by default',
    copy: 'Keyboard-first navigation, clear focus states, and readable responsive layouts.',
  },
];

export default function AboutPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="about-title" className="page-container">
      <div className="surface-card p-6 sm:p-10">
        <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          About the project
        </p>
        <h1 id="about-title" className="mt-4 text-4xl font-bold text-light sm:text-5xl">
          Human-centered AI coaching for better singing practice
        </h1>
        <p className="mt-5 max-w-3xl text-soft sm:text-lg">
          AI Singing Tutor combines audio analysis and guided UI experiences so learners can improve
          pitch, timing, and confidence with each session.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {principles.map((item, index) => (
            <motion.article
              key={item.title}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="tilt-card surface-card p-5"
            >
              <h2 className="text-lg font-semibold text-light">{item.title}</h2>
              <p className="mt-2 text-sm text-soft sm:text-base">{item.copy}</p>
            </motion.article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/upload" className="btn-primary">
            Upload a song
          </Link>
          <Link to="/songs" className="btn-secondary">
            Browse song library
          </Link>
        </div>
      </div>
    </section>
  );
}
