# Sign-Out Feature Troubleshooting Guide
## Strong Strong Fitness App - Authentication Issues

---

## 📋 **Current Implementation Analysis**

### Code Snippets from Your Application

**1. Auth Hook Implementation (`src/hooks/useAuth.tsx`)**
```javascript
const signOut = async () => {
  await supabase.auth.signOut()
}
```

**2. Navbar Implementation (`src/components/Layout/Navbar.tsx`)**
```javascript
// Desktop User Menu
<button
  onClick={() => {
    signOut()
    setShowUserMenu(false)
  }}
  className="w-full flex items-center space-x-2 px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors"
>
  <LogOut className="w-4 h-4" />
  <span>Sign Out</span>
</button>

// Mobile Menu
<button
  onClick={() => {
    signOut()
    setShowMobileMenu(false)
  }}
  className="flex items-center space-x-3 px-4 py-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
>
  <LogOut className="w-6 h-6" />
  <span className="font-medium">Sign Out</span>
</button>
```

**3. Profile Page Implementation (`src/components/Profile/ProfilePage.tsx`)**
```javascript
<button
  onClick={signOut}
  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors"
>
  Sign Out
</button>
```

**4. Auth State Management**
```javascript
// Auth state listener in useAuth hook
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    setSession(session)
    setUser(session?.user ?? null)
    
    if (session?.user) {
      await fetchProfile(session.user.id)
    } else {
      setProfile(null)
    }
    setLoading(false)
  }
)
```

---

## 🎯 **Expected vs Current Behavior**

### Expected Behavior
1. **Immediate UI Response**: Button click should show loading state or immediate feedback
2. **Session Termination**: User session should be cleared from browser storage
3. **State Updates**: User and profile state should be set to null
4. **UI Navigation**: User should be redirected to home page or login state
5. **Storage Cleanup**: All Supabase tokens should be removed from localStorage
6. **Network Request**: Sign-out request should be sent to Supabase auth API

### Current Behavior Issues (Check all that apply)
- [ ] Button doesn't respond to clicks
- [ ] Button responds but user remains logged in
- [ ] Page doesn't redirect after sign-out
- [ ] User data persists in UI
- [ ] Console errors appear
- [ ] Loading state gets stuck
- [ ] Inconsistent behavior across different sign-out buttons
- [ ] Sign-out works but user can still access protected routes

---

## 🔍 **Diagnostic Steps**

### Step 1: Check Browser Console for Errors

Open Chrome DevTools (F12) → Console tab and look for errors when clicking sign-out:

**Common Error Messages:**
```javascript
// Network errors
"Failed to fetch"
"NetworkError: Connection refused"

// Supabase errors
"Unable to sign out user"
"Invalid session"

// JavaScript errors
"Cannot read property 'signOut' of undefined"
"supabase is not defined"
```

**Add Debug Logging:**
```javascript
// Temporary debug version for useAuth hook
const signOut = async () => {
  console.log('🔓 Starting sign-out process...')
  console.log('📊 Current user state:', user)
  console.log('📊 Current session:', session)
  
  try {
    const { error } = await supabase.auth.signOut()
    console.log('✅ Supabase signOut result:', { error })
    
    if (error) {
      console.error('❌ Sign-out error:', error)
      throw error
    }
    
    console.log('🎉 Sign-out successful')
  } catch (err) {
    console.error('💥 Sign-out failed:', err)
  }
}
```

### Step 2: Verify Supabase Configuration

**Check Environment Variables:**
```bash
# In .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Test Supabase Connection:**
```javascript
// Run in browser console
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase client:', supabase)
console.log('Auth client:', supabase.auth)
```

### Step 3: Check Auth State Management

**Monitor Auth State Changes:**
```javascript
// Add to useAuth hook temporarily
useEffect(() => {
  console.log('🔄 Auth state changed:', { user, session, loading })
}, [user, session, loading])

// Test auth state manually
const checkAuthState = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  console.log('Current session:', session)
  console.log('Session error:', error)
}
```

### Step 4: Test Network Requests

**Monitor Network Tab:**
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Click sign-out button
4. Look for requests to `/auth/v1/logout`

**Expected Network Behavior:**
- POST request to `https://[project].supabase.co/auth/v1/logout`
- Status code: 204 (No Content) for success
- Response headers should include session cleanup

### Step 5: Check Browser Storage

**Before Sign-Out:**
```javascript
// Check localStorage
console.log('Auth tokens:', localStorage.getItem('supabase.auth.token'))
console.log('All localStorage:', { ...localStorage })

// Check sessionStorage
console.log('Session storage:', { ...sessionStorage })
```

**After Sign-Out:**
```javascript
// These should be cleared or null
console.log('Auth tokens after signout:', localStorage.getItem('supabase.auth.token'))
```

---

## 🔧 **Environment Details**

### Framework & Dependencies
```json
// From package.json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

### Authentication Method
- **Provider**: Supabase Auth
- **Flow**: Email/Password authentication
- **Session Management**: JWT tokens stored in localStorage
- **RLS**: Row Level Security enabled on all tables

### Browser Compatibility
**Tested Browsers:**
- [ ] Chrome (version: _____)
- [ ] Firefox (version: _____)
- [ ] Safari (version: _____)
- [ ] Edge (version: _____)

**Device Types:**
- [ ] Desktop
- [ ] Mobile
- [ ] Tablet

---

## 🐛 **Common Issues and Solutions**

### Issue 1: Button Doesn't Respond
**Symptoms:** No console logs, no network requests
**Causes:**
- JavaScript errors preventing execution
- Event handler not properly attached
- Component not re-rendering

**Solutions:**
```javascript
// Add error boundary around sign-out buttons
const handleSignOut = async () => {
  try {
    await signOut()
  } catch (error) {
    console.error('Sign out failed:', error)
    alert('Sign out failed. Please try again.')
  }
}

