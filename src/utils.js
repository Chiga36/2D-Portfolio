import { dialogueData, scaleFactor } from "./constants";
import { isTouchDevice } from "./touchControls";

const LABEL_TEXT = {
  pc: "PC",
  "cs-degree": "CS Degree",
  "sofa-table": "Sofa",
  tv: "TV",
  bed: "Bed",
  "resume-projects": "Research Paper and Resume",
  library: "Library",
  "welcome-gate": "Welcome Gate",
  exit: "Exit",
  dustbin: "Dustbin",
  plant: "Plant",
  "conspiracy-board": "Conspiracy Board",
};

export function getLabelText(name) {
  return LABEL_TEXT[name];
}

const LABEL_SIZE = 14;
const LABEL_BORDER_COLOR = [16, 14, 8];
const LABEL_FILL_COLOR = [253, 236, 200];
const LABEL_CORNER_COLOR = [217, 100, 110];
const LABEL_TEXT_COLOR = [74, 47, 26];
const LABEL_BORDER = 3;
const LABEL_CORNER = 3;
const LABEL_PAD_X = 8;
const LABEL_PAD_Y = 5;

// A small pixel-art pill box (cream fill, black border, pink corner accents)
// used as the backing for every world-space label, matching the dialogue
// textbox's styling. Returns a handle with setPos() so callers can either
// place it once (static object labels) or reposition it every frame
// (the player's name tag, which follows them around).
export function createLabelBox(k, text) {
  const measured = k.formatText({ text, size: LABEL_SIZE });
  const boxW = measured.width + LABEL_PAD_X * 2;
  const boxH = measured.height + LABEL_PAD_Y * 2;
  const B = LABEL_BORDER;
  const C = LABEL_CORNER;

  const border = k.add([
    k.rect(boxW, boxH, { radius: 4 }),
    k.anchor("bot"),
    k.pos(0, 0),
    k.color(...LABEL_BORDER_COLOR),
    k.z(97),
  ]);
  const fill = k.add([
    k.rect(boxW - B * 2, boxH - B * 2, { radius: 2 }),
    k.anchor("bot"),
    k.pos(0, -B),
    k.color(...LABEL_FILL_COLOR),
    k.z(98),
  ]);
  const cornerOffsets = [
    [-boxW / 2, -boxH],
    [boxW / 2 - C, -boxH],
    [-boxW / 2, -C],
    [boxW / 2 - C, -C],
  ];
  const corners = cornerOffsets.map(([ox, oy]) =>
    k.add([
      k.rect(C, C),
      k.pos(ox, oy),
      k.color(...LABEL_CORNER_COLOR),
      k.z(99),
    ]),
  );
  const textEntity = k.add([
    k.text(text, { size: LABEL_SIZE }),
    k.anchor("bot"),
    k.pos(0, -B - 1),
    k.color(...LABEL_TEXT_COLOR),
    k.z(100),
  ]);

  function setPos(worldX, worldY) {
    border.pos = k.vec2(worldX, worldY);
    fill.pos = k.vec2(worldX, worldY - B);
    textEntity.pos = k.vec2(worldX, worldY - B - 1);
    corners[0].pos = k.vec2(worldX - boxW / 2, worldY - boxH);
    corners[1].pos = k.vec2(worldX + boxW / 2 - C, worldY - boxH);
    corners[2].pos = k.vec2(worldX - boxW / 2, worldY - C);
    corners[3].pos = k.vec2(worldX + boxW / 2 - C, worldY - C);
  }

  return { setPos };
}

export function addWorldLabel(k, map, localX, localY, text) {
  const worldX = (map.pos.x + localX) * scaleFactor;
  const worldY = (map.pos.y + localY) * scaleFactor;
  const box = createLabelBox(k, text);
  box.setPos(worldX, worldY);
  return box;
}

