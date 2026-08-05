import React from "react";
import ScrollStack, { ScrollStackItem } from "../../components/ScrollStack";
import Technology from "../Technology";
import HowItWorks from "../HowItWorks";
import Platform from "../Platform";
import DoctorDashboard from "../DoctorDashboard";
import "./ScrollStackFeature.css";

/**
 * Presentation-only wrapper: takes the next four existing sections
 * (Technology, HowItWorks, Platform, DoctorDashboard) and presents them as
 * a premium scroll-stack instead of four stacked full-viewport sections.
 * None of the four section components themselves are modified — each one
 * still renders its own real content/layout unchanged; only how it *sits
 * on the page* changes, via ScrollStackFeature.css neutralizing each
 * section's own full-viewport root styling once it's nested inside a card
 * (see that file's own comments) and giving the card itself the elevated,
 * glass-like treatment.
 */
const ScrollStackFeature = () => (
  <section className="scroll-stack-feature">
    <ScrollStack
      useWindowScroll
      itemDistance={120}
      itemStackDistance={40}
      itemScale={0.025}
      baseScale={0.9}
      rotationAmount={0}
      blurAmount={0}
      stackPosition="18%"
      scaleEndPosition="8%"
      className="scroll-stack-feature-scroller"
    >
      <ScrollStackItem itemClassName="scroll-stack-feature-card">
        <Technology />
      </ScrollStackItem>
      <ScrollStackItem itemClassName="scroll-stack-feature-card">
        <HowItWorks />
      </ScrollStackItem>
      <ScrollStackItem itemClassName="scroll-stack-feature-card">
        <Platform />
      </ScrollStackItem>
      <ScrollStackItem itemClassName="scroll-stack-feature-card scroll-stack-feature-card-last">
        <DoctorDashboard />
      </ScrollStackItem>
    </ScrollStack>
  </section>
);

export default ScrollStackFeature;
