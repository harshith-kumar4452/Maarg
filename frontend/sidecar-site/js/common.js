/* Shared helpers: DOM, toast, theme, nav, footer, portal shell */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let _leave = [];
const onLeave = fn => _leave.push(fn);
function runLeave() { _leave.forEach(f => { try { f(); } catch (e) { } }); _leave = []; }
const fmtCd = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
const pad2 = n => String(n).padStart(2, "0");

/* light (cream) is the default theme; the toggle switches to dark */
(function bootTheme() { let t = "light"; try { t = localStorage.getItem("maarg-theme") || "light"; } catch (e) { } document.documentElement.dataset.theme = t; })();

/* toast(msg, kind): kind is "ok" (success), "err" (error) or "info".
   Left out, it is inferred: failures read as errors, "…" as in-progress, anything else as success. */
function toast(msg, kind) {
  if (!kind) kind = /\b(fail(ed|s)?|error|unavailable|offline|denied|invalid)\b/i.test(msg) ? "err" : /…$/.test(msg) ? "info" : "ok";
  let h = $(".toast-host");
  if (!h) { h = document.createElement("div"); h.className = "toast-host"; document.body.appendChild(h); }
  const t = document.createElement("div");
  t.className = "toast " + kind;
  /* errors interrupt screen readers; success and progress wait their turn */
  t.setAttribute("role", kind === "err" ? "alert" : "status");
  const mark = kind === "err" ? '<path d="M12 8v5M12 16.5v.5"/><circle cx="12" cy="12" r="9"/>' : kind === "info" ? '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' : '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 10"/>';
  t.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">${mark}</svg><span></span>`;
  t.lastChild.textContent = msg;
  h.appendChild(t);
  setTimeout(() => t.remove(), kind === "err" ? 6000 : 4000);
}
toast.ok = m => toast(m, "ok");
toast.err = m => toast(m, "err");
const themeIcon = () => (document.documentElement.dataset.theme === "dark" ? ic("sun") : ic("moon"));
function wireTheme(root) {
  $$("[data-theme-toggle]", root).forEach(b => b.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("maarg-theme", next); } catch (e) { }
    $$("[data-theme-toggle]").forEach(x => x.innerHTML = themeIcon());
    document.dispatchEvent(new Event("themechange"));
  }));
  $$("[data-signout]", root).forEach(b => b.addEventListener("click", () => { Session.clear(); if (typeof MAARG !== "undefined") MAARG.signOut(); location.href = "index.html?signedout=1"; }));
}

function navHTML() {
  const acc = Session.account(), mine = acc ? acc.page : "login.html";
  return `<header class="nav">
    <a class="logo" href="index.html" aria-label="MAARG home">${LOGO}<span>MAARG</span></a>
    <nav class="nav-links" id="navLinks" aria-label="Primary">
      <a href="index.html#engines">Engines</a><a href="index.html#roles">Roles</a><a href="architecture.html">Architecture</a><a href="schema.html">Schema</a><a href="${mine}">${acc ? "My portal" : "Sign in"}</a>
    </nav>
    <div class="nav-cta">
      ${acc ? `<span class="pill nav-who">${ic("user").replace("<svg", '<svg width="14" height="14"')}${acc.label}</span>` : ""}
      <button class="theme-btn" data-theme-toggle aria-label="Toggle light and dark theme">${themeIcon()}</button>
      ${acc ? `<button class="btn sm ghost" data-signout>Sign out</button>` : `<a class="btn sm" href="login.html">Sign in</a>`}
      <button class="theme-btn menu-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false">${ic("menu")}</button>
    </div>
  </header>`;
}
/* One menu toggle for both the public nav and the portal sidebar: opens on tap,
   closes on a link tap, Escape, or a tap outside, and never stays open on resize to desktop. */
