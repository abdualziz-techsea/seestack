# Register Flow

## Steps
1. Navigate to /register
2. Verify "Create your account" heading visible
3. Leave name empty, click Create account — verify validation error
4. Fill name "Ahmed Test"
5. Fill email "test@example.com"
6. Type password "weak" — verify strength bar shows 1 segment (red)
7. Type password "Test1234!" — verify strength bar shows 3 segments
8. Type password "Test1234!@#$%Complex" — verify strength bar shows 4 segments (green)
9. Fill organization name "Test Org"
10. Click Create account — verify redirect to /verify-email
