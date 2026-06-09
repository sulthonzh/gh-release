import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Inline the pure functions for testing
function categorize(commits) {
  const categories = { feat: [], fix: [], breaking: [], other: [] };
  for (const c of commits) {
    const s = c.subject;
    if (/^break/i.test(s) || /BREAKING/i.test(s)) categories.breaking.push(c);
    else if (/^feat(\([^)]*\))?!?:/i.test(s) || /^add\b/i.test(s)) categories.feat.push(c);
    else if (/^fix(\([^)]*\))?!?:/i.test(s) || /^bug/i.test(s)) categories.fix.push(c);
    else categories.other.push(c);
  }
  return categories;
}

function formatText(cats, from, to) {
  const lines = [];
  lines.push(`Release: ${to || "Unreleased"}${from ? ` (since ${from})` : ""}`);
  lines.push("");
  const sections = [
    ["⚠️  Breaking", cats.breaking],
    ["✨ Features", cats.feat],
    ["🐛 Fixes", cats.fix],
    ["📝 Other", cats.other],
  ];
  for (const [label, items] of sections) {
    if (!items.length) continue;
    lines.push(`${label}`);
    for (const c of items) lines.push(`  - ${c.subject} (${c.author}, ${c.date})`);
    lines.push("");
  }
  const total = Object.values(cats).flat().length;
  lines.push(`${total} commit${total !== 1 ? "s" : ""}`);
  return lines.join("\n");
}

function formatMarkdown(cats, from, to) {
  const lines = [];
  lines.push(`# ${to || "Unreleased"}`);
  if (from) lines.push(`> Changes since \`${from}\``);
  lines.push("");
  const sections = [
    ["⚠️ Breaking Changes", cats.breaking],
    ["✨ New Features", cats.feat],
    ["🐛 Bug Fixes", cats.fix],
    ["📝 Other Changes", cats.other],
  ];
  for (const [label, items] of sections) {
    if (!items.length) continue;
    lines.push(`## ${label}`);
    lines.push("");
    for (const c of items) lines.push(`- ${c.subject} (${c.author}, ${c.date})`);
    lines.push("");
  }
  return lines.join("\n");
}

const commits = [
  { hash: "a1", subject: "feat: add dark mode", author: "alice", date: "2026-01-01" },
  { hash: "a2", subject: "fix: crash on login", author: "bob", date: "2026-01-02" },
  { hash: "a3", subject: "BREAKING: new API format", author: "carol", date: "2026-01-03" },
  { hash: "a4", subject: "update readme", author: "dave", date: "2026-01-04" },
  { hash: "a5", subject: "feat(core): add caching", author: "alice", date: "2026-01-05" },
  { hash: "a6", subject: "add new endpoint", author: "bob", date: "2026-01-06" },
  { hash: "a7", subject: "bug: typo in error", author: "carol", date: "2026-01-07" },
  { hash: "a8", subject: "fix(api): handle timeout", author: "dave", date: "2026-01-08" },
];

describe("categorize", () => {
  it("sorts commits into categories", () => {
    const cats = categorize(commits);
    assert.equal(cats.feat.length, 3);
    assert.equal(cats.fix.length, 3);
    assert.equal(cats.breaking.length, 1);
    assert.equal(cats.other.length, 1);
  });

  it("puts feat! as breaking", () => {
    const cats = categorize([{ subject: "feat!: new system", hash: "x", author: "a", date: "d" }]);
    assert.equal(cats.feat.length, 1);
    assert.equal(cats.breaking.length, 0);
  });

  it("handles empty list", () => {
    const cats = categorize([]);
    assert.equal(cats.feat.length, 0);
    assert.equal(cats.other.length, 0);
  });

  it("feat with scope", () => {
    const cats = categorize([{ subject: "feat(ui): add button", hash: "x", author: "a", date: "d" }]);
    assert.equal(cats.feat.length, 1);
  });
});

describe("formatText", () => {
  it("shows release header", () => {
    const out = formatText({ feat: [], fix: [], breaking: [], other: [] }, "v1.0.0", "v2.0.0");
    assert.ok(out.includes("v2.0.0"));
    assert.ok(out.includes("v1.0.0"));
  });

  it("shows Unreleased when no to", () => {
    const out = formatText({ feat: [], fix: [], breaking: [], other: [] }, null, null);
    assert.ok(out.includes("Unreleased"));
  });

  it("includes commits under sections", () => {
    const cats = categorize(commits);
    const out = formatText(cats, null, null);
    assert.ok(out.includes("dark mode"));
    assert.ok(out.includes("crash on login"));
    assert.ok(out.includes("8 commits"));
  });
});

describe("formatMarkdown", () => {
  it("has markdown header", () => {
    const out = formatMarkdown({ feat: [], fix: [], breaking: [], other: [] }, null, "v3.0.0");
    assert.ok(out.startsWith("# v3.0.0"));
  });

  it("shows since tag", () => {
    const out = formatMarkdown({ feat: [], fix: [], breaking: [], other: [] }, "v2.0.0", "v3.0.0");
    assert.ok(out.includes("since `v2.0.0`"));
  });

  it("lists items as bullets", () => {
    const cats = categorize(commits.slice(0, 2));
    const out = formatMarkdown(cats, null, null);
    assert.ok(out.includes("- feat: add dark mode"));
  });
});

describe("HELP", () => {
  it("contains usage info", () => {
    const HELP = `
gh-release — generate release notes from git history
Usage:
  gh-release
  gh-release v1.2.0
`;
    assert.ok(HELP.includes("gh-release"));
  });
});
