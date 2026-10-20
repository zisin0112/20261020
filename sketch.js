/**
 * 動物名字文字圖片配對測驗｜p5.js Web Editor 版
 *
 * 作答期間：
 * - 六張相關動物 GIF 與六個文字方格都持續留在畫面上。
 * - 將文字方格拖曳到圖片下方的放置區即可建立配對。
 * - 已放置的文字仍可再次拖曳；移到新位置時會自動清除原位置。
 * - 目標位置最多一個答案；若放到已占用位置，原答案會回到可用狀態。
 * - 結算前只顯示中性狀態，不透露正確答案或對錯。
 *
 * 所有 DOM 建立與查詢都從 setup() 呼叫的 ensureInterface() 開始，
 * 可直接放入 p5.js Web Editor 使用。
 */

const ANIMAL_LIBRARY = [
  {
    name: "貓咪",
    emoji: "🐱",
    gif: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Baiser_de_Nobah.gif",
    source: "Wikimedia Commons｜Baiser de Nobah.gif"
  },
  {
    name: "狗狗",
    emoji: "🐶",
    gif: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Descriptive_Zoopraxography_Greyhound_Galloping_Animated_12.gif",
    source: "Wikimedia Commons｜Greyhound galloping animation"
  },
  {
    name: "兔子",
    emoji: "🐰",
    gif: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Rabbit_0068.gif",
    source: "Wikimedia Commons｜Rabbit 0068.gif"
  },
  {
    name: "狐狸",
    emoji: "🦊",
    gif: "https://upload.wikimedia.org/wikipedia/commons/d/da/Fox_Dance_2022-08-11.gif",
    source: "Wikimedia Commons｜Fox Dance 2022-08-11.gif"
  },
  {
    name: "企鵝",
    emoji: "🐧",
    gif: "https://upload.wikimedia.org/wikipedia/commons/8/86/Ping%C3%BCino_africano%2C_Madrid_Zoo_Aquiarium%2C_2017.gif",
    source: "Wikimedia Commons｜African penguin GIF"
  },
  {
    name: "青蛙",
    emoji: "🐸",
    gif: "https://upload.wikimedia.org/wikipedia/commons/9/99/Frog.gif",
    source: "Wikimedia Commons｜Frog.gif"
  }
];

const TOTAL_QUESTIONS = 6;
let ui = null;
let game = null;
let interfaceReady = false;
let lastTimerPaint = 0;

