import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../features/public/components/Header";
import Footer from "../features/public/components/Footer";
import Grainient from "../features/public/components/Grainient";
import "./SiteAtmosphere.css";

// Deep base -> mid accent -> soft highlight, using only the already
// approved palette (see ScrollStackFeature.css history) — no new hues.
const ATMOSPHERE_COLOR_DARK = "#040404";
const ATMOSPHERE_COLOR_MID = "#171A52";
const ATMOSPHERE_COLOR_LIGHT = "#2E3E8F";

const PublicLayout = () => {
  const { pathname } = useLocation();
  const isHomeRoute = pathname === "/";

  return (
    <div className="public-root">
      {/* Exactly one Grainient instance for the whole layout — see
          SiteAtmosphere.css. Only mounted on the home route: it would be
          fully invisible elsewhere anyway (every other page keeps opaque
          section backgrounds), so skipping the mount there avoids running
          a WebGL render loop no one will ever see. */}
      {isHomeRoute && (
        <Grainient
          className="site-atmosphere-canvas"
          color1={ATMOSPHERE_COLOR_LIGHT}
          color2={ATMOSPHERE_COLOR_MID}
          color3={ATMOSPHERE_COLOR_DARK}
          timeSpeed={0.02}
          colorBalance={-0.35}
          warpStrength={0.6}
          warpFrequency={1.8}
          warpSpeed={0.2}
          warpAmplitude={90}
          blendAngle={20}
          blendSoftness={0.45}
          rotationAmount={60}
          noiseScale={1}
          grainAmount={0.035}
          grainScale={1.5}
          grainAnimated={false}
          contrast={2}
          gamma={0.88}
          saturation={0.8}
          centerX={0}
          centerY={0}
          zoom={3.2}
        />
      )}
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
};

export default PublicLayout;
