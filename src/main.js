import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import {
  addDustbin,
  addRoomC,
  addWorldLabel,
  displayDialogue,
  getLabelText,
  LABEL_OUTLINE_OFFSETS,
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
const musicToggle = document.getElementById("music-toggle");
const skipIntroBtn = document.getElementById("skip-intro");
let musicEnabled = localStorage.getItem("musicEnabled") !== "false";

function applyMusicState() {
  musicToggle.textContent = musicEnabled ? "\u{1F50A}" : "\u{1F507}";
  musicToggle.setAttribute("aria-pressed", String(musicEnabled));
  if (musicEnabled) {
    bgm.play().catch(() => {});
  } else {
    bgm.pause();
  }
}

musicToggle.addEventListener("click", () => {
  musicEnabled = !musicEnabled;
  localStorage.setItem("musicEnabled", String(musicEnabled));
  applyMusicState();
});
applyMusicState();

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
  addRoomC(k, map);
  addDustbin(k, map);

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
          player.onCollide(boundary.name, () => {
            player.isInDialogue = true;
            playInteractSound();
            markExplored(boundary.name);
            displayDialogue(
              dialogueData[boundary.name],
              () => (player.isInDialogue = false),
            );
          });

          const labelText = getLabelText(boundary.name);
          if (labelText) {
            addWorldLabel(
              k,
              map,
              boundary.x + boundary.width / 2,
              boundary.y,
              labelText,
            );
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

  player.onCollide("dustbin", () => {
    player.isInDialogue = true;
    playInteractSound();
    markExplored("dustbin");
    displayDialogue(
      dialogueData.dustbin,
      () => (player.isInDialogue = false),
    );
  });

  const PLAYER_LABEL_OFFSET = -40;
  const playerLabelOutline = LABEL_OUTLINE_OFFSETS.map(([dx, dy]) =>
    k.add([
      k.text("Chirag", { size: 14 }),
      k.anchor("bot"),
      k.pos(
        player.worldPos().x + dx,
        player.worldPos().y + PLAYER_LABEL_OFFSET + dy,
      ),
      k.color(0, 0, 0),
      k.z(100),
    ]),
  );
  const playerLabel = k.add([
    k.text("Chirag", { size: 14 }),
    k.anchor("bot"),
    k.pos(player.worldPos().x, player.worldPos().y + PLAYER_LABEL_OFFSET),
    k.color(255, 255, 255),
    k.z(101),
  ]);

  setCamScale(k);
  k.onResize(() => {
    setCamScale(k);
  });

  k.onUpdate(() => {
    k.camPos(player.worldPos().x, player.worldPos().y);
    updateRoomBackground(player.pos.x, player.pos.y);

    const labelX = player.worldPos().x;
    const labelY = player.worldPos().y + PLAYER_LABEL_OFFSET;
    playerLabel.pos = k.vec2(labelX, labelY);
    playerLabelOutline.forEach((t, i) => {
      const [dx, dy] = LABEL_OUTLINE_OFFSETS[i];
      t.pos = k.vec2(labelX + dx, labelY + dy);
    });
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