function shuffled(items) {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function currentTime() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = String(Math.floor(value / 60)).padStart(2, "0");
  const remainder = String(value % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function injectStyles() {
  if (document.getElementById("animal-match-style")) return;

  const style = document.createElement("style");
  style.id = "animal-match-style";
  style.textContent = `
    :root {
      --ink: #1e2a3d;
      --muted: #68758c;
      --blue: #356ae6;
      --blue-soft: #eef4ff;
      --line: #dce5f5;
      --neutral-border: #b8c7df;
      --neutral-fill: #f3f6fb;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body {
      color: var(--ink);
      background:
        radial-gradient(circle at 8% 0%, #e6efff 0, transparent 28rem),
        radial-gradient(circle at 96% 0%, #fff0d9 0, transparent 25rem),
        #f7f9fd;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif;
    }
    button { font: inherit; }
    .app-shell { width: min(1180px, calc(100% - 28px)); margin: 0 auto; padding: 28px 0 42px; }
    .hero { display: flex; align-items: end; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
    .eyebrow { margin-bottom: 8px; color: var(--blue); font-size: .8rem; font-weight: 900; letter-spacing: .08em; }
    h1 { margin: 0; font-size: clamp(1.7rem, 4vw, 2.7rem); letter-spacing: -.045em; line-height: 1.1; }
    .subtitle { margin: 10px 0 0; color: var(--muted); line-height: 1.65; }
    .restart-button, .primary-button {
      border: 0; border-radius: 13px; padding: 11px 16px; cursor: pointer; color: white;
      background: var(--blue); font-weight: 850; box-shadow: 0 8px 18px rgba(53,106,230,.22);
    }
    .restart-button:hover, .primary-button:hover:not(:disabled) { background: #244fbf; }
    .primary-button:disabled { cursor: not-allowed; color: #8995a8; background: #dce3ed; box-shadow: none; }
    .scorebar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; }
    .stat { padding: 12px 15px; border: 1px solid var(--line); border-radius: 15px; background: rgba(255,255,255,.86); }
    .stat-label { color: var(--muted); font-size: .76rem; font-weight: 750; }
    .stat-value { margin-top: 3px; font-size: 1.25rem; font-weight: 900; }
    #status-message { min-height: 28px; margin: 0 3px 9px; color: var(--muted); font-size: .92rem; font-weight: 750; }
    #board {
      position: relative; padding: 21px; overflow: hidden; border: 1px solid #d8e3f5; border-radius: 24px;
      background: linear-gradient(145deg, rgba(255,255,255,.97), rgba(245,248,255,.97));
      box-shadow: 0 18px 48px rgba(36,67,128,.13); user-select: none; -webkit-user-select: none; touch-action: none;
    }
    #board canvas { display: none !important; }
    .section-title { margin: 0 0 11px; color: #7484a2; font-size: .76rem; font-weight: 900; letter-spacing: .1em; }
    .targets-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 13px; }
    .animal-card { min-width: 0; }
    .picture-panel {
      position: relative; height: clamp(130px, 16vw, 190px); overflow: hidden; display: grid; place-items: center;
      border: 2px solid #d8e3f7; border-radius: 16px 16px 10px 10px; background: linear-gradient(135deg,#edf4ff,#fff8e9);
      box-shadow: 0 8px 18px rgba(53,78,132,.1);
    }
    .picture-panel img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .25s ease; }
    .picture-panel img.loaded { opacity: 1; }
    .fallback-animal { position: absolute; display: grid; place-items: center; text-align: center; font-size: clamp(3.2rem, 7vw, 5rem); line-height: 1; }
    .fallback-animal small { display: block; margin-top: 7px; color: #7a89a6; font-size: .7rem; font-weight: 800; }
    .image-number { position: absolute; top: 8px; left: 8px; padding: 4px 8px; border-radius: 99px; color: #38537e; background: rgba(255,255,255,.86); font-size: .7rem; font-weight: 900; }
    .drop-zone {
      min-height: 57px; margin-top: 7px; display: grid; place-items: center; padding: 8px;
      border: 2px dashed var(--neutral-border); border-radius: 10px; color: #7183a4; background: var(--blue-soft);
      text-align: center; font-size: .82rem; font-weight: 800; transition: border-color .15s, background .15s, transform .15s;
    }
    .drop-zone.is-hover { border-color: var(--blue); background: #dfeaff; transform: translateY(-2px); }
    .drop-zone.is-placed { border-style: solid; border-color: #9eacc3; color: #334b70; background: var(--neutral-fill); }
    .animal-card.is-placed .picture-panel { border-color: #b8c5d9; }
    .options-area { margin-top: 28px; padding-top: 18px; border-top: 1px solid #e1e8f5; }
    .options-help { margin: -4px 0 12px; color: #7b879c; font-size: .8rem; }
    .options-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
    .label-option {
      min-height: 56px; display: grid; place-items: center; padding: 8px 10px; border: 2px solid #d9e4f7;
      border-radius: 13px; color: #294164; background: white; box-shadow: 0 7px 15px rgba(53,78,132,.08);
      cursor: grab; font-weight: 900; touch-action: none; transition: transform .15s, border-color .15s, opacity .15s;
    }
    .label-option:hover { transform: translateY(-2px); border-color: #9cb7ff; }
    .label-option.dragging { opacity: .3; cursor: grabbing; }
    .label-option.is-assigned { border-color: #9eacc3; background: #f3f6fb; color: #50627e; }
    .label-option.is-assigned::after { content: "可重新拖曳"; margin-top: 3px; color: #7b879c; font-size: .62rem; font-weight: 700; }
    .drag-ghost {
      position: fixed; z-index: 100; pointer-events: none; transform: translate(-50%, -50%) rotate(-2deg);
      min-width: 110px; padding: 12px 17px; border: 2px solid var(--blue); border-radius: 13px;
      color: #203b6b; background: white; box-shadow: 0 14px 30px rgba(53,106,230,.28); text-align: center; font-weight: 900;
    }
    .submit-area { display: flex; justify-content: center; margin-top: 22px; }
    .submit-area .primary-button { min-width: 180px; }
    .note { margin: 13px 3px 0; color: #7b879c; font-size: .77rem; line-height: 1.6; }
    .modal-backdrop { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 20px; background: rgba(24,39,72,.48); backdrop-filter: blur(7px); }
    .modal-backdrop[hidden] { display: none; }
    .result-modal { width: min(900px, 100%); max-height: min(90vh, 850px); overflow: auto; padding: 30px; border-radius: 24px; background: white; box-shadow: 0 25px 70px rgba(20,38,79,.3); }
    .result-heading { text-align: center; }
    .result-icon { font-size: 3rem; }
    .result-modal h2 { margin: 7px 0 5px; font-size: 1.8rem; }
    .result-summary { margin: 0 0 20px; color: var(--muted); text-align: center; }
    .result-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 22px; }
    .result-item { padding: 13px 8px; border-radius: 14px; background: #f2f6ff; text-align: center; }
    .result-item strong { display: block; color: var(--blue); font-size: 1.3rem; }
    .result-item span { color: var(--muted); font-size: .72rem; font-weight: 750; }
    .detail-title { margin: 22px 0 10px; color: #536783; font-size: .9rem; font-weight: 900; }
    .result-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
    .result-row { display: grid; grid-template-columns: 112px 1fr; gap: 13px; align-items: center; padding: 10px; border: 1px solid #dce5f5; border-radius: 15px; background: #fbfcff; }
    .result-picture { position: relative; height: 92px; overflow: hidden; display: grid; place-items: center; border-radius: 10px; background: linear-gradient(135deg,#edf4ff,#fff8e9); }
    .result-picture img { width: 100%; height: 100%; object-fit: cover; opacity: 0; }
    .result-picture img.loaded { opacity: 1; }
    .result-picture-fallback { position: absolute; font-size: 3.2rem; }
    .result-row h3 { margin: 0 0 7px; font-size: 1rem; }
    .answer-line { margin: 4px 0; color: #596b87; font-size: .83rem; line-height: 1.45; }
    .answer-line strong { color: #213753; }
    .result-badge { display: inline-block; margin-top: 7px; padding: 4px 9px; border-radius: 99px; font-size: .75rem; font-weight: 900; }
    .result-badge.correct { color: #137c5b; background: #e9f8f1; }
    .result-badge.incorrect { color: #b23a49; background: #ffedf0; }
    .result-modal .primary-button { display: block; margin: 0 auto; }
    @media (max-width: 900px) { .targets-grid, .options-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    @media (max-width: 680px) { .result-details { grid-template-columns: 1fr; } }
    @media (max-width: 560px) {
      .app-shell { width: min(100% - 18px, 520px); padding-top: 18px; }
      .hero { align-items: stretch; flex-direction: column; gap: 12px; }
      .restart-button { width: 100%; }
      .scorebar { gap: 7px; }
      .stat { padding: 10px; }
      .stat-label { font-size: .68rem; }
      .stat-value { font-size: 1.05rem; }
      #board { padding: 14px; border-radius: 19px; }
      .targets-grid, .options-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .picture-panel { height: 135px; }
      .drop-zone { min-height: 55px; font-size: .76rem; }
      .result-modal { padding: 21px 15px; }
      .result-grid { grid-template-columns: repeat(2,1fr); }
      .result-row { grid-template-columns: 88px 1fr; gap: 9px; }
      .result-picture { height: 78px; }
    }
  `;
  document.head.appendChild(style);
}

function ensureInterface() {
  if (interfaceReady) return ui;
  injectStyles();

  const shell = document.createElement("main");
  shell.className = "app-shell";
  shell.innerHTML = `
    <header class="hero">
      <div>
        <div class="eyebrow">🐾 p5.js INTERACTIVE QUIZ</div>
        <h1>動物名字配對</h1>
        <p class="subtitle">請把下方中文文字方格拖曳到相對應動物圖片下方的放置區。配對後題目與選項都會保留，可隨時更改答案。</p>
      </div>
      <button class="restart-button" id="restart-top" type="button">↻ 重新開始</button>
    </header>
    <section class="scorebar" aria-label="目前作答狀態">
      <div class="stat"><div class="stat-label">已放置題數</div><div class="stat-value" id="progress-value">0 / 6</div></div>
      <div class="stat"><div class="stat-label">作答進度</div><div class="stat-value" id="percent-value">0%</div></div>
      <div class="stat"><div class="stat-label">作答時間</div><div class="stat-value" id="time-value">00:00</div></div>
    </section>
    <p id="status-message" role="status" aria-live="polite">請開始拖曳；作答期間只會記錄放置，不顯示對錯。</p>
    <section id="board" aria-label="動物圖片與文字配對遊戲區">
      <div class="section-title">動態圖片與放置區</div>
      <div class="targets-grid" id="targets-grid"></div>
      <div class="options-area">
        <div class="section-title">中文文字方格（六個選項會一直保留）</div>
        <p class="options-help">已放置的文字仍可重新拖曳到其他圖片；更換時原位置會自動更新。</p>
        <div class="options-grid" id="options-grid"></div>
      </div>
      <div class="submit-area">
        <button class="primary-button" id="submit-button" type="button" disabled>完成作答</button>
      </div>
    </section>
    <p class="note">圖片來源為 Wikimedia Commons 公開 GIF。若網路或 GIF 載入失敗，會自動使用對應動物的 Emoji 備援。</p>
  `;
  document.body.appendChild(shell);

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.hidden = true;
  modal.innerHTML = `
    <section class="result-modal" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div class="result-heading">
        <div class="result-icon">🎉</div>
        <h2 id="result-title">六題完成</h2>
        <p class="result-summary">以下結果與答案現在才公開。</p>
      </div>
      <div class="result-grid">
        <div class="result-item"><strong id="result-total">6 / 6</strong><span>總題數</span></div>
        <div class="result-item"><strong id="result-score">0</strong><span>正確數</span></div>
        <div class="result-item"><strong id="result-percent">0%</strong><span>百分比</span></div>
        <div class="result-item"><strong id="result-time">00:00</strong><span>作答時間</span></div>
      </div>
      <div class="detail-title">逐題作答結果</div>
      <div class="result-details" id="result-details"></div>
      <button class="primary-button" id="restart-result" type="button">再玩一次</button>
    </section>
  `;
  document.body.appendChild(modal);

  ui = {
    shell,
    board: shell.querySelector("#board"),
    targetsGrid: shell.querySelector("#targets-grid"),
    optionsGrid: shell.querySelector("#options-grid"),
    status: shell.querySelector("#status-message"),
    progress: shell.querySelector("#progress-value"),
    percent: shell.querySelector("#percent-value"),
    timer: shell.querySelector("#time-value"),
    restartTop: shell.querySelector("#restart-top"),
    submit: shell.querySelector("#submit-button"),
    modal,
    resultTotal: modal.querySelector("#result-total"),
    resultScore: modal.querySelector("#result-score"),
    resultPercent: modal.querySelector("#result-percent"),
    resultTime: modal.querySelector("#result-time"),
    resultDetails: modal.querySelector("#result-details"),
    restartResult: modal.querySelector("#restart-result")
  };
  interfaceReady = true;
  return ui;
}

function setup() {
  const ready = ensureInterface();
  if (!ready) return;

  const canvas = createCanvas(1, 1);
  canvas.parent(ready.board);
  canvas.style("display", "none");
  pixelDensity(1);
  frameRate(30);

  ready.restartTop.addEventListener("click", startNewRound);
  ready.submit.addEventListener("click", submitGame);
  ready.restartResult.addEventListener("click", startNewRound);
  window.addEventListener("pointermove", handlePointerMove, { passive: false });
  window.addEventListener("pointerup", handlePointerUp, { passive: false });
  window.addEventListener("pointercancel", handlePointerUp, { passive: false });
  startNewRound();
}

function startNewRound() {
  if (!ui) return;
  cancelActiveDrag();
  game = {
    targets: shuffled(ANIMAL_LIBRARY).slice(0, TOTAL_QUESTIONS),
    options: [],
    placements: new Map(),
    sourceTargets: new Map(),
    drag: null,
    finished: false,
    startedAt: currentTime()
  };
  game.options = shuffled(game.targets);
  ui.modal.hidden = true;
  ui.status.textContent = "請把文字方格拖到圖片下方；作答期間不會顯示對錯。";
  buildCards();
  updateProgress();
  updateTimer();
}

function buildCards() {
  ui.targetsGrid.replaceChildren();
  ui.optionsGrid.replaceChildren();

  game.targets.forEach((animal, targetIndex) => {
    const card = document.createElement("article");
    card.className = "animal-card";
    card.dataset.targetIndex = String(targetIndex);
    card.innerHTML = `
      <div class="picture-panel" aria-label="第 ${targetIndex + 1} 題動態圖片">
        <span class="fallback-animal" aria-hidden="true">${animal.emoji}<small>圖片備援</small></span>
        <img alt="第 ${targetIndex + 1} 題動態圖片" referrerpolicy="no-referrer">
        <span class="image-number">圖片 ${targetIndex + 1}</span>
      </div>
      <div class="drop-zone" data-target-index="${targetIndex}" role="button" aria-label="第 ${targetIndex + 1} 題圖片下方的文字放置區">把文字放到這裡</div>
    `;
    const image = card.querySelector("img");
    image.addEventListener("load", () => image.classList.add("loaded"));
    image.addEventListener("error", () => {
      image.classList.remove("loaded");
      image.alt = `第 ${targetIndex + 1} 題使用 Emoji 圖片備援`;
    });
    image.src = animal.gif;
    ui.targetsGrid.appendChild(card);
  });

  game.options.forEach((animal, sourceIndex) => {
    const option = document.createElement("button");
    option.className = "label-option";
    option.type = "button";
    option.dataset.sourceIndex = String(sourceIndex);
    option.textContent = animal.name;
    option.setAttribute("aria-label", `拖曳文字方格：${animal.name}`);
    option.addEventListener("pointerdown", (event) => beginDrag(event, sourceIndex));
    ui.optionsGrid.appendChild(option);
  });
}

function beginDrag(event, sourceIndex) {
  if (!game || game.finished) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();

  const animal = game.options[sourceIndex];
  const option = ui.optionsGrid.querySelector(`[data-source-index="${sourceIndex}"]`);
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.textContent = animal.name;
  document.body.appendChild(ghost);
  moveGhost(ghost, event.clientX, event.clientY);
  if (option) option.classList.add("dragging");

  game.drag = { sourceIndex, pointerId: event.pointerId, ghost };
  clearDropHover();
  ui.status.textContent = "正在拖曳文字方格，請放到圖片下方的放置區。";
}

function handlePointerMove(event) {
  if (!game || !game.drag || event.pointerId !== game.drag.pointerId) return;
  event.preventDefault();
  moveGhost(game.drag.ghost, event.clientX, event.clientY);
  const targetIndex = findDropZoneAt(event.clientX, event.clientY);
  clearDropHover();
  if (targetIndex >= 0) {
    const zone = ui.targetsGrid.querySelector(`.drop-zone[data-target-index="${targetIndex}"]`);
    if (zone) zone.classList.add("is-hover");
  }
}

function handlePointerUp(event) {
  if (!game || !game.drag || event.pointerId !== game.drag.pointerId) return;
  event.preventDefault();
  const drag = game.drag;
  const targetIndex = findDropZoneAt(event.clientX, event.clientY);
  const source = ui.optionsGrid.querySelector(`[data-source-index="${drag.sourceIndex}"]`);
  if (source) source.classList.remove("dragging");
  if (drag.ghost && drag.ghost.remove) drag.ghost.remove();
  game.drag = null;
  clearDropHover();

  if (targetIndex < 0) {
    ui.status.textContent = "未放置。原本的配對保持不變。";
    return;
  }
  placeLabel(drag.sourceIndex, targetIndex);
}

function cancelActiveDrag() {
  if (!game || !game.drag) return;
  const source = ui && ui.optionsGrid
    ? ui.optionsGrid.querySelector(`[data-source-index="${game.drag.sourceIndex}"]`)
    : null;
  if (source) source.classList.remove("dragging");
  if (game.drag.ghost && game.drag.ghost.remove) game.drag.ghost.remove();
  game.drag = null;
  clearDropHover();
}

function moveGhost(ghost, clientX, clientY) {
  if (!ghost) return;
  ghost.style.left = `${clientX}px`;
  ghost.style.top = `${clientY}px`;
}

function findDropZoneAt(clientX, clientY) {
  const zones = ui.targetsGrid.querySelectorAll(".drop-zone");
  for (const zone of zones) {
    const rect = zone.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
      return Number(zone.dataset.targetIndex);
    }
  }
  return -1;
}

function clearDropHover() {
  if (!ui) return;
  ui.targetsGrid.querySelectorAll(".drop-zone.is-hover").forEach((zone) => zone.classList.remove("is-hover"));
}

function clearTarget(targetIndex) {
  const oldSourceIndex = game.placements.get(targetIndex);
  if (oldSourceIndex === undefined) return;

  game.placements.delete(targetIndex);
  game.sourceTargets.delete(oldSourceIndex);
  renderTarget(targetIndex);
  renderOption(oldSourceIndex);
}

function placeLabel(sourceIndex, targetIndex) {
  if (!game || game.finished) return;
  if (!ui.optionsGrid.querySelector(`[data-source-index="${sourceIndex}"]`)) return;
  if (!ui.targetsGrid.querySelector(`.drop-zone[data-target-index="${targetIndex}"]`)) return;

  const originalTarget = game.sourceTargets.get(sourceIndex);
  const occupyingSource = game.placements.get(targetIndex);

  if (originalTarget === targetIndex) {
    ui.status.textContent = "這個文字方格已在此位置；仍可繼續調整其他答案。";
    return;
  }

  // 同一文字移到新位置：先清除它在原位置的答案。
  if (originalTarget !== undefined) {
    game.placements.delete(originalTarget);
    game.sourceTargets.delete(sourceIndex);
    renderTarget(originalTarget);
  }

  // 新位置若已有其他文字，讓被換下的文字回到可用狀態。
  if (occupyingSource !== undefined && occupyingSource !== sourceIndex) {
    game.placements.delete(targetIndex);
    game.sourceTargets.delete(occupyingSource);
    renderOption(occupyingSource);
  }

  game.placements.set(targetIndex, sourceIndex);
  game.sourceTargets.set(sourceIndex, targetIndex);
  renderTarget(targetIndex);
  renderOption(sourceIndex);
  updateProgress();

  if (game.placements.size === TOTAL_QUESTIONS) {
    ui.status.textContent = "六個圖片位置都有答案，可以按「完成作答」結算；仍可繼續更改。";
  } else {
    ui.status.textContent = "已更新配對。答案尚未判定，可繼續重新拖曳。";
  }
}

function renderTarget(targetIndex) {
  const zone = ui.targetsGrid.querySelector(`.drop-zone[data-target-index="${targetIndex}"]`);
  const card = zone ? zone.closest(".animal-card") : null;
  if (!zone) return;

  const sourceIndex = game.placements.get(targetIndex);
  if (sourceIndex === undefined) {
    zone.textContent = "把文字放到這裡";
    zone.classList.remove("is-placed");
    if (card) card.classList.remove("is-placed");
    return;
  }

  zone.textContent = game.options[sourceIndex].name;
  zone.classList.add("is-placed");
  if (card) card.classList.add("is-placed");
}

function renderOption(sourceIndex) {
  const option = ui.optionsGrid.querySelector(`[data-source-index="${sourceIndex}"]`);
  if (!option) return;
  const assigned = game.sourceTargets.has(sourceIndex);
  option.classList.toggle("is-assigned", assigned);
  option.setAttribute("aria-label", assigned
    ? `已放置的文字方格：${game.options[sourceIndex].name}，可重新拖曳`
    : `拖曳文字方格：${game.options[sourceIndex].name}`);
}

function updateProgress() {
  if (!ui || !game) return;
  const placed = game.placements.size;
  ui.progress.textContent = `${placed} / ${TOTAL_QUESTIONS}`;
  ui.percent.textContent = `${Math.round(placed / TOTAL_QUESTIONS * 100)}%`;
  ui.submit.disabled = placed !== TOTAL_QUESTIONS || game.finished;
}

function updateTimer() {
  if (!ui || !game) return;
  ui.timer.textContent = formatTime((currentTime() - game.startedAt) / 1000);
}

function submitGame() {
  if (!game || game.finished || game.placements.size !== TOTAL_QUESTIONS) {
    if (ui) ui.status.textContent = "請先讓六個圖片位置都有答案。";
    return;
  }

  game.finished = true;
  cancelActiveDrag();
  const elapsed = (currentTime() - game.startedAt) / 1000;
  ui.status.textContent = "已完成作答，正在整理結果。";
  showResults(game, elapsed);
}

function showResults(completedGame, elapsed) {
  let correctCount = 0;
  const rows = [];

  completedGame.targets.forEach((targetAnimal, targetIndex) => {
    const sourceIndex = completedGame.placements.get(targetIndex);
    const userAnimal = completedGame.options[sourceIndex];
    const correct = userAnimal && userAnimal.name === targetAnimal.name;
    if (correct) correctCount += 1;

    rows.push(`
      <article class="result-row">
        <div class="result-picture" aria-label="第 ${targetIndex + 1} 題圖片">
          <span class="result-picture-fallback" aria-hidden="true">${targetAnimal.emoji}</span>
          <img alt="第 ${targetIndex + 1} 題圖片" data-result-image="${targetIndex}" referrerpolicy="no-referrer">
        </div>
        <div>
          <h3>第 ${targetIndex + 1} 題：${targetAnimal.name}</h3>
          <p class="answer-line">使用者答案：<strong>${userAnimal ? userAnimal.name : "未放置"}</strong></p>
          <p class="answer-line">正確答案：<strong>${targetAnimal.name}</strong></p>
          <span class="result-badge ${correct ? "correct" : "incorrect"}">${correct ? "答對" : "答錯"}</span>
        </div>
      </article>
    `);
  });

  ui.resultTotal.textContent = `${TOTAL_QUESTIONS} / ${TOTAL_QUESTIONS}`;
  ui.resultScore.textContent = String(correctCount);
  ui.resultPercent.textContent = `${Math.round(correctCount / TOTAL_QUESTIONS * 100)}%`;
  ui.resultTime.textContent = formatTime(elapsed);
  ui.resultDetails.innerHTML = rows.join("");

  completedGame.targets.forEach((animal, targetIndex) => {
    const image = ui.resultDetails.querySelector(`[data-result-image="${targetIndex}"]`);
    if (!image) return;
    image.addEventListener("load", () => image.classList.add("loaded"));
    image.addEventListener("error", () => image.classList.remove("loaded"));
    image.src = animal.gif;
  });

  ui.submit.disabled = true;
  ui.modal.hidden = false;
}

function draw() {
  // 遊戲畫面由 DOM 卡片與 GIF 負責；p5.js draw() 只更新計時。
  if (game && !game.finished && currentTime() - lastTimerPaint > 250) {
    updateTimer();
    lastTimerPaint = currentTime();
  }
}