// Places several labels at once, nudging any that would overlap straight up
// until they clear each other (objects placed close together, like the
// resume/projects/library row, would otherwise draw on top of one another).
export function addWorldLabels(k, map, requests) {
  const GAP = 3;

  const items = requests.map(({ localX, localY, text }) => {
    const worldX = (map.pos.x + localX) * scaleFactor;
    const naturalY = (map.pos.y + localY) * scaleFactor;
    const measured = k.formatText({ text, size: LABEL_SIZE });
    const boxW = measured.width + LABEL_PAD_X * 2;
    const boxH = measured.height + LABEL_PAD_Y * 2;
    return { text, worldX, naturalY, boxW, boxH };
  });

  const placed = [];
  for (const item of items) {
    let y = item.naturalY;
    let changed = true;
    while (changed) {
      changed = false;
      for (const p of placed) {
        const minDx = (item.boxW + p.boxW) / 2 + GAP;
        if (Math.abs(item.worldX - p.worldX) >= minDx) continue;
        const minDy = (item.boxH + p.boxH) / 2 + GAP;
        if (Math.abs(y - p.y) < minDy) {
          y = p.y - minDy;
          changed = true;
        }
      }
    }
    placed.push({ ...item, y });
  }

  return placed.map(({ text, worldX, y }) => {
    const box = createLabelBox(k, text);
    box.setPos(worldX, y);
    return box;
  });
}

// In-memory only: exploration progress resets whenever the app reloads/restarts.
const visitedObjects = new Set();

const NON_EXPLORABLE_KEYS = ["exit", "welcome-gate"];

function getExplorableKeys() {
  return Object.keys(dialogueData).filter(
    (key) => !NON_EXPLORABLE_KEYS.includes(key),
  );
}

function buildExploreList(explorable) {
  const listEl = document.getElementById("explore-list");
  if (!listEl) return;
  listEl.innerHTML = "";
  for (const key of explorable) {
    const li = document.createElement("li");
    li.dataset.key = key;

    const check = document.createElement("span");
    check.className = "explore-check";

    const label = document.createElement("span");
    label.className = "explore-label";
    label.textContent = getLabelText(key) || key;

    li.append(check, label);
    listEl.appendChild(li);
  }
}

export function updateExploreStatus() {
  const explorable = getExplorableKeys();
  const percent = Math.round((visitedObjects.size / explorable.length) * 100);
  const textEl = document.getElementById("explore-text");
  if (textEl) textEl.textContent = `You have explored ${percent}% about me`;

  const listEl = document.getElementById("explore-list");
  if (!listEl) return;
  if (listEl.children.length !== explorable.length) buildExploreList(explorable);
  for (const li of listEl.children) {
    const done = visitedObjects.has(li.dataset.key);
    li.classList.toggle("done", done);
    const check = li.querySelector(".explore-check");
    if (check) check.textContent = done ? "✓" : "";
  }
}

export function markExplored(name) {
  const explorable = getExplorableKeys();
  if (!explorable.includes(name)) return;
  if (visitedObjects.has(name)) return;

  visitedObjects.add(name);
  updateExploreStatus();
}

export function isExplored(name) {
  return visitedObjects.has(name);
}

