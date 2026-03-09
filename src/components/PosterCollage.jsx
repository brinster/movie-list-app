// src/components/PosterCollage.jsx
import { useEffect, useRef } from "react";

export default function PosterCollage({ movies }) {
  const canvasRef = useRef(null);
  const drawCancelRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    drawCollage();
    // eslint-disable-next-line
  }, [movies]);

  const drawCollage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cancelled = { value: false };
    drawCancelRef.current = cancelled;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const postersWithUrls = movies
      .filter((m) => m.poster_url)
      .slice()
      .sort((a, b) => new Date(a.added_at) - new Date(b.added_at));

    const POSTER_RATIO = 2 / 3;
    const baseWidth = window.innerWidth < 768 ? 65 : 110;
    const GAP = 6;
    const BLEED = 30;
    const MAX_ATTEMPTS = 30;
    const placed = [];

    const overlaps = (x, y, w, h) => {
      for (const r of placed) {
        if (x < r.x + r.w + GAP && x + w + GAP > r.x &&
            y < r.y + r.h + GAP && y + h + GAP > r.y) return true;
      }
      return false;
    };

    const drawPoster = (img, x, y, w, h, angle) => {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(angle);

      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;

      ctx.globalAlpha = 1;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-w / 2, -h / 2, w, h);

      const highlight = ctx.createLinearGradient(-w / 2, -h / 2, -w / 2 + 6, -h / 2 + 6);
      highlight.addColorStop(0, "rgba(255,255,255,0.12)");
      highlight.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = highlight;
      ctx.fillRect(-w / 2, -h / 2, w, h);

      const shadow = ctx.createLinearGradient(w / 2, h / 2, w / 2 - 12, h / 2 - 12);
      shadow.addColorStop(0, "rgba(0,0,0,0.1)");
      shadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = shadow;
      ctx.fillRect(-w / 2, -h / 2, w, h);

      ctx.restore();
    };

    const loadedImages = [];
    let loadedCount = 0;
    let hasPlaced = false;
    const total = Math.min(postersWithUrls.length, 500);
    if (total === 0) return;

    const placeAll = () => {
      loadedImages.forEach(({ img, w, h }) => {
        const angle = (Math.random() * 36 - 18) * (Math.PI / 180);

        // Place anywhere on screen with slight bleed off edges
        const randPos = () => ({
          x: -BLEED + Math.random() * (window.innerWidth - w + BLEED * 2),
          y: -BLEED + Math.random() * (window.innerHeight - h + BLEED * 2),
        });

        let { x: foundX, y: foundY } = randPos();
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          const { x, y } = randPos();
          if (!overlaps(x, y, w, h)) { foundX = x; foundY = y; break; }
        }

        placed.push({ x: foundX, y: foundY, w, h });
        drawPoster(img, foundX, foundY, w, h, angle);
      });
    };

    postersWithUrls.slice(0, total).forEach((m) => {
      const img = new window.Image();
      img.src = m.poster_url;
      img.onload = () => {
        loadedImages.push({ img, w: baseWidth, h: baseWidth / POSTER_RATIO });
        loadedCount++;
        if (loadedCount === total && !hasPlaced && !cancelled.value) { hasPlaced = true; placeAll(); }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === total && !hasPlaced && !cancelled.value) { hasPlaced = true; placeAll(); }
      };
    });
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", top: 0, left: 0,
        width: "100vw", height: "100vh",
        zIndex: -1, pointerEvents: "none",
      }}
    />
  );
}
