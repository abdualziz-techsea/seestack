# Create Alert Rule Flow

## Steps
1. Navigate to /alerts
2. Verify alerts table is visible
3. Click "+ Create rule" — verify dialog opens
4. Verify 5 trigger type cards are visible
5. Click "Error spike" card — verify it becomes selected (teal border)
6. Verify threshold inputs appear: "More than [X] errors in [Y] minutes"
7. Change threshold to 20 errors in 10 minutes
8. Select severity "Critical only"
9. Enable quiet hours toggle — verify time inputs appear
10. Select Slack channel card — verify webhook URL input appears
11. Enter webhook URL "https://hooks.slack.com/test"
12. Enter rule name "Error spike — production"
13. Click Create rule — verify dialog closes
14. Verify new rule appears in table with correct trigger description
15. Verify rule toggle is ON by default
16. Click toggle to disable — verify status changes to OFF immediately
