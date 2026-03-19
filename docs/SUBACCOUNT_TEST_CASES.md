# Sub-account Test Cases (V1 Parity)

## Overview
This document contains test cases for verifying sub-account functionality matches V1 system behavior.

## Prerequisites
- Admin account access
- At least one device configured
- Sub-account created with username and email

---

## Test Case 1: Sub-account Login with Username

### Steps
1. Navigate to login page (`/login`)
2. Enter username in "Email / Username" field
3. Enter password
4. Click "Login" button

### Expected Result
- [ ] Login successful
- [ ] User redirected to main page
- [ ] Username displayed in user info

### Status: ⬜ PASS / ⬜ FAIL

---

## Test Case 2: Sub-account Login with Email

### Steps
1. Navigate to login page (`/login`)
2. Enter email address in "Email / Username" field
3. Enter password
4. Click "Login" button

### Expected Result
- [ ] Login successful
- [ ] User redirected to main page
- [ ] Email displayed in user info

### Status: ⬜ PASS / ⬜ FAIL

---

## Test Case 3: Sub-account Cannot Edit Device

### Prerequisites
- Logged in as sub-account
- At least one device assigned to sub-account

### Steps
1. Click on any device in the device list
2. Click on the three-dot menu (⋮) button on3. Observe menu options

### Expected Result
- [ ] "Edit" menu item is NOT visible
- [ ] Other menu items visible (History, Follow, Street View, Send Command)

### Status: ⬜ PASS / ⬜ FAIL

---

## Test Case 4: Sub-account Cannot Add Device

### Prerequisites
- Logged in as sub-account

### Steps
1. Look at Objects tab toolbar
2. Observe available buttons

### Expected Result
- [ ] "+" (Add) button is NOT visible
- [ ] Refresh button IS visible
- [ ] Search field IS visible

### Status: ⬜ PASS / ⬜ FAIL

---

## Test Case 5: Sub-account Cannot Add Markers

### Prerequisites
- Logged in as sub-account
- At least one marker exists

### Steps
1. Click on "Places" tab
2. Click on "Markers" sub-tab
3. Observe toolbar buttons

### Expected Result
- [ ] "Add Marker" button is NOT visible
- [ ] "Import" button is NOT visible
- [ ] "Delete All" button is NOT visible
- [ ] "Reload" button IS visible
- [ ] "Groups" button IS visible
- [ ] "Export" button IS visible

### Status: ⬜ PASS / ⬜ FAIL

---

## Test Case 6: Sub-account Cannot Add Routes

### Prerequisites
- Logged in as sub-account

### Steps
1. Click on "Places" tab
2. Click on "Routes" sub-tab
3. Observe toolbar buttons

### Expected Result
- [ ] "Add Route" button is NOT visible
- [ ] "Import" button is NOT visible
- [ ] "Delete All" button is NOT visible
- [ ] "Reload" button IS visible
- [ ] "Groups" button IS visible
- [ ] "Export" button IS visible

### Status: ⬜ PASS / ⬜ FAIL

---

## Test Case 7: Sub-account Cannot Add Zones

### Prerequisites
- Logged in as sub-account

### Steps
1. Click on "Places" tab
2. Click on "Zones" sub-tab
3. Observe toolbar buttons

### Expected Result
- [ ] "Add Zone" button is NOT visible
- [ ] "Import" button is NOT visible
- [ ] "Delete All" button is NOT visible
- [ ] "Reload" button IS visible
- [ ] "Groups" button IS visible
- [ ] "Export" button IS visible

### Status: ⬜ PASS / ⬜ FAIL

---

## Test Case 8: Sub-account Can View Devices

### Prerequisites
- Logged in as sub-account
- Devices assigned to sub-account

### Steps
1. Observe device list in Objects tab

### Expected Result
- [ ] Device list is visible
- [ ] Device names are visible
- [ ] Device status indicators are visible
- [ ] Can click on devices to view details

### Status: ⬜ PASS / ⬜ FAIL

---

## Test Case 9: Sub-account Can View History

### Prerequisites
- Logged in as sub-account
- Devices assigned to sub-account

### Steps
1. Click on device menu (⋮)
2. Click "Show history"
3. Select a time period

### Expected Result
- [ ] History menu opens
- [ ] Can select time periods
- [ ] Can view route on map
- [ ] CANNOT edit/delete route

### Status: ⬜ PASS / ⬜ FAIL

---

## Test Case 10: Sub-account Can View Reports

### Prerequisites
- Logged in as sub-account
- Reports permission enabled for sub-account

### Steps
1. Click on Reports menu
2. Select a report type
3. Generate report

### Expected Result
- [ ] Reports menu is accessible
- [ ] Can generate reports
- [ ] Can view report data
- [ ] CANNOT modify report templates

### Status: ⬜ PASS / ⬜ FAIL

---

## Test Case 11: Sub-account Auto-URL Login

### Prerequisites
- Sub-account with auto-URL (au) enabled
- Auto-login token generated

### Steps
1. Navigate to auto-login URL: `/?au=TOKEN`
2. Observe login behavior

### Expected Result
- [ ] Automatic login successful
- [ ] User redirected to main page
- [ ] Session established correctly

### Status: ⬜ PASS / ⬜ FAIL

---

## Test Case 12: Sub-account Device Visibility Toggle

### Prerequisites
- Logged in as sub-account
- Multiple devices assigned

### Steps
1. Click on visibility checkbox (eye icon) on a device

### Expected Result
- [ ] Visibility toggle works
- [ ] Device marker appears/disappears on map
- [ ] Changes persist (read-only, NOT modifying device)

### Status: ⬜ PASS / ⬜ FAIL

---

## Test Case 13: Sub-account Device Focus Toggle

### Prerequisites
- Logged in as sub-account
- Devices with positions

### Steps
1. Click on focus checkbox (location pin) on a device

### Expected Result
- [ ] Map centers on device
- [ ] Focus indicator shows selected state
- [ ] Changes persist (read-only, NOT modifying device)

### Status: ⬜ PASS / ⬜ FAIL

---

## Test Case 14: Sub-account Cannot Access CPanel

### Prerequisites
- Logged in as sub-account

### Steps
1. Look for CPanel button in top navigation

### Expected Result
- [ ] CPanel button is NOT visible
- [ ] CPanel is not accessible via URL either

### Status: ⬜ PASS / ⬜ FAIL

---

## Summary Checklist

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Login | Username, Email | | |
| Edit Restrictions | Device Edit, Add Device, Add Marker, Add Route, Add Zone | | |
| View Access | View Devices, View History | View Reports | | |
| Other | Auto-URL | Visibility Toggle | Focus Toggle | CPanel Access | | |

---

## Notes

- Sub-accounts should have `deviceReadonly=true` set in database
- Sub-accounts can only access devices assigned to them via `deviceAccess`
- Sub-accounts inherit permissions from parent account
- Sub-accounts cannot delete devices even if assigned

## Backend Verification

To verify sub-account has correct permissions in database:

```sql
SELECT id, name, email, login, deviceReadonly, readonly  parentUserId
FROM users
WHERE parentUserId IS NOT NULL;
```

Expected columns for sub-accounts:
- `deviceReadonly` = true
- `readonly` = true (if applicable)
- `parentUserId` = set to parent's user ID
