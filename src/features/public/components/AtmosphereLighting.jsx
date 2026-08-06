import "./AtmosphereLighting.css";

/**
 * One continuous lighting layer behind ScrollStackFeature through CTA
 * (see HomePage.jsx) — real blurred shapes composited with mix-blend-mode,
 * not CSS gradients painted to imitate light. Absolutely positioned
 * (never fixed/sticky, so it scrolls normally with the page), inert to
 * input, and stacked behind every section via a negative z-index on its
 * own positioned parent.
 */
const AtmosphereLighting = () => (
  <div className="atmosphere-lighting" aria-hidden="true">
    <div className="atmosphere-blob atmosphere-blob-a" />
    <div className="atmosphere-blob atmosphere-blob-b" />
    <div className="atmosphere-blob atmosphere-blob-c" />
    <div className="atmosphere-blob atmosphere-blob-d" />
  </div>
);

export default AtmosphereLighting;
