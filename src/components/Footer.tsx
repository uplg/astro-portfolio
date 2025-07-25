import { type JSX } from "react";
import { useState } from "react";
import { GithubLogo } from "./icons/Icons";
import StatusIndicator from "./StatusIndicator";

const Footer = (): JSX.Element => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const randomizeColors = () => {
    window.dispatchEvent(new CustomEvent("randomizeColors"));
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <footer className="footer">
      {/* Menu burger pour mobile */}
      <button className="burger-menu" onClick={toggleMenu} aria-label="Menu">
        <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
        <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
        <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
      </button>

      {/* Menu expandable */}
      <div className={`footer-menu ${isMenuOpen ? "open" : ""}`}>
        <div className="footer-menu-content">
          <a
            href="/"
            className="footer-link"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </a>
          <a
            href="/projects"
            className="footer-link"
            onClick={() => setIsMenuOpen(false)}
          >
            Projects
          </a>
          <a
            href="/contact"
            className="footer-link"
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

      {/* Menu desktop (caché sur mobile) */}
      <div className="footer-content desktop-menu">
        <a href="/" className="footer-link">
          Home
        </a>
        <a href="/projects" className="footer-link">
          Projects
        </a>
        <a href="/contact" className="footer-link">
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
