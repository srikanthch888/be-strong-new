# Google & Facebook OAuth Integration Troubleshooting Guide
## Strong Strong Fitness App - Social Authentication Setup & Issues

This comprehensive guide addresses common issues when implementing Google and Facebook OAuth authentication with Supabase in your fitness application.

---

## 🔍 **Current Implementation Status**

### What's Currently Working
- ✅ Email/password authentication via Supabase
- ✅ User profile management
- ✅ Protected routes and RLS policies
- ✅ OAuth button placeholders in UI

### What Needs Implementation
- ❌ Google OAuth provider configuration
- ❌ Facebook OAuth provider configuration  
- ❌ OAuth callback handling
- ❌ Profile data mapping from social providers

---

## 🚀 **Step 1: Supabase OAuth Provider Setup**

### 1.1 Google OAuth Configuration

**In Supabase Dashboard:**
1. Go to Authentication → Providers
2. Enable Google provider
3. Configure OAuth settings:

```json
{
  "client_id": "your-google-client-id.apps.googleusercontent.com",
  "client_secret": "your-google-client-secret",
  "redirect_uri": "https://your-project.supabase.co/auth/v1/callback"
}
```

**Common Issues & Solutions:**

❌ **Error: "OAuth configuration not found"**
- **Cause:** Google Cloud Console project not set up
- **Solution:** Create project in Google Cloud Console, enable Google+ API

❌ **Error: "redirect_uri_mismatch"**
- **Cause:** Redirect URI not matching Google Console settings
- **Solution:** Add both development and production URLs:
  - `https://your-project.supabase.co/auth/v1/callback`
  - `http://localhost:5173` (for local development)

❌ **Error: "invalid_client"**
- **Cause:** Incorrect client ID or secret
- **Solution:** Verify credentials from Google Cloud Console

### 1.2 Facebook OAuth Configuration

**In Supabase Dashboard:**
1. Go to Authentication → Providers
2. Enable Facebook provider
3. Configure OAuth settings:

```json
{
  "client_id": "your-facebook-app-id",
  "client_secret": "your-facebook-app-secret",
  "redirect_uri": "https://your-project.supabase.co/auth/v1/callback"
}
```

**Common Issues & Solutions:**

❌ **Error: "App Not Setup"**
- **Cause:** Facebook app not properly configured
- **Solution:** Complete Facebook App Review process

❌ **Error: "URL Blocked"**
- **Cause:** Domain not added to Facebook app settings
- **Solution:** Add your domain to "App Domains" in Facebook Console

❌ **Error: "Invalid Scope"**
- **Cause:** Requesting permissions not approved by Facebook
- **Solution:** Request only basic permissions initially (email, public_profile)

---

## 💻 **Step 2: Frontend Implementation**

### 2.1 Update AuthModal Component

Replace the current placeholder buttons with functional OAuth buttons:

```tsx
// In src/components/Auth/AuthModal.tsx

const handleGoogleSignIn = async () => {
  setLoading(true)
  setError('')
  
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    
    if (error) {
      console.error('Google OAuth error:', error)
      setError(error.message)
    }
  } catch (err: any) {
    console.error('Google sign-in failed:', err)
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

const handleFacebookSignIn = async () => {
  setLoading(true)
  setError('')
  
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email,public_profile'
      }
    })
    
    if (error) {
      console.error('Facebook OAuth error:', error)
      setError(error.message)
    }
  } catch (err: any) {
    console.error('Facebook sign-in failed:', err)
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

// Update the button implementations:
<button
  onClick={handleGoogleSignIn}
  disabled={loading}
  className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
>
  <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center">
    <span className="text-white text-xs font-bold">G</span>
  </div>
  <span className="font-medium text-gray-700">
    {loading ? 'Connecting...' : 'Continue with Google'}
  </span>
</button>

<button
  onClick={handleFacebookSignIn}
  disabled={loading}
  className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
>
  <div className="w-5 h-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
    <span className="text-white text-xs font-bold">f</span>
  </div>
  <span className="font-medium text-gray-700">
    {loading ? 'Connecting...' : 'Continue with Facebook'}
  </span>
</button>
```

### 2.2 Create OAuth Callback Handler

