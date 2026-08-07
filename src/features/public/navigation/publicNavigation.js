// Canonical public marketing navigation — Header and Footer both render
// from this single list so their destinations and labels can never drift
// apart. Every `id` below must match a real `id` attribute rendered
// somewhere in HomePage.jsx (see index.css's `--nav-scroll-offset` rule
// for the matching scroll-margin-top list). There is deliberately no
// entry for content that isn't an actual homepage section — legacy pages
// like /about or /contact are not part of this model.
export const PUBLIC_NAVIGATION = [
  {
    key: "product",
    labelKey: "publicNavigation.groups.product",
    items: [
      { key: "overview", id: "platform", labelKey: "publicNavigation.items.overview" },
      { key: "technology", id: "technology", labelKey: "publicNavigation.items.technology" },
      { key: "howItWorks", id: "how-it-works", labelKey: "publicNavigation.items.howItWorks" },
    ],
  },
  {
    key: "explore",
    labelKey: "publicNavigation.groups.explore",
    items: [
      { key: "ai", id: "ai-assistant", labelKey: "publicNavigation.items.ai" },
      { key: "roadmap", id: "roadmap", labelKey: "publicNavigation.items.roadmap" },
      { key: "faq", id: "faq", labelKey: "publicNavigation.items.faq" },
    ],
  },
];
