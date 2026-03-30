# Organization Settings Save Flow

## Steps
1. Navigate to /settings/general
2. Verify workspace name input has current value
3. Change workspace name to "Updated Org Name"
4. Click "Save changes" — verify button shows loading spinner
5. Verify button changes to "Saved" in green
6. Wait 2 seconds — verify button returns to "Save changes"
7. Click "Delete workspace" in danger zone — verify confirmation dialog opens
8. Verify delete button is disabled
9. Type wrong confirmation text — verify button stays disabled
10. Clear and type exact confirmation "delete fatura" — verify button enables
11. Click Cancel — verify dialog closes without deleting
