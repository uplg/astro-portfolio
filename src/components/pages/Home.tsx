import { type JSX } from "react";
import { Chevron } from "../icons/Icons";
import { t, type Locale } from "../../i18n";

interface HomeProps {
  locale?: Locale;
}

const Home = ({ locale = "en" }: HomeProps): JSX.Element => {
  return (
    <div id="page" className="page home" role="main">
      <section className="hero">
        <h1>{t(locale, "home.hero")}</h1>
      </section>

      <section className="areas">
        <section className="service">
          <h2>{t(locale, "home.dev.title")}</h2>
          <p>{t(locale, "home.dev.desc")}</p>
          <ul>
            <li>{t(locale, "home.dev.item1")}</li>
            <li>{t(locale, "home.dev.item2")}</li>
            <li>{t(locale, "home.dev.item3")}</li>
            <li>{t(locale, "home.dev.item4")}</li>
            <li>{t(locale, "home.dev.item5")}</li>
          </ul>
          <a href={locale === "fr" ? "/fr/projects" : "/projects"}>
            {t(locale, "home.dev.projects")} <Chevron />
          </a>
        </section>

        <section className="service">
          <h2>{t(locale, "home.net.title")}</h2>
          <p>{t(locale, "home.net.desc")}</p>
          <ul>
            <li>{t(locale, "home.net.item1")}</li>
            <li>{t(locale, "home.net.item2")}</li>
            <li>{t(locale, "home.net.item3")}</li>
            <li>{t(locale, "home.net.item4")}</li>
            <li>{t(locale, "home.net.item5")}</li>
          </ul>
        </section>
      </section>
    </div>
  );
};

export default Home;
