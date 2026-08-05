import React, { lazy, Suspense } from "react";
import "./HomePage.css";

import HeroProblemScene from "../sections/HeroProblemScene";
import Technology from "../sections/Technology";
import HowItWorks from "../sections/HowItWorks";
import Platform from "../sections/Platform";
import DoctorDashboard from "../sections/DoctorDashboard";
import PatientDashboard from "../sections/PatientDashboard";
import AI from "../sections/AI";
import Roadmap from "../sections/Roadmap";
import FAQ from "../sections/FAQ";
import CTA from "../sections/CTA";
import { SceneDebugProvider } from "../debug/SceneDebugContext";

const SceneDebugPanel = process.env.NODE_ENV === "development" ? lazy(() => import("../debug/SceneDebugPanel")) : null;

const HomePage = () => {
  return (
    <SceneDebugProvider>
      <div className="home-root">
        <HeroProblemScene />
        <Technology />
        <HowItWorks />
        <Platform />
        <DoctorDashboard />
        <PatientDashboard />
        <AI />
        <Roadmap />
        <FAQ />
        <CTA />
      </div>
      {SceneDebugPanel && (
        <Suspense fallback={null}>
          <SceneDebugPanel />
        </Suspense>
      )}
    </SceneDebugProvider>
  );
};

export default HomePage;
