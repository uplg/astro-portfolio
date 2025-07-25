import { type JSX } from "react";
import { useState, useEffect, useRef } from "react";
import { GithubLogo } from "./icons/Icons";
import StatusIndicator from "./StatusIndicator";

interface FooterProps {
  currentPath?: string;
}

const Footer = ({ currentPath = "/" }: FooterProps): JSX.Element => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  const randomizeColors = () => {
    window.dispatchEvent(new CustomEvent("randomizeColors"));
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (footerRef.current && !footerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <footer className="footer" ref={footerRef}>
      <button className="burger-menu" onClick={toggleMenu} aria-label="Menu">
        <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
        <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
        <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
      </button>

      <div className={`footer-menu ${isMenuOpen ? "open" : ""}`}>
        <div className="footer-menu-content">
          <a
            href="/"
            className={`footer-link ${currentPath === "/" ? "active" : ""}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </a>
          <a
            href="/projects"
            className={`footer-link ${currentPath === "/projects" ? "active" : ""}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Projects
          </a>
          <a
            href="/contact"
            className={`footer-link ${currentPath === "/contact" ? "active" : ""}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Contact
          </a>
          <a
            href="https://github.com/uplg"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            onClick={() => setIsMenuOpen(false)}
          >
            <GithubLogo />
          </a>

          <button
            onClick={() => {
              randomizeColors();
              setIsMenuOpen(false);
            }}
            className="color-randomizer"
            title="Randomize colors"
          >
            🎨
          </button>

          <StatusIndicator />
        </div>
      </div>

      <div className="footer-content desktop-menu">
        <a href="/" className={`footer-link ${currentPath === "/" ? "active" : ""}`}>
          Home
        </a>
        <a href="/projects" className={`footer-link ${currentPath === "/projects" ? "active" : ""}`}>
          Projects
        </a>
        <a href="/contact" className={`footer-link ${currentPath === "/contact" ? "active" : ""}`}>
          Contact
        </a>
        <a
          href="https://github.com/uplg"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          <GithubLogo />
        </a>

        <button
          onClick={randomizeColors}
          className="color-randomizer"
          title="Randomize colors"
        >
          🎨
        </button>

        <StatusIndicator />
      </div>
    </footer>
  );
};

export default Footer;
