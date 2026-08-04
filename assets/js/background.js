/* =====================================================================
   background.js
   Injects the shared living background (gradient blobs + floating
   hearts / sakura petals / sparkles / bokeh) and the persistent
   music player. Runs on every page for a consistent, seamless feel.
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- Inject the base scene + particle field into the DOM ---------- */
  function injectScene() {
    const scene = document.createElement("div");
    scene.className = "bg-scene";
    scene.innerHTML = `
      <div class="bg-blob b1"></div>
      <div class="bg-blob b2"></div>
      <div class="bg-blob b3"></div>
    `;
    document.body.prepend(scene);

    const field = document.createElement("div");
    field.id = "particle-field";
    document.body.prepend(field);
    // keep scene behind field visually via z-index in CSS; order doesn't matter
    document.body.insertBefore(scene, field);
  }

  /* ---------- SVG shapes used for particles (outline style, not emoji) ---------- */
  const SHAPES = {
    heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7.2-4.6-9.7-9.1C.6 8.4 2 4.8 5.4 4.1c2-.4 3.9.5 5 2.2C11.5 4.6 13.4 3.7 15.4 4.1c3.4.7 4.8 4.3 3.1 7.8C19.2 16.4 12 21 12 21z"/></svg>`,
    petal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3c3 3 6 6 6 10a6 6 0 0 1-12 0c0-4 3-7 6-10z"/><path d="M12 3v16" stroke-width="1"/></svg>`,
    sparkle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>`
  };

  function spawnParticle(field) {
    const kinds = ["heart", "petal", "sparkle"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const el = document.createElement("div");
    el.className = "particle " + kind;

    const size = kind === "sparkle" ? 12 + Math.random() * 10 : 14 + Math.random() * 16;
    const left = Math.random() * 100;
    const duration = 16 + Math.random() * 14;
    const delay = Math.random() * 8;
    const drift = (Math.random() * 120 - 60) + "px";
    const spin = (Math.random() * 240 - 120) + "deg";

    el.style.left = left + "vw";
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.opacity = "0";
    el.style.animationDuration = duration + "s";
    el.style.animationDelay = delay + "s";
    el.style.setProperty("--drift", drift);
    el.style.setProperty("--spin", spin);
    el.innerHTML = SHAPES[kind];

    field.appendChild(el);
  }

  function spawnBokeh(field) {
    for (let i = 0; i < 10; i++) {
      const dot = document.createElement("div");
      dot.className = "bokeh";
      const size = 3 + Math.random() * 6;
      dot.style.width = size + "px";
      dot.style.height = size + "px";
      dot.style.left = Math.random() * 100 + "vw";
      dot.style.top = Math.random() * 100 + "vh";
      dot.style.animationDuration = 4 + Math.random() * 5 + "s";
      dot.style.animationDelay = Math.random() * 6 + "s";
      field.appendChild(dot);
    }
  }

  function initParticles() {
    const field = document.getElementById("particle-field");
    if (!field) return;
    const count = window.innerWidth < 640 ? 12 : 20;
    for (let i = 0; i < count; i++) spawnParticle(field);
    spawnBokeh(field);
  }

  /* ---------- Persistent music player ---------- */
  const MUSIC_KEY = "di_music_state_v2"; // { playing: bool, time: number }
  const MUSIC_SRC = "assets/music/piano-romantis.mp3";

  function initMusic() {
    let audio = document.getElementById("bg-audio");
    if (!audio) {
      audio = document.createElement("audio");
      audio.id = "bg-audio";
      audio.src = MUSIC_SRC;
      audio.loop = true;
      audio.preload = "auto";
      audio.addEventListener("error", () => {
        console.warn("DI: file musik gagal dimuat — cek apakah " + MUSIC_SRC + " benar-benar ada di folder itu.");
      });
      document.body.appendChild(audio);
    }

    const toggle = document.createElement("button");
    toggle.className = "music-toggle is-paused";
    toggle.setAttribute("aria-label", "Putar musik");
    toggle.innerHTML = `
      <span class="bars"><span style="animation-delay:0s"></span><span></span><span></span></span>
    `;
    document.body.appendChild(toggle);

    let state = { playing: true, time: 0 };
    try {
      const saved = JSON.parse(localStorage.getItem(MUSIC_KEY) || "null");
      if (saved) state = saved;
    } catch (e) { /* ignore */ }

    function reflectUI() {
      toggle.classList.toggle("is-paused", !state.playing);
      toggle.setAttribute("aria-label", state.playing ? "Jeda musik" : "Putar musik");
    }

    /* ---------- Hint bubble: shown only while autoplay is blocked ---------- */
    let hintEl = null;
    function showHint() {
      if (hintEl) return;
      hintEl = document.createElement("div");
      hintEl.className = "music-hint";
      hintEl.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
        <span>Tekan untuk mainkan musik</span>
      `;
      document.body.appendChild(hintEl);
      toggle.classList.add("needs-tap");
    }
    function hideHint() {
      if (hintEl) {
        hintEl.remove();
        hintEl = null;
      }
      toggle.classList.remove("needs-tap");
    }

    // Attempt to autoplay only if the user hasn't explicitly paused it before.
    // (state.playing defaults to true so first-ever visit tries to autoplay;
    // if the person taps pause, that choice is remembered on later pages.)
    audio.currentTime = state.time || 0;
    if (state.playing) {
      const p = audio.play();
      if (p && p.then) {
        p.then(() => {
          state.playing = true;
          reflectUI();
          hideHint();
          persist();
        }).catch(() => {
          state.playing = false;
          reflectUI();
          showHint();
        });
      } else {
        state.playing = true;
      }
    }
    reflectUI();

    toggle.addEventListener("click", () => {
      if (audio.paused) {
        audio.play().catch(() => {});
        state.playing = true;
        hideHint();
      } else {
        audio.pause();
        state.playing = false;
      }
      reflectUI();
      persist();
    });

    /* ---------- Unlock sound on the very first interaction anywhere on
       the page (e.g. tapping "Mulai"), so people don't have to hunt for
       the tiny music button just to hear it. Only kicks in if the
       person hasn't explicitly paused it themselves. ---------- */
    function unlockOnFirstInteraction() {
      if (!state.playing) return; // they already chose to pause — respect that
      const p = audio.play();
      if (p && p.then) {
        p.then(() => {
          state.playing = true;
          reflectUI();
          hideHint();
          persist();
        }).catch(() => {});
      }
    }
    ["pointerdown", "keydown", "touchstart"].forEach((evt) => {
      document.addEventListener(evt, unlockOnFirstInteraction, { once: true, capture: true });
    });

    function persist() {
      state.time = audio.currentTime || 0;
      try { localStorage.setItem(MUSIC_KEY, JSON.stringify(state)); } catch (e) {}
    }

    setInterval(persist, 1000);
    window.addEventListener("beforeunload", persist);
  }

  document.addEventListener("DOMContentLoaded", function () {
    injectScene();
    initParticles();
    initMusic();
  });
})();
