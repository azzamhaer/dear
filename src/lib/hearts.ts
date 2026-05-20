// Tiny celebration of floating hearts from a screen point.
// No deps, just plain DOM nodes that self-clean.

const SYMBOLS = ["💗", "💗", "💖", "♡"];

export function spawnHearts(
  originX: number,
  originY: number,
  count = 4,
): void {
  if (typeof document === "undefined") return;
  for (let i = 0; i < count; i++) {
    const heart = document.createElement("span");
    heart.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    heart.style.position = "fixed";
    heart.style.left = `${originX + (Math.random() - 0.5) * 22}px`;
    heart.style.top = `${originY}px`;
    heart.style.fontSize = `${14 + Math.random() * 10}px`;
    heart.style.pointerEvents = "none";
    heart.style.zIndex = "9999";
    heart.style.transform = "translate(-50%, -50%)";
    heart.style.willChange = "transform, opacity";
    heart.style.animation = `dear-heart-float ${1100 + Math.random() * 600}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`;
    heart.style.animationDelay = `${i * 60}ms`;
    heart.style.filter = "drop-shadow(0 4px 8px rgba(212, 165, 165, 0.45))";
    // Random horizontal drift per heart
    const drift = (Math.random() - 0.5) * 70;
    heart.style.setProperty("--drift", `${drift}px`);
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1900);
  }
}

/** Convenience: spawn from the center of a DOM element. */
export function spawnHeartsFromElement(el: Element, count = 4): void {
  const rect = el.getBoundingClientRect();
  spawnHearts(rect.left + rect.width / 2, rect.top + rect.height / 2, count);
}
