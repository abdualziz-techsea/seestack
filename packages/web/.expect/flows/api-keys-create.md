# API Key Creation Flow

## Steps
1. Navigate to /settings/api-keys
2. Verify info banner is visible
3. Click "+ Create API key" — verify dialog opens
4. Leave name empty, click Create — verify validation error
5. Enter name "Production Backend"
6. Select project from dropdown
7. Select environment "production"
8. Click Create key — verify dialog closes
9. Verify new key dialog opens showing raw key
10. Verify warning "Copy this key now" is visible
11. Verify "Done" button is disabled
12. Click "Copy to clipboard" — verify button icon changes to checkmark
13. Check the "I've copied" checkbox — verify Done button enables
14. Click Done — verify dialog closes
15. Verify new key appears in table with "ask_live_" prefix (truncated)
