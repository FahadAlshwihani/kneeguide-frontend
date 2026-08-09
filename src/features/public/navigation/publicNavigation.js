import { ROUTES } from "../../../utils/routes";

// Canonical public marketing navigation — Header and Footer both render
// from this single list so their destinations and labels can never drift
// apart. Every `id` below must match a real `id` attribute rendered
// somewhere in HomePage.jsx (see index.css's `--nav-scroll-offset` rule
// for the matching scroll-margin-top list). There is deliberately no
// entry for content that isn't an actual homepage section — legacy pages
// like /about or /contact are not part of this model, and neither is the
// closing CTA section (its job — surfacing auth entry points — is
// already covered by the Account group below).
//
// Order within each group follows the section's real order on the page,
// so reading the menu top-to-bottom roughly previews what scrolling
// top-to-bottom actually shows. "Product" is the core story (the problem
// KneeGuide solves, its approach, how it works, what's in the platform);
// "Explore" is supporting/secondary material (the underlying tech, the
// AI assistant, what's next, common questions).
export const PUBLIC_NAVIGATION = [
  {
    key: "product",
    labelKey: "publicNavigation.groups.product",
    items: [
      { key: "challenge", id: "challenge", labelKey: "publicNavigation.items.challenge" },
      { key: "approach", id: "approach", labelKey: "publicNavigation.items.approach" },
      { key: "howItWorks", id: "how-it-works", labelKey: "publicNavigation.items.howItWorks" },
      { key: "platform", id: "platform", labelKey: "publicNavigation.items.platform" },
    ],
  },
  {
    key: "explore",
    labelKey: "publicNavigation.groups.explore",
    items: [
      { key: "technology", id: "technology", labelKey: "publicNavigation.items.technology" },
      { key: "ai", id: "ai-assistant", labelKey: "publicNavigation.items.ai" },
      { key: "roadmap", id: "roadmap", labelKey: "publicNavigation.items.roadmap" },
      { key: "faq", id: "faq", labelKey: "publicNavigation.items.faq" },
    ],
  },
];

// The third mega-menu/Footer card — real app routes (Login/Register), not
// homepage sections, so deliberately kept out of PUBLIC_NAVIGATION's
// hash-only model above (its consumers render every item as `/#id` +
// goToSection; these need a plain route Link instead). "Patient Login"
// and "Clinician Login" are discovery labels only — both point at the
// one real Login route on purpose, so the menu communicates KneeGuide
// serves both sides of the platform without a second login page/route
// existing anywhere. Same reasoning for Create Account -> the one real
// Register route, whose own first step already handles role selection.
export const PUBLIC_ACCOUNT_LINKS = [
  { key: "patientLogin", to: ROUTES.LOGIN, labelKey: "publicHeader.patientLogin" },
  { key: "clinicianLogin", to: ROUTES.LOGIN, labelKey: "publicHeader.clinicianLogin" },
  { key: "createAccount", to: ROUTES.REGISTER, labelKey: "publicHeader.createAccount" },
];
