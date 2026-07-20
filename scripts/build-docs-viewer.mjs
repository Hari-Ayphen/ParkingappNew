#!/usr/bin/env node
/**
 * Builds a single self-contained, offline, view-only docs explorer at docs/viewer.html.
 *
 * Everything (the marked bundle, all markdown sources, CSS and JS) is inlined into one
 * HTML file so it works by double-clicking it from file:// with zero network access.
 *
 * The page title is resolved at build time, in this order:
 *   1. the DOCS_TITLE env var  (e.g. DOCS_TITLE="Acme Docs" pnpm docs:viewer)
 *   2. the root package.json "name" + " Docs"
 *   3. "Docs"
 *
 * Usage: pnpm docs:viewer
 */

import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOCS_DIR = path.join(ROOT, "docs");
const OUT_FILE = path.join(DOCS_DIR, "viewer.html");

/**
 * Resolves the docs title. Env var wins, then the root package.json name, then a
 * generic fallback — so the viewer carries no hard-coded project name.
 */
async function resolveTitle() {
  const fromEnv = process.env.DOCS_TITLE?.trim();
  if (fromEnv) return fromEnv;

  try {
    const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
    const name = typeof pkg.name === "string" ? pkg.name.replace(/^@[^/]+\//, "").trim() : "";
    if (name) return `${name} Docs`;
  } catch {
    // No root package.json (or unreadable) — fall through to the default.
  }

  return "Docs";
}

/** Repo-root files that are docs in spirit but live outside docs/. */
const ROOT_DOCS = ["README.md", "CLAUDE.md"];

/** Pretty labels + display order for the top-level folders under docs/. */
const CATEGORY_META = [
  ["Project", "Project"],
  ["Docs root", "Docs root"],
  ["overview", "Overview"],
  ["features", "Features (specs)"],
  ["branding", "Branding"],
  ["architecture", "Architecture"],
  ["api", "API"],
  ["modules", "Modules"],
  ["decisions", "Decisions"],
  ["operations", "Operations"],
  ["pages", "Pages"],
  ["design", "Design"],
  ["agents", "Agents"],
  ["_phase2", "Phase 2 (deferred)"],
  ["_audit", "Audit"],
];
const CATEGORY_LABEL = new Map(CATEGORY_META);
const CATEGORY_ORDER = new Map(CATEGORY_META.map(([key], i) => [key, i]));

// ---------------------------------------------------------------------------
// Collect docs
// ---------------------------------------------------------------------------

/** Recursively list every *.md file under a directory. */
async function walk(dir) {
  const found = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      found.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      found.push(full);
    }
  }
  return found;
}

/** Top-level folder under docs/ is the category; files directly in docs/ are "Docs root". */
function categoryFor(relPath) {
  if (!relPath.startsWith("docs/")) return "Project";
  const rest = relPath.slice("docs/".length);
  const slash = rest.indexOf("/");
  return slash === -1 ? "Docs root" : rest.slice(0, slash);
}

