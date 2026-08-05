import { useState, useEffect } from "react";
import DesktopStack from "./DesktopStack";
import MobileStack from "./MobileStack";
import "./ScrollStack.css";

export { ScrollStackItem } from "./StackCard";

const DESKTOP_QUERY = "(min-width: 1024px)";

// Two independent scrolling engines (see DesktopStack.jsx / MobileStack.jsx)
// share this single breakpoint switch. Only the matching engine is ever
// mounted — the other's effects (Lenis instance, rAF loop, observers)
// never run, so there's never a moment where both are actively scrolling
// the same cards.
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (event) => setIsDesktop(event.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isDesktop;
};

const ScrollStack = (props) => {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DesktopStack {...props} /> : <MobileStack {...props} />;
};

export default ScrollStack;
