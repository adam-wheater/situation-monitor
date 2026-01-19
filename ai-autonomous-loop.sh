#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# AUTONOMOUS SOFTWARE FACTORY — macOS FULL LAB EDITION
# STABLE, VERSION-AGNOSTIC, TMUX-SAFE
# ============================================================

export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"

# ----------------------------
# Locate Claude
# ----------------------------
CLAUDE_CMD="$(command -v claude || true)"
[ -z "$CLAUDE_CMD" ] && { echo "ERROR: claude not found"; exit 1; }

# ----------------------------
# Basic config
# ----------------------------
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_BRANCH="main"
WORK_BRANCH="ai-work"
TMUX_SESSION="ai-loop"

BUG_HUNT_EVERY=5
STABILITY_EVERY=7
MUTATION_EVERY=5

TMUX_TIME_LIMIT=1800
COPILOT_TIME_LIMIT=900

MAX_STAGNANT_ITERS=5
MIN_MUTATION_SCORE=60
MAX_WALL_HOURS=48

# ----------------------------
# State
# ----------------------------
STATE_DIR=".ai-metrics"
mkdir -p "$STATE_DIR"
LAST_HASH_FILE="$STATE_DIR/last_hash.txt"
STAGNANT_COUNT_FILE="$STATE_DIR/stagnant_count.txt"
START_TIME_FILE="$STATE_DIR/start_time.txt"
[ -f "$START_TIME_FILE" ] || date +%s > "$START_TIME_FILE"

# ----------------------------
# Helpers
# ----------------------------
hash_tree() {
  ( find src tests TODO.md 2>/dev/null | sort | xargs shasum -a 1 2>/dev/null || true ) | shasum -a 1 | cut -d' ' -f1
}

# ----------------------------
# Sanity checks
# ----------------------------
cd "$PROJECT_DIR"
command -v tmux >/dev/null || { echo "Install tmux"; exit 1; }
command -v node >/dev/null || { echo "Install node"; exit 1; }
command -v npm >/dev/null || { echo "Install npm"; exit 1; }
command -v copilot >/dev/null || { echo "Install copilot CLI"; exit 1; }

# ----------------------------
# 🔐 FORCE CLAUDE CONFIG (NO PROMPTS EVER)
# ----------------------------
mkdir -p .claude

cat > .claude/settings.json <<'EOF'
{
  "sandbox": {
    "enabled": false
  },
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": [
      "Bash",
      "Read",
      "Edit",
      "Write",
      "WebFetch",
      "WebSearch",
      "Task",
      "Skill"
    ],
    "deny": []
  }
}
EOF

cat > CLAUDE.md <<'EOF'
# AUTONOMOUS MODE

- DO NOT ASK QUESTIONS
- DO NOT ASK FOR CONFIRMATION
- APPLY CHANGES DIRECTLY
- USE TOOLS IMMEDIATELY
- FOLLOW AI_MODE.txt STRICTLY

TODO.md is the source of truth.
EOF

git add .claude/settings.json CLAUDE.md || true
git commit -m "Enforce autonomous Claude permissions" || true

# ----------------------------
# JS toolchain bootstrap
# ----------------------------
[ -f package.json ] || npm init -y
mkdir -p src tests/unit tests/e2e public
[ -f TODO.md ] || echo "# TODO" > TODO.md

npm install --save-dev vitest playwright @playwright/test \
  @stryker-mutator/core @stryker-mutator/javascript-mutator @stryker-mutator/vitest-runner || true

npx playwright install || true

# ----------------------------
# Config files
# ----------------------------
[ -f vitest.config.js ] || cat > vitest.config.js <<'EOF'
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'jsdom', include: ['tests/unit/**/*.test.js'] }
});
EOF

[ -f playwright.config.js ] || cat > playwright.config.js <<'EOF'
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  use: { headless: true }
});
EOF

[ -f stryker.conf.json ] || cat > stryker.conf.json <<'EOF'
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "testRunner": "vitest",
  "mutate": ["src/**/*.js"],
  "reporters": ["json", "html", "clear-text"],
  "coverageAnalysis": "off"
}
EOF

node - <<'EOF'
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));
pkg.scripts ||= {};
pkg.scripts.test ||= "vitest run";
pkg.scripts["test:e2e"] ||= "playwright test";
pkg.scripts["test:all"] ||= "npm run test && npm run test:e2e";
pkg.scripts.mutate ||= "stryker run";
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
EOF

# ----------------------------
# Copilot agents
# ----------------------------
mkdir -p .github/agents

make_agent() {
  local name="$1"
  local extra="$2"
  cat > ".github/agents/$name.agent.md" <<EOF
# $name
models: [copilot-coding]
tools: { allow: [shell, read, write, search, git] }
behavior: { non_interactive: true, auto_apply: true, no_confirmations: true }
instructions: |
  You are an autonomous specialist.
  You may modify code, tests, and TODO.md.
  $extra
EOF
}

