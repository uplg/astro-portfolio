import { type JSX } from "react";
import { t, type Locale } from "../../i18n";

interface ContactProps {
  locale?: Locale;
}

const Contact = ({ locale = "en" }: ContactProps): JSX.Element => {
  return (
    <div id="page" className="page contact" role="main">
      <section className="hero">
        <h1>{t(locale, "contact.title")}</h1>
      </section>

      <section className="methods">
        <p className="contact-intro">{t(locale, "contact.intro")}</p>

        <div className="contact-links">
          <a href="mailto:leonard@uplg.xyz" className="contact-card">
            <span className="contact-label">{t(locale, "contact.email")}</span>
            <span className="contact-value">leonard@uplg.xyz</span>
          </a>

          <a
            href="https://linkedin.com/in/uplg"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card"
          >
            <span className="contact-label">{t(locale, "contact.linkedin")}</span>
            <span className="contact-value">/in/uplg</span>
          </a>

          <a
            href="https://github.com/uplg"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card"
          >
            <span className="contact-label">{t(locale, "contact.github")}</span>
            <span className="contact-value">/uplg</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default Contact;
