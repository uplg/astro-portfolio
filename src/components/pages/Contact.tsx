import { type JSX } from "react";

const Contact = (): JSX.Element => {
  return (
    <div id="page" className="page contact" role="main">
      <section className="hero">
        <h1>Contact.</h1>
      </section>

      <section className="methods">
        <p className="contact-intro">
          Open to inquiries, collaborations, and conversations.
        </p>

        <div className="contact-links">
          <a href="mailto:leonard@uplg.xyz" className="contact-card">
            <span className="contact-label">Email</span>
            <span className="contact-value">leonard@uplg.xyz</span>
          </a>

          <a
            href="https://linkedin.com/in/uplg"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card"
          >
            <span className="contact-label">LinkedIn</span>
            <span className="contact-value">/in/uplg</span>
          </a>

          <a
            href="https://github.com/uplg"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card"
          >
            <span className="contact-label">GitHub</span>
            <span className="contact-value">/uplg</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default Contact;