Create a new component to handle OAuth redirects:

```tsx
// src/components/Auth/OAuthCallback.tsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export function OAuthCallback() {
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Check if user was successfully authenticated
        if (user) {
          setStatus('success')
          setMessage('Successfully signed in! Redirecting...')
          
          // Redirect to main app after short delay
          setTimeout(() => {
            window.location.href = '/'
          }, 2000)
        } else {
          // Check URL for error parameters
          const urlParams = new URLSearchParams(window.location.search)
          const error = urlParams.get('error')
          const errorDescription = urlParams.get('error_description')
          
          if (error) {
            setStatus('error')
            setMessage(errorDescription || 'Authentication failed')
          } else {
            // Still loading, wait a bit more
            setTimeout(() => {
              if (!user) {
                setStatus('error')
                setMessage('Authentication timed out')
              }
            }, 5000)
          }
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setMessage(error.message || 'An unexpected error occurred')
      }
    }

    handleOAuthCallback()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Completing Sign In...
              </h2>
              <p className="text-gray-600">
                Please wait while we set up your account.
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to Strong Strong!
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Sign In Failed
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Return to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 2.3 Update App Router

Add the OAuth callback route to your main App component:

```tsx
// In src/App.tsx, add to the renderCurrentPage function:
case 'auth-callback':
  return <OAuthCallback />
```

---

## 🔧 **Step 3: Profile Data Enhancement**

### 3.1 Update Profile Creation Function

Enhance the `handle_new_user` function to handle OAuth user data:

```sql
-- supabase/migrations/oauth_profile_enhancement.sql

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    username, 
    avatar_url, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'preferred_username',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.2 Handle OAuth Profile Updates

Update the useAuth hook to better handle OAuth user data:

```tsx
// In src/hooks/useAuth.tsx, enhance the auth state change listener:

supabase.auth.onAuthStateChange(async (event, session) => {
  console.log(`🔐 Auth Event: ${event}`, {
    hasSession: !!session,
    userId: session?.user?.id,
    provider: session?.user?.app_metadata?.provider
  })
  
  setSession(session)
  setUser(session?.user ?? null)
  
  if (session?.user) {
    await fetchProfile(session.user.id)
    
    // For OAuth users, sync profile data if it's missing
    if (session.user.app_metadata?.provider !== 'email') {
      await syncOAuthProfile(session.user)
    }
  } else {
    setProfile(null)
  }
  setLoading(false)
})

const syncOAuthProfile = async (user: User) => {
  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // If profile exists but missing data, update it
    if (existingProfile && (!existingProfile.avatar_url || !existingProfile.full_name)) {
      const updates: any = {}
      
      if (!existingProfile.avatar_url && user.user_metadata?.avatar_url) {
        updates.avatar_url = user.user_metadata.avatar_url
      }
      
      if (!existingProfile.full_name && user.user_metadata?.full_name) {
        updates.full_name = user.user_metadata.full_name
      }
      
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
      }
    }
  } catch (error) {
    console.error('Error syncing OAuth profile:', error)
  }
}
```

---

## 🐛 **Common OAuth Issues & Solutions**

### Issue 1: "Provider not enabled"
**Error:** `Provider 'google' is not enabled for this project`

**Diagnosis Steps:**
1. Check Supabase Dashboard → Authentication → Providers
2. Verify Google/Facebook provider is enabled
3. Confirm client credentials are saved

**Solution:**
```bash
# Check provider status via Supabase CLI
supabase projects list
supabase auth providers list --project-ref your-project-ref
```

### Issue 2: Popup Blocked
**Error:** OAuth popup gets blocked by browser

**Diagnosis Steps:**
1. Check browser popup settings
2. Test in incognito mode
3. Try redirect flow instead of popup

**Solution:**
```tsx
// Use redirect instead of popup (modify signInWithOAuth options)
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    // Remove any popup-specific options
  }
})
```

### Issue 3: CORS Errors
**Error:** `Access to fetch at 'https://accounts.google.com...' has been blocked by CORS policy`

**Diagnosis Steps:**
1. Check if domain is added to Google Console
2. Verify Supabase project URL is correct
3. Test with different browser

