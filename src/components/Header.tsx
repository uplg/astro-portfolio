import { type JSX } from "react";
import { type Locale } from "../i18n";

interface HeaderProps {
  locale?: Locale;
}

const Header = ({ locale = "en" }: HeaderProps): JSX.Element => {
  const prefix = locale === "fr" ? "/fr" : "";

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">
          <a href={prefix || "/"}>// Uplg.</a>
        </h1>
      </div>
    </header>
  );
};

export default Header;
