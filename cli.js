#!/usr/bin/env node
import { execSync } from "child_process";
import { parseArgs } from "node:util";

const HELP = `
gh-release — generate release notes from git history

Usage:
  gh-release                    # notes since last tag → HEAD
  gh-release v1.2.0             # notes since previous tag → v1.2.0
  gh-release v1.0.0..v1.2.0     # notes between two tags
  gh-release --unreleased       # notes since last tag (unreleased)

Options:
  --repo <path>       path to git repo (default: .)
  --format <fmt>      output: text, json, markdown (default: text)
  --include-merge     include merge commits (default: false)
  --version           show version
  -h, --help          show help
`;

function run(cmd, cwd) {
  try {
    return execSync(cmd, { cwd: cwd || ".", encoding: "utf8", stdio: ["pipe","pipe","pipe"] }).trim();
  } catch { return ""; }
}

function getTags(repo) {
  const out = run("git tag --sort=-version:refname", repo);
  return out ? out.split("\n") : [];
}

function getPreviousTag(tags, currentTag) {
  const idx = tags.indexOf(currentTag);
  return idx >= 0 && idx + 1 < tags.length ? tags[idx + 1] : null;
}

function getCommits(repo, from, to, includeMerge) {
  let range;
  if (from) range = `${from}..${to || "HEAD"}`;
  else if (to) range = `${to}`;
  else range = "HEAD";
  const cmd = includeMerge
    ? `git log ${range} --pretty=format:"%H|%s|%an|%ad" --date=short`
    : `git log ${range} --no-merges --pretty=format:"%H|%s|%an|%ad" --date=short`;
  const out = run(cmd, repo);
  if (!out) return [];
  return out.split("\n").map(line => {
    const [hash, subject, author, date] = line.split("|");
    return { hash, subject, author, date };
  });
}

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

function formatJSON(cats, from, to, commits) {
  return JSON.stringify({ from, to, commits, categories: cats }, null, 2);
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

function main() {
  const { values, positionals } = parseArgs({
    options: {
      repo: { type: "string", default: "." },
      format: { type: "string", default: "text" },
      "include-merge": { type: "boolean", default: false },
      unreleased: { type: "boolean", default: false },
      version: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    strict: true,
    allowPositionals: true,
  });

  if (values.help) { console.log(HELP); process.exit(0); }
  if (values.version) { console.log("1.0.0"); process.exit(0); }

  const repo = values.repo;
  const tags = getTags(repo);

  let from, to;
  const arg = positionals[0];

  if (arg && arg.includes("..")) {
    [from, to] = arg.split("..");
  } else if (arg) {
    to = arg;
    from = getPreviousTag(tags, to);
  } else if (values.unreleased) {
    from = tags[0] || null;
    to = null;
  } else {
    from = tags[0] || null;
    to = null;
  }

  const commits = getCommits(repo, from, to, values["include-merge"]);
  const cats = categorize(commits);

  if (values.format === "json") console.log(formatJSON(cats, from, to, commits));
  else if (values.format === "markdown") console.log(formatMarkdown(cats, from, to));
  else console.log(formatText(cats, from, to));
}

main();
