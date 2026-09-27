#!/usr/bin/env bash
set -euo pipefail

# Run from the release checkout. All release identity and artifact inputs are
# explicit; package.version is never used to guess a GitHub release tag.
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
exec node "$SCRIPT_DIR/generate-release-notes.js" "$@"
