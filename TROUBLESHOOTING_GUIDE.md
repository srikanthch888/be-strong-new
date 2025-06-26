# Comprehensive Troubleshooting Guide
## Data Display Issues for "My Fitness Routes" and "My Procrastination Routes"

This guide provides systematic steps to diagnose and resolve data display issues in the Strong Strong fitness application.

---

## 🔍 **Step 1: Verify Data Exists in Database**

### 1.1 Check Database Tables
Open your Supabase dashboard and verify the following tables contain data:

**For Fitness Routes:**
```sql
-- Check fitness_routes table
SELECT COUNT(*) FROM fitness_routes;
SELECT * FROM fitness_routes LIMIT 5;

-- Check saved_routes table for user data
SELECT COUNT(*) FROM saved_routes WHERE user_id = '[USER_ID]';
SELECT * FROM saved_routes WHERE user_id = '[USER_ID]' LIMIT 5;
```

**For Procrastination Routes:**
```sql
-- Check saved_procrastination_routes table
SELECT COUNT(*) FROM saved_procrastination_routes WHERE user_id = '[USER_ID]';
SELECT * FROM saved_procrastination_routes WHERE user_id = '[USER_ID]' LIMIT 5;
```

### 1.2 Expected Data Structure
**Fitness Routes should have:**
- `id` (uuid)
- `name` (text)
- `description` (text)
- `distance` (numeric)
- `difficulty_level` (beginner/intermediate/advanced)
- `route_type` (running/walking/cycling/etc.)

**Procrastination Routes should have:**
- `id` (uuid)
- `user_id` (uuid)
- `original_task` (text)
- `route_steps` (jsonb array)
- `status` (active/completed/archived)

### 1.3 Common Issues & Solutions
❌ **No data in tables:** Run the initial migration to populate sample data
❌ **User ID mismatches:** Verify the user ID from `auth.users` matches profile IDs
❌ **Corrupted data:** Check for null values in required fields

---

## 🔗 **Step 2: Check API Endpoints and Configuration**

### 2.1 Supabase Configuration
Verify your environment variables in `.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2.2 Test Database Connections
Open browser console and test connection:
```javascript
// Test Supabase connection
import { supabase } from './src/lib/supabase'

// Test fitness routes
const testFitnessRoutes = async () => {
  const { data, error } = await supabase
    .from('fitness_routes')
    .select('*')
    .limit(1);
  console.log('Fitness routes:', { data, error });
}

// Test procrastination routes
const testProcrastinationRoutes = async () => {
  const { data, error } = await supabase
    .from('saved_procrastination_routes')
    .select('*')
    .eq('user_id', 'current-user-id')
    .limit(1);
  console.log('Procrastination routes:', { data, error });
}
```

### 2.3 Common API Issues
❌ **Connection refused:** Check Supabase URL and project status
❌ **401 Unauthorized:** Verify API keys and user authentication
❌ **403 Forbidden:** Check RLS policies (see Step 3)

---

## 🔐 **Step 3: Validate User Authentication and Permissions**

### 3.1 Check User Authentication
```javascript
// In browser console or component
const checkAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('Current user:', user);
  console.log('Auth error:', error);
  
  if (user) {
    console.log('User ID:', user.id);
    console.log('User email:', user.email);
  }
}
```

### 3.2 Verify Profile Creation
```javascript
// Check if profile exists for current user
const checkProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    console.log('User profile:', { data, error });
  }
}
```

### 3.3 Test RLS Policies
```sql
-- Test RLS policies in Supabase SQL editor
-- Make sure you're authenticated as a user

-- Test fitness routes access
SELECT * FROM fitness_routes LIMIT 1;

-- Test saved routes access
SELECT * FROM saved_routes WHERE user_id = auth.uid() LIMIT 1;

-- Test procrastination routes access
SELECT * FROM saved_procrastination_routes WHERE user_id = auth.uid() LIMIT 1;
```

### 3.4 Common Auth Issues
❌ **User not authenticated:** Ensure user is logged in
❌ **Profile missing:** Check trigger function `handle_new_user`
❌ **RLS blocking access:** Verify RLS policies allow user access

---

## 🎨 **Step 4: Inspect Frontend Components for Proper Data Binding**

### 4.1 Check Routes Page Component
Open `src/components/Routes/RoutesPage.tsx` and add debug logging:

```javascript
// Add to useEffect
useEffect(() => {
  console.log('RoutesPage: User changed', user);
  fetchRoutes()
  if (user) {
    fetchSavedRoutes()
  }
}, [user])

