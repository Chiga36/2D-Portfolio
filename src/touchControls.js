const DEAD_ZONE = 0.22;

export const isTouchDevice = window.matchMedia(
  "(hover: none) and (pointer: coarse)",
).matches;

if (isTouchDevice) document.documentElement.classList.add("touch-device");

export function setupTouchControls({ onInteract }) {
  const root = document.getElementById("touch-controls");
  const dpad = document.getElementById("touch-dpad");
  const interactBtn = document.getElementById("touch-interact");
  let direction = null;
  let active = false;

  function directionFromEvent(e) {
    const rect = dpad.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < rect.width * DEAD_ZONE) return null;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
    return dy > 0 ? "down" : "up";
  }

  function setDirection(dir) {
    if (dir === direction) return;
    direction = dir;
    dpad.dataset.dir = dir ?? "";
  }

  dpad.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dpad.setPointerCapture(e.pointerId);
    setDirection(directionFromEvent(e));
  });
  dpad.addEventListener("pointermove", (e) => {
    if (dpad.hasPointerCapture(e.pointerId)) setDirection(directionFromEvent(e));
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    dpad.addEventListener(type, () => setDirection(null));
  }

  interactBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    interactBtn.classList.add("pressed");
    onInteract();
  });
  for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
    interactBtn.addEventListener(type, () =>
      interactBtn.classList.remove("pressed"),
    );
  }

  root.addEventListener("contextmenu", (e) => e.preventDefault());

  return {
    getDirection: () => direction,
    setActive(next) {
      if (next === active) return;
      active = next;
      root.classList.toggle("active", next);
      if (!next) setDirection(null);
    },
    setInteractReady(ready) {
      interactBtn.classList.toggle("ready", ready);
    },
  };
}
