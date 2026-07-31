/**
 * Single shared no-op handler for interactive shared dashboard cards when
 * rendered with `previewMode` (e.g. inside the public Hero). Keeps preview
 * safety in one place instead of scattering `if (previewMode)` branches
 * across every card component.
 */
export const handlePreviewInteraction = (event) => {
  event?.preventDefault?.();
};
