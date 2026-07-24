import React from "react";
import Hero from "../../components/public/Hero/Hero";
import Problem from "../../components/public/Sections/Problem";
import Solution from "../../components/public/Sections/Solution";
import Technology from "../../components/public/Sections/Technology";
import HowItWorks from "../../components/public/Sections/HowItWorks";
import Features from "../../components/public/Sections/Features";
import CallToAction from "../../components/public/Sections/CallToAction";

const HomePage = () => {
  return (
    <div>
      <Hero />
      <Problem />
      <Solution />
      <Technology />
      <HowItWorks />
      <Features />
      <CallToAction />
    </div>
  );
};

export default HomePage;
