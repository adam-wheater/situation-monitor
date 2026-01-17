#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# AUTONOMOUS MULTI-AGENT ITERATION LOOP (TMUX) — situation-monitor
# ============================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_BRANCH="main"

WT="${PROJECT_DIR%/}/../situation-monitor-ai-loop"
BR="ai-loop"

CLAUDE_CMD="${CLAUDE_CMD:-claude}"
TMUX_SESSION="ai-loop"

TEST_COMMAND=(node --experimental-vm-modules "./test-node.mjs")
BUILD_COMMAND=(python3 -m py_compile "./proxy_server.py")

fail() { echo "ERROR: $*" 1>&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

cleanup() {
  set +e
  cd "$PROJECT_DIR" >/dev/null 2>&1 || true

  if git worktree list 2>/dev/null | grep -qF "$WT"; then
    git worktree remove "$WT" --force >/dev/null 2>&1 || true
  fi

  if git show-ref --verify --quiet "refs/heads/$BR"; then
    git branch -D "$BR" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

cd "$PROJECT_DIR"

[ -d .git ] || fail "Not a git repo"
[ "$(git branch --show-current)" = "$MAIN_BRANCH" ] || fail "Must be on main"

if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "Working tree dirty. Commit/stash first."
fi

[ -f "TODO.md" ] || fail "TODO.md not found"

have git || fail "git not found"
have tmux || fail "tmux not found"
have node || fail "node not found"
have python3 || fail "python3 not found"
have "$CLAUDE_CMD" || fail "claude not found"

cleanup
tmux kill-session -t "$TMUX_SESSION" >/dev/null 2>&1 || true

git worktree add "$WT" -b "$BR" "$MAIN_BRANCH" >/dev/null
cd "$WT"

ITER=1

while true; do
  echo
  echo "============================================"
  echo " ITERATION $ITER"
  echo "============================================"

  TODO_CONTENT="$(cat TODO.md)"

  PROMPT_A_FILE="$(mktemp)"
  PROMPT_B_FILE="$(mktemp)"
  PROMPT_AUD_FILE="$(mktemp)"

  cat > "$PROMPT_A_FILE" <<EOF
You are Worker A.

IMPORTANT: You MUST APPLY CHANGES DIRECTLY TO THE REPOSITORY.
Do NOT show diffs unless asked. Write files to disk.

Take the FIRST HALF of TODO items.

TODO.md:
$TODO_CONTENT
EOF

  cat > "$PROMPT_B_FILE" <<EOF
You are Worker B.

IMPORTANT: You MUST APPLY CHANGES DIRECTLY TO THE REPOSITORY.
Do NOT show diffs unless asked. Write files to disk.

Take the SECOND HALF of TODO items.

TODO.md:
$TODO_CONTENT
EOF

  cat > "$PROMPT_AUD_FILE" <<EOF
You are the Auditor.

IMPORTANT:
- DO NOT implement features.
- You MUST update TODO.md and write AUDIT.md to disk.

TODO.md:
$TODO_CONTENT
EOF

  tmux new-session -d -s "$TMUX_SESSION" -c "$WT"
  tmux split-window -v -t "$TMUX_SESSION" -c "$WT"
  tmux select-pane -t "$TMUX_SESSION:0.0"
  tmux split-window -h -t "$TMUX_SESSION" -c "$WT"
  tmux select-layout -t "$TMUX_SESSION" tiled
  tmux set -g mouse on

  # Worker A
  tmux send-keys -t "$TMUX_SESSION:0.0" "cd '$WT' && $CLAUDE_CMD ." C-m
  sleep 4
  tmux send-keys -t "$TMUX_SESSION:0.0" "cat '$PROMPT_A_FILE'" C-m

  # Worker B
  tmux send-keys -t "$TMUX_SESSION:0.1" "cd '$WT' && $CLAUDE_CMD ." C-m
  sleep 4
  tmux send-keys -t "$TMUX_SESSION:0.1" "cat '$PROMPT_B_FILE'" C-m

  # Auditor
  tmux send-keys -t "$TMUX_SESSION:0.2" "cd '$WT' && $CLAUDE_CMD ." C-m
  sleep 4
  tmux send-keys -t "$TMUX_SESSION:0.2" "cat '$PROMPT_AUD_FILE'" C-m

  echo
  echo "============================================"
  echo " TMUX STARTED"
  echo " Exit Claude in all panes, then Ctrl+B :kill-session"
  echo "============================================"

  tmux attach -t "$TMUX_SESSION"

  rm -f "$PROMPT_A_FILE" "$PROMPT_B_FILE" "$PROMPT_AUD_FILE"

  echo
  echo "============================================"
  echo " COMMITTING ITERATION $ITER"
  echo "============================================"

  if git diff --quiet; then
    echo "No changes made this iteration."
  else
    git add -A
    git commit -m "AI iteration $ITER"
  fi

  echo
  read -r -p "Run another iteration? (yes/no): " CONT
  [ "$CONT" = "yes" ] || break

  ITER=$((ITER + 1))
done

echo
echo "============================================"
echo " FINAL CHECKS"
echo "============================================"

"${TEST_COMMAND[@]}"
"${BUILD_COMMAND[@]}"

echo
echo "============================================"
echo " FINAL DIFF"
echo "============================================"

git --no-pager diff "$MAIN_BRANCH"...HEAD

cd "$PROJECT_DIR"

echo
read -r -p "Merge AI loop branch into main? Type 'yes' to merge: " CONFIRM
[ "$CONFIRM" = "yes" ] || exit 0

git merge --no-ff --no-edit "$BR"

echo "MERGED."
