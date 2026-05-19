import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/upload', label: 'Upload Song' },
    { to: '/songs', label: 'Songs' },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex touch-target items-center rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark ${
      isActive
        ? 'bg-primary/20 text-primary'
        : 'text-light hover:bg-primary/10 hover:text-primary'
    }`;

  return (
    <header
      aria-label="Primary"
      className="sticky top-0 z-50 border-b border-primary/20 bg-dark/85 backdrop-blur-xl"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:py-4">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
          className="text-xl font-bold text-primary sm:text-2xl"
        >
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark"
          >
            <span aria-hidden="true" className="mr-2">
              🎤
            </span>
            <span>AI Singing Tutor</span>
          </Link>
        </motion.div>

        <div className="hidden gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-light transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            {isMenuOpen ? '✕' : '☰'}
          </span>
        </button>
      </div>

      {isMenuOpen && (
        <motion.div
          id="mobile-navigation"
          initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
          className="border-t border-primary border-opacity-20 bg-dark/95 px-4 pb-4 md:hidden"
        >
          <div className="flex flex-col gap-2 pt-2">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  );
}