**Solution:**
1. Add your domain to Google Cloud Console → Credentials → OAuth 2.0 Client IDs
2. Include both development and production URLs:
   - `http://localhost:5173`
   - `https://your-domain.com`

### Issue 4: Profile Creation Failures
**Error:** `Database error saving new user`

**Diagnosis Steps:**
1. Check Supabase logs for trigger errors
2. Verify profiles table schema
3. Test trigger function manually

**Solution:**
```sql
-- Test the trigger function
SELECT public.handle_new_user();

-- Check for constraint violations
SELECT * FROM profiles WHERE id IS NULL OR username IS NULL;
```

### Issue 5: Token Expiration
**Error:** `JWT expired` or `Session expired`

**Diagnosis Steps:**
1. Check token refresh settings
2. Verify session duration in Supabase
3. Test manual token refresh

**Solution:**
```tsx
// Add automatic token refresh
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      }
      
      if (event === 'SIGNED_OUT') {
        // Clear any cached data
        setProfile(null)
      }
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

---

## 🧪 **Testing OAuth Integration**

### Test Checklist
- [ ] Google OAuth flow completes successfully
- [ ] Facebook OAuth flow completes successfully
- [ ] Profile data is created/updated correctly
- [ ] Avatar images load properly
- [ ] User can sign out and sign back in
- [ ] Error handling works for failed attempts
- [ ] Redirect URLs work in both development and production
- [ ] CORS settings allow all necessary domains

### Manual Testing Steps

1. **Test Google OAuth:**
   ```bash
   # Open browser dev tools
   # Click "Continue with Google"
   # Monitor Network tab for requests
   # Check Console for any errors
   # Verify profile creation in Supabase dashboard
   ```

2. **Test Facebook OAuth:**
   ```bash
   # Clear browser cache
   # Click "Continue with Facebook"
   # Check permissions requested
   # Verify data received matches expectations
   ```

3. **Test Error Scenarios:**
   ```bash
   # Disable providers temporarily
   # Test with invalid credentials
   # Test network failures
   # Verify error messages display correctly
   ```

### Automated Testing
```tsx
// src/tests/oauth.test.ts
describe('OAuth Integration', () => {
  test('Google OAuth button triggers correct flow', () => {
    // Mock OAuth flow
    // Assert correct provider called
    // Verify redirect URL format
  })
  
  test('Profile creation handles OAuth metadata', () => {
    // Mock OAuth user data
    // Test profile creation
    // Verify data mapping
  })
})
```

---

## 🔒 **Security Considerations**

### OAuth Security Best Practices
1. **Validate redirect URIs:** Only allow whitelisted domains
2. **Use state parameters:** Prevent CSRF attacks
3. **Validate tokens:** Always verify OAuth tokens server-side
4. **Limit scope requests:** Only request necessary permissions

### Privacy Compliance
1. **Data collection notice:** Inform users what data you collect
2. **Consent management:** Allow users to revoke access
3. **Data retention:** Implement appropriate data retention policies

### Implementation Security
```tsx
// Secure OAuth implementation example
const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
  // Generate secure state parameter
  const state = crypto.randomUUID()
  sessionStorage.setItem('oauth_state', state)
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { state }
    }
  })
  
  if (error) {
    console.error(`${provider} OAuth error:`, error)
    // Don't expose detailed error to user
    setError('Authentication failed. Please try again.')
  }
}
```

---

## 📞 **Getting Help**

### Provider-Specific Support
- **Google OAuth:** [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- **Facebook OAuth:** [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- **Supabase Auth:** [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

### Common Support Resources
1. **Supabase Discord:** Real-time community support
2. **Provider Status Pages:** Check for service outages
3. **Browser Dev Tools:** Network and console debugging
4. **Supabase Logs:** Real-time error monitoring

### Debugging Information to Collect
When seeking help, provide:
- Exact error messages from browser console
- Network request details from DevTools
- OAuth provider (Google/Facebook)
- Browser and device information
- Steps to reproduce the issue
- Supabase project ID (without sensitive data)

This comprehensive guide should help you implement and troubleshoot Google and Facebook OAuth authentication in your Strong Strong fitness app. Start with the Supabase provider configuration, then implement the frontend components, and finally test thoroughly across different scenarios.