import { dialogueData, scaleFactor } from "./constants";
import { currentlyReadingBooks } from "./currentlyReading";
import { scrollSections } from "./scrollContent";
import { setupPcScreen } from "./pcScreen";
import { k } from "./kaboomCtx";
import {
  addDustbin,
  addRoomC,
  addWorldLabels,
  createGlow,
  createLabelBox,
  displayDialogue,
  getLabelText,
  isExplored,
  markExplored,
  playInteractSound,
  setCamScale,
  updateExploreStatus,
  updateRoomBackground,
} from "./utils";

k.loadSprite("spritesheet", "./spritesheet.png", {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "idle-down": 936,
    "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
    "idle-side": 975,
    "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
    "idle-up": 1014,
    "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 },
  },
});

k.loadSprite("map", "./map.png");
k.loadSprite("room-c", "./room-c.png");
k.loadSprite("plant-pot", "./plant-pot.png");
k.loadSprite("dustbin", "./dustbin.png");

// Kaboom's setBackground(color, alpha) does `alpha && (bgAlpha = alpha)`,
// so passing a literal 0 is falsy and silently keeps the default opaque alpha.
k.setBackground(k.Color.fromHex("#311047"), 0.001);

const welcomeScreen = document.getElementById("welcome-screen");
let gameStarted = false;

const bgm = document.getElementById("bgm");
const outroBgm = document.getElementById("outro-bgm");
const musicToggle = document.getElementById("music-toggle");
const skipIntroBtn = document.getElementById("skip-intro");
let musicEnabled = localStorage.getItem("musicEnabled") !== "false";
let currentTrack = bgm;

function applyMusicState() {
  musicToggle.textContent = musicEnabled ? "\u{1F50A}" : "\u{1F507}";
  musicToggle.setAttribute("aria-pressed", String(musicEnabled));
  if (musicEnabled) {
    currentTrack.play().catch(() => {});
  } else {
    currentTrack.pause();
  }
}

musicToggle.addEventListener("click", () => {
  musicEnabled = !musicEnabled;
  localStorage.setItem("musicEnabled", String(musicEnabled));
  applyMusicState();
  document.getElementById("game").focus();
});
applyMusicState();

const exploreStatusEl = document.getElementById("explore-status");
const exploreToggle = document.getElementById("explore-toggle");
exploreToggle.addEventListener("click", () => {
  const open = exploreStatusEl.classList.toggle("open");
  exploreToggle.setAttribute("aria-expanded", String(open));
  document.getElementById("game").focus();
});

const outroScreen = document.getElementById("outro-screen");
const outroClose = document.getElementById("outro-close");

function showOutroScreen() {
  outroScreen.style.display = "flex";
  bgm.pause();
  currentTrack = outroBgm;
  applyMusicState();
}

function hideOutroScreen() {
  outroScreen.style.display = "none";
  outroBgm.pause();
  outroBgm.currentTime = 0;
  currentTrack = bgm;
  applyMusicState();
  document.getElementById("game").focus();
}

outroClose.addEventListener("click", hideOutroScreen);
window.addEventListener("keydown", (e) => {
  if (outroScreen.style.display === "flex" && e.key === "Escape") {
    hideOutroScreen();
  }
});

const libraryScreen = document.getElementById("library-screen");
const libraryClose = document.getElementById("library-close");

currentlyReadingBooks.forEach(({ genre, books }, colIndex) => {
  const genreEl = document.getElementById(`library-genre-${colIndex}`);
  if (genreEl) genreEl.textContent = genre;

  const colEl = document.querySelector(`.library-col-${colIndex}`);
  if (!colEl) return;
  books.forEach((title, rowIndex) => {
    const row = document.createElement("div");
    row.className = "library-row";
    row.style.top = `${(rowIndex * 100) / books.length}%`;

    const tooltip = document.createElement("div");
    tooltip.className = "library-row-tooltip";
    const label = document.createElement("span");
    label.textContent = title;
    tooltip.appendChild(label);

    row.appendChild(tooltip);
    colEl.appendChild(row);
  });
});

// Set once the "main" scene creates the player, so the library popup can
// block/restore movement by toggling isInDialogue while it's open.
let activePlayer = null;

const pcScreen = setupPcScreen({
  onOpen: () => {
    if (activePlayer) activePlayer.isInDialogue = true;
  },
  onClose: () => {
    if (activePlayer) activePlayer.isInDialogue = false;
    document.getElementById("game").focus();
  },
});

