# Skill Registry — liquidacion-domestica

> Index of available LLM skills. Each entry provides the trigger context and
> exact path. Sub-agents MUST read the full SKILL.md at the listed path before
> acting. This is an index, not a summary — the skill file is the source of truth.

Generated: 2026-05-28
Source: ~/.config/opencode/skills/ (user-level)

## Project Convention Files

| File | Path |
|------|------|
| AGENTS.md | C:\Users\USER\OneDrive\Documentos\liquidacion-domestica\AGENTS.md |

## Project Skills

*(No project-level skill directories found)*

## User Skills

| Name | Trigger | Path | Scope |
|------|---------|------|-------|
| branch-pr | Create Gentle AI pull requests with issue-first checks. Creating, opening, or preparing PRs for review. | C:\Users\USER\.config\opencode\skills\branch-pr\SKILL.md | user |
| chained-pr | PRs over 400 lines, stacked PRs, review slices. Split oversized changes into chained PRs that protect review focus. | C:\Users\USER\.config\opencode\skills\chained-pr\SKILL.md | user |
| cognitive-doc-design | Design docs that reduce cognitive load. Writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs. | C:\Users\USER\.config\opencode\skills\cognitive-doc-design\SKILL.md | user |
| comment-writer | Write warm, direct collaboration comments. PR feedback, issue replies, reviews, Slack messages, or GitHub comments. | C:\Users\USER\.config\opencode\skills\comment-writer\SKILL.md | user |
| customize-opencode | Editing or creating opencode's own configuration files or its subagent/skill/plugin/MCP/permission config. | C:\Users\USER\.config\opencode\skills\customize-opencode\SKILL.md | user |
| go-testing | Go tests, go test coverage, Bubbletea teatest, golden files. Apply focused Go testing patterns. | C:\Users\USER\.config\opencode\skills\go-testing\SKILL.md | user |
| issue-creation | Create Gentle AI issues with issue-first checks. Creating GitHub issues, bug reports, or feature requests. | C:\Users\USER\.config\opencode\skills\issue-creation\SKILL.md | user |
| judgment-day | Judgment day, dual review, adversarial review, juzgar. Run blind dual review, fix confirmed issues, then re-judge. | C:\Users\USER\.config\opencode\skills\judgment-day\SKILL.md | user |
| skill-creator | New skills, agent instructions, documenting AI usage patterns. Create LLM-first skills with valid frontmatter. | C:\Users\USER\.config\opencode\skills\skill-creator\SKILL.md | user |
| skill-improver | Improve skills, audit skills, refactor skills, skill quality. Audit and upgrade existing LLM-first skills. | C:\Users\USER\.config\opencode\skills\skill-improver\SKILL.md | user |
| work-unit-commits | Plan commits as reviewable work units. Implementation, commit splitting, chained PRs, or keeping tests and docs with code. | C:\Users\USER\.config\opencode\skills\work-unit-commits\SKILL.md | user |

## Legend

- **Name**: Skill identifier — use this with the `skill()` tool to load.
- **Trigger**: The `description` field — context that activates this skill.
- **Path**: Full filesystem path to the SKILL.md source of truth.
- **Scope**: `user` (global to the agent) or `project` (specific to this repo).
- Excluded from index: `sdd-*`, `_shared`, `skill-registry` (internal SDD infrastructure).