// A soft pulsing highlight overlaid on an object's trigger area, used to
// prompt "press Enter" once an object has already been seen once (first
// contact still opens the dialogue immediately; later contacts just glow).
export function createGlow(k, map, x, y, w, h) {
  const pad = 2;
  const glow = map.add([
    k.rect(w + pad * 2, h + pad * 2, { radius: 3 }),
    k.pos(x - pad, y - pad),
    k.color(255, 221, 110),
    k.opacity(0),
    k.z(10),
  ]);

  let active = false;
  let t = 0;
  glow.onUpdate(() => {
    if (!active) return;
    t += k.dt();
    glow.opacity = 0.25 + 0.2 * Math.abs(Math.sin(t * 5));
  });

  return {
    activate() {
      active = true;
    },
    deactivate() {
      active = false;
      glow.opacity = 0;
    },
  };
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

export function displayDialogue(rawText, onDisplayEnd) {
  const dialogueUI = document.getElementById("textbox-container");
  const dialogue = document.getElementById("dialogue");
  const textbox = document.getElementById("textbox");
  const text = isTouchDevice
    ? rawText.replace(/(press|hit) enter/gi, (_, verb) =>
        verb === verb.toLowerCase() ? "tap the arrow" : "Tap the arrow",
      )
    : rawText;

  dialogueUI.style.display = "block";
  let index = 0;
  let currentText = "";
  const intervalRef = setInterval(() => {
    if (index < text.length) {
      currentText += text[index];
      dialogue.innerHTML = currentText;
      textbox.scrollTop = textbox.scrollHeight;
      index++;
      return;
    }

    clearInterval(intervalRef);
  }, 20);

  const closeBtn = document.getElementById("close");

  // `confirmed` is false only for Escape, so callers can skip follow-up
  // screens (bookshelf, scroll, outro) when the player just wants out.
  function onCloseBtnClick(confirmed = true) {
    onDisplayEnd(confirmed !== false);
    dialogueUI.style.display = "none";
    dialogue.innerHTML = "";
    clearInterval(intervalRef);
    closeBtn.removeEventListener("click", onCloseBtnClick);
    window.removeEventListener("keydown", onDismissKeyDown);
    document.getElementById("game").focus();
  }

  function onDismissKeyDown(e) {
    if (e.key === "Escape") onCloseBtnClick(false);
    else if (e.key === "Enter") onCloseBtnClick(true);
  }

  closeBtn.addEventListener("click", onCloseBtnClick);
  window.addEventListener("keydown", onDismissKeyDown);
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
    { x: 224, y: 176, w: 40, h: 40 }, // corridor guard, left of the doorway shaft
    { x: 296, y: 176, w: 40, h: 40 }, // corridor guard, right of the doorway shaft
    { x: 224, y: 216, w: 40, h: 16 }, // room top wall, left of doorway
    { x: 296, y: 216, w: 40, h: 16 }, // room top wall, right of doorway
    { x: 224, y: 232, w: 16, h: 28 }, // room left wall, above the exit door
    { x: 224, y: 288, w: 16, h: 32 }, // room left wall, below the exit door
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

  // exit door set into the widened left wall
  map.add([
    k.area({ shape: new k.Rect(k.vec2(0), 14, 14) }),
    k.body({ isStatic: true }),
    k.pos(224, 268),
    "exit",
  ]);
  addWorldLabel(k, map, 232, 260, LABEL_TEXT.exit);

  // centered under the window (which sits on the top wall, map x300-332)
  map.add([k.sprite("plant-pot"), k.pos(300, 238)]);
  map.add([
    // matches the sprite's full opaque bounding box so the player can't
    // walk onto/through the foliage, only the small collider it had before
    k.area({ shape: new k.Rect(k.vec2(0), 13, 19) }),
    k.body({ isStatic: true }),
    k.pos(302, 239),
    "plant",
  ]);
  addWorldLabel(k, map, 308, 238, LABEL_TEXT.plant);
  const plantGlow = createGlow(k, map, 302, 239, 13, 19);

  // the pinboard art is already baked into room-c.png (left of the chimney,
  // native px 8,42 to 37,53) and sits over the existing top-wall collider
  // above (which ends at map y232), so this only needs a tagged trigger
  // area, not its own body. The trigger is extended a few px past the art's
  // bottom edge, down to the wall's edge, so the player's collider (which
  // can only ever reach as far as that wall) actually overlaps it — while
  // the glow highlight below stays sized to the art itself.
  map.add([
    k.area({ shape: new k.Rect(k.vec2(0), 30, 15) }),
    k.pos(229, 218),
    "conspiracy-board",
  ]);
  addWorldLabel(k, map, 244, 217, LABEL_TEXT["conspiracy-board"]);
  const conspiracyGlow = createGlow(k, map, 229, 218, 30, 12);

  return { plantGlow, conspiracyGlow };
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
  return createGlow(k, map, 73, 143, 9, 11);
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
