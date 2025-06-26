# Loading Issues Troubleshooting Guide
## Fitness Routes & Procrastination Routes Data Loading Problems

This guide helps you systematically identify and report loading issues with the Strong Strong fitness application's route data features.

---

## 📋 **Issue Reporting Template**

When experiencing loading issues, please provide the following information for faster resolution:

### 1. **Current Status of Data Loading**

**Select all that apply:**
- [ ] Infinite loading spinner (specify duration: ___ minutes)
- [ ] Blank/empty screen with no content
- [ ] Error messages displayed (copy exact message below)
- [ ] Partial data loading (some sections work, others don't)
- [ ] Data loads but appears outdated
- [ ] Loading works sometimes but not others

**Error Messages (if any):**
```
[Copy and paste exact error messages here, including any error codes]
```

**Screenshots:**
*Please attach screenshots of the loading screen or error state*

### 2. **Steps Already Taken to Resolve the Issue**

**Check all attempted solutions:**
- [ ] Refreshed the webpage (F5 or Ctrl+R)
- [ ] Cleared browser cache and cookies
- [ ] Logged out and logged back in
- [ ] Tried a different browser
- [ ] Restarted the browser completely
- [ ] Checked internet connection
- [ ] Tried accessing from a different device
- [ ] Waited and tried again later
- [ ] Checked if other parts of the app work

**Additional steps taken:**
```
[Describe any other troubleshooting steps you attempted]
```

### 3. **Device Type and Operating System**

**Device Information:**
- **Device Type:** 
  - [ ] Desktop Computer
  - [ ] Laptop
  - [ ] Tablet
  - [ ] Smartphone
  - [ ] Other: ___________

- **Operating System:**
  - [ ] Windows 11
  - [ ] Windows 10
  - [ ] macOS (version: _______)
  - [ ] Linux (distribution: _______)
  - [ ] iOS (version: _______)
  - [ ] Android (version: _______)
  - [ ] ChromeOS
  - [ ] Other: ___________

**Browser Information:**
- **Browser:** 
  - [ ] Chrome (version: _______)
  - [ ] Firefox (version: _______)
  - [ ] Safari (version: _______)
  - [ ] Edge (version: _______)
  - [ ] Other: ___________

- **Browser Extensions:** 
  - [ ] Ad blockers (specify: _______)
  - [ ] Privacy extensions
  - [ ] Other relevant extensions: ___________

### 4. **Network Connection Status**

**Connection Details:**
- **Connection Type:**
  - [ ] Wi-Fi (home/office)
  - [ ] Wi-Fi (public/cafe)
  - [ ] Mobile data (4G/5G)
  - [ ] Ethernet (wired)
  - [ ] VPN connection
  - [ ] Corporate network

- **Connection Speed:** _________ Mbps (if known)

- **Connection Stability:**
  - [ ] Stable connection
  - [ ] Intermittent connectivity issues
  - [ ] Slow connection
  - [ ] Frequent disconnections

**Network Test Results:**
```
Test your connection at speedtest.net and paste results here:
Download: _____ Mbps
Upload: _____ Mbps
Ping: _____ ms
```

### 5. **App Version and Environment**

**Application Information:**
- **App Version:** v0.0.0 (check package.json or about section)
- **Environment:** 
  - [ ] Development (localhost:5173)
  - [ ] Staging
  - [ ] Production
- **Last Working Version:** _________ (if known)
- **Recent Updates:** 
  - [ ] Just updated to latest version
  - [ ] No recent updates
  - [ ] Unsure about updates

### 6. **Time When Issue Started**

**Timing Information:**
- **Date:** ___/___/_____ (MM/DD/YYYY)
- **Time:** ___:___ AM/PM (your local timezone: _______)
- **Duration:** 
  - [ ] Just started
  - [ ] Past hour
  - [ ] Past few hours
  - [ ] Since yesterday
  - [ ] Multiple days
  - [ ] Intermittent over weeks

**Pattern:**
- [ ] Happens every time I try to load data
- [ ] Happens only at certain times of day
- [ ] Happens randomly
- [ ] Started after a specific action (specify: _______)

### 7. **Specific Features Affected**

**Select which sections have loading issues:**

**Fitness Routes:**
- [ ] All fitness routes not loading
- [ ] Saved fitness routes not loading
- [ ] Route details not loading
- [ ] Route search not working
- [ ] Route filters not working
- [ ] Can't save new routes

**Procrastination Routes:**
- [ ] Saved procrastination routes not loading
- [ ] Can't generate new procrastination routes
- [ ] Route steps not displaying
- [ ] Can't save generated routes
- [ ] Route editing not working
- [ ] Route completion tracking not working

**Authentication:**
- [ ] Can't log in
- [ ] Profile information not loading
- [ ] Session keeps expiring

---

## 🔍 **Self-Diagnostic Steps**

Before reporting the issue, try these quick diagnostic steps:

### Step 1: Browser Console Check
1. Press F12 to open Developer Tools
2. Click on the "Console" tab
3. Look for red error messages
4. Copy any error messages to include in your report

### Step 2: Network Tab Analysis
1. In Developer Tools, click "Network" tab
2. Refresh the page
3. Look for failed requests (red status codes)
4. Note any 400, 401, 403, 500 errors

### Step 3: Basic Connectivity Test
1. Try accessing other websites
2. Test the app on a different device
3. Try using mobile data instead of Wi-Fi

### Step 4: Cache and Storage Clear
```
Chrome: Settings > Privacy > Clear browsing data
Firefox: Settings > Privacy > Clear Data
Safari: Develop > Empty Caches
```

---

## 🚨 **Priority Levels**

**Critical (Report Immediately):**
- [ ] Complete app failure - nothing loads
- [ ] Authentication completely broken
- [ ] Data loss or corruption

**High (Report Within 24 Hours):**
- [ ] Major features not working
- [ ] Affects multiple users
- [ ] Prevents core functionality

**Medium (Report Within Few Days):**
- [ ] Single feature not working
- [ ] Intermittent issues
- [ ] Workarounds available

**Low (Report When Convenient):**
- [ ] Minor display issues
- [ ] Occasional glitches
- [ ] Enhancement requests

---

## 📧 **How to Submit Your Report**

1. **Fill out all relevant sections** above
2. **Attach screenshots** if possible
3. **Include browser console errors** if any
4. **Provide detailed reproduction steps**

**Submit via:**
- GitHub Issues (preferred)
- Support email
- In-app feedback form

---

## 🔧 **Common Quick Fixes**

### For Infinite Loading:
1. Wait 2-3 minutes (sometimes data is large)
2. Refresh the page
3. Clear browser cache
4. Try incognito/private browsing mode

### For Error Messages:
1. Copy the exact error message
2. Log out and log back in
3. Check if issue persists across browsers
4. Try accessing other app features

### For Blank Screens:
1. Check browser console for JavaScript errors
2. Disable browser extensions temporarily
3. Try a different browser
4. Check if other users report similar issues

---

## 📊 **Data Collection for Developers**

If comfortable with technical steps, provide this additional information:

### Browser Console Output:
```javascript
// Open console and run:
console.log('User Agent:', navigator.userAgent);
console.log('Local Storage:', localStorage.getItem('supabase.auth.token'));
console.log('Session Storage:', sessionStorage.length);
```

### Network Request Details:
```
// From Network tab, copy details of failed requests:
Request URL: 
Status Code: 
Response Headers: 
Request Headers: 
Response Body: 
```

### JavaScript Errors:
```
// Copy any red console errors:
Error Type: 
Error Message: 
Stack Trace: 
File/Line: 
```

---

## 📈 **Follow-up Information**

After submitting your report:

1. **Issue ID:** _________ (will be provided)
2. **Expected Response Time:** 24-48 hours for acknowledgment
3. **Updates:** Check your email or GitHub notifications
4. **Testing:** You may be asked to test fixes when available

**Status Tracking:**
- [ ] Issue reported
- [ ] Issue acknowledged
- [ ] Fix in development
- [ ] Fix ready for testing
- [ ] Issue resolved

---

*Thank you for helping improve the Strong Strong fitness app! Your detailed reports help us identify and fix issues quickly.*