// Add to fetch functions
const fetchRoutes = async () => {
  console.log('Fetching routes...');
  try {
    const { data, error } = await supabase
      .from('fitness_routes')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Routes data:', data);
    console.log('Routes error:', error);
    if (error) throw error
    setRoutes(data || [])
  } catch (error) {
    console.error('Error fetching routes:', error)
  } finally {
    setLoading(false)
  }
}
```

### 4.2 Check Procrastination Routes Component
Open `src/components/Procrastination/SavedProcrastinationRoutes.tsx`:

```javascript
// Add debug logging to fetchSavedRoutes
const fetchSavedRoutes = async () => {
  if (!user) {
    console.log('No user, skipping fetch');
    return;
  }

  console.log('Fetching procrastination routes for user:', user.id);
  try {
    const { data, error } = await supabase
      .from('saved_procrastination_routes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    console.log('Procrastination routes data:', data);
    console.log('Procrastination routes error:', error);
    if (error) throw error
    setSavedRoutes(data || [])
  } catch (error) {
    console.error('Error fetching saved routes:', error)
    setMessage('Failed to load saved routes.')
  } finally {
    setLoading(false)
  }
}
```

### 4.3 Common Component Issues
❌ **Data not rendering:** Check if data is being set in state
❌ **Loading state stuck:** Verify loading state is properly managed
❌ **Filter/search not working:** Check filter logic and state updates

---

## 🌐 **Step 5: Review Network Requests for Error Responses**

### 5.1 Monitor Network Tab
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Filter by "XHR" or "Fetch"
4. Navigate to routes pages
5. Look for failed requests (red status codes)

### 5.2 Common Network Errors and Solutions

**Error: 400 Bad Request**
```json
{"code":"PGRST116","message":"No relationships found between..."}
```
**Solution:** Check table relationships and foreign keys

**Error: 401 Unauthorized**
```json
{"code":"401","message":"JWT expired"}
```
**Solution:** User needs to re-authenticate

**Error: 403 Forbidden**
```json
{"message":"permission denied for table..."}
```
**Solution:** Check RLS policies

**Error: 500 Internal Server Error**
```json
{"code":"unexpected_failure","message":"..."}
```
**Solution:** Check database constraints and triggers

### 5.3 Debug Network Requests
Add this to your components to log all Supabase requests:
```javascript
// Add to src/lib/supabase.ts
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.id);
});

// Log all database queries
const originalFrom = supabase.from;
supabase.from = function(table) {
  console.log(`Querying table: ${table}`);
  return originalFrom.call(this, table);
};
```

---

## ⚡ **Step 6: Test Data Loading and Rendering Logic**

### 6.1 Test Loading States
Check if loading indicators work properly:
```javascript
// Add temporary button to test loading
const testLoading = () => {
  setLoading(true);
  setTimeout(() => setLoading(false), 3000);
}
```

### 6.2 Test Empty States
```javascript
// Temporarily set empty data to test empty states
const testEmptyState = () => {
  setRoutes([]);
  setSavedRoutes([]);
}
```

### 6.3 Test Error States
```javascript
// Test error message display
const testErrorState = () => {
  setMessage('Test error message');
}
```

### 6.4 Verify Data Flow
1. **Data fetched:** Check browser console for fetch logs
2. **State updated:** Verify state contains correct data
3. **Component re-renders:** Confirm UI updates with new data
4. **Filters applied:** Test search and filter functionality

---

## 🗺️ **Step 7: Confirm Route Mapping Functionality**

### 7.1 Check Navigation
Verify navigation between different sections works:
```javascript
// In Navbar component, add logging
const handleNavigate = (page: string) => {
  console.log('Navigating to:', page);
  setCurrentPage(page)
}
```

### 7.2 Test Route-Specific Logic
**For Fitness Routes:**
- Saving/unsaving routes
- Updating route status
- Filtering by status

**For Procrastination Routes:**
- Creating new routes
- Editing existing routes
- Completion tracking

### 7.3 Common Route Issues
❌ **Navigation not working:** Check currentPage state and switch logic
❌ **Data not persisting:** Verify save operations and re-fetch logic
❌ **Filters not applied:** Check filter state and application logic

---

## 🚨 **Common Error Messages and Solutions**

### Database Errors
```
"relation 'fitness_routes' does not exist"
```
**Solution:** Run database migrations

```
"permission denied for table fitness_routes"
```
**Solution:** Check RLS policies for the table

```
"duplicate key value violates unique constraint"
```
**Solution:** Check for existing records before insert

### Authentication Errors
```
"JWT expired"
```
**Solution:** Refresh user session or re-authenticate

```
"User not authenticated"
```
**Solution:** Ensure user is logged in before accessing protected routes

### Frontend Errors
```
"Cannot read property 'length' of undefined"
```
**Solution:** Add null checks before accessing array properties

```
"Failed to fetch"
```
**Solution:** Check network connection and API endpoints

---

## 🔧 **Quick Diagnostic Checklist**

- [ ] User is authenticated and profile exists
- [ ] Database tables contain expected data
- [ ] RLS policies allow user access to their data
- [ ] Network requests are successful (200 status)
- [ ] Component state is being updated with fetched data
- [ ] Loading states are properly managed
- [ ] Error handling is working correctly
- [ ] Filters and search functionality work as expected

---

## 📞 **Getting Additional Help**

If issues persist after following this guide:

1. **Check browser console** for JavaScript errors
2. **Review Supabase logs** in the dashboard
3. **Test with different user accounts** to isolate user-specific issues
4. **Verify database schema** matches expected structure
5. **Check for recent changes** that might have introduced issues

**Need more specific help?** Provide:
- Exact error messages from console
- Network request details from DevTools
- User ID and affected data
- Steps to reproduce the issue