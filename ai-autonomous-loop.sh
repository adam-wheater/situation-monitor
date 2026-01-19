#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# AUTONOMOUS SOFTWARE FACTORY — macOS FULL LAB EDITION
# QODO-FREE, VERSION-AGNOSTIC, STABLE
# ============================================================

# ----------------------------
# PATH FIX FOR TMUX
# ----------------------------
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"

# ----------------------------
# Locate Claude
# ----------------------------
CLAUDE_CMD="$(command -v claude || true)"
if [ -z "$CLAUDE_CMD" ]; then
  echo "ERROR: claude not found in PATH"
  exit 1
fi

# ----------------------------
# Basic config
# ----------------------------
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_BRANCH="main"
WORK_BRANCH="ai-work"
TMUX_SESSION="ai-loop"

# ----------------------------
# Control parameters
# ----------------------------
BUG_HUNT_EVERY=5
STABILITY_EVERY=7
MUTATION_EVERY=5

TMUX_TIME_LIMIT=1800        # 30 minutes Claude
COPILOT_TIME_LIMIT=1800     # 30 minutes per Copilot agent

MAX_STAGNANT_ITERS=5
MIN_MUTATION_SCORE=60
MAX_PERF_REGRESSION=10
MAX_WALL_HOURS=48

# ----------------------------
# State
# ----------------------------
STATE_DIR=".ai-metrics"
mkdir -p "$STATE_DIR"

LAST_HASH_FILE="$STATE_DIR/last_hash.txt"
STAGNANT_COUNT_FILE="$STATE_DIR/stagnant_count.txt"
PERF_BASELINE_FILE="$STATE_DIR/perf.txt"
FORCED_MODE_FILE="$STATE_DIR/forced_mode.txt"
START_TIME_FILE="$STATE_DIR/start_time.txt"

[ -f "$START_TIME_FILE" ] || date +%s > "$START_TIME_FILE"

# ----------------------------
# Helpers
# ----------------------------
fail() { echo "ERROR: $*" 1>&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

hash_tree() {
  ( find src tests TODO.md 2>/dev/null | sort | xargs shasum -a 1 2>/dev/null || true ) | shasum -a 1 | cut -d' ' -f1
}

# ----------------------------
# Wall clock limit
# ----------------------------
START_TIME="$(cat "$START_TIME_FILE")"
NOW="$(date +%s)"
ELAPSED_HOURS="$(( (NOW - START_TIME) / 3600 ))"
if [ "$ELAPSED_HOURS" -ge "$MAX_WALL_HOURS" ]; then
  echo "⏹️ Max wall-clock time reached. Stopping."
  exit 0
fi

# ----------------------------
# Sanity checks
# ----------------------------
cd "$PROJECT_DIR"

have git || fail "git missing"
have tmux || fail "tmux missing"
have node || fail "node missing"
have npm || fail "npm missing"
have copilot || fail "copilot missing"
have gtimeout || fail "gtimeout missing (brew install coreutils)"

# ----------------------------
# Project skeleton
# ----------------------------
[ -f package.json ] || npm init -y
mkdir -p src tests/unit tests/e2e public
[ -f TODO.md ] || echo "# TODO" > TODO.md

# ----------------------------
# Install JS tooling
# ----------------------------
npm install --save-dev vitest @vitest/coverage-v8 playwright @playwright/test \
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
pkg.scripts.perf ||= "node perf.js";
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
EOF

# ----------------------------
# Claude config
# ----------------------------
mkdir -p .claude

cat > .claude/settings.json <<'EOF'
{
  "model": "claude-sonnet",
  "sandbox": false,
  "autoApplyEdits": true,
  "permissions": { "allow": ["Bash*","Read**","Edit**","Write**"] }
}
EOF

cat > CLAUDE.md <<'EOF'
# Autonomous Engineering Loop

- DO NOT ask questions
- DO NOT ask for confirmation
- APPLY CHANGES DIRECTLY
- USE TOOLS IMMEDIATELY
- OBEY AI_MODE.txt STRICTLY

TODO.md is the source of truth.
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
  You are a fully autonomous specialist reviewer.
  You may modify code, tests, and TODO.md.
  Specialisation:
  $extra
EOF
}

make_agent "autonomous-reviewer" "General code quality, bugs, architecture."
make_agent "security-reviewer" "Security, input validation, unsafe APIs."
make_agent "performance-reviewer" "Performance, memory, algorithmic complexity."
make_agent "test-quality-reviewer" "Test quality, assertions, edge cases."

# ----------------------------
# Main loop
# ----------------------------
ITER=1
echo 0 > "$STAGNANT_COUNT_FILE"

while true; do
  echo "============================================"
  echo " 🤖 ITERATION $ITER"
  echo "============================================"

  MODE="normal"
  (( ITER % BUG_HUNT_EVERY == 0 )) && MODE="bughunt"
  (( ITER % STABILITY_EVERY == 0 )) && MODE="stability"

  if [ -f "$FORCED_MODE_FILE" ]; then
    MODE="$(cat "$FORCED_MODE_FILE")"
    echo "⚠️ Forced mode: $MODE"
  fi

  echo "$MODE" > AI_MODE.txt

  # ------------------ Convergence ------------------
  CURRENT_HASH="$(hash_tree)"
  LAST_HASH="$(cat "$LAST_HASH_FILE" 2>/dev/null || echo "")"

  if [ "$CURRENT_HASH" = "$LAST_HASH" ]; then
    STAGNANT=$(($(cat "$STAGNANT_COUNT_FILE") + 1))
    echo "$STAGNANT" > "$STAGNANT_COUNT_FILE"
    if [ "$STAGNANT" -ge "$MAX_STAGNANT_ITERS" ]; then
      echo "✅ Convergence detected. Stopping."
      exit 0
    fi
  else
    echo 0 > "$STAGNANT_COUNT_FILE"
    echo "$CURRENT_HASH" > "$LAST_HASH_FILE"
  fi

  # ------------------ Git sync ------------------
  git checkout "$MAIN_BRANCH"
  git pull --ff-only || true
  git branch -D "$WORK_BRANCH" >/dev/null 2>&1 || true
  git checkout -b "$WORK_BRANCH"

  # ------------------ Claude tmux ------------------
  PROMPT_AUD=$(mktemp)
  PROMPT_A=$(mktemp)
  PROMPT_B=$(mktemp)

  cat > "$PROMPT_AUD" <<EOF
