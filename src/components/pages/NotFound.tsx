import { type JSX } from "react";

const NotFound = (): JSX.Element => {
  return (
    <div id="page" className="page not-found" role="main">
      <section className="hero">
        <h1>404 - Page Not Found</h1>
      </section>

      <div className="links" style={{ textAlign: "center", marginTop: "30px" }}>
        <a href="/">← Back to Home</a>
      </div>
    </div>
  );
};

export default NotFound;
