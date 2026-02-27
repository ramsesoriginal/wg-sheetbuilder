"use strict";

console.log("wg-sheetbuilder: main.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const btn = document.getElementById("btn-smoke-test");
  if (btn) {
    btn.addEventListener("click", () => {
      // Minimal proof JS is wired correctly.
      alert("Smoke test OK — JS is running.");
    });
  }
});
