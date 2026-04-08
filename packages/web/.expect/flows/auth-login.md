# Login Flow

## Steps
1. Navigate to /login
2. Verify page title "Welcome back" is visible
3. Enter invalid email "notanemail" — verify field shows validation error
4. Enter valid email "test@fatura.io" and wrong password "wrongpass"
5. Click Sign in — verify error banner appears with correct message
6. Clear password, enter correct password "Test1234!"
7. Click Sign in — verify redirect to /overview
8. Verify topbar shows "SeeStack" logo and project selector
