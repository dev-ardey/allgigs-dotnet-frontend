# Backend 500 Errors - Debug Guide

## Problem
Multiple backend API endpoints are returning 500 errors:
- `/api/UserRole/me` - 500
- `/api/jobclicks?limit=1000` - 500
- `/api/jobclicks/recent?limit=50` - 500
- `/api/applying?includeArchived=false` - 500

## How to Debug

### Step 1: Check Railway Backend Logs

1. Go to Railway dashboard: https://railway.app
2. Open your backend service: `allGigs-v3-backend`
3. Go to **Logs** tab
4. Look for errors when these endpoints are called
5. Common causes:
   - Missing database connection
   - JWT validation errors
   - Missing/null user ID in token
   - Database query errors
   - Missing controllers/services

### Step 2: Check Which Endpoints Are Missing

The frontend expects these endpoints:
- `GET /api/UserRole/me` - Get user role
- `GET /api/jobclicks?limit=1000` - Get job clicks
- `GET /api/jobclicks/recent?limit=50` - Get recent job clicks
- `GET /api/applying?includeArchived=false` - Get applications
- `GET /api/futurefeatures/me` - Get future features (406 error - content type issue)

### Step 3: Test Backend Directly

Test with Swagger UI:
1. Open: https://allgigs-v3-backend-production.up.railway.app/swagger
2. Try each endpoint with a valid JWT token
3. Check what errors you get

Or test with curl:
```bash
# Get your JWT token from browser dev tools (Network tab > Request headers > Authorization)
TOKEN="your_jwt_token_here"

# Test UserRole endpoint
curl -X GET https://allgigs-v3-backend-production.up.railway.app/api/UserRole/me \
  -H "Authorization: Bearer $TOKEN"

# Test applying endpoint
curl -X GET "https://allgigs-v3-backend-production.up.railway.app/api/applying?includeArchived=false" \
  -H "Authorization: Bearer $TOKEN"

# Test jobclicks endpoint
curl -X GET "https://allgigs-v3-backend-production.up.railway.app/api/jobclicks?limit=1000" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 4: Common Issues

1. **"User ID not found in token"**
   - Backend needs to extract user ID from JWT token
   - Check `UserRoleController`, `JobClicksController`, `ApplyingController`
   - Ensure they use `ClaimTypes.NameIdentifier` or `"sub"` claim

2. **Database connection errors**
   - Check Railway environment variables:
     - `SUPABASE_URL`
     - `SUPABASE_KEY`
   - Check if backend can connect to Supabase

3. **Missing controllers**
   - Check if all controllers exist in backend:
     - `UserRoleController.cs`
     - `JobClicksController.cs`
     - `ApplyingController.cs`
     - `FutureFeaturesController.cs`

4. **406 Error for future_features**
   - This is still going directly to Supabase!
   - The URL shows `future_features?select=*&user_id=eq...` which is Supabase syntax
   - Check if there's a component still using direct Supabase instead of `apiClient.getFutureFeatures()`

### Step 5: Fix Backend

Once you identify the issue from logs:

1. **If missing user ID in token:**
   ```csharp
   // In controller:
   var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
   if (string.IsNullOrEmpty(userId))
   {
       return Unauthorized("User ID not found in token");
   }
   ```

2. **If database errors:**
   - Check Supabase connection string
   - Verify table names match
   - Check RLS policies

3. **If missing endpoints:**
   - Implement missing controllers
   - Register services in `Program.cs`

### Step 6: Temporary Workaround

If backend is down, you can temporarily:
- Only test features that don't require backend
- Wait for backend to be fixed
- Check Railway deployment status

## Next Steps

1. Check Railway logs → Find exact error
2. Fix backend controller/service → Redeploy
3. Test endpoints in Swagger → Verify they work
4. Test frontend → Should work now

