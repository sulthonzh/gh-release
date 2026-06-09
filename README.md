# gh-release

Generate release notes from git history. Zero deps, zero config.

It reads your git log, categorizes commits by type (feat/fix/breaking/other), and outputs clean release notes in text, JSON, or markdown.

## Why

Writing release notes is boring. Your commit history already has the info — just extract and format it.

## Install

```bash
npm install -g gh-release
# or
npx gh-release
```

## Usage

```bash
# Release notes since last tag → HEAD
gh-release

# Notes up to a specific tag
gh-release v1.2.0

# Notes between two tags
gh-release v1.0.0..v1.2.0

# Markdown output (paste into GitHub releases)
gh-release --format markdown v1.2.0

# JSON for scripting
gh-release --format json

# Include merge commits
gh-release --include-merge
```

## How it categorizes

- **feat**: commits starting with `feat:`, `feat(scope):`, or `add`
- **fix**: commits starting with `fix:`, `fix(scope):`, or `bug`
- **breaking**: commits with `BREAKING` or starting with `break`
- **other**: everything else

## Output formats

### Text (default)
```
Release: v2.0.0 (since v1.0.0)

⚠️  Breaking
  - BREAKING: new API format (carol, 2026-01-03)

✨ Features
  - feat: add dark mode (alice, 2026-01-01)

🐛 Fixes
  - fix: crash on login (bob, 2026-01-02)

5 commits
```

### Markdown
Great for pasting into GitHub Releases or CHANGELOG.md.

### JSON
For piping into other tools or scripts.

## Options

- `--repo <path>` — path to git repo (default: `.`)
- `--format <fmt>` — `text`, `json`, or `markdown` (default: `text`)
- `--include-merge` — include merge commits
- `--unreleased` — explicit flag for unreleased changes
- `-h, --help` — show help
- `--version` — show version

## License

MIT
