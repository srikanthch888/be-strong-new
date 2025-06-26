# Supabase DNS Resolution Error - Troubleshooting Guide

## 🔍 **Error Analysis**

**Error**: `net::ERR_NAME_NOT_RESOLVED`  
**URL**: `https://svqygblfccrztrtqphiwu.supabase.co/auth/v1/token`  
**Root Cause**: DNS cannot resolve the Supabase hostname

## 🚨 **Immediate Actions Required**

### 1. Verify Supabase Project Status

**Check your Supabase dashboard:**
1. Log into [https://app.supabase.com](https://app.supabase.com)
2. Navigate to your project dashboard
3. Verify project status - look for any warnings or notices
4. Check if the project is **paused**, **deleted**, or **suspended**

**Common issues:**
- ❌ Project paused due to inactivity
- ❌ Project deleted or archived
- ❌ Billing issues causing suspension
- ❌ URL changed due to project recreation

### 2. Validate Environment Configuration

**Check your `.env` file:**
```bash
# Your current .env should contain:
VITE_SUPABASE_URL=https://svqygblfccrztrtqphiwu.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Verification steps:**
1. Confirm the URL exactly matches your Supabase dashboard
2. Ensure no extra spaces or characters in the URL
3. Verify the URL format: `https://[project-id].supabase.co`
4. Check if the project ID `svqygblfccrztrtqphiwu` is correct

### 3. DNS Resolution Testing

**Test DNS resolution manually:**

**Option A - Browser Test:**
1. Open a new browser tab
2. Navigate directly to: `https://svqygblfccrztrtqphiwu.supabase.co`
3. You should see a Supabase API response, not a DNS error

**Option B - Command Line Test:**
```bash
# Test DNS resolution
nslookup svqygblfccrztrtqphiwu.supabase.co

# Test HTTP connectivity
curl -I https://svqygblfccrztrtqphiwu.supabase.co
```

**Expected results:**
- DNS should resolve to an IP address
- HTTP request should return 200 or 404 (not connection error)

## 🔧 **Solutions by Priority**

### Solution 1: Update Supabase URL (Most Likely Fix)

If your project was recreated or the URL changed:

1. **Get the correct URL from Supabase dashboard:**
   - Go to Settings → API
   - Copy the exact "Project URL"

2. **Update your `.env` file:**
   ```bash
   VITE_SUPABASE_URL=https://[new-project-id].supabase.co
   VITE_SUPABASE_ANON_KEY=[your-anon-key]
   ```

3. **Restart your development server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

### Solution 2: DNS Cache Clearing

If the URL is correct but DNS is cached:

**Windows:**
```bash
ipconfig /flushdns
```

**macOS:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Linux:**
```bash
sudo systemctl restart systemd-resolved
# or
sudo /etc/init.d/nscd restart
```

**Browser DNS cache:**
1. Chrome: Go to `chrome://net-internals/#dns` → Click "Clear host cache"
2. Firefox: Restart browser
3. Try incognito/private mode

### Solution 3: Network Configuration

**Corporate/University networks:**
- Contact IT department - they may be blocking `.supabase.co` domains
- Try using mobile hotspot to test
- Use VPN to bypass network restrictions

**Firewall/Antivirus:**
- Temporarily disable firewall/antivirus
- Add exception for `.supabase.co` domains
- Check if parental controls are blocking the domain

### Solution 4: Alternative DNS Servers

Try using different DNS servers:

**Google DNS:**
- Primary: `8.8.8.8`
- Secondary: `8.8.4.4`

**Cloudflare DNS:**
- Primary: `1.1.1.1`
- Secondary: `1.0.0.1`

**How to change DNS (Windows):**
1. Network Settings → Change adapter options
2. Right-click connection → Properties
3. Select "Internet Protocol Version 4"
4. Use custom DNS servers above

## 🛠️ **Code-Level Solutions**

### Enhanced Error Handling

Add this diagnostic function to your app:

```javascript
// Add to src/lib/supabase.ts or create new diagnostic file
export async function diagnoseFfetch() {
  const testUrl = import.meta.env.VITE_SUPABASE_URL
  
  console.log('🔍 Diagnosing Supabase connectivity...')
  console.log('Target URL:', testUrl)
  console.log('Navigator online:', navigator.onLine)
  
  // Test 1: Basic fetch
  try {
    const response = await fetch(testUrl)
    console.log('✅ Basic fetch successful:', response.status)
  } catch (error) {
    console.error('❌ Basic fetch failed:', error)
    
    // Specific error analysis
    if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
      console.error('🚨 DNS RESOLUTION FAILED - Check:')
      console.error('1. Supabase project status')
      console.error('2. Environment variable VITE_SUPABASE_URL')
      console.error('3. Network DNS settings')
      console.error('4. Firewall/proxy configuration')
    }
  }
  
  // Test 2: Alternative endpoint
  try {
    const healthCheck = await fetch('https://supabase.com')
    console.log('✅ Supabase main site reachable:', healthCheck.status)
  } catch (error) {
    console.error('❌ Cannot reach supabase.com - network issue')
  }
  
  // Test 3: DNS resolution check
  try {
    // This will help identify if it's specifically your project URL
    const domain = new URL(testUrl).hostname
    console.log('Testing domain:', domain)
  } catch (error) {
    console.error('❌ Invalid URL format:', testUrl)
  }
}

// Usage: Call this function in browser console or component
// diagnoseFfetch()
```

### Fallback Authentication Strategy

```javascript
// Enhanced signIn with better error handling
const signIn = async (email: string, password: string) => {
  try {
    setConnectionError(null)
    
    // Pre-flight check
    if (!navigator.onLine) {
      throw new Error('No internet connection')
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      // Enhanced error classification
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('ERR_NAME_NOT_RESOLVED')) {
        throw new Error(
          'Cannot connect to authentication service. Please check:\n' +
          '• Your internet connection\n' +
          '• Supabase project status\n' +
          '• Network firewall settings'
        )
      }
      throw error
    }
    
    return { error: null }
  } catch (error) {
    supabaseErrorHandler.logError(error, 'signin')
    return { error: error as AuthError }
  }
}
```

## 📋 **Step-by-Step Debugging Checklist**

- [ ] **Check Supabase dashboard** - Project active and URL correct?
- [ ] **Verify .env file** - URL exactly matches dashboard?
- [ ] **Test direct URL access** - Can you visit the URL in browser?
- [ ] **Check network connectivity** - Can you reach other websites?
- [ ] **Test DNS resolution** - Use nslookup or online DNS checker
- [ ] **Clear DNS cache** - Flush local DNS cache
- [ ] **Try different network** - Mobile hotspot or different WiFi
- [ ] **Check firewall/antivirus** - Temporarily disable security software
- [ ] **Try different browser** - Rule out browser-specific issues
- [ ] **Contact Supabase support** - If project appears deleted/suspended

## 🆘 **Emergency Workarounds**

### Temporary Local Development

If you need to continue development while resolving DNS issues:

1. **Use Supabase local development:**
   ```bash
   npx supabase start
   # This creates a local Supabase instance
   ```

2. **Update .env for local development:**
   ```bash
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_ANON_KEY=your-local-anon-key
   ```

### Create New Supabase Project

If your project is deleted/inaccessible:

1. Create new project at [app.supabase.com](https://app.supabase.com)
2. Run your database migrations
3. Update environment variables with new URL and keys

## 📞 **When to Contact Support**

Contact Supabase support if:
- Project shows as active but URL doesn't resolve
- You can access dashboard but not API endpoints
- Error persists across different networks and devices
- Project was working and suddenly stopped

**Include in support request:**
- Project ID/URL
- Exact error message
- Screenshots of project dashboard
- Results of DNS tests
- Your geographic location