#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

failed=0

report_files() {
  local title="$1"
  local files="$2"
  if [[ -n "$files" ]]; then
    echo "ERROR: $title"
    echo "$files"
    failed=1
  fi
}

tracked_private_files="$({ git ls-files; } | grep -E '(^|/)(\.env($|\.)|.*\.(jks|keystore|p8|p12|pem|key)$|google-services\.json$|GoogleService-Info\.plist$|local\.properties$|id\.json$)' | grep -vE '(^|/)\.env\.example$' || true)"
report_files "Private configuration or signing files are tracked:" "$tracked_private_files"

tracked_secret_files="$(git grep -IlE 'sb_(secret|publishable)_[A-Za-z0-9_-]{16,}|HELIUS_API_KEY=.+|SUPABASE_SERVICE_ROLE_KEY=.+|WALLET_AUTH_PEPPER=.+' -- . ':!package-lock.json' ':!scripts/public-release-audit.sh' || true)"
report_files "Possible credentials appear in tracked files:" "$tracked_secret_files"

working_secret_files="$(rg -Il --hidden \
  -g '!.git/**' -g '!node_modules/**' -g '!android/.gradle/**' -g '!.env' -g '!scripts/public-release-audit.sh' \
  -e 'sb_(secret|publishable)_[A-Za-z0-9_-]{16,}' \
  -e 'HELIUS_API_KEY=.+' \
  -e 'SUPABASE_SERVICE_ROLE_KEY=.+' \
  -e 'WALLET_AUTH_PEPPER=.+' . || true)"
report_files "Possible credentials appear in publishable working-tree files:" "$working_secret_files"

local_path_files="$(rg -Il --hidden \
  -g '!.git/**' -g '!node_modules/**' -g '!android/.gradle/**' -g '!.env' \
  -e '/Users/[A-Za-z0-9._-]+/' -e '/home/[A-Za-z0-9._-]+/' . || true)"
report_files "Machine-specific absolute paths remain:" "$local_path_files"

history_secret_commits="$(git log --all --format='%H' -G 'sb_(secret|publishable)_[A-Za-z0-9_-]{16,}|HELIUS_API_KEY=.+|SUPABASE_SERVICE_ROLE_KEY=.+|WALLET_AUTH_PEPPER=.+' -- . ':!scripts/public-release-audit.sh' | sort -u || true)"
if [[ -n "$history_secret_commits" ]]; then
  echo "ERROR: Possible credential patterns occur in Git history. Commit contents were not printed."
  failed=1
fi

if [[ "$failed" -ne 0 ]]; then
  echo "Public release audit failed. Keep the repository private until every finding is resolved."
  exit 1
fi

echo "Public release audit passed: no tracked private files, common credential patterns, Git-history matches, or machine-specific paths found."
