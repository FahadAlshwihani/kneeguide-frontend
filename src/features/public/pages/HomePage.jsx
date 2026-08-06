import React from "react";
import "./HomePage.css";

import HeroProblemScene from "../sections/HeroProblemScene";
import ScrollStackFeature from "../sections/ScrollStackFeature";
import PatientDashboard from "../sections/PatientDashboard";
import AI from "../sections/AI";
import Roadmap from "../sections/Roadmap";
import FAQ from "../sections/FAQ";
import CTA from "../sections/CTA";
import AtmosphereLighting from "../components/AtmosphereLighting";

const HomePage = () => {
  return (
    <div className="home-root">
      <HeroProblemScene />
      {/* One shared lighting layer behind all six of these sections
          instead of each painting its own background — see
          AtmosphereLighting.jsx. Plain normal-flow wrapper with no
          explicit height, so it's always exactly these sections'
          combined real height. */}
      <div className="atmosphere-wrapper">
        <AtmosphereLighting />
        <ScrollStackFeature />
        <PatientDashboard />
        <AI />
        <Roadmap />
        <FAQ />
        <CTA />
      </div>
    </div>
  );
};

export default HomePage;
