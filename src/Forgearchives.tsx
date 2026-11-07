import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
const FORGE_CSS = `
/* The Forge & Archives — one clean stylesheet (fa-*). */

.fa-page, .fa-page * { box-sizing: border-box; }

.fa-page {
  min-height: 100vh;
  padding: 32px 24px 96px;
  background-image:
    linear-gradient(rgba(8, 11, 10, 0.78), rgba(8, 11, 10, 0.78)),
    url("/paradise-hotel-background.jpg");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.fa-wrap {
  width: min(1480px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
}

.fa-panel,
.fa-block,
.fa-plate,
.fa-hero,
.fa-step,
.fa-rail {
  position: relative;
  min-width: 0;
  background: var(--corners), var(--stone);
  border: 1px solid #060504;
  border-radius: var(--radius-lg);
  box-shadow: var(--frame);
}

.fa-panel { padding: 32px; }

.fa-eyebrow {
  color: var(--brass);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.fa-panel h1,
.fa-title {
  margin: 6px 0 4px;
  color: var(--brass-hi);
  font-family: var(--font-display);
  font-weight: 600;
}

.fa-title { font-size: 30px; }
.fa-muted { margin: 4px 0 0; color: var(--ash); }

.fa-empty {
  margin: 12px 0;
  padding: 18px;
  color: var(--ash);
  text-align: center;
  border: 1px dashed var(--line-strong);
}

/* Long words wrap instead of spilling over neighbours. */
.fa-title, .fa-epithet, .fa-muted, .fa-row-name, .fa-preview-name,
.fa-field p, .fa-item p, .fa-notes, .fa-dl dd, .fa-skillgrid {
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Numbers: lining figures so "1" never looks like "I". */
.fa-counts strong, .fa-vitals strong, .fa-die strong, .fa-preview-stats b,
.fa-skillgrid b, .fa-item-stats b, .fa-seg small, .fa-dice-pick button {
  font-family: var(--font-body);
  font-weight: 700;
  font-variant-numeric: lining-nums;
  font-feature-settings: "lnum" 1;
}

/* ---------- header ---------- */

.fa-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.fa-head-right { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.fa-counts { display: flex; gap: 10px; }

.fa-counts div {
  display: grid;
  gap: 2px;
  min-width: 96px;
  padding: 10px 14px;
  text-align: center;
  background: var(--tile);
  border: 1px solid var(--line);
}

.fa-counts strong { color: var(--brass-hi); font-size: 26px; line-height: 1; }

.fa-counts span {
  color: var(--ash);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

/* ---------- workbench ---------- */

.fa-bench {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

@media (min-width: 960px) {
  .fa-bench { grid-template-columns: 350px minmax(0, 1fr); }
  .fa-rail { position: sticky; top: 16px; max-height: calc(100vh - 32px); }
}

.fa-rail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  overflow: hidden;
}

/* + Dreadling / + Dreadful: stacked, always inside the column */
.fa-forge-row { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }

.fa-forge-row .ph-btn {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fa-search,
.fa-filter-row select {
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  color: var(--bone);
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid var(--line);
  font: inherit;
}

.fa-filter-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.fa-seg { display: flex; }

.fa-seg button {
  flex: 1;
  min-width: 0;
  min-height: 38px;
  padding: 6px 4px;
  color: var(--ash);
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--line);
  font-family: var(--font-caps);
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
}

.fa-seg button + button { border-left: 0; }
.fa-seg button small { margin-left: 3px; color: var(--brass-dim); font-size: 11px; }

.fa-seg button.is-on {
  color: var(--brass-hi);
  background: var(--surface);
  border-color: var(--line-strong);
  box-shadow: inset 0 -2px 0 var(--ember-hi);
}

.fa-seg button.is-on small { color: var(--ember-hi); }

.fa-rows {
  display: grid;
  gap: 10px;
  align-content: start;
  min-height: 0;
  max-height: 420px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
}

@media (min-width: 960px) { .fa-rows { max-height: none; flex: 1; } }

.fa-row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  text-align: left;
  color: inherit;
  background: var(--tile);
  border: 1px solid var(--line);
  border-left: 3px solid var(--brass-dim);
  cursor: pointer;
}

.fa-row:hover { border-color: var(--line-strong); }
.fa-row.is-dreadling { border-left-color: var(--rust); }
.fa-row.is-dreadful { border-left-color: var(--ember-hi); }
.fa-row.is-selected { background: rgba(140, 29, 19, 0.16); border-color: var(--ember-hi); }

.fa-row-img {
  display: grid;
  place-items: center;
  width: 52px;
  height: 64px;
  overflow: hidden;
  color: var(--brass);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--line);
}

.fa-row-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.fa-row-main { display: grid; gap: 4px; align-content: center; min-width: 0; }

.fa-row-name {
  color: var(--bone);
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.1;
}

.fa-row-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }

.fa-recno {
  color: var(--brass-dim);
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
}

.fa-recno.is-inline { color: var(--brass); font-size: 12px; }
.fa-detail { min-width: 0; }
.fa-welcome { padding: 40px 28px; }

/* ---------- stamp, threat, status ---------- */

.fa-stamp {
  display: inline-block;
  padding: 1px 7px;
  color: var(--brass);
  border: 2px solid currentColor;
  font-family: var(--font-caps);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  white-space: nowrap;
  transform: rotate(-3deg);
  opacity: 0.9;
}

.fa-stamp.is-unclassified { color: var(--ash); }
.fa-stamp.is-confidential { color: #c98f4a; }
.fa-stamp.is-classified { color: var(--ember-hi); }
.fa-stamp.is-redacted { color: var(--bone); background: #000; border-color: var(--ember); }

.fa-threat { display: inline-flex; gap: 3px; }
.fa-threat i { width: 8px; height: 8px; border: 1px solid var(--brass-dim); transform: rotate(45deg); }
.fa-threat i.is-on { background: var(--ember-hi); border-color: var(--ember-hi); box-shadow: 0 0 6px rgba(208, 71, 46, 0.6); }

.fa-status {
  padding: 1px 8px;
  color: var(--ash);
  border: 1px solid var(--line);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.fa-status.is-active { color: var(--ember-hi); border-color: rgba(208, 71, 46, 0.5); }
.fa-status.is-contained { color: var(--fluor); border-color: rgba(159, 179, 162, 0.5); }
.fa-status.is-restored { color: var(--brass-hi); border-color: var(--line-strong); }

/* ---------- case file (read view) ---------- */

.fa-case { display: grid; gap: 24px; min-width: 0; }

.fa-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  padding: 32px;
  background: linear-gradient(120deg, rgba(140, 29, 19, 0.12), transparent 55%), var(--corners), var(--stone);
}

@media (min-width: 720px) { .fa-hero { grid-template-columns: 190px minmax(0, 1fr); } }

.fa-portrait-wrap { display: grid; gap: 8px; align-content: start; min-width: 0; }
.fa-portrait-wrap .fa-seg button { min-height: 32px; font-size: 11px; }

.fa-portrait {
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  color: var(--brass);
  font-size: 44px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--line-strong);
}

.fa-portrait img { width: 100%; height: 100%; object-fit: cover; display: block; }

.fa-hero-main { display: grid; gap: 10px; align-content: start; min-width: 0; }
.fa-hero-main .fa-title { margin: 0; font-size: 36px; line-height: 1.05; }
.fa-epithet { color: var(--bone-soft); font-family: var(--font-display); font-size: 19px; font-style: italic; }
.fa-hero-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.fa-dossier-actions { display: flex; flex-wrap: wrap; gap: 8px; }

.fa-plate { display: grid; gap: 16px; padding: 24px; }

.fa-vitals { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 8px; }

.fa-vitals div {
  display: grid;
  gap: 2px;
  padding: 10px 8px;
  text-align: center;
  background: var(--tile);
  border: 1px solid var(--line);
}

.fa-vitals span, .fa-die span {
  color: var(--ash);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.fa-vitals strong { color: var(--brass-hi); font-size: 24px; line-height: 1.1; }
.fa-vitals .is-dread strong { color: var(--ember-hi); }

.fa-dice-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 8px; }
.fa-die { display: grid; gap: 2px; padding: 10px 6px; text-align: center; background: var(--tile); border: 1px solid var(--line); }
.fa-die strong { color: var(--brass-hi); font-size: 22px; }

/* Two columns only when each has real room; otherwise they stack. */
.fa-case-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
  gap: 24px;
  align-items: start;
}

.fa-col { display: grid; gap: 24px; min-width: 0; align-content: start; }
.fa-block { padding: 28px; overflow: hidden; }

.fa-sub {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px;
  color: var(--brass);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.fa-sub::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, var(--line-strong), transparent); }
.fa-sub.is-gap { margin-top: 28px; }

.fa-field { margin: 16px 0 0; }
.fa-block .fa-field:first-of-type { margin-top: 0; }
.fa-field span { color: var(--ash); font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
.fa-field p { margin: 4px 0 0; color: var(--bone-soft); white-space: pre-wrap; }

.fa-dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 8px 16px; margin: 0; }
.fa-dl dt { align-self: center; color: var(--ash); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; }
.fa-dl dd { margin: 0; color: var(--bone); }

.fa-skillgrid { display: flex; flex-wrap: wrap; gap: 6px 16px; color: var(--ash); font-size: 14px; }
.fa-skillgrid b { color: var(--brass-hi); }

.fa-list { display: grid; gap: 12px; }
.fa-item { display: grid; gap: 8px; min-width: 0; padding: 16px 18px; background: var(--tile); border: 1px solid var(--line); }
.fa-item-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 12px; }
.fa-item strong { color: var(--brass-hi); font-family: var(--font-display); font-size: 19px; }
.fa-item p { margin: 0; color: var(--bone-soft); white-space: pre-wrap; }
.fa-item.is-dread { border-color: rgba(208, 71, 46, 0.55); }
.fa-item.is-dread strong { color: var(--ember-hi); }

.fa-tags { display: inline-flex; flex-wrap: wrap; gap: 6px; }
.fa-tags em { padding: 1px 8px; color: var(--ash); border: 1px solid var(--line); font-size: 10px; font-style: normal; letter-spacing: 0.12em; text-transform: uppercase; }
.fa-item-stats { display: flex; flex-wrap: wrap; gap: 6px 18px; color: var(--ash); font-size: 13px; }
.fa-item-stats b { color: var(--brass-hi); }

.fa-trigger { color: var(--bone-soft); }
.fa-trigger span { margin-right: 6px; color: var(--ember-hi); font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }

.fa-notes {
  margin: 0;
  padding: 14px;
  color: var(--parch-ink);
  background: var(--parch);
  border: 1px solid var(--parch-line);
  font-family: var(--font-display);
  font-size: 17px;
  white-space: pre-wrap;
}

/* ---------- editor ---------- */

.fa-editor { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-items: start; }
.fa-editor-side { display: grid; gap: 12px; align-content: start; min-width: 0; }
.fa-editor-main { display: grid; gap: 24px; min-width: 0; }

/* Narrow/medium: side column becomes a compact top strip */
.fa-stepnav { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.fa-actions-side { display: none; }

/* Wide only: true two-column editor (side column never scrolls on its own) */
@media (min-width: 1560px) {
  .fa-editor { grid-template-columns: 270px minmax(0, 1fr); }
  .fa-editor-side { position: sticky; top: 24px; }
  .fa-stepnav { grid-template-columns: minmax(0, 1fr); }
  .fa-actions-side { display: block; }
  .fa-actions-bottom { display: none; }
}

.fa-preview {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  padding: 18px;
  background: var(--corners), var(--stone);
  border: 1px solid var(--line-strong);
}

.fa-preview .fa-eyebrow { overflow-wrap: anywhere; letter-spacing: 0.12em; }

.fa-preview-imgs { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
.fa-preview-imgs.has-two { grid-template-columns: repeat(2, minmax(0, 1fr)); }

.fa-preview-img {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 150px;
  overflow: hidden;
  color: var(--brass);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--line);
}

.fa-preview-img img { width: 100%; height: 100%; object-fit: cover; display: block; }

.fa-img-tag {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 2px 6px;
  color: var(--brass-hi);
  background: rgba(0, 0, 0, 0.7);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-align: center;
  text-transform: uppercase;
}

.fa-preview-name { color: var(--brass-hi); font-family: var(--font-display); font-size: 24px; font-weight: 600; }
.fa-preview-stats { display: flex; flex-wrap: wrap; gap: 4px 14px; color: var(--ash); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
.fa-preview-stats b { margin-left: 4px; color: var(--brass-hi); font-size: 16px; letter-spacing: 0; }

.fa-stepnav { display: grid; gap: 6px; }

.fa-stepnav button {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 6px 12px;
  color: var(--bone-soft);
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--line);
  font-family: var(--font-caps);
  font-size: 14px;
  letter-spacing: 0.08em;
  text-align: left;
  cursor: pointer;
}

.fa-stepnav button:hover { color: var(--brass-hi); border-color: var(--line-strong); }

.fa-stepnav button span {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  color: var(--brass);
  border: 1px solid var(--line-strong);
  font-family: var(--font-body);
  font-size: 12px;
}

.fa-stepnav button.is-bad, .fa-stepnav button.is-bad span { color: var(--ember-hi); border-color: var(--ember-hi); }

.fa-editor-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 18px;
  background: var(--surface);
  border: 1px solid var(--line-strong);
}

.fa-actions-side .fa-editor-actions { display: grid; }
.fa-actions-side .fa-editor-actions .ph-btn { width: 100%; }
.fa-editor-actions .fa-err { flex: 1 1 100%; }

.fa-step { padding: 30px; scroll-margin-top: 16px; }

.fa-step > header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line-soft);
}

.fa-step h3 { margin: 0; color: var(--brass-hi); font-family: var(--font-display); font-size: 22px; font-weight: 600; }
.fa-step header p { margin: 2px 0 0; color: var(--ash); font-size: 14px; }

.fa-step-n {
  flex: none;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: var(--ember-hi);
  background: rgba(140, 29, 19, 0.15);
  border: 1px solid var(--ember-hi);
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1;
}

.fa-step-body { display: grid; gap: 18px; min-width: 0; }

.fa-lbl { display: grid; gap: 6px; min-width: 0; }
.fa-lbl-t { color: var(--brass); font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }

.fa-lbl input, .fa-lbl select, .fa-lbl textarea {
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  color: var(--bone);
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid var(--line);
  font: inherit;
}

/* Dropdown lists (including grouped saves) stay readable on dark themes. */
.fa-lbl select option { color: var(--bone); background: #111; }
.fa-lbl select optgroup { color: var(--brass); background: #111; font-style: normal; }

.fa-lbl textarea { resize: vertical; }
.fa-lbl.has-error input, .fa-lbl.has-error select, .fa-lbl.has-error textarea { border-color: var(--ember-hi); }
.fa-hint { margin: 0; color: var(--ash); font-size: 12px; }
.fa-err { color: var(--ember-hi); font-size: 12px; font-weight: 600; }

.fa-sub-label { margin-top: 6px; color: var(--brass); font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }

.fa-grid-2, .fa-grid-3, .fa-grid-4 { display: grid; gap: 18px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 640px) {
  .fa-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .fa-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .fa-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1100px) { .fa-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

.fa-dice-edit { display: grid; gap: 14px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 760px) { .fa-dice-edit { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

.fa-dice-card { display: grid; gap: 10px; padding: 16px; background: var(--tile); border: 1px solid var(--line); }
.fa-dice-title { display: grid; gap: 2px; }
.fa-dice-title strong { color: var(--brass-hi); font-family: var(--font-display); font-size: 19px; }
.fa-dice-title span { color: var(--ash); font-size: 12px; }
.fa-dice-pick { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px; }

.fa-dice-pick button {
  min-height: 40px;
  color: var(--ash);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--line);
  font-size: 15px;
  cursor: pointer;
}

.fa-dice-pick button.is-on { color: var(--ember-hi); background: rgba(140, 29, 19, 0.22); border-color: var(--ember-hi); }

.fa-abilities { display: grid; gap: 16px; }

.fa-ability {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 20px;
  background: var(--tile);
  border: 1px solid var(--line);
  border-left: 3px solid var(--rust);
}

.fa-ability.is-dread { border-left-color: var(--ember-hi); border-color: rgba(208, 71, 46, 0.5); }

.fa-ability-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--brass);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.fa-x { width: 34px; height: 34px; color: var(--ember-hi); background: transparent; border: 1px solid rgba(208, 71, 46, 0.5); cursor: pointer; }

.fa-skill-edit { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (min-width: 900px) { .fa-skill-edit { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.fa-skill-col { display: grid; gap: 8px; align-content: start; padding: 14px; background: var(--tile); border: 1px solid var(--line); }
.fa-skill-col strong { color: var(--brass-hi); font-family: var(--font-display); font-size: 18px; }

.fa-threat-pick { display: flex; gap: 8px; align-items: center; min-height: 42px; }
.fa-threat-pick button { width: 22px; height: 22px; background: transparent; border: 1px solid var(--brass-dim); transform: rotate(45deg); cursor: pointer; }
.fa-threat-pick button.is-on { background: var(--ember-hi); border-color: var(--ember-hi); box-shadow: 0 0 6px rgba(208, 71, 46, 0.6); }

.fa-record-file { display: grid; gap: 18px; }

@media (max-width: 720px) {
  .fa-page { padding: 16px 12px 80px; }
  .fa-wrap, .fa-bench, .fa-case, .fa-editor-main { gap: 16px; }
  .fa-panel, .fa-step, .fa-block { padding: 18px; }
  .fa-hero { padding: 18px; gap: 18px; }
  .fa-plate { padding: 16px; }
  .fa-ability { padding: 14px; }
  .fa-hero-main .fa-title { font-size: 30px; }
}
`;

