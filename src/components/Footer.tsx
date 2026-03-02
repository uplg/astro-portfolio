import { type JSX } from "react";
import { useState, useEffect, useRef } from "react";
import { GithubLogo } from "./icons/Icons";
import StatusIndicator from "./StatusIndicator";

interface FooterProps {
  currentPath?: string;
}

type RendererType = "auto" | "webgpu" | "webgl2" | "canvas2d";

const RENDERER_LABELS: Record<RendererType, string> = {
  auto: "Auto",
  webgpu: "GPU",
  webgl2: "GL2",
  canvas2d: "2D",
};

const RENDERER_ORDER: RendererType[] = ["auto", "webgpu", "webgl2", "canvas2d"];

const LS_THEME_KEY = "theme";
const LS_RENDERER_KEY = "renderer";

function loadTheme(): "system" | "dark" | "light" {
  try {
    const v = localStorage.getItem(LS_THEME_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {}
  return "system";
}

function loadRenderer(): RendererType {
  try {
    const v = localStorage.getItem(LS_RENDERER_KEY);
    if (v === "webgpu" || v === "webgl2" || v === "canvas2d") return v as RendererType;
  } catch {}
  return "auto";
}

function saveTheme(t: "system" | "dark" | "light") {
  try {
    if (t === "system") {
      localStorage.removeItem(LS_THEME_KEY);
    } else {
      localStorage.setItem(LS_THEME_KEY, t);
    }
  } catch {}
}

function saveRenderer(r: RendererType) {
  try {
    if (r === "auto") {
      localStorage.removeItem(LS_RENDERER_KEY);
    } else {
      localStorage.setItem(LS_RENDERER_KEY, r);
    }
  } catch {}
}

const Footer = ({ currentPath }: FooterProps): JSX.Element => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientPath, setClientPath] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<"system" | "dark" | "light">(loadTheme);
  const [renderer, setRenderer] = useState<RendererType>(loadRenderer);
  const footerRef = useRef<HTMLElement>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);

  const cycleTheme = () => {
    const order: Array<"system" | "dark" | "light"> = ["system", "dark", "light"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    saveTheme(next);

    if (next === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      window.dispatchEvent(new CustomEvent("themeChange", { detail: { dark: isDark } }));
    } else {
      document.documentElement.setAttribute("data-theme", next);
      window.dispatchEvent(
        new CustomEvent("themeChange", {
          detail: { dark: next === "dark" },
        }),
      );
    }
  };

  const cycleRenderer = () => {
    const next = RENDERER_ORDER[(RENDERER_ORDER.indexOf(renderer) + 1) % RENDERER_ORDER.length];
    setRenderer(next);
    saveRenderer(next);
    window.dispatchEvent(new CustomEvent("forceRenderer", { detail: { renderer: next } }));
  };

  const themeIcon = theme === "system" ? "◐" : theme === "dark" ? "●" : "○";
  const themeTitle =
    theme === "system" ? "Theme: System" : theme === "dark" ? "Theme: Dark" : "Theme: Light";

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
          window.location.pathname === "/" ? "/" : window.location.pathname.replace(/\/$/, "");
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
      if (footerRef.current && !footerRef.current.contains(event.target as Node)) {
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
      <input type="checkbox" id="burger-toggle" className="burger-toggle" ref={checkboxRef} />

      <footer className="footer" ref={footerRef}>
        <button className="burger-menu" onClick={toggleMenu} aria-label="Menu">
          <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
          <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
          <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
        </button>

        <label htmlFor="burger-toggle" className="burger-label" aria-label="Menu">
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

            <div className="footer-controls">
              <button onClick={cycleTheme} className="footer-btn" title={themeTitle}>
                {themeIcon}
              </button>
              <button
                onClick={cycleRenderer}
                className="footer-btn footer-btn-debug"
                title={`Renderer: ${RENDERER_LABELS[renderer]}`}
              >
                {RENDERER_LABELS[renderer]}
              </button>
            </div>

            <StatusIndicator />
          </div>
        </div>

        <div className="footer-content desktop-menu">
          <a href="/" className={`footer-link ${isActive("/") ? "active" : ""}`}>
            Home
          </a>
          <a href="/projects" className={`footer-link ${isActive("/projects") ? "active" : ""}`}>
            Projects
          </a>
          <a href="/contact" className={`footer-link ${isActive("/contact") ? "active" : ""}`}>
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

          <StatusIndicator />

          <button onClick={cycleTheme} className="footer-btn" title={themeTitle}>
            {themeIcon}
          </button>
          <button
            onClick={cycleRenderer}
            className="footer-btn footer-btn-debug"
            title={`Renderer: ${RENDERER_LABELS[renderer]}`}
          >
            {RENDERER_LABELS[renderer]}
          </button>
        </div>
      </footer>
    </>
  );
};

export default Footer;