You are the Auditor. Mode: $MODE.
Rewrite TODO.md, split into TODO_A.md and TODO_B.md, write AUDIT.md.
EOF

  cat > "$PROMPT_A" <<EOF
You are Builder A. Mode: $MODE.
Work only on TODO_A.md.
EOF

  cat > "$PROMPT_B" <<EOF
You are Builder B. Mode: $MODE.
Work only on TODO_B.md.
EOF

  tmux kill-session -t "$TMUX_SESSION" >/dev/null 2>&1 || true
  tmux new-session -d -s "$TMUX_SESSION" -c "$PROJECT_DIR"
  tmux split-window -h
  tmux split-window -v
  tmux select-layout tiled

  tmux send-keys -t "$TMUX_SESSION:0.0" "bash -lc '$CLAUDE_CMD .'" C-m
  sleep 2; tmux send-keys -t "$TMUX_SESSION:0.0" "cat '$PROMPT_AUD'" C-m

  tmux send-keys -t "$TMUX_SESSION:0.1" "bash -lc '$CLAUDE_CMD .'" C-m
  sleep 2; tmux send-keys -t "$TMUX_SESSION:0.1" "cat '$PROMPT_A'" C-m

  tmux send-keys -t "$TMUX_SESSION:0.2" "bash -lc '$CLAUDE_CMD .'" C-m
  sleep 2; tmux send-keys -t "$TMUX_SESSION:0.2" "cat '$PROMPT_B'" C-m

  ( sleep "$TMUX_TIME_LIMIT"; tmux kill-session -t "$TMUX_SESSION" >/dev/null 2>&1 || true ) &
  WATCHDOG_PID=$!
  tmux attach -t "$TMUX_SESSION" || true
  kill "$WATCHDOG_PID" >/dev/null 2>&1 || true

  rm -f "$PROMPT_AUD" "$PROMPT_A" "$PROMPT_B"

  if ! git diff --quiet; then
    git add -A
    git commit -m "Claude iteration $ITER ($MODE)"
  fi

  # ------------------ Copilot reviewers ------------------
  git diff HEAD~1..HEAD > "$STATE_DIR/last.diff" || true

  for AGENT in autonomous-reviewer security-reviewer performance-reviewer test-quality-reviewer; do
    gtimeout "$COPILOT_TIME_LIMIT" copilot --agent "$AGENT" --non-interactive -i \
"Mode: $MODE. Review repo and diff:

$(cat "$STATE_DIR/last.diff")" || true
  done

  if ! git diff --quiet; then
    git add -A
    git commit -m "Copilot review $ITER"
  fi

  # ------------------ Merge ------------------
  git checkout "$MAIN_BRANCH"
  if ! git merge --no-ff --no-edit "$WORK_BRANCH"; then
    git checkout --theirs .
    git add -A
    git commit -m "Auto-resolve merge conflict" || {
      "$CLAUDE_CMD" .
      git add -A
      git commit -m "Resolve merge via Claude"
    }
  fi

  # ------------------ Tests + visuals ------------------
  if [ "$MODE" = "stability" ]; then
    npx playwright test --update-snapshots || true
  fi

  if ! npm run test:all; then
    echo "⚠️ Test or visual failure" >> TODO.md
    echo "stability" > "$FORCED_MODE_FILE"
  fi

  # ------------------ Performance ------------------
  if npm run perf > "$STATE_DIR/perf_new.txt" 2>/dev/null; then
    NEW_PERF="$(tr -d ' \n' < "$STATE_DIR/perf_new.txt")"
    if [[ "$NEW_PERF" =~ ^[0-9]+$ ]]; then
      if [ -f "$PERF_BASELINE_FILE" ]; then
        OLD_PERF="$(cat "$PERF_BASELINE_FILE")"
        if [ "$NEW_PERF" -gt "$((OLD_PERF * (100 + MAX_PERF_REGRESSION) / 100))" ]; then
          echo "⚠️ Performance regression" >> TODO.md
          echo "bughunt" > "$FORCED_MODE_FILE"
        fi
      fi
      echo "$NEW_PERF" > "$PERF_BASELINE_FILE"
    fi
  fi

  # ------------------ Mutation gate ------------------
  if (( ITER % MUTATION_EVERY == 0 )); then
    npm run mutate || true
    if [ -f reports/mutation/mutation.json ]; then
      SCORE="$(node -e "const r=require('./reports/mutation/mutation.json'); console.log(r.metrics?.mutationScore || r.metrics?.metrics?.mutationScore || 0)")"
      if (( ${SCORE%.*} < MIN_MUTATION_SCORE )); then
        echo "⚠️ Mutation score low" >> TODO.md
        echo "stability" > "$FORCED_MODE_FILE"
      else
        rm -f "$FORCED_MODE_FILE"
      fi
    fi
  fi

  ITER=$((ITER + 1))
done