/* =========================================================
   THE FORGE & ARCHIVES — one workbench
   Left: the records. Right: the open record, or the editor
   for creating / changing one. DM only.

   Saving goes through the callbacks passed in by App.tsx
   (existing Supabase tables "dreadlings" and "dreadfuls" plus
   localStorage). All the newer fields live inside each record's
   existing `data` JSON, so no database change is needed and old
   records keep working.

   New in this version:
   - Saves can be any core OR any skill.
   - "None" (also N/A, -, —) is accepted in every optional field.
   - Every record can have a second picture: the transformed form
     (stored as `transformedImage`).
   ========================================================= */

type Kind = "dreadling" | "dreadful";

const CLASSIFICATIONS = [
  "Unclassified",
  "Restricted",
  "Confidential",
  "Classified",
  "Redacted",
];
const STATUSES = ["Active", "Dormant", "Contained", "Restored", "Unknown"];
const DICE = ["1d4", "1d6", "1d8", "1d10", "1d12", "1d20"];
const PREFIX: Record<Kind, string> = { dreadling: "PH-DL", dreadful: "PH-DF" };
const KIND_LABEL: Record<Kind, string> = {
  dreadling: "Dreadling",
  dreadful: "Dreadful",
};

const ABILITY_TYPES = ["Action", "Dreadful Action", "Reaction", "Passive"];
const ABILITY_USES = [
  "At will",
  "Once per round",
  "Once per encounter",
  "Limited",
];
const CORES = ["Mind", "Body", "Heart", "Ego"] as const;
const CORE_SKILLS: Record<string, string[]> = {
  Mind: ["Perception", "Knowledge", "Analysis"],
  Body: ["Might", "Agility", "Endurance"],
  Heart: ["Empathy", "Influence", "Expression"],
  Ego: ["Memory", "Self", "Psyche"],
};

