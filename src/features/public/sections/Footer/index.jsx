import React from "react";
import "./Footer.css";

/**
 * Landing-page closing section placeholder. Distinct from the sitewide
 * <Footer /> component in features/public/components, which is rendered
 * once per page by PublicLayout.
 */
const FooterSection = () => {
  return (
    <section className="footer-section-root">
      <div className="footer-section-container">
        <h2 className="footer-section-title">Footer Section Placeholder</h2>
      </div>
    </section>
  );
};

export default FooterSection;
