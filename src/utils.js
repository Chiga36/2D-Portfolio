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
  map.add([k.sprite("room-c"), k.pos(224, 176)]);

  const walls = [
    { x: 224, y: 216, w: 40, h: 8 }, // room top wall, left of doorway
    { x: 296, y: 216, w: 40, h: 8 }, // room top wall, right of doorway
    { x: 224, y: 224, w: 8, h: 96 }, // room left wall
    { x: 328, y: 224, w: 8, h: 96 }, // room right wall
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