function wireMenu(btn, panel, host) {
  if (!btn || !panel) return;
  const set = o => { host.classList.toggle("open", o); btn.setAttribute("aria-expanded", o); btn.setAttribute("aria-label", o ? "Close menu" : "Open menu"); };
  btn.addEventListener("click", e => { e.stopPropagation(); set(!host.classList.contains("open")); });
  panel.addEventListener("click", e => { if (e.target.closest("a, button[data-view]")) set(false); });
  document.addEventListener("click", e => { if (host.classList.contains("open") && !host.contains(e.target)) set(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && host.classList.contains("open")) { set(false); btn.focus(); } });
  matchMedia("(min-width: 861px)").addEventListener("change", m => { if (m.matches) set(false); });
}
function wireNav(root) {
  const nl = $("#navLinks", root);
  wireMenu($("#menuBtn", root), nl, nl);
  wireTheme(root);
  if (/[?&]signedout=1/.test(location.search)) { toast.ok("You have been signed out."); history.replaceState(null, "", location.pathname + location.hash); }
}
const REPO_URL = "https://github.com/harshith-kumar4452/Maarg";
function footHTML() {
  return `<footer class="foot wrap">
    <div><a class="logo" href="index.html" aria-label="MAARG home">${LOGO}<span>MAARG</span></a><p style="margin-top:12px;max-width:36ch">MAARG means “path”. It predicts where cargo goes missing and brings it home on vehicles already heading that way.</p></div>
    <div class="cols">
      <nav aria-label="Explore"><h4>Explore</h4><a href="index.html#engines">Engines</a><a href="index.html#how">How it works</a><a href="index.html#roles">Four roles</a><a href="index.html#heat">Risk heat map</a><a href="architecture.html">Architecture</a><a href="schema.html">Database schema</a></nav>
      <nav aria-label="Sign in"><h4>Sign in as</h4><a href="login.html?role=admin">Admin</a><a href="login.html?role=dispatcher">Dispatcher</a><a href="login.html?role=driver">Driver</a><a href="login.html?role=customer">Customer</a></nav>
      <div><h4>Quick reference</h4><span>Urgency: λ = SLA penalty × (1 + T ÷ 50)</span><br><span>Bounty: pay = min(2nd-lowest bid, MaxBounty)</span><br><span>Ceiling: MaxBounty = min(λ × Δt, C_ded − C_overhead)</span></div>
    </div>
    <div class="foot-bottom"><span>© ${new Date().getFullYear()} MAARG. All rights reserved.</span><a href="${REPO_URL}" target="_blank" rel="noopener">Source on GitHub</a></div></footer>`;
}

function pageHead(title, sub, tools) {
  return `<div class="page-head"><div><h1>${title}</h1><p>${sub || ""}</p></div><div class="head-tools">${tools || ""}</div></div>`;
}

/* Portal shell. The sidebar only ever shows the signed-in role's own sections. */
function shell(root, role, title, sub, tools, body, opts = {}) {
  const acc = ACCOUNTS[role];
  const views = opts.views || [];
  root.innerHTML = `<div class="shell">
    <aside class="side" id="side">
      <a class="logo" href="index.html" aria-label="MAARG home">${LOGO}<span>MAARG</span></a>
      <button class="theme-btn side-menu-btn" id="sideMenuBtn" aria-label="Open menu" aria-expanded="false" aria-controls="sideMenu">${ic("menu")}</button>
      <div class="side-menu" id="sideMenu">
      <div class="grp"><p class="grp-t">${acc.label} portal</p><nav aria-label="${acc.label} sections">${views.length
        ? views.map(v => `<button type="button" data-view="${v[0]}" class="${v[0] === opts.active ? "on" : ""}">${ic(v[2])}${v[1]}</button>`).join("")
        : `<a class="on" aria-current="page" href="${acc.page}">${ic(opts.icon || ({ admin: "chart", dispatcher: "list", driver: "truck", customer: "pin" })[role])}${opts.navLabel || title}</a>`}</nav></div>
      <div class="grp"><p class="grp-t">MAARG</p><nav aria-label="Platform"><a href="index.html">${ic("home")}Home</a><button type="button" data-signout>${ic("out")}Sign out</button></nav></div>
      </div>
      <div class="me"><span class="avatar">${acc.name[0]}</span><div><b>${acc.name}</b><small>${acc.who}</small></div><button class="theme-btn" style="margin-left:auto;width:32px;height:32px" data-theme-toggle aria-label="Toggle light and dark theme">${themeIcon()}</button></div>
    </aside>
    <main class="main">${opts.noHead ? "" : pageHead(title, sub, tools)}${body}</main></div>`;
  wireTheme(root);
  wireMenu($("#sideMenuBtn", root), $("#sideMenu", root), $("#side", root));
  let hello = null; try { hello = sessionStorage.getItem("maarg-welcome"); sessionStorage.removeItem("maarg-welcome"); } catch (e) { }
  if (hello) toast.ok(`Signed in as ${hello}. Welcome to the ${acc.label.toLowerCase()} portal.`);
}
