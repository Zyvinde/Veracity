// glass-card.js
// Sizing the duplicate to the viewport rather than to the card is deliberate. The filter shifts each colour channel by a different amount, so the filtered element's own leading edges show hard channel-separation bands. At viewport size those bands fall outside the card and only clean refraction shows.
// The duplicate stays at 1× even on retina: the SVG filter's cost scales with pixel count, and what shows through is a soft refraction where 4× the filter work buys nothing.

const video = document.getElementById('bg-video');
const card = document.querySelector('[data-glass-card]');
const container = document.getElementById('dup-video-container');
const canvas = document.getElementById('dup-image');

if (video && card && container && canvas) {
  const ctx = canvas.getContext('2d');
  const DUP_PIXEL_RATIO = 1;

  let lastW = 0;
  let lastH = 0;

  function render() {
    requestAnimationFrame(render);

    if (!video.videoWidth || !video.videoHeight) return;

    const rect = card.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    container.style.left = `${-rect.left}px`;
    container.style.top = `${-rect.top}px`;
    container.style.width = `${vw}px`;
    container.style.height = `${vh}px`;

    const w = Math.round(vw * DUP_PIXEL_RATIO);
    const h = Math.round(vh * DUP_PIXEL_RATIO);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      lastW = w;
      lastH = h;
    }

    try {
      const cover = Math.max(vw / video.videoWidth, vh / video.videoHeight);
      const sw = vw / cover;
      const sh = vh / cover;
      const sx = (video.videoWidth - sw) / 2;
      const sy = (video.videoHeight - sh) / 2;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    } catch (e) {
      // frame may not be decodable yet
    }
  }

  requestAnimationFrame(render);
}
