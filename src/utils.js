import { dialogueData, scaleFactor } from "./constants";

const LABEL_TEXT = {
  pc: "PC",
  "cs-degree": "CS Degree",
  "sofa-table": "Sofa",
  tv: "TV",
  bed: "Bed",
  resume: "Resume",
  projects: "Projects",
  library: "Library",
  exit: "Exit",
  dustbin: "Dustbin",
};

export function getLabelText(name) {
  return LABEL_TEXT[name];
}

export const LABEL_OUTLINE_OFFSETS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];

export function addWorldLabel(k, map, localX, localY, text) {
  const worldX = (map.pos.x + localX) * scaleFactor;
  const worldY = (map.pos.y + localY) * scaleFactor;

  for (const [dx, dy] of LABEL_OUTLINE_OFFSETS) {
    k.add([
      k.text(text, { size: 14 }),
      k.anchor("bot"),
      k.pos(worldX + dx, worldY + dy),
      k.color(0, 0, 0),
      k.z(100),
    ]);
  }

  return k.add([
    k.text(text, { size: 14 }),
    k.anchor("bot"),
    k.pos(worldX, worldY),
    k.color(255, 255, 255),
    k.z(101),
  ]);
}

// In-memory only: exploration progress resets whenever the app reloads/restarts.
const visitedObjects = new Set();

function getExplorableKeys() {
  return Object.keys(dialogueData).filter((key) => key !== "exit");
}

export function updateExploreStatus() {
  const explorable = getExplorableKeys();
  const percent = Math.round((visitedObjects.size / explorable.length) * 100);
  const el = document.getElementById("explore-status");
  if (el) el.textContent = `You have explored ${percent}% about me`;
}

export function markExplored(name) {
  const explorable = getExplorableKeys();
  if (!explorable.includes(name)) return;
  if (visitedObjects.has(name)) return;

  visitedObjects.add(name);
  updateExploreStatus();
}

let audioCtx;

export function playInteractSound() {
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.setValueAtTime(880, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    // ignore audio errors (e.g. unsupported browser)
  }
}

export function displayDialogue(text, onDisplayEnd) {
  const dialogueUI = document.getElementById("textbox-container");
  const dialogue = document.getElementById("dialogue");

  dialogueUI.style.display = "block";
  let index = 0;
  let currentText = "";
  const intervalRef = setInterval(() => {
    if (index < text.length) {
      currentText += text[index];
      dialogue.innerHTML = currentText;
      index++;
      return;
    }

    clearInterval(intervalRef);
  }, 20);

  const closeBtn = document.getElementById("close");

  function onCloseBtnClick() {
    onDisplayEnd();
    dialogueUI.style.display = "none";
    dialogue.innerHTML = "";
    clearInterval(intervalRef);
    closeBtn.removeEventListener("click", onCloseBtnClick);
    window.removeEventListener("keydown", onEscapeKeyDown);
    document.getElementById("game").focus();
  }

  function onEscapeKeyDown(e) {
    if (e.key === "Escape") onCloseBtnClick();
  }

  closeBtn.addEventListener("click", onCloseBtnClick);
  window.addEventListener("keydown", onEscapeKeyDown);
}

export function setCamScale(k) {
  const resizeFactor = k.width() / k.height();
  if (resizeFactor < 1) {
    k.camScale(k.vec2(1));
    return;
  }
  k.camScale(k.vec2(1.5));
}

export function addRoomC(k, map) {
  // room-c.png has a 3px transparent margin baked in on the left/right/bottom
  // (so its border-outline wraps all the way around); shift the sprite left
  // by that margin so the drawn room still lines up with the wall colliders below.
  map.add([k.sprite("room-c"), k.pos(221, 176)]);

  const walls = [
    { x: 224, y: 216, w: 40, h: 16 }, // room top wall, left of doorway
    { x: 296, y: 216, w: 40, h: 16 }, // room top wall, right of doorway
    { x: 224, y: 232, w: 8, h: 88 }, // room left wall
    { x: 328, y: 232, w: 8, h: 88 }, // room right wall
    { x: 224, y: 312, w: 112, h: 8 }, // room bottom wall
  ];
  for (const wall of walls) {
    map.add([
      k.area({ shape: new k.Rect(k.vec2(0), wall.w, wall.h) }),
      k.body({ isStatic: true }),
      k.pos(wall.x, wall.y),
    ]);
  }

  map.add([k.sprite("plant-pot"), k.pos(290, 280)]);
  map.add([
    k.area({ shape: new k.Rect(k.vec2(0), 11, 6) }),
    k.body({ isStatic: true }),
    k.pos(292, 294),
  ]);
  addWorldLabel(k, map, 298, 280, "Plant");
}

export function addDustbin(k, map) {
  map.add([k.sprite("dustbin"), k.pos(66, 142)]);
  map.add([
    k.area({ shape: new k.Rect(k.vec2(0), 9, 11) }),
    k.body({ isStatic: true }),
    k.pos(73, 143),
    "dustbin",
  ]);
  addWorldLabel(k, map, 75, 143, LABEL_TEXT.dustbin);
}

const ROOM_THRESHOLDS = [{ room: "room-a", maxX: 800 }];
const ROOM_C_MIN_Y = 710; // scaled map-y past the gap cut into room B's bottom wall

export function updateRoomBackground(playerX, playerY) {
  let room;
  const match = ROOM_THRESHOLDS.find((entry) => playerX < entry.maxX);
  if (match) {
    room = match.room;
  } else if (playerY > ROOM_C_MIN_Y) {
    room = "room-c";
  } else {
    room = "room-b";
  }

  const app = document.getElementById("app");
  if (app.classList.contains(room)) return;

  app.classList.remove("room-a", "room-b", "room-c");
  app.classList.add(room);
}