// Use in button onClick
<button onClick={handleSignOut}>Sign Out</button>
```

### Issue 2: User Remains Logged In
**Symptoms:** Button responds but user state doesn't change
**Causes:**
- Auth state listener not working
- Session not properly cleared
- Component state not updating

**Debug Steps:**
```javascript
// Force auth state refresh
const forceAuthRefresh = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  console.log('Forced session check:', session)
  
  if (!session) {
    setUser(null)
    setProfile(null)
    setSession(null)
  }
}
```

### Issue 3: Network/Connection Errors
**Symptoms:** "Failed to fetch" or timeout errors
**Causes:**
- Network connectivity issues
- Supabase service down
- Incorrect Supabase URL

**Solutions:**
```javascript
// Add retry logic
const signOutWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { error } = await supabase.auth.signOut()
      if (!error) return
      throw error
    } catch (error) {
      console.log(`Sign-out attempt ${i + 1} failed:`, error)
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}
```

### Issue 4: Partial Sign-Out
**Symptoms:** Some UI updates but user can still access protected routes
**Causes:**
- Profile state not cleared
- Route guards not working
- Cache issues

**Solution:**
```javascript
const completeSignOut = async () => {
  try {
    // Clear Supabase session
    await supabase.auth.signOut()
    
    // Force clear all auth state
    setUser(null)
    setProfile(null)
    setSession(null)
    
    // Clear any cached data
    setSavedRoutes([])
    // Clear other user-specific data
    
    // Optional: force page refresh
    // window.location.reload()
    
  } catch (error) {
    console.error('Complete sign-out failed:', error)
  }
}
```

---

## 🔬 **Advanced Debugging**

### Debug Auth Events
```javascript
// Add comprehensive auth event logging
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`🔐 Auth Event: ${event}`, {
    event,
    session: session ? {
      user: session.user.id,
      expires: session.expires_at
    } : null,
    timestamp: new Date().toISOString()
  })
  
  // Log specific sign-out event
  if (event === 'SIGNED_OUT') {
    console.log('✅ User successfully signed out')
    console.log('📱 Clearing UI state...')
  }
})
```

### Test Manual Session Clearing
```javascript
// Emergency session clear function
const emergencySignOut = () => {
  console.log('🚨 Emergency sign-out initiated')
  
  // Clear localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase')) {
      localStorage.removeItem(key)
    }
  })
  
  // Clear sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('supabase')) {
      sessionStorage.removeItem(key)
    }
  })
  
  // Force reload
  window.location.reload()
}
```

### Monitor Component Re-renders
```javascript
// Add to components using auth
useEffect(() => {
  console.log('🔄 Component re-rendered with auth state:', {
    hasUser: !!user,
    hasProfile: !!profile,
    loading
  })
}, [user, profile, loading])
```

---

## 📊 **Issue Report Template**

**Current Behavior:**
- [ ] Button click has no effect
- [ ] Button click works but user stays logged in
- [ ] Error messages appear: ________________
- [ ] UI partially updates but issues remain
- [ ] Other: ________________

**Console Errors:**
```
[Paste console errors here]
```

**Network Requests:**
```
Request URL: 
Status Code: 
Response: 
```

**Browser Environment:**
- Browser: ________________
- Version: ________________
- Device: ________________
- OS: ________________

**Steps Already Taken:**
- [ ] Refreshed the page
- [ ] Cleared browser cache
- [ ] Tried different browser
- [ ] Checked network connection
- [ ] Tested in incognito mode

**Additional Context:**
- When did the issue start? ________________
- Does it happen on all devices? ________________
- Any recent changes made? ________________

---

## 🚀 **Recommended Fix Implementation**

Based on common issues, here's an improved sign-out implementation:

```javascript
// Enhanced useAuth hook
const signOut = async () => {
  try {
    setLoading(true)
    
    // Clear Supabase session
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Supabase sign-out error:', error)
      // Don't throw - continue with manual cleanup
    }
    
    // Force clear all auth state
    setUser(null)
    setProfile(null)
    setSession(null)
    
    // Clear any user-specific cached data
    // This ensures UI updates even if network request fails
    
    console.log('✅ Sign-out completed successfully')
    
  } catch (error) {
    console.error('Sign-out process failed:', error)
    // Still clear local state as fallback
    setUser(null)
    setProfile(null)
    setSession(null)
  } finally {
    setLoading(false)
  }
}

// Enhanced button implementation with feedback
const SignOutButton = () => {
  const [isSigningOut, setIsSigningOut] = useState(false)
  
  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      alert('Sign out failed. Please try refreshing the page.')
    } finally {
      setIsSigningOut(false)
    }
  }
  
  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl transition-colors"
    >
      {isSigningOut ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}
```

This troubleshooting guide should help identify and resolve the specific issue with your sign-out functionality. Follow the diagnostic steps in order and use the debug code snippets to gather detailed information about what's happening during the sign-out process.