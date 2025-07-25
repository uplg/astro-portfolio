import { type JSX } from "react";

const Header = (): JSX.Element => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">
          <a href="/">// Uplg.</a>
        </h1>
      </div>
    </header>
  );
};

export default Header;
