import { type JSX } from "react";
import { t, type Locale } from "../../i18n";

interface NotFoundProps {
  locale?: Locale;
}

const NotFound = ({ locale = "en" }: NotFoundProps): JSX.Element => {
  const homeHref = locale === "fr" ? "/fr" : "/";
  return (
    <div id="page" className="page not-found" role="main">
      <section className="hero">
        <h1>{t(locale, "notfound.title")}</h1>
      </section>

      <div className="links" style={{ textAlign: "center", marginTop: "30px" }}>
        <a href={homeHref}>&larr; {t(locale, "notfound.back")}</a>
      </div>
    </div>
  );
};

export default NotFound;
