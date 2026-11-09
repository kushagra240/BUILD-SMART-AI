# Install the agent kit (2 minutes)

1. Copy into the repo root, keeping paths:
   - `AGENTS.md`  -> repo root
   - `.agents/skills/buildsmart-ai/`  -> repo root (also copy or symlink it into the folder your tool reads for skills, e.g. `.claude/skills/` for Claude Code; check your tool's docs for the exact folder)
   - `docs/TASKS.md`  -> `docs/TASKS.md`
2. Commit on a branch: `git checkout -b chore/agent-kit`, `git add AGENTS.md .agents docs/TASKS.md`, commit, push, merge.
3. Start every new agent session with: "Read AGENTS.md, load the buildsmart-ai skill, read docs/TASKS.md, then claim one task in your lane."
4. Give each agent a different lane (L1 to L6) so they never edit the same files.
5. After the rates package is placed (task T01), update the status file whenever reality changes.
Not verified: which skills folder each tool scans. AGENTS.md alone works everywhere because it points to the skill path.