/** First H1 wins; otherwise Title-Case the filename. */
function titleFor(markdown, relPath) {
  const match = markdown.match(/^[ \t]{0,3}#[ \t]+(.+?)[ \t]*#*[ \t]*$/m);
  if (match) {
    return match[1].replace(/`/g, "").replace(/\*\*?/g, "").trim();
  }
  const base = path.basename(relPath, ".md");
  return base
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function collectDocs() {
  const files = [...(await walk(DOCS_DIR))];
  for (const name of ROOT_DOCS) {
    const full = path.join(ROOT, name);
    try {
      if ((await stat(full)).isFile()) files.push(full);
    } catch {
      // Root doc missing — skip silently.
    }
  }

  const docs = [];
  for (const full of files) {
    const relPath = path.relative(ROOT, full).split(path.sep).join("/");
    if (relPath === "docs/viewer.html") continue; // never inline our own output
    const markdown = await readFile(full, "utf8");
    const category = categoryFor(relPath);
    docs.push({
      path: relPath,
      category,
      categoryLabel: CATEGORY_LABEL.get(category) ?? category,
      title: titleFor(markdown, relPath),
      markdown,
    });
  }

  docs.sort((a, b) => {
    const ca = CATEGORY_ORDER.get(a.category) ?? 999;
    const cb = CATEGORY_ORDER.get(b.category) ?? 999;
    if (ca !== cb) return ca - cb;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.title.localeCompare(b.title);
  });

  return docs;
}

// ---------------------------------------------------------------------------
// Inline marked
// ---------------------------------------------------------------------------

/**
 * Read a browser-ready marked bundle out of node_modules. marked >= 5 ships an
 * unminified UMD build rather than marked.min.js, so try known filenames in order
 * of preference and fall back to whatever browser build exists.
 */
async function readMarkedBundle() {
  const require = createRequire(import.meta.url);
  const pkgJson = require.resolve("marked/package.json");
  const pkgDir = path.dirname(pkgJson);
  const version = JSON.parse(await readFile(pkgJson, "utf8")).version;

  const candidates = ["marked.min.js", "lib/marked.umd.js", "marked.umd.js", "lib/marked.min.js"];
  for (const candidate of candidates) {
    const full = path.join(pkgDir, candidate);
    try {
      const source = await readFile(full, "utf8");
      return { source, version, file: candidate };
    } catch {
      // try next candidate
    }
  }
  throw new Error(
    `Could not find a browser build of marked in ${pkgDir}. Tried: ${candidates.join(", ")}. Run: pnpm add -D -w marked`
  );
}

// ---------------------------------------------------------------------------
// HTML assembly
// ---------------------------------------------------------------------------

/** Make a JSON payload safe to embed inside a <script> element. */
/** Escapes a build-time string for safe interpolation into the generated HTML. */
function escapeHtmlAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toEmbeddedJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

const CSS = String.raw`
:root {
  --bg: #ffffff;
  --bg-sidebar: #f7f7f8;
  --bg-subtle: #f1f1f3;
  --bg-hover: #e9e9ec;
  --bg-active: #e3e8ff;
  --fg: #1f2328;
  --fg-muted: #656d76;
  --fg-active: #2c3ea8;
  --border: #d8dae0;
  --border-strong: #c2c6ce;
  --accent: #3b4fd8;
  --mark-bg: #ffe9a8;
  --mark-fg: #4a3800;
  --code-bg: #f1f1f3;
  --quote-border: #c2c6ce;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f1116;
    --bg-sidebar: #161922;
    --bg-subtle: #1c2029;
    --bg-hover: #242936;
    --bg-active: #232a4d;
    --fg: #e4e6eb;
    --fg-muted: #9aa2b1;
    --fg-active: #a9b6ff;
    --border: #2a2f3c;
    --border-strong: #3a4152;
    --accent: #8c9bff;
    --mark-bg: #6b5210;
    --mark-fg: #ffe9a8;
    --code-bg: #1c2029;
    --quote-border: #3a4152;
  }
}

* { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

#layout { display: flex; height: 100vh; overflow: hidden; }

/* ---------- Sidebar ---------- */
#sidebar {
  width: 320px;
  flex: 0 0 320px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
#sidebar-head { padding: 16px 16px 12px; border-bottom: 1px solid var(--border); }
#brand { font-size: 14px; font-weight: 700; letter-spacing: .02em; margin: 0 0 2px; }
#brand-sub { font-size: 12px; color: var(--fg-muted); margin: 0 0 12px; }
#search {
  width: 100%;
  padding: 8px 10px;
  font: inherit;
  font-size: 14px;
  color: var(--fg);
  background: var(--bg);
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  outline: none;
}
#search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }
#search::placeholder { color: var(--fg-muted); }
#search-meta { font-size: 12px; color: var(--fg-muted); margin-top: 8px; min-height: 1em; }

#tree { flex: 1; overflow-y: auto; padding: 8px 8px 40px; }

.cat { margin-bottom: 2px; }
.cat-head {
  display: flex; align-items: center; gap: 6px;
  width: 100%;
  padding: 7px 8px;
  font: inherit; font-size: 13px; font-weight: 600;
  color: var(--fg);
  background: none; border: 0; border-radius: 6px;
  cursor: pointer; text-align: left;
}
.cat-head:hover { background: var(--bg-hover); }
.cat-caret { font-size: 10px; color: var(--fg-muted); transition: transform .12s ease; }
.cat.collapsed .cat-caret { transform: rotate(-90deg); }
.cat-name { flex: 1; }
.cat-count {
  font-size: 11px; font-weight: 600; color: var(--fg-muted);
  background: var(--bg-subtle); border: 1px solid var(--border);
  border-radius: 999px; padding: 1px 7px;
}
.cat-list { list-style: none; margin: 0 0 6px; padding: 0; }
.cat.collapsed .cat-list { display: none; }

.doc-link {
  display: block;
  width: 100%;
  padding: 5px 10px 5px 24px;
  font: inherit; font-size: 13px;
  color: var(--fg-muted);
  background: none; border: 0; border-radius: 6px;
  cursor: pointer; text-align: left;
  overflow-wrap: anywhere;
}
.doc-link:hover { background: var(--bg-hover); color: var(--fg); }
.doc-link.active { background: var(--bg-active); color: var(--fg-active); font-weight: 600; }
.doc-excerpt {
  display: block;
  font-size: 11.5px; line-height: 1.45; color: var(--fg-muted);
  margin-top: 3px; font-weight: 400;
}
.doc-path-hint { display: block; font-size: 11px; color: var(--fg-muted); margin-top: 2px; font-weight: 400; }
mark { background: var(--mark-bg); color: var(--mark-fg); border-radius: 2px; padding: 0 1px; }
.empty { padding: 16px 10px; font-size: 13px; color: var(--fg-muted); }

/* ---------- Main ---------- */
#main { flex: 1; overflow-y: auto; }
#main-inner { max-width: 820px; margin: 0 auto; padding: 48px 32px 96px; }
#doc-path {
  font-size: 12px; color: var(--fg-muted);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  margin-bottom: 28px; padding-bottom: 12px; border-bottom: 1px solid var(--border);
  overflow-wrap: anywhere;
}

article { overflow-wrap: break-word; }
article h1, article h2, article h3, article h4, article h5, article h6 {
  line-height: 1.3; font-weight: 650; margin: 1.8em 0 .6em; scroll-margin-top: 24px;
}
article h1 { font-size: 2em; margin-top: 0; padding-bottom: .3em; border-bottom: 1px solid var(--border); }
article h2 { font-size: 1.5em; padding-bottom: .3em; border-bottom: 1px solid var(--border); }
article h3 { font-size: 1.25em; }
article h4 { font-size: 1.05em; }
article h5, article h6 { font-size: 1em; color: var(--fg-muted); }
article p { margin: 0 0 1em; }
article ul, article ol { margin: 0 0 1em; padding-left: 1.6em; }
article li { margin: .25em 0; }
article li > p { margin: .4em 0; }
article a { color: var(--accent); text-decoration: none; }
article a:hover { text-decoration: underline; }
article a.doc-xref::after { content: " ↗"; font-size: .8em; opacity: .6; }
article a.dead {
  color: var(--fg-muted); text-decoration: none; cursor: default;
  border-bottom: 1px dotted var(--border-strong);
}
article img { max-width: 100%; height: auto; }
article hr { border: 0; border-top: 1px solid var(--border); margin: 2em 0; }

article code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: .875em;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: .12em .35em;
}
article pre {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
  overflow-x: auto;
  margin: 0 0 1.2em;
  line-height: 1.5;
}
article pre code { background: none; border: 0; padding: 0; font-size: .84em; }

article blockquote {
  margin: 0 0 1.2em;
  padding: .2em 0 .2em 1em;
  border-left: 3px solid var(--quote-border);
  color: var(--fg-muted);
}
article blockquote > :last-child { margin-bottom: 0; }

.table-wrap { overflow-x: auto; margin: 0 0 1.4em; }
article table { border-collapse: collapse; width: 100%; font-size: .9em; }
article th, article td {
  border: 1px solid var(--border-strong);
  padding: 7px 12px;
  text-align: left;
  vertical-align: top;
}
article th { background: var(--bg-subtle); font-weight: 650; white-space: nowrap; }
article tbody tr:nth-child(even) { background: var(--bg-subtle); }

article input[type="checkbox"] { margin-right: .4em; }

#welcome { color: var(--fg-muted); }
#welcome h1 { color: var(--fg); }
#welcome kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .82em;
  background: var(--code-bg); border: 1px solid var(--border-strong);
  border-bottom-width: 2px; border-radius: 4px; padding: .1em .4em;
}