function showLibraryScreen() {
  libraryScreen.style.display = "flex";
  if (activePlayer) activePlayer.isInDialogue = true;
}

function hideLibraryScreen() {
  libraryScreen.style.display = "none";
  if (activePlayer) activePlayer.isInDialogue = false;
  document.getElementById("game").focus();
}

libraryClose.addEventListener("click", hideLibraryScreen);
window.addEventListener("keydown", (e) => {
  if (libraryScreen.style.display === "flex" && e.key === "Escape") {
    hideLibraryScreen();
  }
});

const degreeScreen = document.getElementById("degree-screen");
const degreeClose = document.getElementById("degree-close");

function showDegreeScreen() {
  degreeScreen.style.display = "flex";
  if (activePlayer) activePlayer.isInDialogue = true;
}

function hideDegreeScreen() {
  degreeScreen.style.display = "none";
  if (activePlayer) activePlayer.isInDialogue = false;
  document.getElementById("game").focus();
}

degreeClose.addEventListener("click", hideDegreeScreen);
window.addEventListener("keydown", (e) => {
  if (degreeScreen.style.display === "flex" && e.key === "Escape") {
    hideDegreeScreen();
  }
});

const scrollScreen = document.getElementById("scroll-screen");
const scrollBody = document.getElementById("scroll-body");
const scrollContent = document.getElementById("scroll-content");
const scrollPrev = document.getElementById("scroll-prev");
const scrollNext = document.getElementById("scroll-next");
const scrollPage = document.getElementById("scroll-page");
const scrollClose = document.getElementById("scroll-close");
let scrollIndex = 0;
let scrollOpen = false;
let scrollClosing = false;

function renderScrollSection() {
  const section = scrollSections[scrollIndex];
  scrollContent.replaceChildren();

  const title = document.createElement("h2");
  title.className = "scroll-title";
  title.textContent = section.title;
  scrollContent.appendChild(title);

  for (const block of section.blocks) {
    if (block.heading) {
      const heading = document.createElement("h3");
      heading.className = "scroll-heading";
      heading.textContent = block.heading;
      scrollContent.appendChild(heading);
    }
    for (const line of block.lines) {
      const p = document.createElement("p");
      p.className = block.heading ? "scroll-line" : "scroll-empty";
      if (typeof line === "string") {
        p.textContent = line;
      } else {
        const link = document.createElement("a");
        link.href = line.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = line.text;
        p.appendChild(link);
      }
      scrollContent.appendChild(p);
    }
  }

  const prev = scrollSections[scrollIndex - 1];
  const next = scrollSections[scrollIndex + 1];
  scrollPrev.style.visibility = prev ? "visible" : "hidden";
  scrollNext.style.visibility = next ? "visible" : "hidden";
  scrollPrev.querySelector(".scroll-nav-label").textContent = prev?.title ?? "";
  scrollNext.querySelector(".scroll-nav-label").textContent = next?.title ?? "";
  // the scroll font's "/" draws like a backslash, so spell it out
  scrollPage.textContent = `${scrollIndex + 1} of ${scrollSections.length}`;
  scrollContent.scrollTop = 0;
}

function goToScrollSection(index) {
  if (index < 0 || index >= scrollSections.length || index === scrollIndex) return;
  scrollContent.classList.add("fading");
  setTimeout(() => {
    scrollIndex = index;
    renderScrollSection();
    scrollContent.classList.remove("fading");
  }, 200);
}

function showScrollScreen() {
  scrollIndex = 0;
  renderScrollSection();
  scrollOpen = true;
  scrollClosing = false;
  scrollScreen.classList.remove("closing", "opening");
  scrollScreen.style.display = "flex";
  void scrollScreen.offsetWidth; // restart the unroll animation on every open
  scrollScreen.classList.add("opening");
  if (activePlayer) activePlayer.isInDialogue = true;
}

function hideScrollScreen() {
  if (!scrollOpen || scrollClosing) return;
  scrollClosing = true;
  scrollScreen.classList.remove("opening");
  scrollScreen.classList.add("closing");
}

// movement stays locked until the roll-up animation has actually finished
scrollBody.addEventListener("animationend", (e) => {
  if (e.animationName !== "scroll-roll-up") return;
  scrollScreen.style.display = "none";
  scrollScreen.classList.remove("closing");
  scrollOpen = false;
  scrollClosing = false;
  if (activePlayer) activePlayer.isInDialogue = false;
  document.getElementById("game").focus();
});

