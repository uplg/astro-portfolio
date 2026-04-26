import { type JSX } from "react";
import { useState, useEffect, useRef } from "react";
import { GithubLogo } from "./icons/Icons";
import StatusIndicator from "./StatusIndicator";
import { t, getAlternatePath, type Locale } from "../i18n";

interface FooterProps {
  currentPath?: string;
  locale?: Locale;
}

const LS_THEME_KEY = "theme";

function loadTheme(): "system" | "dark" | "light" {
  try {
    const v = localStorage.getItem(LS_THEME_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {}
  return "system";
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

const Footer = ({ currentPath, locale = "en" }: FooterProps): JSX.Element => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientPath, setClientPath] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<"system" | "dark" | "light">("system");
  const footerRef = useRef<HTMLElement>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);

  const prefix = locale === "fr" ? "/fr" : "";

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

  const themeIcon = theme === "system" ? "\u25D0" : theme === "dark" ? "\u25CF" : "\u25CB";
  const themeTitle =
    theme === "system"
      ? t(locale, "theme.system")
      : theme === "dark"
        ? t(locale, "theme.dark")
        : t(locale, "theme.light");

  const otherLocale: Locale = locale === "fr" ? "en" : "fr";
  const langSwitchPath = getAlternatePath(clientPath || currentPath || "/", otherLocale);

  const langToggle = (
    <span className="lang-toggle">
      {locale === "fr" ? (
        <>
          <span className="lang-active">FR</span>
          <span className="lang-sep">&middot;</span>
          <a href={langSwitchPath} className="lang-link">
            EN
          </a>
        </>
      ) : (
        <>
          <a href={langSwitchPath} className="lang-link">
            FR
          </a>
          <span className="lang-sep">&middot;</span>
          <span className="lang-active">EN</span>
        </>
      )}
    </span>
  );

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
    setTheme(loadTheme());
  }, []);

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
              href={prefix || "/"}
              className={`footer-link ${isActive(prefix || "/") ? "active" : ""}`}
              onClick={closeMenu}
            >
              {t(locale, "nav.home")}
            </a>
            <a
              href={`${prefix}/projects`}
              className={`footer-link ${isActive(`${prefix}/projects`) ? "active" : ""}`}
              onClick={closeMenu}
            >
              {t(locale, "nav.projects")}
            </a>
            <a
              href={`${prefix}/contact`}
              className={`footer-link ${isActive(`${prefix}/contact`) ? "active" : ""}`}
              onClick={closeMenu}
            >
              {t(locale, "nav.contact")}
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
              {langToggle}
            </div>

            <StatusIndicator locale={locale} />
          </div>
        </div>

        <div className="footer-content desktop-menu">
          <a
            href={prefix || "/"}
            className={`footer-link ${isActive(prefix || "/") ? "active" : ""}`}
          >
            {t(locale, "nav.home")}
          </a>
          <a
            href={`${prefix}/projects`}
            className={`footer-link ${isActive(`${prefix}/projects`) ? "active" : ""}`}
          >
            {t(locale, "nav.projects")}
          </a>
          <a
            href={`${prefix}/contact`}
            className={`footer-link ${isActive(`${prefix}/contact`) ? "active" : ""}`}
          >
            {t(locale, "nav.contact")}
          </a>
          <a
            href="https://github.com/uplg"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            <GithubLogo />
          </a>

          <StatusIndicator locale={locale} />

          <button onClick={cycleTheme} className="footer-btn" title={themeTitle}>
            {themeIcon}
          </button>
          {langToggle}
        </div>
      </footer>
    </>
  );
};

export default Footer;
