import { type JSX } from "react";
import { Chevron } from "../icons/Icons";

const Home = (): JSX.Element => {
  return (
    <div id="page" className="page home" role="main">
      <section className="hero">
        <h1>
          Passionately building and creating, bringing the future to the
          present.
        </h1>
      </section>

      <section className="areas">
        <section className="service">
          <h2>Development</h2>
          <p>
            We utilise insights and expertise gained from managing multiple
            successful projects.
          </p>
          <ul>
            <li>Custom solutions using state of the art technologies</li>
            <li>Decentralization (DLT)</li>
            <li>Tracking solutions</li>
            <li>OpenID</li>
            <li>IoT</li>
          </ul>
          <a href="/projects">
            Projects <Chevron />
          </a>
        </section>

        <section className="service">
          <h2>Networking</h2>
          <p>
            We have enabled the growth of large successful communities,
            deploying infrastructure at scale.
          </p>
          <ul>
            <li>On-premise private networks</li>
            <li>Self-sovereign identities</li>
            <li>Offshore hosting</li>
            <li>Monitoring</li>
            <li>Security</li>
          </ul>
        </section>
      </section>
    </div>
  );
};

export default Home;
