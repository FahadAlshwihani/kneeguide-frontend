import React from "react";
import "./HomePage.css";

import HeroProblemScene from "../sections/HeroProblemScene";
import ScrollStackFeature from "../sections/ScrollStackFeature";
import PatientDashboard from "../sections/PatientDashboard";
import AI from "../sections/AI";
import Roadmap from "../sections/Roadmap";
import FAQ from "../sections/FAQ";
import CTA from "../sections/CTA";
import { useHomeSectionScroll } from "../navigation/useSectionNavigation";

const HomePage = () => {
  useHomeSectionScroll();

  return (
    <div className="home-root">
      <HeroProblemScene />
      <ScrollStackFeature />
      <PatientDashboard />
      <AI />
      <Roadmap />
      <FAQ />
      <CTA />
    </div>
  );
};

export default HomePage;
