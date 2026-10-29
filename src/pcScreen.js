import { pcSections } from "./pcContent";

// Main keyboard rows (key counts), drawn left of the arrow cluster.
const KEY_ROWS = [14, 14, 13, 12];

function buildKeyboard(keysEl) {
  const main = document.createElement("div");
  main.className = "pc-keys-main";
  for (const count of KEY_ROWS) {
    const row = document.createElement("div");
    row.className = "pc-key-row";
    for (let i = 0; i < count; i++) {
      const key = document.createElement("span");
      key.className = "pc-key";
      row.appendChild(key);
    }
    main.appendChild(row);
  }
  const spaceRow = document.createElement("div");
  spaceRow.className = "pc-key-row";
  for (const cls of ["", "", "pc-key-space", "", ""]) {
    const key = document.createElement("span");
    key.className = `pc-key ${cls}`.trim();
    spaceRow.appendChild(key);
  }
  main.appendChild(spaceRow);

  const arrows = document.createElement("div");
  arrows.className = "pc-keys-arrows";
  const makeArrow = (dir) => {
    const key = document.createElement("span");
    key.className = `pc-key pc-key-arrow pc-key-${dir}`;
    key.dataset.dir = dir;
    const glyph = document.createElement("span");
    glyph.className = `pc-arrow-glyph ${dir}`;
    key.appendChild(glyph);
    return key;
  };
  const top = document.createElement("div");
  top.className = "pc-key-row";
  top.appendChild(makeArrow("up"));
  const bottom = document.createElement("div");
  bottom.className = "pc-key-row";
  bottom.append(makeArrow("left"), makeArrow("down"), makeArrow("right"));
  arrows.append(top, bottom);

  keysEl.replaceChildren(main, arrows);
  return {
    left: arrows.querySelector(".pc-key-left"),
    right: arrows.querySelector(".pc-key-right"),
  };
}

function pressKey(keyEl) {
  keyEl.classList.remove("pressed");
  void keyEl.offsetWidth; // restart if pressed again quickly
  keyEl.classList.add("pressed");
  setTimeout(() => keyEl.classList.remove("pressed"), 220);
}

function renderItem(item, compact) {
  const panel = document.createElement("div");
  panel.className = compact ? "pc-panel compact" : "pc-panel";

  const heading = document.createElement("p");
  heading.className = "pc-panel-heading";
  heading.textContent = item.heading;
  panel.appendChild(heading);

  if (item.text) {
    const text = document.createElement("p");
    text.className = "pc-panel-text";
    text.textContent = item.text;
    panel.appendChild(text);
  }
  if (item.meta) {
    const meta = document.createElement("p");
    meta.className = "pc-panel-meta";
    meta.textContent = item.meta;
    panel.appendChild(meta);
  }
  if (item.link) {
    const p = document.createElement("p");
    p.className = "pc-panel-meta";
    const a = document.createElement("a");
    a.href = item.link.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = item.link.text;
    p.appendChild(a);
    panel.appendChild(p);
  }
  return panel;
}

// onOpen/onClose let the game lock and unlock player movement; onClose only
// fires once the power-off animation has finished.
export function setupPcScreen({ onOpen, onClose }) {
  const screenEl = document.getElementById("pc-screen");
  const crtEl = document.getElementById("pc-crt");
  const tabsEl = document.getElementById("pc-tabs");
  const contentEl = document.getElementById("pc-content");
  const prevBtn = document.getElementById("pc-prev");
  const nextBtn = document.getElementById("pc-next");
  const pageEl = document.getElementById("pc-page");
  const closeBtn = document.getElementById("pc-close");
  const arrowKeys = buildKeyboard(document.getElementById("pc-keys"));

  const deskEl = document.querySelector(".pc-desk");
  const keyboardEl = document.querySelector(".pc-keyboard");

  // the drawn keyboard has a fixed pixel width, so shrink it to fit narrow
  // screens (zoom keeps the layout box in step with the visual size)
  function fitKeyboard() {
    keyboardEl.style.zoom = "";
    const free = deskEl.clientWidth - 16;
    const natural = keyboardEl.offsetWidth;
    if (free > 0 && natural > free) keyboardEl.style.zoom = String(free / natural);
  }
  window.addEventListener("resize", fitKeyboard);

  let index = 0;
  let open = false;
  let closing = false;

  function render() {
    tabsEl.replaceChildren(
      ...pcSections.map((section, i) => {
        const tab = document.createElement("button");
        tab.className = i === index ? "pc-tab active" : "pc-tab";
        tab.textContent = section.title;
        tab.addEventListener("click", () => selectTab(i));
        return tab;
      }),
    );
    const { items, compact } = pcSections[index];
    contentEl.replaceChildren(...items.map((item) => renderItem(item, compact)));
    contentEl.scrollTop = 0;

    const prev = pcSections[index - 1];
    const next = pcSections[index + 1];
    prevBtn.style.visibility = prev ? "visible" : "hidden";
    nextBtn.style.visibility = next ? "visible" : "hidden";
    prevBtn.querySelector(".pc-nav-label").textContent = prev?.title ?? "";
    nextBtn.querySelector(".pc-nav-label").textContent = next?.title ?? "";
    pageEl.textContent = `${index + 1} / ${pcSections.length}`;
  }

  function goTo(target) {
    if (target < 0 || target >= pcSections.length || target === index) return;
    crtEl.classList.add("switching");
    setTimeout(() => {
      index = target;
      render();
      crtEl.classList.remove("switching");
    }, 120);
  }

  // arrow input always presses the drawn key, even at the first/last page
  function step(dir) {
    pressKey(dir > 0 ? arrowKeys.right : arrowKeys.left);
    goTo(index + dir);
  }

  function selectTab(target) {
    if (target === index) return;
    pressKey(target > index ? arrowKeys.right : arrowKeys.left);
    goTo(target);
  }

  function show() {
    index = 0;
    render();
    open = true;
    closing = false;
    screenEl.classList.remove("closing", "opening");
    screenEl.style.display = "flex";
    fitKeyboard();
    void screenEl.offsetWidth; // restart the power-on animation on every open
    screenEl.classList.add("opening");
    onOpen();
  }

  function hide() {
    if (!open || closing) return;
    closing = true;
    screenEl.classList.remove("opening");
    screenEl.classList.add("closing");
  }

  crtEl.addEventListener("animationend", (e) => {
    if (e.animationName !== "pc-crt-off") return;
    screenEl.style.display = "none";
    screenEl.classList.remove("closing");
    open = false;
    closing = false;
    onClose();
  });

  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  arrowKeys.left.addEventListener("click", () => step(-1));
  arrowKeys.right.addEventListener("click", () => step(1));
  closeBtn.addEventListener("click", hide);
  window.addEventListener("keydown", (e) => {
    if (!open || closing) return;
    if (e.key === "Escape") hide();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });

  return { show };
}
