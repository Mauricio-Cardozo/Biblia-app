#!/usr/bin/env bash
# PostToolUse hook: runs ESLint on the file that was just edited.
# Exit 2 sends the lint output back to the agent so it fixes the issues.
set -uo pipefail

file=$(jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0

case "$file" in
  */node_modules/*) exit 0 ;;
  */AppMovil/*.ts|*/AppMovil/*.tsx|*/AppMovil/*.js|*/AppMovil/*.jsx) ;;
  *) exit 0 ;;
esac

[ -f "$file" ] || exit 0

app_dir="${CLAUDE_PROJECT_DIR:-$(git -C "$(dirname "$file")" rev-parse --show-toplevel)}/AppMovil"
eslint="$app_dir/node_modules/.bin/eslint"
[ -x "$eslint" ] || exit 0

if ! output=$(cd "$app_dir" && "$eslint" --max-warnings=0 "$file" 2>&1); then
  echo "ESLint encontró problemas en $file:" >&2
  echo "$output" >&2
  exit 2
fi
exit 0