scrollPrev.addEventListener("click", () => goToScrollSection(scrollIndex - 1));
scrollNext.addEventListener("click", () => goToScrollSection(scrollIndex + 1));
scrollClose.addEventListener("click", hideScrollScreen);
window.addEventListener("keydown", (e) => {
  if (!scrollOpen || scrollClosing) return;
  if (e.key === "Escape") hideScrollScreen();
  else if (e.key === "ArrowLeft") goToScrollSection(scrollIndex - 1);
  else if (e.key === "ArrowRight") goToScrollSection(scrollIndex + 1);
});

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  welcomeScreen.style.display = "none";
  document.getElementById("game").focus();
  skipIntroBtn.style.display = "flex";
  if (musicEnabled) bgm.play().catch(() => {});
}

welcomeScreen.addEventListener("click", startGame);
window.addEventListener("keydown", startGame, { once: true });

function enterMain() {
  skipIntroBtn.style.display = "none";
  document.getElementById("app").classList.remove("intro-active");
  document.getElementById("explore-status").style.display = "block";
  updateExploreStatus();
  k.go("main");
}

k.scene("intro", () => {
  const introPlayer = k.add([
    k.sprite("spritesheet", { anim: "walk-down" }),
    k.anchor("center"),
    k.pos(k.width() / 2, k.height() / 2 - 60),
    k.scale(10),
    k.fixed(),
  ]);
  introPlayer.play("walk-down");

  k.add([
    k.rect(Math.min(620, k.width() - 40), 100, { radius: 10 }),
    k.anchor("center"),
    k.pos(k.width() / 2, k.height() / 2 + 170),
    k.color(k.Color.fromHex("#2d1b4d")),
    k.opacity(0.6),
    k.fixed(),
  ]);

  k.add([
    k.text("Hi, my name is Chirag\nand this is my portfolio", {
      size: 28,
      align: "center",
      width: k.width() - 80,
    }),
    k.anchor("center"),
    k.pos(k.width() / 2, k.height() / 2 + 170),
    k.color(255, 255, 255),
    k.fixed(),
  ]);

  let introFinished = false;
  function finishIntro() {
    if (!gameStarted || introFinished) return;
    introFinished = true;
    enterMain();
  }

  k.wait(4.5, finishIntro);
  k.onKeyPress("escape", finishIntro);
  skipIntroBtn.onclick = finishIntro;
});

