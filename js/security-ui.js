// IKAZE DIGITAL — lightweight UI deterrents
// ⚠️ NOT A SECURITY MECHANISM.
// This only discourages casual copying. The user can always open DevTools.
// Never place secrets in frontend code. Real security = backend + Firebase Rules.
(() => {
  'use strict';

  // Respect reduced motion users — skip all deterrents if set
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Context menu on decorative elements only — never block form fields,
  // inputs, or text selection for accessibility.
  document.addEventListener('contextmenu', (e) => {
    const t = e.target;
    const isEditable = t && (
      t.matches?.('input, textarea, select, [contenteditable="true"]') ||
      t.closest?.('input, textarea, select, [contenteditable="true"]')
    );
    if (!isEditable) {
      // Soft deterrence — log only, do not block, so as not to hurt UX
      // (comment out the next line to actually block)
      // e.preventDefault();
    }
  });

  // Optional: dev-only note in console (remove in production build)
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.info(
      '%cIKAZE DIGITAL',
      'background:#00A1DE;color:#fff;padding:4px 8px;border-radius:4px;font-weight:600',
      '\nDeveloper console — safe to use. No secrets are stored in the frontend.'
    );
  }
})();
