import { type JSX } from "react";
import { useState, useEffect, useRef } from "react";
import { GithubLogo } from "./icons/Icons";
import StatusIndicator from "./StatusIndicator";

interface FooterProps {
  currentPath?: string;
}

const Footer = ({ currentPath }: FooterProps): JSX.Element => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientPath, setClientPath] = useState<string | undefined>(undefined);
  const footerRef = useRef<HTMLElement>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);

  const randomizeColors = () => {
    window.dispatchEvent(new CustomEvent("randomizeColors"));
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (checkboxRef.current) {
      checkboxRef.current.checked = !isMenuOpen;
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    if (checkboxRef.current) {
      checkboxRef.current.checked = false;
    }
  };

  const isActive = (href: string) => {
    const pathToCheck = clientPath || currentPath;
    return pathToCheck === href;
  };

  useEffect(() => {
    const updatePath = () => {
      if (typeof window !== "undefined") {
        const path =
          window.location.pathname === "/"
            ? "/"
            : window.location.pathname.replace(/\/$/, "");
        setClientPath(path);
        closeMenu();
      }
    };

    updatePath();

    document.addEventListener("astro:page-load", updatePath);

    window.addEventListener("popstate", updatePath);

    return () => {
      document.removeEventListener("astro:page-load", updatePath);
      window.removeEventListener("popstate", updatePath);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        footerRef.current &&
        !footerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.checked = isMenuOpen;
    }
  }, [isMenuOpen]);

  return (
    <>
      <input
        type="checkbox"
        id="burger-toggle"
        className="burger-toggle"
        ref={checkboxRef}
      />

      <footer className="footer" ref={footerRef}>
        <button className="burger-menu" onClick={toggleMenu} aria-label="Menu">
          <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
          <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
          <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
        </button>

        <label
          htmlFor="burger-toggle"
          className="burger-label"
          aria-label="Menu"
        >
          <span className="burger-line"></span>
          <span className="burger-line"></span>
          <span className="burger-line"></span>
        </label>

        <div className={`footer-menu ${isMenuOpen ? "open" : ""}`}>
          <div className="footer-menu-content">
            <a
              href="/"
              className={`footer-link ${isActive("/") ? "active" : ""}`}
              onClick={closeMenu}
            >
              Home
            </a>
            <a
              href="/projects"
              className={`footer-link ${isActive("/projects") ? "active" : ""}`}
              onClick={closeMenu}
            >
              Projects
            </a>
            <a
              href="/contact"
              className={`footer-link ${isActive("/contact") ? "active" : ""}`}
              onClick={closeMenu}
            >
              Contact
            </a>
            <a
              href="https://github.com/uplg"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              onClick={closeMenu}
            >
              <GithubLogo />
            </a>

            <button
              onClick={() => {
                randomizeColors();
                closeMenu();
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
          <a
            href="/"
            className={`footer-link ${isActive("/") ? "active" : ""}`}
          >
            Home
          </a>
          <a
            href="/projects"
            className={`footer-link ${isActive("/projects") ? "active" : ""}`}
          >
            Projects
          </a>
          <a
            href="/contact"
            className={`footer-link ${isActive("/contact") ? "active" : ""}`}
          >
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
    </>
  );
};

export default Footer;
