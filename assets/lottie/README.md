# Multigate Lottie animations

Four looping wireframe animations: the Collect, Convert and Pay steps of "Move money", and the hero globe.

| File | Use for | Size (json / .lottie) |
| --- | --- | --- |
| `multigate-collect.json` / `.lottie` | Collect (single coin) | ~0.4 MB / ~60 KB |
| `multigate-convert.json` / `.lottie` | Convert (two coins) | ~0.8 MB / ~120 KB |
| `multigate-pay.json` / `.lottie` | Pay (coin stack) | ~1.7 MB / ~130 KB |
| `multigate-globe.json` / `.lottie` | Hero globe with Africa | ~2.1 MB / ~220 KB |

**Spec:** 600 x 600 canvas, 24 fps, 48 frames (a seamless 2 second loop), transparent background, vector only (no images or fonts), single stroke colour `#1362f5` at 1.6 px.

## Which file to use
Prefer the `.lottie` files (dotLottie, compressed). Use the `.json` files with any standard Lottie player.

## Using them
**Plain web (lottie-web)**
```html
<div id="collect" style="width:300px;height:300px"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script>
<script>
  lottie.loadAnimation({ container: document.getElementById('collect'), renderer: 'svg', loop: true, autoplay: true, path: '/assets/lottie/multigate-collect.json' });
</script>
```

**React (dotLottie)**
```jsx
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
<DotLottieReact src="/assets/lottie/multigate-collect.lottie" loop autoplay />
```

**Recolouring:** the stroke is one colour on one group named "Stroke". To change colour, edit `c.k` in the stroke item (RGBA, 0 to 1), or use your player's colour override on the layer "Wireframe".

**Reduced motion:** pause the animation when `prefers-reduced-motion: reduce` matches (`anim.goToAndStop(0, true)`).

`demo.html` plays all three side by side (open it from a local server so the JSON loads).

## Notes for the dev
- These are true 3D turntables flattened to vectors: every line's vertices are keyframed per frame. There is no depth fading of the back lines (the website's canvas version fades them).
- File sizes are driven by the number of keyframed vertices. If weight matters, ship the `.lottie` files.

## Hero globe
`multigate-globe` is 1200 x 1200, 24 fps, 96 frames (a 4 second loop). It is a gentle sway of about 12 degrees either side of centre, not a full spin, so Africa always faces the viewer. Layers, top to bottom: `Live markets` (the XOF, NGN and GHS countries, 2.2 px), `Africa borders` (1.2 px), `Meridians` and `Parallels` (0.8 px, 38% opacity).
- On the website the globe also turns as you scroll. To match that, pause the loop and drive it from scroll: `anim.goToAndStop(frame, true)` with `frame = scrollProgress * (anim.totalFrames - 1)`.
- The far side of the globe is not drawn (lines near the edge are trimmed slightly so they never show through).
- The hero positions the globe large and cropped by the page edge, to the right of the headline. Size and place the container in CSS; the file has no background.
