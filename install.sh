#!/usr/bin/env bash
# Symlink every skills/* folder into the agent skill directories.
set -euo pipefail
repo="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
targets=("$HOME/.agents/skills" "$HOME/.claude/skills")

for dir in "${targets[@]}"; do
  mkdir -p "$dir"
  for skill in "$repo"/skills/*/; do
    name="$(basename "$skill")"
    link="$dir/$name"
    src="${skill%/}"
    if [ -L "$link" ] && [ "$(readlink "$link")" = "$src" ]; then
      echo "ok      $link"
    elif [ -e "$link" ] || [ -L "$link" ]; then
      echo "SKIP    $link (exists, not a link to this repo)"
    else
      ln -s "$src" "$link"
      echo "linked  $link -> $src"
    fi
  done
done