@media (max-width: 860px) {
  #layout { flex-direction: column; }
  #sidebar { width: 100%; flex: 0 0 auto; max-height: 45vh; border-right: 0; border-bottom: 1px solid var(--border); }
  #main-inner { padding: 28px 18px 64px; }
}
`;

const JS = String.raw`
(function () {
  "use strict";

  var DOCS = window.__DOCS__ || [];
  var TITLE = window.__DOCS_TITLE__ || "Docs";
  var byPath = Object.create(null);
  DOCS.forEach(function (d) {
    byPath[d.path] = d;
    d.searchText = (d.title + "\n" + d.markdown).toLowerCase();
  });

  var els = {
    tree: document.getElementById("tree"),
    search: document.getElementById("search"),
    meta: document.getElementById("search-meta"),
    main: document.getElementById("main"),
    inner: document.getElementById("main-inner"),
  };

  var currentPath = null;
  var collapsed = Object.create(null);

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** POSIX-style path resolution, used to turn relative md links into repo paths. */
  function resolvePath(fromDir, href) {
    var base = href.charAt(0) === "/" ? [] : fromDir.split("/").filter(Boolean);
    var parts = href.split("/");
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p === "" || p === ".") continue;
      if (p === "..") base.pop();
      else base.push(p);
    }
    return base.join("/");
  }

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .replace(/<[^>]*>/g, "")
      .replace(/[^\w\u0080-\uFFFF\- ]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  // ------------------------------------------------------------------
  // Markdown rendering
  // ------------------------------------------------------------------
  var renderDir = "";
  var slugCounts = Object.create(null);

  marked.use({
    gfm: true,
    breaks: false,
    renderer: {
      heading: function (token) {
        var text = this.parser.parseInline(token.tokens);
        var slug = slugify(token.text) || "section";
        slugCounts[slug] = (slugCounts[slug] || 0) + 1;
        var id = slugCounts[slug] > 1 ? slug + "-" + (slugCounts[slug] - 1) : slug;
        return "<h" + token.depth + ' id="' + escapeHtml(id) + '">' + text + "</h" + token.depth + ">\n";
      },
      // Tables get their own horizontal scroll container so the page never scrolls sideways.
      table: function (token) {
        var html = this.constructor.prototype.table.call(this, token);
        return '<div class="table-wrap">' + html + "</div>\n";
      },
      link: function (token) {
        var text = this.parser.parseInline(token.tokens);
        var href = token.href || "";
        var title = token.title ? ' title="' + escapeHtml(token.title) + '"' : "";

        // In-page anchors stay as-is.
        if (href.charAt(0) === "#") {
          return '<a href="' + escapeHtml(href) + '"' + title + ">" + text + "</a>";
        }
        // External links open in a new tab (user-initiated only; nothing is fetched).
        if (/^(https?:|mailto:)/i.test(href)) {
          return (
            '<a href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer"' + title + ">" + text + "</a>"
          );
        }
        // Relative link: resolve against this doc's folder and map to an inlined doc.
        var hash = "";
        var hashAt = href.indexOf("#");
        var bare = href;
        if (hashAt !== -1) {
          hash = href.slice(hashAt);
          bare = href.slice(0, hashAt);
        }
        var resolved = resolvePath(renderDir, decodeURI(bare));
        if (byPath[resolved]) {
          return '<a class="doc-xref" href="#' + escapeHtml(resolved) + escapeHtml(hash) + '"' + title + ">" + text + "</a>";
        }
        // Anything else would be a broken file:// navigation — render it inert.
        return (
          '<a class="dead" title="Not available in this viewer: ' + escapeHtml(href) + '">' + text + "</a>"
        );
      },
    },
  });

  function renderMarkdown(doc) {
    renderDir = doc.path.indexOf("/") === -1 ? "" : doc.path.slice(0, doc.path.lastIndexOf("/"));
    slugCounts = Object.create(null);
    try {
      return marked.parse(doc.markdown);
    } catch (err) {
      return "<p>Failed to render this document: " + escapeHtml(err && err.message) + "</p>";
    }
  }

  // ------------------------------------------------------------------
  // Sidebar tree
  // ------------------------------------------------------------------
  function groupDocs(docs) {
    var groups = [];
    var index = Object.create(null);
    docs.forEach(function (d) {
      if (!index[d.category]) {
        index[d.category] = { key: d.category, label: d.categoryLabel, docs: [] };
        groups.push(index[d.category]);
      }
      index[d.category].docs.push(d);
    });
    return groups;
  }

  function buildTree(docs, opts) {
    els.tree.textContent = "";
    if (!docs.length) {
      var empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "No documents match your search.";
      els.tree.appendChild(empty);
      return;
    }

    groupDocs(docs).forEach(function (group) {
      var section = document.createElement("div");
      section.className = "cat" + (collapsed[group.key] && !opts.forceOpen ? " collapsed" : "");

      var head = document.createElement("button");
      head.className = "cat-head";
      head.type = "button";
      head.innerHTML =
        '<span class="cat-caret">▼</span><span class="cat-name"></span><span class="cat-count"></span>';
      head.querySelector(".cat-name").textContent = group.label;
      head.querySelector(".cat-count").textContent = String(group.docs.length);
      head.addEventListener("click", function () {
        var isCollapsed = section.classList.toggle("collapsed");
        collapsed[group.key] = isCollapsed;
      });
      section.appendChild(head);

      var list = document.createElement("ul");
      list.className = "cat-list";
      group.docs.forEach(function (doc) {
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.className = "doc-link" + (doc.path === currentPath ? " active" : "");
        btn.type = "button";
        btn.dataset.path = doc.path;

        var titleSpan = document.createElement("span");
        titleSpan.textContent = doc.title;
        btn.appendChild(titleSpan);

        if (opts.query) {
          var excerpt = makeExcerpt(doc, opts.query);
          if (excerpt) {
            var ex = document.createElement("span");
            ex.className = "doc-excerpt";
            ex.innerHTML = excerpt;
            btn.appendChild(ex);
          }
        }

        btn.addEventListener("click", function () {
          location.hash = doc.path;
        });
        li.appendChild(btn);
        list.appendChild(li);
      });
      section.appendChild(list);
      els.tree.appendChild(section);
    });
  }

  // ------------------------------------------------------------------
  // Search
  // ------------------------------------------------------------------
  function makeExcerpt(doc, query) {
    var hay = doc.searchText;
    var at = hay.indexOf(query);
    // Title-only hit: nothing useful to excerpt from the body.
    if (at === -1) return "";
    var source = doc.title + "\n" + doc.markdown;
    var start = Math.max(0, at - 45);
    var end = Math.min(source.length, at + query.length + 90);
    var slice = source.slice(start, end).replace(/\s+/g, " ").trim();
    var html = escapeHtml(slice);
    // Highlight every occurrence of the term inside the excerpt.
    var needle = escapeHtml(query).toLowerCase();
    var out = "";
    var lower = html.toLowerCase();
    var pos = 0;
    while (needle) {
      var hit = lower.indexOf(needle, pos);
      if (hit === -1) break;
      out += html.slice(pos, hit) + "<mark>" + html.slice(hit, hit + needle.length) + "</mark>";
      pos = hit + needle.length;
    }
    out += html.slice(pos);
    return (start > 0 ? "…" : "") + out + (end < source.length ? "…" : "");
  }

  function applySearch() {
    var query = els.search.value.trim().toLowerCase();
    if (!query) {
      buildTree(DOCS, { forceOpen: false, query: "" });
      els.meta.textContent = DOCS.length + " documents";
      return;
    }
    var hits = DOCS.filter(function (d) {
      return d.searchText.indexOf(query) !== -1;
    });
    buildTree(hits, { forceOpen: true, query: query });
    els.meta.textContent = hits.length + (hits.length === 1 ? " match" : " matches");
  }

  // ------------------------------------------------------------------
  // Routing
  // ------------------------------------------------------------------
  function showWelcome() {
    currentPath = null;
    document.title = TITLE;
    els.inner.innerHTML =
      '<div id="welcome"><h1>' +
      escapeHtml(TITLE) +
      "</h1>" +
      "<p>" +
      DOCS.length +
      " documents, fully offline. Pick one from the sidebar, or search across every doc's title and full text.</p>" +
      "<p>Press <kbd>/</kbd> to jump to search. Deep-link any doc with its path, e.g. " +
      "<code>#docs/modules/orders.md</code>.</p>" +
      "<p>This file is generated — re-run <code>pnpm docs:viewer</code> after changing the docs.</p></div>";
    highlightActive();
  }

  function showDoc(pathname, anchor) {
    var doc = byPath[pathname];
    if (!doc) return showWelcome();
    currentPath = doc.path;
    document.title = doc.title + " · " + TITLE;
    els.inner.innerHTML =
      '<div id="doc-path"></div><article id="doc-body"></article>';
    els.inner.querySelector("#doc-path").textContent = doc.path;
    els.inner.querySelector("#doc-body").innerHTML = renderMarkdown(doc);
    highlightActive();

    if (anchor) {
      var target = els.inner.querySelector("#" + (window.CSS && CSS.escape ? CSS.escape(anchor) : anchor));
      if (target) return target.scrollIntoView();
    }
    els.main.scrollTop = 0;
  }

  function highlightActive() {
    var links = els.tree.querySelectorAll(".doc-link");
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle("active", links[i].dataset.path === currentPath);
    }
  }

  function route() {
    var raw = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!raw) return showWelcome();
    var anchor = "";
    var hashAt = raw.indexOf("#");
    if (hashAt !== -1) {
      anchor = raw.slice(hashAt + 1);
      raw = raw.slice(0, hashAt);
    }
    showDoc(raw, anchor);
  }

  // ------------------------------------------------------------------
  // Init
  // ------------------------------------------------------------------
  els.search.addEventListener("input", applySearch);
  els.search.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      els.search.value = "";
      applySearch();
      els.search.blur();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== els.search) {
      e.preventDefault();
      els.search.focus();
    }
  });
  window.addEventListener("hashchange", route);

  applySearch();
  route();
})();
`;

function buildHtml({ docs, marked, title }) {
  const generatedAt = new Date().toISOString();
  const payload = docs.map((d) => ({
    path: d.path,
    category: d.category,
    categoryLabel: d.categoryLabel,
    title: d.title,
    markdown: d.markdown,
  }));

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtmlAttr(title)}</title>
<!--
  GENERATED FILE — do not edit by hand.
  Built by scripts/build-docs-viewer.mjs at ${generatedAt}
  ${payload.length} documents · marked v${marked.version} (${marked.file}) inlined
  Regenerate with: pnpm docs:viewer
-->
<style>
${CSS}
</style>
</head>
<body>
<div id="layout">
  <aside id="sidebar">
    <div id="sidebar-head">
      <p id="brand">${escapeHtmlAttr(title)}</p>
      <p id="brand-sub">Offline docs explorer · generated ${generatedAt.slice(0, 10)}</p>
      <input id="search" type="search" placeholder="Search all docs…" autocomplete="off" spellcheck="false" aria-label="Search all docs">
      <div id="search-meta"></div>
    </div>
    <nav id="tree" aria-label="Documents"></nav>
  </aside>
  <main id="main">
    <div id="main-inner"></div>
  </main>
</div>

<!-- marked v${marked.version} — inlined from node_modules at build time (no CDN, no network) -->
<script>
${marked.source}
</script>

<script id="docs-data">
window.__DOCS_TITLE__ = ${toEmbeddedJson(title)};
window.__DOCS__ = ${toEmbeddedJson(payload)};
</script>

<script>
${JS}
</script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const docs = await collectDocs();
  if (!docs.length) throw new Error(`No markdown found under ${DOCS_DIR}`);

  const marked = await readMarkedBundle();
  const title = await resolveTitle();
  const html = buildHtml({ docs, marked, title });
  await writeFile(OUT_FILE, html, "utf8");

  const bytes = Buffer.byteLength(html);
  const size = bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(2) + " MB" : Math.round(bytes / 1024) + " KB";

  const counts = new Map();
  for (const d of docs) counts.set(d.categoryLabel, (counts.get(d.categoryLabel) ?? 0) + 1);

  console.log("Docs viewer built");
  console.log("  output : " + path.relative(ROOT, OUT_FILE));
  console.log("  size   : " + size);
  console.log("  docs   : " + docs.length);
  console.log("  marked : v" + marked.version + " (" + marked.file + ", inlined)");
  console.log("  categories:");
  for (const [label, count] of counts) console.log("    " + label.padEnd(20) + count);
  console.log("\nOpen it with: open " + path.relative(ROOT, OUT_FILE));
}

main().catch((err) => {
  console.error("Failed to build docs viewer:\n", err);
  process.exit(1);
});
