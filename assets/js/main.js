/* =====================================================================
   main.js
   Shared utilities: localStorage answer store, page transitions,
   ripple micro-interaction, and small DOM helpers used across pages.
   ===================================================================== */

const DI = (function () {
  "use strict";

  const STORE_KEY = "di_answers";

  /* ---------- Answer storage ---------- */
  function getAnswers() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function setAnswer(key, value) {
    const answers = getAnswers();
    answers[key] = value;
    localStorage.setItem(STORE_KEY, JSON.stringify(answers));
  }

  /* ---------- Navigation with blur/scale/fade exit transition ---------- */
  function goTo(url) {
    const content = document.querySelector(".page-content");
    if (!content) {
      window.location.href = url;
      return;
    }
    content.classList.add("leaving");
    setTimeout(() => {
      window.location.href = url;
    }, 480);
  }

  /* ---------- Ripple effect for buttons ---------- */
  function attachRipple(el) {
    el.addEventListener("click", function (e) {
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height) * 1.4;
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
      ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
      el.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  }

  function initRipples() {
    document.querySelectorAll(".btn").forEach(attachRipple);
  }

  /* ---------- Simple reveal-on-load stagger for elements with .fade-in-up ---------- */
  function initReveal() {
    const items = document.querySelectorAll(".fade-in-up");
    items.forEach((el, i) => {
      el.style.transition = `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${0.08 * i}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${0.08 * i}s`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        });
      });
    });
  }

  /* ---------- Progress dots helper ---------- */
  function paintProgress(step, total) {
    const track = document.querySelector(".progress-track");
    if (!track) return;
    track.innerHTML = "";
    for (let i = 1; i <= total; i++) {
      const dot = document.createElement("span");
      dot.className = "progress-dot";
      if (i < step) dot.classList.add("is-done");
      if (i === step) dot.classList.add("is-current");
      track.appendChild(dot);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initRipples();
    initReveal();
  });

  return { getAnswers, setAnswer, goTo, paintProgress, attachRipple };
})();
