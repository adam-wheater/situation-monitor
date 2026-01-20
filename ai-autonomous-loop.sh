#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# ============================================================
# AUTONOMOUS SOFTWARE FACTORY — LINUX DOCKER EDITION
# CLAUDE = BUILDER, COPILOT = REVIEWER
# ============================================================

# ----------------------------
# Trust workspace directory (Docker volume)
# ----------------------------
git config --global --add safe.directory /workspace

# ----------------------------
# Locate tools
# ----------------------------
CLAUDE_CMD="$(command -v claude || true)"
COPILOT_CMD="$(command -v copilot || true)"

[ -z "$CLAUDE_CMD" ] && { echo "ERROR: claude not found"; exit 1; }
[ -z "$COPILOT_CMD" ] && { echo "ERROR: copilot not found"; exit 1; }

# ----------------------------
# Basic config
# ----------------------------
PROJECT_DIR="/workspace"
cd "$PROJECT_DIR"

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

REPO_URL="https://github.com/adam-wheater/situation-monitor"

# ----------------------------
# State
# ----------------------------
STATE_DIR=".ai-metrics"
mkdir -p "$STATE_DIR"

LAST_HASH_FILE="$STATE_DIR/last_hash.txt"
STAGNANT_COUNT_FILE="$STATE_DIR/stagnant_count.txt"
START_TIME_FILE="$STATE_DIR/start_time.txt"
FORCED_MODE_FILE="$STATE_DIR/forced_mode.txt"

[ -f "$START_TIME_FILE" ] || date +%s > "$START_TIME_FILE"

# ----------------------------
# Helpers
# ----------------------------
hash_tree() {
  ( find src tests TODO.md 2>/dev/null | sort | xargs sha1sum 2>/dev/null || true ) | sha1sum | cut -d' ' -f1
}

# ----------------------------
# Wall clock limit
# ----------------------------
START_TIME="$(cat "$START_TIME_FILE")"
NOW="$(date +%s)"
ELAPSED_HOURS="$(( (NOW - START_TIME) / 3600 ))"
if [ "$ELAPSED_HOURS" -ge "$MAX_WALL_HOURS" ]; then
  echo "Max wall-clock time reached. Stopping."
  exit 0
fi

# ----------------------------
# Ensure repo exists (robust)
# ----------------------------
if [ ! -d ".git" ]; then
  if [ -z "$(ls -A .)" ]; then
    echo "Empty directory, cloning repository..."
    git clone "$REPO_URL" .
  else
    echo "Directory not empty but no .git — initialising git repo..."
    git init
    git remote add origin "$REPO_URL" || true
    git fetch origin
    git checkout -B main origin/main || git checkout -B main
  fi
fi

# ----------------------------
# Ensure project skeleton
# ----------------------------
[ -f package.json ] || npm init -y
mkdir -p src tests/unit tests/e2e public
[ -f TODO.md ] || echo "# TODO" > TODO.md

# ----------------------------
# Install deps (idempotent)
# ----------------------------
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
# Enforce at least one E2E test
# ----------------------------
if [ ! -f tests/e2e/basic.spec.js ]; then
  cat > tests/e2e/basic.spec.js <<'EOF'
import { test, expect } from '@playwright/test';

test('app loads', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/./);
});
EOF
fi

# ----------------------------
# Claude config
# ----------------------------
mkdir -p .claude

cat > .claude/settings.json <<'EOF'
{
  "sandbox": {
    "enabled": false
  },
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": ["Bash","Read","Edit","Write","WebFetch","WebSearch"]
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

QUALITY RULES:
- The project MUST have Playwright E2E tests in tests/e2e
- If fewer than 3 meaningful E2E tests exist, YOU MUST ADD MORE.
- Every user-facing feature MUST have at least one E2E test.
- If E2E tests fail or are missing, FIX OR CREATE THEM.

TODO.md is the source of truth.
EOF

git add .claude/settings.json CLAUDE.md || true
git commit -m "Enforce autonomous Claude permissions" || true

# ----------------------------
# Main loop
# ----------------------------
ITER=1
echo 0 > "$STAGNANT_COUNT_FILE"

git checkout "$MAIN_BRANCH" || git checkout -b "$MAIN_BRANCH"

while true; do
  echo "================ ITERATION $ITER ================"

  MODE="normal"
  (( ITER % BUG_HUNT_EVERY == 0 )) && MODE="bughunt"
  (( ITER % STABILITY_EVERY == 0 )) && MODE="stability"

  if [ -f "$FORCED_MODE_FILE" ]; then
    MODE="$(cat "$FORCED_MODE_FILE")"
    echo "Forced mode: $MODE"
  fi

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

  # ---------------- Claude tmux ----------------
  PROMPT_AUD="$(mktemp)"
  PROMPT_A="$(mktemp)"
  PROMPT_B="$(mktemp)"

  cat > "$PROMPT_AUD" <<EOF
You are the Auditor. Mode: $MODE.
Rewrite TODO.md. Split into TODO_A.md and TODO_B.md. Write AUDIT.md.
EOF

  cat > "$PROMPT_A" <<EOF
You are Builder A. Mode: $MODE.
Implement TODO_A.md fully with tests (including Playwright if relevant).
EOF

  cat > "$PROMPT_B" <<EOF
You are Builder B. Mode: $MODE.
Implement TODO_B.md fully with tests (including Playwright if relevant).
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

  for ROLE in "autonomous reviewer" "security reviewer" "performance reviewer" "test quality reviewer"; do
    timeout "$COPILOT_TIME_LIMIT" copilot -p "
You are the $ROLE.

Current mode: $MODE.

Review the entire repository and this diff:

$(cat "$STATE_DIR/last.diff")

- Improve the code.
- Fix bugs.
- Improve tests, including Playwright E2E.
- Apply changes directly.
- Do not ask questions.
"
  done || true

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

  # ---------------- Tests ----------------
  if ! npm run test:all; then
    echo "Test failures" >> TODO.md
    echo "stability" > "$FORCED_MODE_FILE"
  else
    rm -f "$FORCED_MODE_FILE"
  fi

  # ---------------- Mutation testing ----------------
  if (( ITER % MUTATION_EVERY == 0 )); then
    npm run mutate || true
    if [ -f reports/mutation/mutation.json ]; then
      SCORE="$(node -e "const r=require('./reports/mutation/mutation.json'); console.log(r.metrics?.mutationScore || r.metrics?.metrics?.mutationScore || 0)")"
      if (( ${SCORE%.*} < MIN_MUTATION_SCORE )); then
        echo "Mutation score below threshold" >> TODO.md
        echo "stability" > "$FORCED_MODE_FILE"
      fi
    fi
  fi

  ITER=$((ITER + 1))
done
