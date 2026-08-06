import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../features/public/components/Header";
import Footer from "../features/public/components/Footer";
import Grainient from "../features/public/components/Grainient";
import "./SiteBackground.css";

// TODO: waiting on the exact approved hex values for these three —
// placeholders only, not to be treated as final. Do not ship without
// replacing them.
const GRAINIENT_COLOR_1 = "#PENDING_DARK_BLUE";
const GRAINIENT_COLOR_2 = "#PENDING_BLACK";
const GRAINIENT_COLOR_3 = "#PENDING_DEEP_BLUE";

const PublicLayout = () => {
  const { pathname } = useLocation();
  const isHomeRoute = pathname === "/";

  return (
    <div className="public-root">
      {/* Exactly one Grainient instance, used as-is — only the three
          colors are overridden, every other prop is the component's own
          default (see Grainient.jsx). Rendered here rather than inside
          HomePage so the same canvas can also sit behind <Footer/>, which
          PublicLayout renders once per page across every public route.
          Only mounted on the home route: it would be fully hidden behind
          every other page's normal opaque section backgrounds anyway. */}
      {isHomeRoute && (
        <Grainient
          className="site-background-canvas"
          color1={GRAINIENT_COLOR_1}
          color2={GRAINIENT_COLOR_2}
          color3={GRAINIENT_COLOR_3}
        />
      )}
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
};

export default PublicLayout;
