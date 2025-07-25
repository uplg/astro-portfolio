import { type JSX } from "react";

const Contact = (): JSX.Element => {
  return (
    <div id="page" className="page contact" role="main">
      <section className="hero">
        <h1>Contact.</h1>
      </section>

      <section className="areas">
        <p>
          <a href="mailto:leonard@uplg.xyz">leonard@uplg.xyz</a>
        </p>
      </section>
    </div>
  );
};

export default Contact;