/* Everything a save can be rolled against: the four cores, then each core's skills. */
const SAVE_OPTIONS: { group: string; options: string[] }[] = [
  { group: "Cores", options: [...CORES] },
  ...CORES.map((core) => ({
    group: `${core} skills`,
    options: CORE_SKILLS[core],
  })),
];

const ROLES = [
  "Caretaker",
  "Dreamer",
  "Guardian",
  "Adversary",
  "Archivist",
  "Diplomat",
  "Watcher",
  "Vessel",
  "Timekeeper",
  "Doorman",
  "Overseer",
  "Mnēmosynē",
];

function pad(value: number): string {
  return String(value).padStart(4, "0");
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/* ---------- "None" handling ---------- */

/* Anything in this list counts as "nothing here" and is always allowed. */
const NONE_VALUES = ["none", "n/a", "na", "-", "—", "–"];

function isNone(text?: string): boolean {
  return NONE_VALUES.includes((text || "").trim().toLowerCase());
}

/* True only when there is something real to show. */
function hasValue(text?: string): boolean {
  return !!text && text.trim() !== "" && !isNone(text);
}

/* Turns "None" into an empty string so saved data stays clean. */
function cleanText(text?: string): string {
  return hasValue(text) ? (text as string).trim() : "";
}

/* Number from a form field. "None" and blanks count as 0. */
function toNum(text: string): number {
  if (!text.trim() || isNone(text)) return 0;
  return Number(text);
}

/* A dice expression like 2d6+3, d8, 1d10-1. Empty or "None" is allowed. */
function diceError(text: string): string {
  if (!text.trim() || isNone(text)) return "";
  const t = text.replace(/\s+/g, "").toLowerCase();
  const ok = /^(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(t) && /d\d+/.test(t);
  return ok ? "" : "Use dice like 2d6+3, d8 or 1d10-1, or write None.";
}

/* ---------- structured pieces ---------- */

type Ability = {
  name: string;
  type: string;
  range: string;
  uses: string;
  damage: string;
  save: string;
  description: string;
};

type DreadfulAction = {
  name: string;
  trigger: string;
  range: string;
  damage: string;
  save: string;
  description: string;
};

function blankAbility(): Ability {
  return {
    name: "",
    type: "Action",
    range: "",
    uses: "At will",
    damage: "",
    save: "",
    description: "",
  };
}

function toAbility(raw: any): Ability {
  return {
    name: raw?.name || "",
    type: ABILITY_TYPES.includes(raw?.type) ? raw.type : "Action",
    range: raw?.range || "",
    uses: ABILITY_USES.includes(raw?.uses) ? raw.uses : "At will",
    damage: raw?.damage || "",
    save: raw?.save || "",
    description: raw?.description || "",
  };
}

function toAction(raw: any): DreadfulAction {
  return {
    name: raw?.name || "",
    trigger: raw?.trigger || "",
    range: raw?.range || "",
    damage: raw?.damage || "",
    save: raw?.save || "",
    description: raw?.description || "",
  };
}

function abilityHasContent(a: Ability): boolean {
  return !!(a.name.trim() || a.description.trim());
}

function cleanAbility(a: Ability): Ability {
  return {
    ...a,
    range: cleanText(a.range),
    damage: cleanText(a.damage),
    save: cleanText(a.save),
  };
}

function cleanAction(a: DreadfulAction): DreadfulAction {
  return {
    ...a,
    trigger: cleanText(a.trigger),
    range: cleanText(a.range),
    damage: cleanText(a.damage),
    save: cleanText(a.save),
  };
}

/* ---------- entries (one per record) ---------- */

type Entry = {
  kind: Kind;
  raw: any;
  id: string;
  name: string;
  image: string;
  number: string;
  classification: string;
  threat: number;
  status: string;
  notes: string;
  summary: string;
};

function toEntries(kind: Kind, list: any[]): Entry[] {
  return list.map((raw, index) => {
    const level = Number(raw.corruptionLevel) || 1;
    const defaultThreat =
      kind === "dreadful" ? clamp(Math.ceil(level / 2), 1, 5) : 1;
    return {
      kind,
      raw,
      id: String(raw.id),
      name:
        raw.name ||
        (kind === "dreadling" ? "Unnamed Dreadling" : "Unnamed Dreadful"),
      image: kind === "dreadling" ? raw.imageUrl || "" : raw.portrait || "",
      number: raw.recordNumber || `${PREFIX[kind]}-${pad(index + 1)}`,
      classification: CLASSIFICATIONS.includes(raw.classification)
        ? raw.classification
        : "Unclassified",
      threat: clamp(Number(raw.threatLevel) || defaultThreat, 1, 5),
      status: STATUSES.includes(raw.recordStatus)
        ? raw.recordStatus
        : kind === "dreadful" && raw.isRestored
          ? "Restored"
          : "Active",
      notes: raw.recordNotes || "",
      summary:
        kind === "dreadling"
          ? raw.sourceOfTrauma || raw.appearance || ""
          : raw.corruptionDescription || "",
    };
  });
}

function nextNumber(kind: Kind, entries: Entry[]): string {
  let max = 0;
  for (const entry of entries) {
    if (entry.kind !== kind) continue;
    const match = /-(\d+)$/.exec(entry.number);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${PREFIX[kind]}-${pad(max + 1)}`;
}

/* ---------- small display pieces ---------- */

function Threat({ level }: { level: number }) {
  return (
    <span className="fa-threat" title={`Threat level ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= level ? "is-on" : ""} />
      ))}
    </span>
  );
}

function Stamp({ value }: { value: string }) {
  return <span className={"fa-stamp is-" + value.toLowerCase()}>{value}</span>;
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={"fa-status is-" + value.toLowerCase()}>{value}</span>
  );
}

/* =========================================================
   MAIN
   ========================================================= */

type View =
  | { type: "empty" }
  | { type: "dossier"; kind: Kind; id: string }
  | { type: "edit"; kind: Kind; editId: string | null };

