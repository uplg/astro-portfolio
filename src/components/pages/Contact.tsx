import { type JSX } from "react";

const Contact = (): JSX.Element => {
  return (
    <div id="page" className="page contact" role="main">
      <section className="hero">
        <h1>Contact.</h1>
      </section>

      <section className="methods">
        <p>
          Feel free to reach out to me for any inquiries, collaborations, or
          just to say hello!
        </p>
        <p>
          <a href="mailto:leonard@uplg.xyz">Mail</a>
        </p>
        <p>
          <a
            href="https://linkedin.com/in/uplg"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </p>
      </section>
    </div>
  );
};

export default Contact;
