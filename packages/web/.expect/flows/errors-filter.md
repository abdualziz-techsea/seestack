# Errors Page Filtering

## Steps
1. Navigate to /errors
2. Verify errors table is visible with at least 1 row
3. Click "Unresolved" filter pill — verify only unresolved errors shown
4. Click "Production" environment filter — verify filters compound
5. Type "NullPointer" in search — verify results filter in real time (300ms debounce)
6. Clear search — verify all results return
7. Click first error row — verify detail sheet slides in from right
8. Verify stack trace is visible in the detail sheet
9. Verify "Watch Replay" button is visible
10. Click Resolve button — verify status badge changes to "resolved"
11. Close detail sheet — verify main list updated