export default function ForgeArchives({
  isDM,
  dreadlings,
  dreadfuls,
  guests,
  onSaveDreadling,
  onSaveDreadful,
  onDelete,
  onBack,
}: {
  isDM: boolean;
  dreadlings: any[];
  dreadfuls: any[];
  guests: any[];
  onSaveDreadling: (record: any) => Promise<void> | void;
  onSaveDreadful: (record: any) => Promise<void> | void;
  onDelete: (kind: Kind, id: string) => Promise<void> | void;
  onBack: () => void;
}) {
  const [view, setView] = useState<View>({ type: "empty" });
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | Kind>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const detailRef = useRef<HTMLDivElement | null>(null);

  const entries = useMemo(
    () => [
      ...toEntries("dreadling", dreadlings),
      ...toEntries("dreadful", dreadfuls),
    ],
    [dreadlings, dreadfuls]
  );

  /* On narrow screens the detail sits below the list: bring it into view. */
  useEffect(() => {
    if (view.type === "empty") return;
    if (window.matchMedia?.("(max-width: 959px)").matches) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [view]);

  if (!isDM) {
    return (
      <main className="fa-page">
        <style>{FORGE_CSS}</style>
        <div className="fa-wrap">
          <section className="fa-panel">
            <div className="fa-eyebrow">Paradise Hotel · Records Division</div>
            <h1>Restricted</h1>
            <p className="fa-muted">
              These archives are sealed. Only the Game Master may open them.
            </p>
            <button type="button" className="ph-btn" onClick={onBack}>
              Return
            </button>
          </section>
        </div>
      </main>
    );
  }

  const visible = entries
    .filter((e) => kindFilter === "all" || e.kind === kindFilter)
    .filter((e) => statusFilter === "all" || e.status === statusFilter)
    .filter((e) => classFilter === "all" || e.classification === classFilter)
    .filter((e) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.number.toLowerCase().includes(q) ||
        e.classification.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.number.localeCompare(b.number));

  const openEntry =
    view.type === "dossier"
      ? entries.find((e) => e.kind === view.kind && e.id === view.id)
      : undefined;

  const editEntry =
    view.type === "edit" && view.editId
      ? entries.find((e) => e.kind === view.kind && e.id === view.editId)
      : undefined;

  const selectedKey =
    view.type === "dossier"
      ? view.kind + view.id
      : view.type === "edit" && view.editId
        ? view.kind + view.editId
        : "";

  return (
    <main className="fa-page">
      <style>{FORGE_CSS}</style>
      <div className="fa-wrap">
        <header className="fa-panel fa-head">
          <div>
            <div className="fa-eyebrow">Paradise Hotel · Records Division</div>
            <h1>The Forge &amp; Archives</h1>
            <p className="fa-muted">
              Forge new horrors and keep the files on the ones already
              stalking the halls. All in one place.
            </p>
          </div>

          <div className="fa-head-right">
            <div className="fa-counts">
              <div>
                <strong>{dreadlings.length}</strong>
                <span>Dreadlings</span>
              </div>
              <div>
                <strong>{dreadfuls.length}</strong>
                <span>Dreadfuls</span>
              </div>
            </div>
            <button
              type="button"
              className="ph-btn ph-btn-secondary"
              onClick={onBack}
            >
              ‹ Back to Management
            </button>
          </div>
        </header>

        <div className="fa-bench">
          {/* ================= LEFT: THE RECORDS ================= */}
          <aside className="fa-rail">
            <div className="fa-forge-row">
              <button
                type="button"
                className="ph-btn"
                onClick={() =>
                  setView({ type: "edit", kind: "dreadling", editId: null })
                }
              >
                + Dreadling
              </button>
              <button
                type="button"
                className="ph-btn"
                onClick={() =>
                  setView({ type: "edit", kind: "dreadful", editId: null })
                }
              >
                + Dreadful
              </button>
            </div>

            <input
              type="search"
              className="fa-search"
              value={search}
              placeholder="Search name, number, class…"
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="fa-seg" role="tablist" aria-label="Record type">
              {(
                [
                  ["all", "All", entries.length],
                  ["dreadling", "Dreadlings", dreadlings.length],
                  ["dreadful", "Dreadfuls", dreadfuls.length],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  className={kindFilter === value ? "is-on" : ""}
                  onClick={() => setKindFilter(value)}
                >
                  {label} <small>{count}</small>
                </button>
              ))}
            </div>

            <div className="fa-filter-row">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="all">Any class</option>
                {CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Any status</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="fa-rows">
              {entries.length === 0 && (
                <p className="fa-empty">
                  The archives are empty. Forge the first record.
                </p>
              )}
              {entries.length > 0 && visible.length === 0 && (
                <p className="fa-empty">No records match.</p>
              )}

              {visible.map((e) => (
                <button
                  key={e.kind + e.id}
                  type="button"
                  className={
                    "fa-row is-" +
                    e.kind +
                    (selectedKey === e.kind + e.id ? " is-selected" : "")
                  }
                  onClick={() =>
                    setView({ type: "dossier", kind: e.kind, id: e.id })
                  }
                >
                  <span className="fa-row-img">
                    {e.image ? <img src={e.image} alt="" /> : <span>◈</span>}
                  </span>
                  <span className="fa-row-main">
                    <span className="fa-recno">{e.number}</span>
                    <span className="fa-row-name">{e.name}</span>
                    <span className="fa-row-meta">
                      <Stamp value={e.classification} />
                      <Threat level={e.threat} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* ================= RIGHT: THE OPEN RECORD ================= */}
          <section className="fa-detail" ref={detailRef}>
            {view.type === "empty" && (
              <div className="fa-panel fa-welcome">
                <div className="fa-eyebrow">Nothing open</div>
                <h2 className="fa-title">Choose a record, or forge a new one</h2>
                <p className="fa-muted">
                  Pick a file from the list to read it, edit it, or delete it.
                  Use <strong>+ Dreadling</strong> or <strong>+ Dreadful</strong>{" "}
                  to open a blank forge right here.
                </p>
              </div>
            )}

            {view.type === "dossier" && !openEntry && (
              <div className="fa-panel">
                <p className="fa-empty">That record no longer exists.</p>
              </div>
            )}

            {view.type === "dossier" && openEntry && (
              <Dossier
                key={openEntry.kind + openEntry.id}
                entry={openEntry}
                onEdit={() =>
                  setView({
                    type: "edit",
                    kind: openEntry.kind,
                    editId: openEntry.id,
                  })
                }
                onDelete={async () => {
                  if (!window.confirm(`Permanently delete ${openEntry.name}?`)) {
                    return;
                  }
                  await onDelete(openEntry.kind, openEntry.id);
                  setView({ type: "empty" });
                }}
              />
            )}

            {view.type === "edit" && view.kind === "dreadling" && (
              <DreadlingEditor
                key={view.editId || "new-dreadling"}
                initial={editEntry ? editEntry.raw : null}
                defaultNumber={nextNumber("dreadling", entries)}
                onCancel={() =>
                  setView(
                    editEntry
                      ? { type: "dossier", kind: "dreadling", id: editEntry.id }
                      : { type: "empty" }
                  )
                }
                onSave={async (record) => {
                  await onSaveDreadling(record);
                  setView({
                    type: "dossier",
                    kind: "dreadling",
                    id: String(record.id),
                  });
                }}
              />
            )}

            {view.type === "edit" && view.kind === "dreadful" && (
              <DreadfulEditor
                key={view.editId || "new-dreadful"}
                initial={editEntry ? editEntry.raw : null}
                guests={guests}
                existing={dreadfuls}
                defaultNumber={nextNumber("dreadful", entries)}
                onCancel={() =>
                  setView(
                    editEntry
                      ? { type: "dossier", kind: "dreadful", id: editEntry.id }
                      : { type: "empty" }
                  )
                }
                onSave={async (record) => {
                  await onSaveDreadful(record);
                  setView({
                    type: "dossier",
                    kind: "dreadful",
                    id: String(record.id),
                  });
                }}
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   DOSSIER (read view)
   ========================================================= */

function AbilityCard({ ability }: { ability: Ability }) {
  const tags = [ability.type, ability.range, ability.uses].filter(
    (t) => hasValue(t) && t !== "At will"
  );
  return (
    <div className="fa-item">
      <div className="fa-item-head">
        <strong>{ability.name || "Unnamed ability"}</strong>
        <span className="fa-tags">
          {tags.map((t) => (
            <em key={t}>{t}</em>
          ))}
        </span>
      </div>
      {(hasValue(ability.damage) || hasValue(ability.save)) && (
        <div className="fa-item-stats">
          {hasValue(ability.damage) && (
            <span>
              Damage <b>{ability.damage}</b>
            </span>
          )}
          {hasValue(ability.save) && (
            <span>
              Save <b>{ability.save}</b>
            </span>
          )}
        </div>
      )}
      {ability.description && <p>{ability.description}</p>}
    </div>
  );
}

function ActionCard({ action }: { action: DreadfulAction }) {
  const has =
    action.name ||
    action.description ||
    hasValue(action.trigger) ||
    hasValue(action.damage);
  if (!has) return <p className="fa-muted">No Dreadful Action recorded.</p>;
  return (
    <div className="fa-item is-dread">
      <div className="fa-item-head">
        <strong>{action.name || "Unnamed Dreadful Action"}</strong>
        <span className="fa-tags">
          {hasValue(action.range) && <em>{action.range}</em>}
        </span>
      </div>
      {hasValue(action.trigger) && (
        <p className="fa-trigger">
          <span>Trigger</span> {action.trigger}
        </p>
      )}
      {(hasValue(action.damage) || hasValue(action.save)) && (
        <div className="fa-item-stats">
          {hasValue(action.damage) && (
            <span>
              Damage <b>{action.damage}</b>
            </span>
          )}
          {hasValue(action.save) && (
            <span>
              Save <b>{action.save}</b>
            </span>
          )}
        </div>
      )}
      {action.description && <p>{action.description}</p>}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="fa-field">
      <span>{label}</span>
      <p>{value && value.trim() ? value : "None recorded."}</p>
    </div>
  );
}

function Dossier({
  entry,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const r = entry.raw;
  const isDreadling = entry.kind === "dreadling";
  const [form, setForm] = useState<"base" | "transformed">("base");

  const transformed: string = r.transformedImage || "";
  const shownImage =
    form === "transformed" && transformed ? transformed : entry.image;

  const abilities: Ability[] = (
    Array.isArray(isDreadling ? r.abilities : r.dreadfulAbilities)
      ? isDreadling
        ? r.abilities
        : r.dreadfulAbilities
      : []
  )
    .map(toAbility)
    .filter(abilityHasContent);

  const guestAbilities: [string, any][] =
    !isDreadling && r.abilities && !Array.isArray(r.abilities)
      ? Object.entries(r.abilities).filter(
          ([, a]: [string, any]) => a && (a.name || a.description)
        )
      : [];

  const action = toAction(r.dreadfulAction);
  const skills: [string, number][] =
    !isDreadling && r.skills ? Object.entries(r.skills) : [];
  const roles = [r.role, r.role2].filter(Boolean).join(" · ");

  return (
    <section className="fa-case">
      <div className="fa-hero">
        <div className="fa-portrait-wrap">
          <div className="fa-portrait">
            {shownImage ? (
              <img src={shownImage} alt={entry.name} />
            ) : (
              <span>◈</span>
            )}
          </div>
          {transformed && (
            <div className="fa-seg" role="tablist" aria-label="Form">
              <button
                type="button"
                className={form === "base" ? "is-on" : ""}
                onClick={() => setForm("base")}
              >
                Normal
              </button>
              <button
                type="button"
                className={form === "transformed" ? "is-on" : ""}
                onClick={() => setForm("transformed")}
              >
                Transformed
              </button>
            </div>
          )}
        </div>

        <div className="fa-hero-main">
          <div className="fa-eyebrow">
            {KIND_LABEL[entry.kind]} Record ·{" "}
            <span className="fa-recno is-inline">{entry.number}</span>
          </div>
          <h2 className="fa-title">{entry.name}</h2>
          {(r.title || roles) && (
            <div className="fa-epithet">
              {[r.title, roles].filter(Boolean).join(" — ")}
            </div>
          )}
          <div className="fa-hero-tags">
            <Stamp value={entry.classification} />
            <StatusBadge value={entry.status} />
            <Threat level={entry.threat} />
          </div>
          <div className="fa-dossier-actions">
            <button type="button" className="ph-btn" onClick={onEdit}>
              Edit Record
            </button>
            <button
              type="button"
              className="ph-btn ph-btn-secondary"
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="fa-plate">
        <div className="fa-vitals">
          <div>
            <span>HP</span>
            <strong>
              {isDreadling
                ? (r.hp ?? "—")
                : `${r.hp ?? 0}/${r.maxHp ?? r.hp ?? 0}`}
            </strong>
          </div>
          <div>
            <span>AC</span>
            <strong>{r.ac ?? "—"}</strong>
          </div>
          <div>
            <span>Move</span>
            <strong>{r.movement ?? "—"}</strong>
          </div>
          {isDreadling ? (
            <div>
              <span>Init</span>
              <strong>{formatBonus(Number(r.initiativeBonus) || 0)}</strong>
            </div>
          ) : (
            <>
              <div className="is-dread">
                <span>Dread</span>
                <strong>{r.dread ?? 0}</strong>
              </div>
              <div>
                <span>Memory</span>
                <strong>
                  {r.memoryPool ?? 0}/{r.maxMemoryPool ?? 0}
                </strong>
              </div>
            </>
          )}
        </div>

        <div className="fa-dice-row">
          {CORES.map((core) => (
            <div key={core} className="fa-die">
              <span>{core}</span>
              <strong>{r[core.toLowerCase() + "Die"] || "—"}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="fa-case-cols">
        <div className="fa-col">
          <div className="fa-block">
            <h3 className="fa-sub">File</h3>
            <dl className="fa-dl">
              <dt>Record</dt>
              <dd>{entry.number}</dd>
              <dt>Class</dt>
              <dd>{entry.classification}</dd>
              {!isDreadling && (
                <>
                  <dt>Last room</dt>
                  <dd>{r.room || "Unassigned"}</dd>
                  <dt>Corruption</dt>
                  <dd>Level {r.corruptionLevel ?? "—"}</dd>
                </>
              )}
            </dl>
          </div>

          {isDreadling ? (
            <div className="fa-block">
              <h3 className="fa-sub">Manifestation</h3>
              <Field label="Source of trauma" value={r.sourceOfTrauma} />
              <Field label="Appearance" value={r.appearance} />
              <Field label="Behavior" value={r.behavior} />
            </div>
          ) : (
            <div className="fa-block">
              <h3 className="fa-sub">Corruption</h3>
              <Field label="What changed" value={r.corruptionDescription} />
            </div>
          )}

          {skills.length > 0 && (
            <div className="fa-block">
              <h3 className="fa-sub">Skills</h3>
              <div className="fa-skillgrid">
                {skills.map(([name, value]) => (
                  <span key={name}>
                    {name} <b>{value}</b>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="fa-col">
          <div className="fa-block">
            <h3 className="fa-sub">
              {isDreadling ? "Abilities" : "Corrupted abilities"}
            </h3>
            {abilities.length === 0 ? (
              <p className="fa-muted">
                {isDreadling && r.encounterAbility
                  ? r.encounterAbility
                  : "No abilities recorded."}
              </p>
            ) : (
              <div className="fa-list">
                {abilities.map((a, i) => (
                  <AbilityCard key={i} ability={a} />
                ))}
              </div>
            )}

            {guestAbilities.length > 0 && (
              <>
                <h3 className="fa-sub is-gap">Original abilities</h3>
                <div className="fa-list">
                  {guestAbilities.map(([core, a]) => (
                    <div key={core} className="fa-item">
                      <div className="fa-item-head">
                        <strong>{a.name || "Unnamed ability"}</strong>
                        <span className="fa-tags">
                          <em>{core}</em>
                        </span>
                      </div>
                      {a.description && <p>{a.description}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="fa-block">
            <h3 className="fa-sub">Dreadful Action</h3>
            <ActionCard action={action} />
          </div>

          <div className="fa-block">
            <h3 className="fa-sub">Archivist&apos;s notes</h3>
            <p className="fa-notes">{entry.notes || "No notes filed."}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatBonus(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

/* =========================================================
   EDITOR PIECES
   ========================================================= */

function Step({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="fa-step" id={`fa-step-${n}`}>
      <header>
        <span className="fa-step-n">{n}</span>
        <div>
          <h3>{title}</h3>
          {hint && <p>{hint}</p>}
        </div>
      </header>
      <div className="fa-step-body">{children}</div>
    </section>
  );
}

function Lbl({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className={"fa-lbl" + (error ? " has-error" : "")}>
      <span className="fa-lbl-t">{label}</span>
      {children}
      {error ? (
        <span className="fa-err">{error}</span>
      ) : hint ? (
        <span className="fa-hint">{hint}</span>
      ) : null}
    </label>
  );
}

const DIE_HINT: Record<string, string> = {
  Mind: "Perception · Knowledge · Analysis",
  Body: "Might · Agility · Endurance",
  Heart: "Empathy · Influence · Expression",
  Ego: "Memory · Self · Psyche",
};

function DiceBlock({
  values,
  onChange,
}: {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="fa-dice-edit">
      {CORES.map((core) => {
        const key = core.toLowerCase() + "Die";
        return (
          <div key={key} className="fa-dice-card">
            <div className="fa-dice-title">
              <strong>{core}</strong>
              <span>{DIE_HINT[core]}</span>
            </div>
            <div className="fa-dice-pick">
              {DICE.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={values[key] === d ? "is-on" : ""}
                  onClick={() => onChange(key, d)}
                >
                  {d.replace("1", "")}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Save dropdown: None, the four cores, then every skill grouped by core. */
function SaveSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">None</option>
      {SAVE_OPTIONS.map((g) => (
        <optgroup key={g.group} label={g.group}>
          {g.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function AbilityEditor({
  abilities,
  onChange,
  errors,
}: {
  abilities: Ability[];
  onChange: (next: Ability[]) => void;
  errors: Record<string, string>;
}) {
  function set(index: number, patch: Partial<Ability>) {
    onChange(abilities.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  return (
    <div className="fa-abilities">
      {abilities.length === 0 && (
        <p className="fa-muted">No abilities yet.</p>
      )}

      {abilities.map((a, i) => (
        <div key={i} className="fa-ability">
          <div className="fa-ability-head">
            <span>Ability {i + 1}</span>
            <button
              type="button"
              className="fa-x"
              aria-label={`Remove ability ${i + 1}`}
              onClick={() => onChange(abilities.filter((_, n) => n !== i))}
            >
              ✕
            </button>
          </div>

          <div className="fa-grid-2">
            <Lbl label="Name" error={errors[`ability-${i}-name`]}>
              <input
                type="text"
                value={a.name}
                placeholder="e.g. Hollow Scream"
                onChange={(e) => set(i, { name: e.target.value })}
              />
            </Lbl>
            <Lbl label="Type">
              <select
                value={a.type}
                onChange={(e) => set(i, { type: e.target.value })}
              >
                {ABILITY_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Lbl>
          </div>

          <div className="fa-grid-4">
            <Lbl label="Range" hint="e.g. 30 ft, Touch, None">
              <input
                type="text"
                value={a.range}
                onChange={(e) => set(i, { range: e.target.value })}
              />
            </Lbl>
            <Lbl label="Uses">
              <select
                value={a.uses}
                onChange={(e) => set(i, { uses: e.target.value })}
              >
                {ABILITY_USES.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </Lbl>
            <Lbl
              label="Damage / effect dice"
              error={errors[`ability-${i}-damage`]}
            >
              <input
                type="text"
                value={a.damage}
                placeholder="2d6+3 or None"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => set(i, { damage: e.target.value })}
              />
            </Lbl>
            <Lbl label="Save">
              <SaveSelect
                value={a.save}
                onChange={(v) => set(i, { save: v })}
              />
            </Lbl>
          </div>

          <Lbl label="What it does">
            <textarea
              rows={2}
              value={a.description}
              placeholder="Conditions, targets, extra rules…"
              onChange={(e) => set(i, { description: e.target.value })}
            />
          </Lbl>
        </div>
      ))}

      <button
        type="button"
        className="ph-btn ph-btn-secondary"
        onClick={() => onChange([...abilities, blankAbility()])}
      >
        + Add ability
      </button>
    </div>
  );
}

function ActionEditor({
  action,
  onChange,
  errors,
}: {
  action: DreadfulAction;
  onChange: (next: DreadfulAction) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="fa-ability is-dread">
      <Lbl label="Action name">
        <input
          type="text"
          value={action.name}
          placeholder="e.g. Grasp of Despair"
          onChange={(e) => onChange({ ...action, name: e.target.value })}
        />
      </Lbl>
      <Lbl
        label="Trigger"
        hint="When does the Dreadful Action happen? (e.g. when a guest rolls a natural 1)"
      >
        <input
          type="text"
          value={action.trigger}
          onChange={(e) => onChange({ ...action, trigger: e.target.value })}
        />
      </Lbl>
      <div className="fa-grid-3">
        <Lbl label="Range">
          <input
            type="text"
            value={action.range}
            onChange={(e) => onChange({ ...action, range: e.target.value })}
          />
        </Lbl>
        <Lbl label="Damage / effect dice" error={errors["action-damage"]}>
          <input
            type="text"
            value={action.damage}
            placeholder="3d8 or None"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => onChange({ ...action, damage: e.target.value })}
          />
        </Lbl>
        <Lbl label="Save">
          <SaveSelect
            value={action.save}
            onChange={(v) => onChange({ ...action, save: v })}
          />
        </Lbl>
      </div>
      <Lbl label="Effect">
        <textarea
          rows={3}
          value={action.description}
          placeholder="What happens. Conditions, targets, extra rules…"
          onChange={(e) => onChange({ ...action, description: e.target.value })}
        />
      </Lbl>
    </div>
  );
}

/* Editor preview: shows the normal picture and, when set, the transformed one. */
function PreviewImages({
  base,
  transformed,
}: {
  base: string;
  transformed: string;
}) {
  const two = !!transformed.trim();
  return (
    <div className={"fa-preview-imgs" + (two ? " has-two" : "")}>
      <div className="fa-preview-img">
        {base ? <img src={base} alt="" /> : <span>◈</span>}
        {two && <span className="fa-img-tag">Normal</span>}
      </div>
      {two && (
        <div className="fa-preview-img">
          <img src={transformed} alt="" />
          <span className="fa-img-tag">Transformed</span>
        </div>
      )}
    </div>
  );
}

/* The editor layout: a sticky side column (preview, step list, save)
   next to the form. On narrow screens it stacks. */
function EditorShell({
  preview,
  steps,
  actions,
  children,
}: {
  preview: ReactNode;
  steps: { n: number; title: string; bad: boolean }[];
  actions: ReactNode;
  children: ReactNode;
}) {
  function jump(n: number) {
    document
      .getElementById(`fa-step-${n}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="fa-editor">
      <aside className="fa-editor-side">
        {preview}
        <nav className="fa-stepnav" aria-label="Form sections">
          {steps.map((step) => (
            <button
              key={step.n}
              type="button"
              className={step.bad ? "is-bad" : ""}
              onClick={() => jump(step.n)}
            >
              <span>{step.n}</span>
              {step.title}
            </button>
          ))}
        </nav>
        <div className="fa-actions-side">{actions}</div>
      </aside>

      <div className="fa-editor-main">
        {children}
        <div className="fa-actions-bottom">{actions}</div>
      </div>
    </div>
  );
}

/* ---------- record file ---------- */

type MetaDraft = {
  recordNumber: string;
  classification: string;
  threatLevel: number;
  recordStatus: string;
  recordNotes: string;
};

function metaFrom(initial: any, defaultNumber: string, kind: Kind): MetaDraft {
  const level = Number(initial?.corruptionLevel) || 1;
  return {
    recordNumber: initial?.recordNumber || defaultNumber,
    classification: CLASSIFICATIONS.includes(initial?.classification)
      ? initial.classification
      : "Unclassified",
    threatLevel: clamp(
      Number(initial?.threatLevel) ||
        (kind === "dreadful" ? Math.ceil(level / 2) : 1),
      1,
      5
    ),
    recordStatus: STATUSES.includes(initial?.recordStatus)
      ? initial.recordStatus
      : kind === "dreadful" && initial?.isRestored
        ? "Restored"
        : "Active",
    recordNotes: initial?.recordNotes || "",
  };
}

function RecordFile({
  meta,
  onChange,
}: {
  meta: MetaDraft;
  onChange: (next: MetaDraft) => void;
}) {
  return (
    <div className="fa-record-file">
      <div className="fa-grid-4">
        <Lbl label="Record number">
          <input
            type="text"
            value={meta.recordNumber}
            onChange={(e) => onChange({ ...meta, recordNumber: e.target.value })}
          />
        </Lbl>
        <Lbl label="Classification">
          <select
            value={meta.classification}
            onChange={(e) =>
              onChange({ ...meta, classification: e.target.value })
            }
          >
            {CLASSIFICATIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Lbl>
        <Lbl label="Status">
          <select
            value={meta.recordStatus}
            onChange={(e) => onChange({ ...meta, recordStatus: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Lbl>
        <div className="fa-lbl">
          <span className="fa-lbl-t">Threat level</span>
          <div className="fa-threat-pick">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={n <= meta.threatLevel ? "is-on" : ""}
                aria-label={`Threat ${n}`}
                onClick={() => onChange({ ...meta, threatLevel: n })}
              />
            ))}
          </div>
        </div>
      </div>
      <Lbl label="Archivist's notes">
        <textarea
          rows={3}
          value={meta.recordNotes}
          placeholder="Anything worth remembering about this record…"
          onChange={(e) => onChange({ ...meta, recordNotes: e.target.value })}
        />
      </Lbl>
    </div>
  );
}

function EditorActions({
  saving,
  label,
  errorCount,
  onSave,
  onCancel,
}: {
  saving: boolean;
  label: string;
  errorCount: number;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fa-editor-actions">
      {errorCount > 0 && (
        <span className="fa-err">
          Fix {errorCount} highlighted field{errorCount === 1 ? "" : "s"} to save.
        </span>
      )}
      <button type="button" className="ph-btn" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : label}
      </button>
      <button
        type="button"
        className="ph-btn ph-btn-secondary"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

/* Required number. "None" counts as 0 and is accepted. */
function numberError(value: string, label: string, min = 0): string {
  if (isNone(value)) return "";
  if (value.trim() === "") return `${label} is required.`;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min)
    return `${label} must be a number, ${min} or more, or None.`;
  return "";
}

/* =========================================================
   DREADLING EDITOR
   ========================================================= */

function DreadlingEditor({
  initial,
  defaultNumber,
  onSave,
  onCancel,
}: {
  initial: any | null;
  defaultNumber: string;
  onSave: (record: any) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => ({
    name: initial?.name || "",
    imageUrl: initial?.imageUrl || "",
    transformedImage: initial?.transformedImage || "",
    sourceOfTrauma: initial?.sourceOfTrauma || "",
    appearance: initial?.appearance || "",
    behavior: initial?.behavior || "",
    hp: String(initial?.hp ?? "10"),
    ac: String(initial?.ac ?? "10"),
    movement: String(initial?.movement ?? "30"),
    initiativeBonus: String(initial?.initiativeBonus ?? "0"),
    mindDie: initial?.mindDie || "1d4",
    bodyDie: initial?.bodyDie || "1d4",
    heartDie: initial?.heartDie || "1d4",
    egoDie: initial?.egoDie || "1d4",
  }));
  const [abilities, setAbilities] = useState<Ability[]>(() => {
    if (Array.isArray(initial?.abilities) && initial.abilities.length) {
      return initial.abilities.map(toAbility);
    }
    if (initial?.encounterAbility) {
      return [
        {
          ...blankAbility(),
          name: "Encounter Ability",
          description: initial.encounterAbility,
        },
      ];
    }
    return [blankAbility()];
  });
  const [action, setAction] = useState<DreadfulAction>(() =>
    toAction(initial?.dreadfulAction)
  );
  const [meta, setMeta] = useState<MetaDraft>(() =>
    metaFrom(initial, defaultNumber, "dreadling")
  );
  const [saving, setSaving] = useState(false);
  const [tried, setTried] = useState(false);

  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = "Give it a name.";
  const hpErr = numberError(draft.hp, "HP");
  if (hpErr) errors.hp = hpErr;
  const acErr = numberError(draft.ac, "AC");
  if (acErr) errors.ac = acErr;
  const mvErr = numberError(draft.movement, "Movement");
  if (mvErr) errors.movement = mvErr;
  if (!isNone(draft.initiativeBonus) && !Number.isFinite(Number(draft.initiativeBonus)))
    errors.initiativeBonus = "Must be a number, or None.";
  abilities.forEach((a, i) => {
    if (abilityHasContent(a) && !a.name.trim())
      errors[`ability-${i}-name`] = "Name this ability.";
    const d = diceError(a.damage);
    if (d) errors[`ability-${i}-damage`] = d;
  });
  const actionDmg = diceError(action.damage);
  if (actionDmg) errors["action-damage"] = actionDmg;

  const errorCount = Object.keys(errors).length;
  const shown = tried ? errors : {};
  const hasErr = (...keys: string[]) =>
    tried && Object.keys(errors).some((k) => keys.some((p) => k.startsWith(p)));
  const stepNav = [
    { n: 1, title: "Identity", bad: hasErr("name") },
    {
      n: 2,
      title: "Combat profile",
      bad: hasErr("hp", "ac", "movement", "initiativeBonus"),
    },
    { n: 3, title: "Abilities", bad: hasErr("ability-") },
    { n: 4, title: "Dreadful Action", bad: hasErr("action-") },
    { n: 5, title: "Record file", bad: false },
  ];

  async function save() {
    setTried(true);
    if (errorCount > 0) return;
    setSaving(true);
    try {
      await onSave({
        ...(initial || {}),
        id: initial?.id || Date.now().toString(),
        ...draft,
        name: draft.name.trim(),
        imageUrl: draft.imageUrl.trim(),
        transformedImage: draft.transformedImage.trim(),
        hp: toNum(draft.hp),
        ac: toNum(draft.ac),
        movement: toNum(draft.movement),
        initiativeBonus: toNum(draft.initiativeBonus) || 0,
        abilities: abilities.filter(abilityHasContent).map(cleanAbility),
        dreadfulAction: cleanAction(action),
        recordNumber: meta.recordNumber.trim() || defaultNumber,
        classification: meta.classification,
        threatLevel: meta.threatLevel,
        recordStatus: meta.recordStatus,
        recordNotes: meta.recordNotes,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorShell
      steps={stepNav}
      actions={
        <EditorActions
          saving={saving}
          label={initial ? "Save Changes" : "Save Dreadling"}
          errorCount={tried ? errorCount : 0}
          onSave={save}
          onCancel={onCancel}
        />
      }
      preview={
        <div className="fa-preview">
          <PreviewImages
            base={draft.imageUrl}
            transformed={draft.transformedImage}
          />
          <div className="fa-preview-main">
            <div className="fa-eyebrow">
              {initial ? "Editing Dreadling" : "Forging a Dreadling"} ·{" "}
              {meta.recordNumber || defaultNumber}
            </div>
            <div className="fa-preview-name">
              {draft.name || "Unnamed Dreadling"}
            </div>
          </div>
          <div className="fa-preview-stats">
            <span>
              HP <b>{draft.hp || "—"}</b>
            </span>
            <span>
              AC <b>{draft.ac || "—"}</b>
            </span>
            <span>
              Mind <b>{draft.mindDie.replace("1", "")}</b>
            </span>
            <span>
              Body <b>{draft.bodyDie.replace("1", "")}</b>
            </span>
            <span>
              Heart <b>{draft.heartDie.replace("1", "")}</b>
            </span>
            <span>
              Ego <b>{draft.egoDie.replace("1", "")}</b>
            </span>
          </div>
        </div>
      }
    >
      <Step
        n={1}
        title="Identity"
        hint="What it is, where it came from, how it looks and acts."
      >
        <Lbl label="Name" error={shown.name}>
          <input
            type="text"
            value={draft.name}
            placeholder="What is this manifestation called?"
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </Lbl>
        <div className="fa-grid-2">
          <Lbl
            label="Image URL"
            hint="Link to a picture. Shown in the preview above."
          >
            <input
              type="text"
              value={draft.imageUrl}
              placeholder="https://example.com/dreadling.png"
              onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
            />
          </Lbl>
          <Lbl
            label="Transformed image URL"
            hint="Optional. A second picture for its transformed form."
          >
            <input
              type="text"
              value={draft.transformedImage}
              placeholder="https://example.com/dreadling-transformed.png"
              onChange={(e) =>
                setDraft({ ...draft, transformedImage: e.target.value })
              }
            />
          </Lbl>
        </div>
        <Lbl
          label="Source of trauma"
          hint="Which memory, fear or experience gave it form?"
        >
          <textarea
            rows={2}
            value={draft.sourceOfTrauma}
            onChange={(e) =>
              setDraft({ ...draft, sourceOfTrauma: e.target.value })
            }
          />
        </Lbl>
        <div className="fa-grid-2">
          <Lbl label="Appearance" hint="Shape, features, unsettling details.">
            <textarea
              rows={3}
              value={draft.appearance}
              onChange={(e) => setDraft({ ...draft, appearance: e.target.value })}
            />
          </Lbl>
          <Lbl label="Behavior" hint="How does it act in a scene?">
            <textarea
              rows={3}
              value={draft.behavior}
              onChange={(e) => setDraft({ ...draft, behavior: e.target.value })}
            />
          </Lbl>
        </div>
      </Step>

      <Step
        n={2}
        title="Combat profile"
        hint="The numbers Battle Grounds uses."
      >
        <div className="fa-grid-4">
          <Lbl label="HP" error={shown.hp}>
            <input
              type="text"
              inputMode="numeric"
              value={draft.hp}
              onChange={(e) => setDraft({ ...draft, hp: e.target.value })}
            />
          </Lbl>
          <Lbl label="AC" error={shown.ac}>
            <input
              type="text"
              inputMode="numeric"
              value={draft.ac}
              onChange={(e) => setDraft({ ...draft, ac: e.target.value })}
            />
          </Lbl>
          <Lbl label="Movement (ft)" error={shown.movement}>
            <input
              type="text"
              inputMode="numeric"
              value={draft.movement}
              onChange={(e) => setDraft({ ...draft, movement: e.target.value })}
            />
          </Lbl>
          <Lbl
            label="Initiative bonus"
            hint="Added to 1d20"
            error={shown.initiativeBonus}
          >
            <input
              type="text"
              inputMode="numeric"
              value={draft.initiativeBonus}
              onChange={(e) =>
                setDraft({ ...draft, initiativeBonus: e.target.value })
              }
            />
          </Lbl>
        </div>

        <div className="fa-sub-label">Core dice</div>
        <p className="fa-hint">
          A Dreadling has no skills. When it uses a core, it rolls 1d20 + that
          core&apos;s die. Pick one die per core.
        </p>
        <DiceBlock
          values={draft as unknown as Record<string, string>}
          onChange={(key, value) => setDraft({ ...draft, [key]: value })}
        />
      </Step>

      <Step
        n={3}
        title="Abilities"
        hint="Each one with its type, range, uses, dice and save."
      >
        <AbilityEditor
          abilities={abilities}
          onChange={setAbilities}
          errors={shown}
        />
      </Step>

      <Step
        n={4}
        title="Dreadful Action"
        hint="The terrible thing it can do when the Hotel allows it."
      >
        <ActionEditor action={action} onChange={setAction} errors={shown} />
      </Step>

      <Step n={5} title="Record file" hint="How the archive files it.">
        <RecordFile meta={meta} onChange={setMeta} />
      </Step>
    </EditorShell>
  );
}

/* =========================================================
   DREADFUL EDITOR
   ========================================================= */

function DreadfulEditor({
  initial,
  guests,
  existing,
  defaultNumber,
  onSave,
  onCancel,
}: {
  initial: any | null;
  guests: any[];
  existing: any[];
  defaultNumber: string;
  onSave: (record: any) => Promise<void> | void;
  onCancel: () => void;
}) {
  /* A Dreadful stands on its own. A guest sheet can optionally be used to
     pre-fill the form, but nothing is linked or required. */
  const [fromGuest, setFromGuest] = useState<string>(
    initial?.originalGuestId || ""
  );
  const [guestPick, setGuestPick] = useState("");

  const [identity, setIdentity] = useState({
    name: initial?.name || "",
    portrait: initial?.portrait || "",
    transformedImage: initial?.transformedImage || "",
    title: initial?.title || "",
    room: initial?.room || "",
    role: initial?.role || "",
    role2: initial?.role2 || "",
  });
  const [level, setLevel] = useState(String(initial?.corruptionLevel ?? 1));
  const [description, setDescription] = useState(
    initial?.corruptionDescription || ""
  );
  const [dice, setDice] = useState<Record<string, string>>({
    mindDie: initial?.mindDie || "1d4",
    bodyDie: initial?.bodyDie || "1d4",
    heartDie: initial?.heartDie || "1d4",
    egoDie: initial?.egoDie || "1d4",
  });
  const [stats, setStats] = useState({
    hp: String(initial?.hp ?? "20"),
    maxHp: String(initial?.maxHp ?? initial?.hp ?? "20"),
    ac: String(initial?.ac ?? "10"),
    movement: String(initial?.movement ?? "30"),
    dread: String(initial?.dread ?? "0"),
    memoryPool: String(initial?.memoryPool ?? "0"),
    maxMemoryPool: String(initial?.maxMemoryPool ?? "0"),
  });
  const [skills, setSkills] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    Object.values(CORE_SKILLS)
      .flat()
      .forEach((s) => (out[s] = String(initial?.skills?.[s] ?? 0)));
    return out;
  });
  const [abilities, setAbilities] = useState<Ability[]>(() =>
    Array.isArray(initial?.dreadfulAbilities)
      ? initial.dreadfulAbilities.map(toAbility)
      : []
  );
  const [action, setAction] = useState<DreadfulAction>(() =>
    toAction(initial?.dreadfulAction)
  );
  const [meta, setMeta] = useState<MetaDraft>(() =>
    metaFrom(initial, defaultNumber, "dreadful")
  );
  const [saving, setSaving] = useState(false);
  const [tried, setTried] = useState(false);

  /* Optional shortcut: copy the numbers from a guest sheet into the form. */
  function copyFromGuest(key: string) {
    setGuestPick(key);
    const g = guests.find((x, i) => (x.id || `guest-${x.room}-${i}`) === key);
    if (!g) return;
    setFromGuest(key);
    setIdentity({
      name: g.name || "",
      portrait: g.portrait || "",
      transformedImage: "",
      title: g.title || "",
      room: g.room || "",
      role: g.role || "",
      role2: g.role2 || "",
    });
    setStats({
      hp: String(g.hp ?? "20"),
      maxHp: String(g.maxHp ?? g.hp ?? "20"),
      ac: String(g.ac ?? "10"),
      movement: String(g.movement ?? "30"),
      dread: String(g.dread ?? "0"),
      memoryPool: String(g.memoryPool ?? "0"),
      maxMemoryPool: String(g.maxMemoryPool ?? "0"),
    });
    const next: Record<string, string> = {};
    Object.values(CORE_SKILLS)
      .flat()
      .forEach((s) => (next[s] = String(g.skills?.[s] ?? 0)));
    setSkills(next);
  }

  const errors: Record<string, string> = {};
  if (!identity.name.trim()) errors.name = "Give it a name.";
  const lvl = Number(level);
  if (!Number.isFinite(lvl) || lvl < 1 || lvl > 10)
    errors.level = "Corruption level is 1 to 10.";
  (
    [
      ["hp", "HP"],
      ["maxHp", "Max HP"],
      ["ac", "AC"],
      ["movement", "Movement"],
      ["dread", "Dread"],
      ["memoryPool", "Memory"],
      ["maxMemoryPool", "Max Memory"],
    ] as const
  ).forEach(([key, label]) => {
    const err = numberError(stats[key], label);
    if (err) errors[key] = err;
  });
  if (toNum(stats.dread) > 20) errors.dread = "Dread is 0 to 20.";
  Object.entries(skills).forEach(([name, value]) => {
    if (isNone(value)) return;
    if (!Number.isFinite(Number(value)) || Number(value) < 0)
      errors[`skill-${name}`] = "0 or more, or None";
  });
  abilities.forEach((a, i) => {
    if (abilityHasContent(a) && !a.name.trim())
      errors[`ability-${i}-name`] = "Name this ability.";
    const d = diceError(a.damage);
    if (d) errors[`ability-${i}-damage`] = d;
  });
  const actionDmg = diceError(action.damage);
  if (actionDmg) errors["action-damage"] = actionDmg;

  const errorCount = Object.keys(errors).length;
  const shown = tried ? errors : {};
  const hasErr = (...keys: string[]) =>
    tried && Object.keys(errors).some((k) => keys.some((p) => k.startsWith(p)));

  const stepNav = [
    { n: 1, title: "Identity", bad: hasErr("name", "level") },
    {
      n: 2,
      title: "Vitals & roles",
      bad: hasErr("hp", "maxHp", "ac", "movement", "dread", "memory", "maxMemory"),
    },
    { n: 3, title: "Dice & skills", bad: hasErr("skill-") },
    { n: 4, title: "Abilities", bad: hasErr("ability-") },
    { n: 5, title: "Dreadful Action", bad: hasErr("action-") },
    { n: 6, title: "Record file", bad: false },
  ];

  async function save() {
    setTried(true);
    if (errorCount > 0) return;

    const skillNumbers: Record<string, number> = {};
    Object.entries(skills).forEach(([k, v]) => (skillNumbers[k] = toNum(v)));

    const fields = {
      name: identity.name.trim(),
      portrait: identity.portrait.trim(),
      transformedImage: identity.transformedImage.trim(),
      title: identity.title.trim(),
      room: identity.room.trim(),
      role: identity.role,
      role2: identity.role2,
      corruptionLevel: clamp(Math.round(lvl), 1, 10),
      corruptionDescription: description,
      ...dice,
      hp: toNum(stats.hp),
      maxHp: toNum(stats.maxHp),
      ac: toNum(stats.ac),
      movement: toNum(stats.movement),
      dread: toNum(stats.dread),
      memoryPool: toNum(stats.memoryPool),
      maxMemoryPool: toNum(stats.maxMemoryPool),
      skills: { ...(initial?.skills || {}), ...skillNumbers },
      dreadfulAbilities: abilities.filter(abilityHasContent).map(cleanAbility),
      dreadfulAction: cleanAction(action),
      recordNumber: meta.recordNumber.trim() || defaultNumber,
      classification: meta.classification,
      threatLevel: meta.threatLevel,
      recordStatus: meta.recordStatus,
      recordNotes: meta.recordNotes,
      isRestored: meta.recordStatus === "Restored",
    };

    const record = initial
      ? { ...initial, ...fields }
      : {
          /* Safe defaults so any older code that expects a guest-shaped
             record still finds the fields it looks for. */
          level: "Normal Guest",
          notes: [],
          gifts: [],
          totems: [],
          hotelNotes: "",
          abilities: {},
          password: "",
          ...fields,
          id: `dreadful-${Date.now()}`,
          originalGuestId: fromGuest || "",
        };

    if (
      !initial &&
      fromGuest &&
      existing.some((d) => d.originalGuestId === fromGuest) &&
      !window.confirm(
        "A Dreadful based on this guest already exists. Forge another one anyway?"
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      await onSave(record);
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorShell
      steps={stepNav}
      actions={
        <EditorActions
          saving={saving}
          label={initial ? "Save Changes" : "Save Dreadful"}
          errorCount={tried ? errorCount : 0}
          onSave={save}
          onCancel={onCancel}
        />
      }
      preview={
        <div className="fa-preview">
          <PreviewImages
            base={identity.portrait}
            transformed={identity.transformedImage}
          />
          <div className="fa-preview-main">
            <div className="fa-eyebrow">
              {initial ? "Editing Dreadful" : "Forging a Dreadful"} ·{" "}
              {meta.recordNumber || defaultNumber}
            </div>
            <div className="fa-preview-name">
              {identity.name || "Unnamed Dreadful"}
            </div>
          </div>
          <div className="fa-preview-stats">
            <span>
              HP <b>{stats.hp || "—"}</b>
            </span>
            <span>
              AC <b>{stats.ac || "—"}</b>
            </span>
            <span>
              Mind <b>{dice.mindDie.replace("1", "")}</b>
            </span>
            <span>
              Body <b>{dice.bodyDie.replace("1", "")}</b>
            </span>
            <span>
              Heart <b>{dice.heartDie.replace("1", "")}</b>
            </span>
            <span>
              Ego <b>{dice.egoDie.replace("1", "")}</b>
            </span>
          </div>
        </div>
      }
    >
      <Step
        n={1}
        title="Identity"
        hint="Who or what it is. A Dreadful is its own creature. No existing guest needed."
      >
        {!initial && guests.length > 0 && (
          <Lbl
            label="Start from a guest sheet (optional)"
            hint="Copies the name, picture, stats and skills into this form so you can twist them. Nothing stays linked."
          >
            <select
              value={guestPick}
              onChange={(e) => copyFromGuest(e.target.value)}
            >
              <option value="">Start blank</option>
              {guests.map((g, i) => {
                const key = g.id || `guest-${g.room}-${i}`;
                return (
                  <option key={key} value={key}>
                    Room {g.room} — {g.name}
                  </option>
                );
              })}
            </select>
          </Lbl>
        )}

        <div className="fa-grid-2">
          <Lbl label="Name" error={shown.name}>
            <input
              type="text"
              value={identity.name}
              placeholder="What is it called?"
              onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
            />
          </Lbl>
          <Lbl label="Title / epithet" hint="e.g. The Hollow Concierge">
            <input
              type="text"
              value={identity.title}
              onChange={(e) => setIdentity({ ...identity, title: e.target.value })}
            />
          </Lbl>
        </div>
        <div className="fa-grid-2">
          <Lbl label="Image URL" hint="Link to a picture. Shown in the preview.">
            <input
              type="text"
              value={identity.portrait}
              placeholder="https://example.com/dreadful.png"
              onChange={(e) =>
                setIdentity({ ...identity, portrait: e.target.value })
              }
            />
          </Lbl>
          <Lbl
            label="Transformed image URL"
            hint="Optional. A second picture for its transformed form."
          >
            <input
              type="text"
              value={identity.transformedImage}
              placeholder="https://example.com/dreadful-transformed.png"
              onChange={(e) =>
                setIdentity({ ...identity, transformedImage: e.target.value })
              }
            />
          </Lbl>
        </div>
        <div className="fa-grid-2">
          <Lbl label="Last known room" hint="Optional">
            <input
              type="text"
              value={identity.room}
              onChange={(e) => setIdentity({ ...identity, room: e.target.value })}
            />
          </Lbl>
          <Lbl label="Corruption level (1–10)" error={shown.level}>
            <input
              type="number"
              min={1}
              max={10}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
          </Lbl>
        </div>
        <Lbl
          label="Corruption description"
          hint="What has Dread made of it? How does it look, speak and hunt?"
        >
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Lbl>
      </Step>

      <Step
        n={2}
        title="Vitals & roles"
        hint="The numbers Battle Grounds uses, and the roles that decide its proficiencies."
      >
        <div className="fa-grid-4">
          <Lbl label="HP" error={shown.hp}>
            <input
              type="text"
              inputMode="numeric"
              value={stats.hp}
              onChange={(e) => setStats({ ...stats, hp: e.target.value })}
            />
          </Lbl>
          <Lbl label="Max HP" error={shown.maxHp}>
            <input
              type="text"
              inputMode="numeric"
              value={stats.maxHp}
              onChange={(e) => setStats({ ...stats, maxHp: e.target.value })}
            />
          </Lbl>
          <Lbl label="AC" error={shown.ac}>
            <input
              type="text"
              inputMode="numeric"
              value={stats.ac}
              onChange={(e) => setStats({ ...stats, ac: e.target.value })}
            />
          </Lbl>
          <Lbl label="Movement (ft)" error={shown.movement}>
            <input
              type="text"
              inputMode="numeric"
              value={stats.movement}
              onChange={(e) => setStats({ ...stats, movement: e.target.value })}
            />
          </Lbl>
        </div>
        <div className="fa-grid-4">
          <Lbl label="Dread (0–20)" error={shown.dread}>
            <input
              type="text"
              inputMode="numeric"
              value={stats.dread}
              onChange={(e) => setStats({ ...stats, dread: e.target.value })}
            />
          </Lbl>
          <Lbl label="Memory pool" error={shown.memoryPool}>
            <input
              type="text"
              inputMode="numeric"
              value={stats.memoryPool}
              onChange={(e) => setStats({ ...stats, memoryPool: e.target.value })}
            />
          </Lbl>
          <Lbl label="Max memory" error={shown.maxMemoryPool}>
            <input
              type="text"
              inputMode="numeric"
              value={stats.maxMemoryPool}
              onChange={(e) =>
                setStats({ ...stats, maxMemoryPool: e.target.value })
              }
            />
          </Lbl>
        </div>
        <div className="fa-grid-2">
          <Lbl label="Primary role" hint="Roles give proficiency in three skills.">
            <select
              value={identity.role}
              onChange={(e) => setIdentity({ ...identity, role: e.target.value })}
            >
              <option value="">No role</option>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Lbl>
          <Lbl label="Secondary role">
            <select
              value={identity.role2}
              onChange={(e) => setIdentity({ ...identity, role2: e.target.value })}
            >
              <option value="">No role</option>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Lbl>
        </div>
      </Step>

      <Step
        n={3}
        title="Dice & skills"
        hint="Core dice are used for ability rolls (1d20 + core die). Skills are used for skill rolls (1d20 + skill + proficiency)."
      >
        <div className="fa-sub-label">Core dice</div>
        <DiceBlock
          values={dice}
          onChange={(key, value) => setDice({ ...dice, [key]: value })}
        />

        <div className="fa-sub-label">Skills</div>
        <div className="fa-skill-edit">
          {CORES.map((core) => (
            <div key={core} className="fa-skill-col">
              <strong>{core}</strong>
              {CORE_SKILLS[core].map((skill) => (
                <Lbl key={skill} label={skill} error={shown[`skill-${skill}`]}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={skills[skill]}
                    onChange={(e) =>
                      setSkills({ ...skills, [skill]: e.target.value })
                    }
                  />
                </Lbl>
              ))}
            </div>
          ))}
        </div>
      </Step>

      <Step
        n={4}
        title="Abilities"
        hint="Each one with its type, range, uses, dice and save."
      >
        <AbilityEditor
          abilities={abilities}
          onChange={setAbilities}
          errors={shown}
        />
      </Step>

      <Step
        n={5}
        title="Dreadful Action"
        hint="The terrible thing it can do when the Hotel allows it."
      >
        <ActionEditor action={action} onChange={setAction} errors={shown} />
      </Step>

      <Step n={6} title="Record file" hint="How the archive files it.">
        <RecordFile meta={meta} onChange={setMeta} />
      </Step>
    </EditorShell>
  );
}