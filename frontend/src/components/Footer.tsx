import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-primary/20 bg-dark/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-soft sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} AI Singing Tutor</p>
        <nav aria-label="Footer links" className="flex flex-wrap gap-2">
          <Link to="/" className="touch-target inline-flex items-center rounded-md px-3 hover:text-primary">
            Home
          </Link>
          <Link
            to="/about"
            className="touch-target inline-flex items-center rounded-md px-3 hover:text-primary"
          >
            About
          </Link>
          <Link
            to="/songs"
            className="touch-target inline-flex items-center rounded-md px-3 hover:text-primary"
          >
            Song Library
          </Link>
        </nav>
      </div>
    </footer>
  );
}
