# Multigate Lottie animations

Three looping wireframe animations for the Collect, Convert and Pay steps of "Move money".

| File | Use for | Size (json / .lottie) |
| --- | --- | --- |
| `multigate-collect.json` / `.lottie` | Collect (single coin) | ~0.4 MB / ~60 KB |
| `multigate-convert.json` / `.lottie` | Convert (two coins) | ~0.8 MB / ~120 KB |
| `multigate-pay.json` / `.lottie` | Pay (coin stack) | ~1.7 MB / ~130 KB |

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