k.scene("main", async () => {
  const mapData = await (await fetch("./map.json")).json();
  const layers = mapData.layers;

  const map = k.add([k.sprite("map"), k.pos(0), k.scale(scaleFactor)]);
  const { plantGlow, conspiracyGlow } = addRoomC(k, map);
  const dustbinGlow = addDustbin(k, map);

  const player = k.make([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.area({
      shape: new k.Rect(k.vec2(0, 3), 10, 10),
    }),
    k.body(),
    k.anchor("center"),
    k.pos(),
    k.scale(scaleFactor),
    {
      speed: 300,
      direction: "down",
      isInDialogue: false,
    },
    "player",
  ]);
  activePlayer = player;

  // Once an object has been seen, re-touching it doesn't reopen the dialogue
  // right away: it just glows, and the player confirms with Enter. Only one
  // object can be "pending" at a time.
  let pendingInteraction = null;
  const interactHint = document.getElementById("interact-hint");

  function openObjectDialogue(name) {
    player.isInDialogue = true;
    playInteractSound();
    displayDialogue(dialogueData[name], (confirmed) => {
      player.isInDialogue = false;
      if (!confirmed) return;
      if (name === "library") showLibraryScreen();
      if (name === "resume-projects") showScrollScreen();
      if (name === "pc") pcScreen.show();
      if (name === "cs-degree") showDegreeScreen();
    });
  }

  function handleObjectCollide(name, glow) {
    if (player.isInDialogue) return;
    if (!isExplored(name)) {
      markExplored(name);
      openObjectDialogue(name);
      return;
    }
    pendingInteraction = { name, glow };
    glow.activate();
    interactHint.style.display = "block";
  }

  function handleObjectCollideEnd(name, glow) {
    if (pendingInteraction && pendingInteraction.name === name) {
      glow.deactivate();
      pendingInteraction = null;
      interactHint.style.display = "none";
    }
  }

  k.onKeyPress("enter", () => {
    if (!pendingInteraction || player.isInDialogue) return;
    const { name, glow } = pendingInteraction;
    glow.deactivate();
    pendingInteraction = null;
    interactHint.style.display = "none";
    openObjectDialogue(name);
  });

  const labelRequests = [];

  for (const layer of layers) {
    if (layer.name === "boundaries") {
      for (const boundary of layer.objects) {
        map.add([
          k.area({
            shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
          }),
          k.body({ isStatic: true }),
          k.pos(boundary.x, boundary.y),
          boundary.name,
        ]);

        if (boundary.name) {
          const glow = createGlow(
            k,
            map,
            boundary.x,
            boundary.y,
            boundary.width,
            boundary.height,
          );
          player.onCollide(boundary.name, () =>
            handleObjectCollide(boundary.name, glow),
          );
          player.onCollideEnd(boundary.name, () =>
            handleObjectCollideEnd(boundary.name, glow),
          );

          const labelText = getLabelText(boundary.name);
          if (labelText) {
            labelRequests.push({
              localX: boundary.x + boundary.width / 2,
              localY: boundary.y,
              text: labelText,
            });
          }
        }
      }

      continue;
    }

    if (layer.name === "spawnpoints") {
      for (const entity of layer.objects) {
        if (entity.name === "player") {
          player.pos = k.vec2(
            (map.pos.x + entity.x) * scaleFactor,
            (map.pos.y + entity.y) * scaleFactor,
          );
          k.add(player);
        }
      }
    }
  }

  addWorldLabels(k, map, labelRequests);

  player.onCollide("dustbin", () => handleObjectCollide("dustbin", dustbinGlow));
  player.onCollideEnd("dustbin", () =>
    handleObjectCollideEnd("dustbin", dustbinGlow),
  );

  player.onCollide("plant", () => handleObjectCollide("plant", plantGlow));
  player.onCollideEnd("plant", () =>
    handleObjectCollideEnd("plant", plantGlow),
  );

  player.onCollide("conspiracy-board", () =>
    handleObjectCollide("conspiracy-board", conspiracyGlow),
  );
  player.onCollideEnd("conspiracy-board", () =>
    handleObjectCollideEnd("conspiracy-board", conspiracyGlow),
  );

  player.onCollide("exit", () => {
    if (player.isInDialogue) return;
    markExplored("exit");
    player.isInDialogue = true;
    playInteractSound();
    displayDialogue(dialogueData.exit, (confirmed) => {
      player.isInDialogue = false;
      if (confirmed) showOutroScreen();
    });
  });

  const PLAYER_LABEL_OFFSET = -40;
  const playerLabelBox = createLabelBox(k, "Chirag");
  playerLabelBox.setPos(
    player.worldPos().x,
    player.worldPos().y + PLAYER_LABEL_OFFSET,
  );

  setCamScale(k);
  k.onResize(() => {
    setCamScale(k);
  });

  k.onUpdate(() => {
    k.camPos(player.worldPos().x, player.worldPos().y);
    updateRoomBackground(player.pos.x, player.pos.y);

    playerLabelBox.setPos(
      player.worldPos().x,
      player.worldPos().y + PLAYER_LABEL_OFFSET,
    );
  });

  const maxDt = 1 / 60;
  function moveClamped(vx, vy) {
    const dt = Math.min(k.dt(), maxDt);
    player.moveBy(vx * dt, vy * dt);
  }

  function stopAnims() {
    if (player.direction === "down") {
      player.play("idle-down");
      return;
    }
    if (player.direction === "up") {
      player.play("idle-up");
      return;
    }

    player.play("idle-side");
  }

  k.onKeyDown(() => {
    if (!gameStarted || player.isInDialogue) return;

    const keyMap = [
      k.isKeyDown("d") || k.isKeyDown("right"),
      k.isKeyDown("a") || k.isKeyDown("left"),
      k.isKeyDown("w") || k.isKeyDown("up"),
      k.isKeyDown("s") || k.isKeyDown("down"),
    ];

    const nbOfKeyPressed = keyMap.filter(Boolean).length;
    if (nbOfKeyPressed !== 1) return;

    if (keyMap[0]) {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "right";
      moveClamped(player.speed, 0);
      return;
    }

    if (keyMap[1]) {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "left";
      moveClamped(-player.speed, 0);
      return;
    }

    if (keyMap[2]) {
      if (player.curAnim() !== "walk-up") player.play("walk-up");
      player.direction = "up";
      moveClamped(0, -player.speed);
      return;
    }

    if (keyMap[3]) {
      if (player.curAnim() !== "walk-down") player.play("walk-down");
      player.direction = "down";
      moveClamped(0, player.speed);
    }
  });

  k.onKeyRelease(() => {
    stopAnims();
  });
});

k.go("intro");
