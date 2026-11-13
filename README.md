# Multigate landing page

Static page, no build step. Open `index.html`, or serve the folder.

- **Design:** built from the Figma file "Demo Prep" (Landing Page frame). PT Serif for headings, DM Sans for body, JetBrains Mono for a few labels.
- **Copy:** the signed-off plain-language homepage copy in `docs/homepage-copy-plain-language.md`.
- **Images:** `assets/d/` holds the 3D coins and icons, the hero and Africa maps and the Trust Centre seal, exported from the Figma design.
- **Review mode:** add `?review` to the URL, or use the button, to show each section's job and the open sign-off items.
- The booking form is a prototype. Nothing is sent.

## Current build

The page follows a ruled-grid layout with Inter Tight headlines, JetBrains Mono labels and blue wireframe drawings. The drawings (globe, gate, vault, coins) are generated in code in `assets/motion.js` and drawn on canvas; there are no 3D model files. The previous Figma-based build is in git history.
