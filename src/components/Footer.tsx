import { type JSX } from "react";
import { GithubLogo } from "./icons/Icons";

const Footer = (): JSX.Element => {
  const randomizeColors = () => {
    // Trigger a custom event to randomize colors in BackgroundCanvas
    window.dispatchEvent(new CustomEvent("randomizeColors"));
  };

  return (
    <footer className="footer">
      <div className="footer-content">
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
          href="https://status.uplg.xyz/status/uplg"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          Status
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
      </div>
    </footer>
  );
};

export default Footer;
