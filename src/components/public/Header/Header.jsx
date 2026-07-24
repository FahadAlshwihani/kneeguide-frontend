import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../utils/routes";

const Header = () => {
  return (
    <header>
      <nav>
        <Link to="/">Logo</Link>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/technology">Technology</Link>
        <Link to="/features">Features</Link>
        <Link to="/how-it-works">How It Works</Link>
        <Link to="/contact">Contact</Link>
        <Link to={ROUTES.LOGIN}>Login</Link>
      </nav>
    </header>
  );
};

export default Header;