make_agent "autonomous-reviewer" "General code quality and bugs."
make_agent "security-reviewer" "Security issues."
make_agent "performance-reviewer" "Performance issues."
make_agent "test-quality-reviewer" "Test quality and coverage."

# ----------------------------
# Main loop
# ----------------------------
ITER=1
echo 0 > "$STAGNANT_COUNT_FILE"

while true; do
  echo "================ ITERATION $ITER ================"

  MODE="normal"
  (( ITER % BUG_HUNT_EVERY == 0 )) && MODE="bughunt"
  (( ITER % STABILITY_EVERY == 0 )) && MODE="stability"
  echo "$MODE" > AI_MODE.txt

  CURRENT_HASH="$(hash_tree)"
  LAST_HASH="$(cat "$LAST_HASH_FILE" 2>/dev/null || echo "")"

  if [ "$CURRENT_HASH" = "$LAST_HASH" ]; then
    STAGNANT=$(($(cat "$STAGNANT_COUNT_FILE") + 1))
    echo "$STAGNANT" > "$STAGNANT_COUNT_FILE"
    [ "$STAGNANT" -ge "$MAX_STAGNANT_ITERS" ] && { echo "Converged. Exiting."; exit 0; }
  else
    echo 0 > "$STAGNANT_COUNT_FILE"
    echo "$CURRENT_HASH" > "$LAST_HASH_FILE"
  fi

  git checkout "$MAIN_BRANCH"
  git pull --ff-only || true
  git branch -D "$WORK_BRANCH" >/dev/null 2>&1 || true
  git checkout -b "$WORK_BRANCH"

  PROMPT_AUD="$(mktemp)"
  PROMPT_A="$(mktemp)"
  PROMPT_B="$(mktemp)"

  cat > "$PROMPT_AUD" <<EOF
You are the Auditor. Mode: $MODE.
Rewrite TODO.md. Split into TODO_A.md and TODO_B.md. Write AUDIT.md.
EOF

  cat > "$PROMPT_A" <<EOF
You are Builder A. Mode: $MODE.
Implement TODO_A.md fully with tests.
EOF

  cat > "$PROMPT_B" <<EOF
You are Builder B. Mode: $MODE.
Implement TODO_B.md fully with tests.
EOF

  tmux kill-session -t "$TMUX_SESSION" >/dev/null 2>&1 || true
  tmux new-session -d -s "$TMUX_SESSION" -c "$PROJECT_DIR"
  tmux split-window -h
  tmux split-window -v
  tmux select-layout tiled

  send_prompt() {
    local pane="$1"
    local file="$2"
    tmux send-keys -t "$pane" "bash -lc '$CLAUDE_CMD .'" C-m
    sleep 3
    tmux load-buffer "$file"
    tmux paste-buffer -t "$pane"
    tmux send-keys -t "$pane" C-m
  }

  send_prompt "$TMUX_SESSION:0.0" "$PROMPT_AUD"
  send_prompt "$TMUX_SESSION:0.1" "$PROMPT_A"
  send_prompt "$TMUX_SESSION:0.2" "$PROMPT_B"

  ( sleep "$TMUX_TIME_LIMIT"; tmux kill-session -t "$TMUX_SESSION" >/dev/null 2>&1 || true ) &
  tmux attach -t "$TMUX_SESSION" || true

  rm -f "$PROMPT_AUD" "$PROMPT_A" "$PROMPT_B"

  if ! git diff --quiet; then
    git add -A
    git commit -m "Claude iteration $ITER ($MODE)"
  fi

  # ---------------- Copilot reviewers ----------------
  git diff HEAD~1..HEAD > "$STATE_DIR/last.diff" || true

  for AGENT in autonomous-reviewer security-reviewer performance-reviewer test-quality-reviewer; do
    timeout "$COPILOT_TIME_LIMIT" copilot --agent "$AGENT" --non-interactive -i \
"Mode: $MODE. Review repo and diff:

$(cat "$STATE_DIR/last.diff")" || true
  done

  if ! git diff --quiet; then
    git add -A
    git commit -m "Copilot review $ITER"
  fi

  # ---------------- Merge ----------------
  git checkout "$MAIN_BRANCH"
  if ! git merge --no-ff --no-edit "$WORK_BRANCH"; then
    git checkout --theirs .
    git add -A
    git commit -m "Auto-resolve conflict" || true
  fi

  npm run test:all || echo "Test failures" >> TODO.md

  if (( ITER % MUTATION_EVERY == 0 )); then
    npm run mutate || true
  fi

  ITER=$((ITER + 1))
done
