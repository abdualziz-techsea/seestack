#!/usr/bin/env bash
# Regression guard: the old confusing frequency block must NOT come back into
# the Error Insights UI text or the public docs. This is intentionally narrow —
# it only checks the insights component file and CD docs, never strings that
# legitimately mention "/min" elsewhere (e.g. monitor intervals).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

INSIGHTS_FILE="$HERE/packages/web/src/features/errors/components/ErrorInsightsCard.tsx"
DOCS_FILES=(
  "$HERE/seeStack_Project_CD/PROJECT_CD/DOCUMENTS/Final_Project_Report.md"
  "$HERE/seeStack_Project_CD/PROJECT_CD/DOCUMENTS/Final_Project_Report_OnePager.md"
  "$HERE/seeStack_Project_CD/PROJECT_CD/DOCUMENTS/DEMO_GUIDE.md"
)

# Forbid these substrings in the insights UI
FORBID_UI=(
  "/min"
  "/hour"
  "Per minute"
  "Per hour"
  "Avg / hour"
  "averagePerHour"
  "perMinute"
  "perHour"
  "lastHourCount"
  "Last hour"
  "Spike"
)

fail=0

scan_file() {
  local file="$1"; shift
  local label="$1"; shift
  for needle in "$@"; do
    if grep -nF -- "$needle" "$file" >/dev/null 2>&1; then
      echo "FAIL [$label] '$needle' found in $file"
      grep -nF -- "$needle" "$file" || true
      fail=1
    fi
  done
}

# UI scan
if [ -f "$INSIGHTS_FILE" ]; then
  scan_file "$INSIGHTS_FILE" "insights-ui" "${FORBID_UI[@]}"
fi

# Docs: forbid the same offending phrasings in the report wording
DOC_PHRASES=(
  "perMinute"
  "perHour"
  "averagePerHour"
  "lastHourCount"
  "/min · "
  " /hour · "
  "errors per minute"
  "errors per hour"
)
for d in "${DOCS_FILES[@]}"; do
  [ -f "$d" ] && scan_file "$d" "docs" "${DOC_PHRASES[@]}"
done

if [ "$fail" -ne 0 ]; then
  echo
  echo "Regression check FAILED — the confusing frequency block is back somewhere."
  exit 1
fi
echo "OK — confusing frequency block is not present in UI or docs."
