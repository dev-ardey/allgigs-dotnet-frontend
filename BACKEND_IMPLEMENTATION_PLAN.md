# 🎯 AllGigs Backend API - Complete Implementation Plan

**Project:** AllGigs Freelance Job Board  
**Backend:** .NET 8 Web API  
**Database:** Supabase PostgreSQL  
**Hosting:** Railway  
**Approach:** Minimal Backend (Security + Data Access)  
**Date:** October 2025

---

## 📑 Table of Contents

1. [Fase 0: Voorbereiding & Strategie](#fase-0-voorbereiding--strategie)
2. [Fase 1: Backend Project Setup](#fase-1-backend-project-setup)
3. [Fase 2: Database Setup](#fase-2-database-setup)
4. [Fase 3: Backend Core Implementation](#fase-3-backend-core-implementation)
5. [Fase 4: Frontend Integration](#fase-4-frontend-integration)
6. [Fase 5: Testing & Validation](#fase-5-testing--validation)
7. [Fase 6: Deployment](#fase-6-deployment)
8. [Fase 7: GDPR Compliance](#fase-7-gdpr-compliance)
9. [Fase 8: Monitoring & Maintenance](#fase-8-monitoring--maintenance)
10. [Checklist & Summary](#checklist--summary)

---

## FASE 0: VOORBEREIDING & STRATEGIE

### 0.1 Project Structure Beslissing

**Gekozen Aanpak: Monorepo**

```
Freelance_jobboard/
├── frontend/          # Bestaande Next.js app
│   ├── pages/
│   ├── components/
│   └── ...
├── backend/           # Nieuwe .NET 8 API
│   ├── Controllers/
│   ├── Services/
│   └── ...
└── shared/            # Gedeelde types/constants
```

**Waarom Monorepo:**
- ✅ Alles in één repo
- ✅ Makkelijk te deployen
- ✅ Shared types mogelijk
- ✅ Eén git history

---

### 0.2 Technology Stack

```yaml
Backend:
  Framework: .NET 8 Web API
  Language: C# 12
  Database: Supabase PostgreSQL
  Authentication: JWT (Supabase tokens)
  Hosting: Railway
  
Frontend:
  Framework: Next.js (blijft hetzelfde)
  API Client: Fetch API
  
Database:
  Provider: Supabase
  ORM: Npgsql (PostgreSQL driver)
  
Security:
  Authentication: JWT Bearer tokens
  Authorization: Role-based (freeUser, paidUser, admin)
  HTTPS: Enforced
  CORS: Configured
```

---

### 0.3 Security Architecture

```
User → Frontend → Backend API → Supabase Database
         ↓            ↓              ↓
      UI Logic   Security      Data Storage
                 + Validation
```

**Security Layers:**
1. **Frontend**: UI validation (user experience)
2. **Backend**: Authentication + Authorization (security)
3. **Database**: RLS policies (defense in depth)

---

## FASE 1: BACKEND PROJECT SETUP

### 1.1 .NET Project Initialisatie

#### Stap 1.1.1: .NET SDK Check

```bash
# Check of .NET 8 geïnstalleerd is
dotnet --version
# Expected: 8.0.x

# Als niet geïnstalleerd:
# Download van: https://dotnet.microsoft.com/download/dotnet/8.0
```

**Waarom:** .NET 8 is de LTS versie met beste performance en security.

---

#### Stap 1.1.2: Project Aanmaken

```bash
cd /Users/niiardeyankrah/Desktop/Nii\ Ardey/projects\ 2025/allgigs\ 4.0\ repo/Freelance_jobboard

# Maak backend directory
mkdir backend
cd backend

# Maak .NET Web API project
dotnet new webapi -n AllGigs.Api --framework net8.0

cd AllGigs.Api
```

**Waarom:** `webapi` template geeft ons een clean starting point met best practices.

---

#### Stap 1.1.3: Project Structure

```
backend/
└── AllGigs.Api/
    ├── Controllers/        # API endpoints
    ├── Services/          # Business logic
    ├── Models/            # Data models
    ├── DTOs/              # Data Transfer Objects
    ├── Middleware/        # Custom middleware
    ├── Configuration/     # App settings
    ├── Program.cs         # Entry point
    └── appsettings.json   # Configuration
```

**Waarom:** Clean architecture - separation of concerns.

---

### 1.2 Dependencies Installation

#### Stap 1.2.1: Core Packages

```bash
# JWT Authentication
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer

# PostgreSQL driver voor Supabase
dotnet add package Npgsql

# HTTP client voor Supabase API calls
dotnet add package Supabase

# Input validation
dotnet add package FluentValidation.AspNetCore

# Environment variables
dotnet add package DotNetEnv

# Swagger voor API documentatie
dotnet add package Swashbuckle.AspNetCore
```

**Waarom elke package:**
- **JwtBearer**: Voor Supabase JWT token validatie
- **Npgsql**: Direct PostgreSQL access (Supabase is PostgreSQL)
- **Supabase**: Official C# client voor Supabase
- **FluentValidation**: Type-safe input validation
- **DotNetEnv**: Voor .env file support
- **Swashbuckle**: Swagger UI om API te testen

---

### 1.3 Configuration Setup

#### Stap 1.3.1: appsettings.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Supabase": {
    "Url": "",
    "Key": "",
    "JwtSecret": ""
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-frontend-domain.com"
    ]
  },
  "RateLimit": {
    "FreeUserDailyLimit": 50,
    "FreeUserJobClickLimit": 10
  }
}
```

**Waarom:** Centralized configuration - makkelijk te wijzigen per environment.

---

#### Stap 1.3.2: .env file (voor secrets)

Maak: `backend/AllGigs.Api/.env`

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

**Waarom:** Secrets niet in git committen (security).

---

#### Stap 1.3.3: .gitignore update

Voeg toe aan `.gitignore`:

```bash
backend/AllGigs.Api/.env
backend/AllGigs.Api/appsettings.Development.json
backend/AllGigs.Api/bin/
backend/AllGigs.Api/obj/
```

**Waarom:** Voorkomt dat secrets in git komen.

---

## FASE 2: DATABASE SETUP

### 2.1 Database Schema voor Authorization

#### Stap 2.1.1: user_roles tabel

**Run in Supabase SQL Editor:**

```sql
-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'freeUser' 
        CHECK (role IN ('freeUser', 'paidUser', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    subscription_id TEXT,
    UNIQUE(user_id)
);

-- Indexes voor performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

**Waarom:**
- **user_id UNIQUE**: Eén role per user
- **CHECK constraint**: Alleen geldige roles
- **expires_at**: Voor subscription management
- **Indexes**: Snelle queries

---

#### Stap 2.1.2: Auto-assign freeUser role

```sql
-- Trigger om nieuwe users automatisch freeUser te maken
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'freeUser')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION assign_default_role();
```

**Waarom:** Elke nieuwe user krijgt automatisch freeUser role - geen manual work.

---

#### Stap 2.1.3: Feature usage tracking

```sql
-- Voor rate limiting
CREATE TABLE IF NOT EXISTS feature_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Index voor snelle daily queries
CREATE INDEX idx_feature_usage_user_date 
    ON feature_usage(user_id, used_at DESC);
```

**Waarom:** Track hoeveel keer freeUsers features gebruiken (voor limits).

---

### 2.2 Row Level Security (RLS)

#### Stap 2.2.1: Enable RLS

```sql
-- Enable RLS op belangrijke tabellen
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
```

**Waarom:** Defense in depth - zelfs als backend gehacked wordt, database is protected.

---

#### Stap 2.2.2: RLS Policies

```sql
-- Users kunnen alleen eigen role zien
CREATE POLICY "Users can view own role"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Alleen admins kunnen roles wijzigen
CREATE POLICY "Admins can manage roles"
    ON user_roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Users kunnen alleen eigen feature usage zien
CREATE POLICY "Users can view own usage"
    ON feature_usage FOR SELECT
    USING (auth.uid() = user_id);

-- Users kunnen alleen eigen usage loggen
CREATE POLICY "Users can log own usage"
    ON feature_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Job clicks policies
CREATE POLICY "Users can view own job clicks"
    ON job_clicks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job clicks"
    ON job_clicks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins kunnen alles zien
CREATE POLICY "Admins can view all data"
    ON job_clicks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );
```

**Waarom:** Multi-layer security - backend + database checks.

---

### 2.3 Database Helper Functions

#### Stap 2.3.1: Role check functions

```sql
-- Check user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
    SELECT role FROM user_roles 
    WHERE user_id = user_uuid
    AND (expires_at IS NULL OR expires_at > NOW());
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if paid user
CREATE OR REPLACE FUNCTION is_paid_user()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('paidUser', 'admin')
        AND (expires_at IS NULL OR expires_at > NOW())
    );
$$ LANGUAGE sql SECURITY DEFINER;
```

**Waarom:** Reusable functions - DRY principle.

---

#### Stap 2.3.2: Daily limit check

```sql
-- Check daily feature limit
CREATE OR REPLACE FUNCTION check_daily_limit(
    feature_name TEXT,
    max_limit INT
)
RETURNS BOOLEAN AS $$
DECLARE
    usage_count INT;
    user_role TEXT;
BEGIN
    -- Get user role
    SELECT role INTO user_role
    FROM user_roles
    WHERE user_id = auth.uid();
    
    -- Paid users have unlimited access
    IF user_role IN ('paidUser', 'admin') THEN
        RETURN TRUE;
    END IF;
    
    -- Count today's usage
    SELECT COUNT(*) INTO usage_count
    FROM feature_usage
    WHERE user_id = auth.uid()
    AND feature = feature_name
    AND used_at >= CURRENT_DATE;
    
    RETURN usage_count < max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Waarom:** Business logic in database - consistent across all clients.

---

### 2.4 Maak jezelf Admin

#### Stap 2.4.1: Get je user ID

```sql
-- Run in Supabase SQL Editor
SELECT id, email FROM auth.users WHERE email = 'jouw@email.com';
```

#### Stap 2.4.2: Set admin role

```sql
-- Replace YOUR_USER_ID met je echte user ID
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();
```

**Waarom:** Je hebt één admin nodig om te testen en andere users te managen.

---

## FASE 3: BACKEND CORE IMPLEMENTATION

### 3.1 Models & DTOs

#### Models/User.cs

```csharp
namespace AllGigs.Api.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "freeUser";
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }
    
    public enum UserRole
    {
        FreeUser,
        PaidUser,
        Admin
    }
}
```

**Waarom:** Type-safe models - compile-time checking.

---

#### Models/Job.cs

```csharp
namespace AllGigs.Api.Models
{
    public class Job
    {
        public string UniqueId { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? Company { get; set; }
        public string? Location { get; set; }
        public string? Rate { get; set; }
        public string? Date { get; set; }
        public string? Summary { get; set; }
        public string? Url { get; set; }
        public DateTime? CreatedAt { get; set; }
        public Guid? AddedBy { get; set; }
        public string? AddedByEmail { get; set; }
    }
}
```

**Waarom:** Matches je Supabase schema.

---

#### DTOs/Requests.cs

```csharp
namespace AllGigs.Api.DTOs
{
    public class AddJobRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Rate { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }
    
    public class SearchJobsRequest
    {
        public string? SearchTerm { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }
}
```

**Waarom:** Separate DTOs van Models - validation en security.

---

#### DTOs/Responses.cs

```csharp
namespace AllGigs.Api.DTOs
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Error { get; set; }
        public string? Message { get; set; }
    }
    
    public class UserInfoResponse
    {
        public Guid UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsAdmin { get; set; }
        public bool IsPaidUser { get; set; }
    }
}
```

**Waarom:** Consistent API responses - makkelijk voor frontend.

---

### 3.2 Services Layer

#### Services/ISupabaseService.cs

```csharp
namespace AllGigs.Api.Services
{
    public interface ISupabaseService
    {
        Task<User?> GetUserRole(Guid userId);
        Task<List<Job>> GetJobs(string? searchTerm = null);
        Task<Job> AddJob(Guid userId, AddJobRequest request);
        Task<bool> CheckDailyLimit(Guid userId, string feature, int limit);
        Task LogFeatureUsage(Guid userId, string feature);
    }
}
```

**Waarom:** Interface voor dependency injection - testable code.

---

#### Services/SupabaseService.cs (Implementation skeleton)

```csharp
using Supabase;
using Npgsql;

namespace AllGigs.Api.Services
{
    public class SupabaseService : ISupabaseService
    {
        private readonly Supabase.Client _supabase;
        private readonly string _connectionString;
        
        public SupabaseService(IConfiguration config)
        {
            var url = config["Supabase:Url"];
            var key = config["Supabase:Key"];
            
            _supabase = new Supabase.Client(url, key);
            _connectionString = BuildConnectionString(config);
        }
        
        public async Task<User?> GetUserRole(Guid userId)
        {
            // Implementation: Query user_roles table
            // Return User object with role info
        }
        
        public async Task<List<Job>> GetJobs(string? searchTerm = null)
        {
            // Implementation: Query Allgigs_All_vacancies_NEW table
            // Apply search filter if provided
        }
        
        public async Task<Job> AddJob(Guid userId, AddJobRequest request)
        {
            // Implementation: Insert into Allgigs_All_vacancies_NEW
            // Log to job_postings_log table
        }
        
        public async Task<bool> CheckDailyLimit(Guid userId, string feature, int limit)
        {
            // Implementation: Call check_daily_limit() database function
        }
        
        public async Task LogFeatureUsage(Guid userId, string feature)
        {
            // Implementation: Insert into feature_usage table
        }
        
        private string BuildConnectionString(IConfiguration config)
        {
            // Build PostgreSQL connection string for Supabase
        }
    }
}
```

**Waarom:** Encapsulate Supabase logic - single responsibility.

---

### 3.3 Authentication & Authorization

#### Program.cs - JWT Setup

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register services
builder.Services.AddScoped<ISupabaseService, SupabaseService>();

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSecret = builder.Configuration["Supabase:JwtSecret"];
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecret!)
            ),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// Authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("PaidUser", policy =>
        policy.RequireRole("paidUser", "admin"));
        
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("admin"));
});

// CORS configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "https://your-frontend-domain.com"
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

var app = builder.Build();

// Configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

// Custom middleware
app.UseMiddleware<RoleEnrichmentMiddleware>();

app.MapControllers();
app.Run();
```

**Waarom:** Supabase JWT tokens valideren - secure authentication.

---

#### Middleware/RoleEnrichmentMiddleware.cs

```csharp
using System.Security.Claims;

namespace AllGigs.Api.Middleware
{
    public class RoleEnrichmentMiddleware
    {
        private readonly RequestDelegate _next;
        
        public RoleEnrichmentMiddleware(RequestDelegate next)
        {
            _next = next;
        }
        
        public async Task InvokeAsync(
            HttpContext context, 
            ISupabaseService supabaseService)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.FindFirst("sub")?.Value;
                
                if (Guid.TryParse(userId, out var userGuid))
                {
                    var user = await supabaseService.GetUserRole(userGuid);
                    
                    if (user != null)
                    {
                        // Add role claim to user
                        var identity = context.User.Identity as ClaimsIdentity;
                        identity?.AddClaim(new Claim(ClaimTypes.Role, user.Role));
                    }
                }
            }
            
            await _next(context);
        }
    }
}
```

**Waarom:** JWT token bevat geen role - we halen het uit database en voegen toe.

---

### 3.4 Controllers

#### Controllers/AuthController.cs

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AllGigs.Api.Services;
using AllGigs.Api.DTOs;

namespace AllGigs.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ISupabaseService _supabaseService;
        
        public AuthController(ISupabaseService supabaseService)
        {
            _supabaseService = supabaseService;
        }
        
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserInfoResponse>> GetCurrentUser()
        {
            var userId = User.FindFirst("sub")?.Value;
            
            if (!Guid.TryParse(userId, out var userGuid))
                return Unauthorized();
                
            var user = await _supabaseService.GetUserRole(userGuid);
            
            if (user == null)
                return NotFound();
                
            return Ok(new UserInfoResponse
            {
                UserId = user.Id,
                Email = user.Email,
                Role = user.Role,
                IsAdmin = user.Role == "admin",
                IsPaidUser = user.Role is "paidUser" or "admin"
            });
        }
    }
}
```

**Waarom:** Frontend kan user info + role ophalen.

---

#### Controllers/JobsController.cs

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AllGigs.Api.Services;
using AllGigs.Api.Models;
using AllGigs.Api.DTOs;

namespace AllGigs.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class JobsController : ControllerBase
    {
        private readonly ISupabaseService _supabaseService;
        private readonly IConfiguration _config;
        private readonly ILogger<JobsController> _logger;
        
        public JobsController(
            ISupabaseService supabaseService,
            IConfiguration config,
            ILogger<JobsController> logger)
        {
            _supabaseService = supabaseService;
            _config = config;
            _logger = logger;
        }
        
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<Job>>>> GetJobs(
            [FromQuery] string? search = null)
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation("User {UserId} requested jobs", userId);
                
                // Check rate limit for free users
                var user = await _supabaseService.GetUserRole(userId);
                
                if (user?.Role == "freeUser")
                {
                    var limit = _config.GetValue<int>("RateLimit:FreeUserDailyLimit");
                    var canUse = await _supabaseService.CheckDailyLimit(
                        userId, "job_search", limit);
                        
                    if (!canUse)
                    {
                        return StatusCode(429, new ApiResponse<List<Job>>
                        {
                            Success = false,
                            Error = "Daily limit reached. Upgrade to continue."
                        });
                    }
                    
                    await _supabaseService.LogFeatureUsage(userId, "job_search");
                }
                
                var jobs = await _supabaseService.GetJobs(search);
                
                return Ok(new ApiResponse<List<Job>>
                {
                    Success = true,
                    Data = jobs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get jobs");
                return StatusCode(500, new ApiResponse<List<Job>>
                {
                    Success = false,
                    Error = "Internal server error"
                });
            }
        }
        
        [HttpPost]
        [Authorize(Policy = "PaidUser")]
        public async Task<ActionResult<ApiResponse<Job>>> AddJob(
            [FromBody] AddJobRequest request)
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation("User {UserId} adding job", userId);
                
                var job = await _supabaseService.AddJob(userId, request);
                
                return Ok(new ApiResponse<Job>
                {
                    Success = true,
                    Data = job,
                    Message = "Job added successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add job");
                return StatusCode(500, new ApiResponse<Job>
                {
                    Success = false,
                    Error = "Failed to add job"
                });
            }
        }
        
        private Guid GetUserId()
        {
            var userId = User.FindFirst("sub")?.Value;
            return Guid.Parse(userId!);
        }
    }
}
```

**Waarom:** 
- Rate limiting voor freeUsers
- Authorization voor paidUsers
- Clean error handling

---

## FASE 4: FRONTEND INTEGRATION

### 4.1 API Client Setup

#### utils/apiClient.ts

```typescript
import { supabase } from '../SupabaseClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

class ApiClient {
    private async getToken(): Promise<string> {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || '';
    }

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        const token = await this.getToken();
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `API Error: ${response.status}`);
        }

        return response.json();
    }

    async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        const token = await this.getToken();
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API Error');
        }

        return response.json();
    }
    
    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        const token = await this.getToken();
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API Error');
        }

        return response.json();
    }
}

export const api = new ApiClient();
```

**Waarom:** Centralized API calls - DRY principle.

---

### 4.2 Authorization Hook

#### components/ui/useAuthorization.ts

```typescript
import { useEffect, useState } from 'react';
import { api } from '../../utils/apiClient';

export type UserRole = 'freeUser' | 'paidUser' | 'admin';

interface UserInfo {
    userId: string;
    email: string;
    role: UserRole;
    isAdmin: boolean;
    isPaidUser: boolean;
}

export function useAuthorization() {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const response = await api.get<UserInfo>('/auth/me');
            if (response.success && response.data) {
                setUserInfo(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch user info:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasAccess = (feature: string): boolean => {
        if (!userInfo) return false;

        const accessMatrix: Record<string, UserRole[]> = {
            'dashboard': ['freeUser', 'paidUser', 'admin'],
            'search': ['freeUser', 'paidUser', 'admin'],
            'pipeline': ['paidUser', 'admin'],
            'add-job': ['paidUser', 'admin'],
            'admin-panel': ['admin'],
        };

        const allowedRoles = accessMatrix[feature] || [];
        return allowedRoles.includes(userInfo.role);
    };

    return {
        userInfo,
        loading,
        hasAccess,
        isAdmin: userInfo?.isAdmin || false,
        isPaidUser: userInfo?.isPaidUser || false,
        refreshUserInfo: fetchUserInfo
    };
}
```

**Waarom:** Frontend kan authorization checken - consistent met backend.

---

### 4.3 Update Existing Components

#### Example: pages/dashboard.tsx

```typescript
import { useAuthorization } from '../components/ui/useAuthorization';
import { api } from '../utils/apiClient';

export default function Dashboard() {
    const { hasAccess, isPaidUser, userInfo } = useAuthorization();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Replace direct Supabase calls met API calls
    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await api.get<Job[]>('/jobs');
            if (response.success && response.data) {
                setJobs(response.data);
            }
        } catch (error) {
            if (error.message.includes('429')) {
                // Show upgrade modal - rate limit reached
                showUpgradeModal();
            } else {
                console.error('Failed to fetch jobs:', error);
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Protect features
    if (!hasAccess('pipeline')) {
        return <UpgradeModal feature="CRM Pipeline" />;
    }
    
    // Rest of component...
}
```

**Waarom:** Frontend gebruikt nu backend API - secure data access.

---

### 4.4 Environment Variables

#### .env.local (in frontend root)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Voor production:**

```bash
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app/api
```

---

## FASE 5: TESTING & VALIDATION

### 5.1 Backend Testing

#### Stap 5.1.1: Start Backend

```bash
cd backend/AllGigs.Api
dotnet run
```

Expected output:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
```

---

#### Stap 5.1.2: Test Swagger UI

Open browser: `http://localhost:5000/swagger`

Test endpoints:
- GET `/api/auth/me`
- GET `/api/jobs`
- POST `/api/jobs`

---

#### Stap 5.1.3: Test met curl

```bash
# Get your Supabase token first (from browser dev tools)
TOKEN="your_supabase_jwt_token"

# Test authentication
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Test jobs endpoint
curl -X GET http://localhost:5000/api/jobs \
  -H "Authorization: Bearer $TOKEN"

# Test add job (as paidUser/admin)
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job",
    "company": "Test Company",
    "location": "Remote",
    "rate": "$100/hour",
    "summary": "Test job summary",
    "url": "https://example.com/job"
  }'
```

---

#### Stap 5.1.4: Test Rate Limiting

```bash
# Make 51 requests as freeUser
for i in {1..51}; do
  echo "Request $i"
  curl -X GET http://localhost:5000/api/jobs \
    -H "Authorization: Bearer $FREEUSER_TOKEN"
done
# Expected: First 50 succeed, 51st returns 429
```

---

### 5.2 Frontend Testing

#### Stap 5.2.1: Test API Integration

```typescript
// Test in browser console
import { api } from './utils/apiClient';

// Test get
const jobsResponse = await api.get('/jobs');
console.log(jobsResponse);

// Test post (as paidUser)
const newJob = await api.post('/jobs', {
    title: 'Test Job',
    company: 'Test Company',
    location: 'Remote',
    rate: '$100/hour',
    summary: 'Test summary',
    url: 'https://example.com'
});
console.log(newJob);
```

---

### 5.3 Security Testing

#### Stap 5.3.1: Test RLS Policies

```sql
-- Login als user A in Supabase SQL Editor
-- Try to access user B's data
SELECT * FROM job_clicks WHERE user_id = 'USER_B_ID';
-- Expected: Empty result or permission denied
```

---

#### Stap 5.3.2: Test JWT Validation

```bash
# Test met invalid token
curl -X GET http://localhost:5000/api/jobs \
  -H "Authorization: Bearer invalid_token"
# Expected: 401 Unauthorized

# Test zonder token
curl -X GET http://localhost:5000/api/jobs
# Expected: 401 Unauthorized

# Test met expired token
curl -X GET http://localhost:5000/api/jobs \
  -H "Authorization: Bearer expired_token"
# Expected: 401 Unauthorized
```

---

#### Stap 5.3.3: Test Authorization

```bash
# Test add job as freeUser
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer $FREEUSER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test",...}'
# Expected: 403 Forbidden

# Test add job as paidUser
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer $PAIDUSER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test",...}'
# Expected: 200 OK
```

---

## FASE 6: DEPLOYMENT

### 6.1 Railway Setup

#### Stap 6.1.1: Install Railway CLI

```bash
npm install -g @railway/cli

# Login
railway login
```

---

#### Stap 6.1.2: Create Dockerfile

Create: `backend/AllGigs.Api/Dockerfile`

```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy everything else and build
COPY . ./
RUN dotnet publish -c Release -o out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# Expose port (Railway uses 8080)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "AllGigs.Api.dll"]
```

**Waarom:** Docker container - consistent deployment across environments.

---

#### Stap 6.1.3: Create .dockerignore

Create: `backend/AllGigs.Api/.dockerignore`

```
bin/
obj/
.env
.git/
.gitignore
*.md
```

---

#### Stap 6.1.4: Initialize Railway Project

```bash
cd backend/AllGigs.Api
railway init

# Follow prompts to create new project
```

---

#### Stap 6.1.5: Set Environment Variables

In Railway Dashboard (https://railway.app):

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
ASPNETCORE_ENVIRONMENT=Production
```

---

#### Stap 6.1.6: Deploy

```bash
railway up
```

Wait for deployment to complete. You'll get a URL like:
`https://allgigs-api-production.railway.app`

---

### 6.2 Frontend Environment Update

#### Stap 6.2.1: Update .env.local

```bash
# Update frontend/.env.local
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app/api
```

---

#### Stap 6.2.2: Update CORS in Backend

Update `appsettings.json` or Railway environment variable:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-frontend-domain.vercel.app",
      "https://your-frontend-domain.com"
    ]
  }
}
```

---

#### Stap 6.2.3: Deploy Frontend

```bash
# If using Vercel
vercel --prod

# Or push to GitHub (auto-deploy)
git add .
git commit -m "Update API URL"
git push
```

---

### 6.3 Verify Deployment

#### Test production API:

```bash
# Get token from production frontend
TOKEN="production_supabase_token"

# Test API
curl -X GET https://your-railway-app.railway.app/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## FASE 7: GDPR COMPLIANCE

### 7.1 Privacy Policy

#### Stap 7.1.1: Create Privacy Policy Page

Create: `pages/privacy.tsx`

```typescript
export default function PrivacyPolicy() {
    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Privacy Policy</h1>
            
            <h2>Data We Collect</h2>
            <ul>
                <li>Email address (for authentication)</li>
                <li>Job search history (for recommendations)</li>
                <li>Click history (for analytics)</li>
            </ul>
            
            <h2>Why We Collect This Data</h2>
            <ul>
                <li>To provide personalized job recommendations</li>
                <li>To improve our service</li>
                <li>To manage your account</li>
            </ul>
            
            <h2>Your Rights (GDPR)</h2>
            <ul>
                <li>Right to access your data</li>
                <li>Right to delete your account</li>
                <li>Right to export your data</li>
                <li>Right to correct your data</li>
            </ul>
            
            <h2>How to Exercise Your Rights</h2>
            <p>Contact us at: privacy@allgigs.com</p>
            <p>Or use the settings in your account dashboard</p>
            
            <h2>Data Retention</h2>
            <ul>
                <li>Active accounts: Indefinite</li>
                <li>Deleted accounts: 30 days</li>
            </ul>
            
            <h2>Contact</h2>
            <p>Email: privacy@allgigs.com</p>
        </div>
    );
}
```

---

### 7.2 User Rights Implementation

#### Stap 7.2.1: Add UserController

Create: `backend/AllGigs.Api/Controllers/UserController.cs`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace AllGigs.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly ISupabaseService _supabaseService;
        
        public UserController(ISupabaseService supabaseService)
        {
            _supabaseService = supabaseService;
        }
        
        [HttpGet("data")]
        public async Task<ActionResult> ExportUserData()
        {
            var userId = GetUserId();
            
            // Get all user data from various tables
            var userData = new
            {
                UserId = userId,
                Profile = await _supabaseService.GetUserProfile(userId),
                JobClicks = await _supabaseService.GetUserJobClicks(userId),
                SearchHistory = await _supabaseService.GetUserSearches(userId),
                ExportedAt = DateTime.UtcNow
            };
            
            var json = JsonSerializer.Serialize(userData, new JsonSerializerOptions 
            { 
                WriteIndented = true 
            });
            
            return File(
                Encoding.UTF8.GetBytes(json),
                "application/json",
                $"allgigs-user-data-{userId}.json"
            );
        }
        
        [HttpDelete("account")]
        public async Task<ActionResult> DeleteAccount()
        {
            var userId = GetUserId();
            
            // Delete all user data (CASCADE will handle related records)
            await _supabaseService.DeleteUserAccount(userId);
            
            return Ok(new 
            { 
                success = true,
                message = "Account scheduled for deletion. Your data will be removed within 30 days." 
            });
        }
        
        private Guid GetUserId()
        {
            var userId = User.FindFirst("sub")?.Value;
            return Guid.Parse(userId!);
        }
    }
}
```

**Waarom:** GDPR user rights - data export en account deletion.

---

#### Stap 7.2.2: Add User Settings Page

Create: `pages/settings.tsx`

```typescript
import { useState } from 'react';
import { api } from '../utils/apiClient';

export default function Settings() {
    const [loading, setLoading] = useState(false);
    
    const handleExportData = async () => {
        setLoading(true);
        try {
            // Download user data as JSON
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/user/data`,
                {
                    headers: {
                        'Authorization': `Bearer ${await getToken()}`
                    }
                }
            );
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my-allgigs-data.json';
            a.click();
        } catch (error) {
            alert('Failed to export data');
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure? This action cannot be undone.')) {
            return;
        }
        
        setLoading(true);
        try {
            await api.delete('/user/account');
            alert('Account deletion scheduled');
            // Logout user
            await supabase.auth.signOut();
            window.location.href = '/';
        } catch (error) {
            alert('Failed to delete account');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div style={{ padding: '2rem' }}>
            <h1>Account Settings</h1>
            
            <section style={{ marginTop: '2rem' }}>
                <h2>Data & Privacy</h2>
                
                <button 
                    onClick={handleExportData}
                    disabled={loading}
                    style={{ marginTop: '1rem' }}
                >
                    Export My Data
                </button>
                
                <button 
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    style={{ 
                        marginTop: '1rem',
                        marginLeft: '1rem',
                        background: 'red'
                    }}
                >
                    Delete Account
                </button>
            </section>
        </div>
    );
}
```

**Waarom:** Users kunnen hun GDPR rechten uitoefenen.

---

### 7.3 Cookie Consent (Optional)

Als je cookies gebruikt (Google Analytics, etc.):

```bash
npm install react-cookie-consent
```

```typescript
// pages/_app.tsx
import CookieConsent from "react-cookie-consent";

function MyApp({ Component, pageProps }) {
    return (
        <>
            <Component {...pageProps} />
            <CookieConsent
                location="bottom"
                buttonText="Accept"
                declineButtonText="Decline"
                enableDeclineButton
            >
                We use cookies to improve your experience. 
                See our <a href="/privacy">Privacy Policy</a>.
            </CookieConsent>
        </>
    );
}
```

---

## FASE 8: MONITORING & MAINTENANCE

### 8.1 Logging

Logging is al geïmplementeerd in de controllers via `ILogger<T>`.

#### View logs in Railway:

```bash
railway logs
```

---

### 8.2 Health Checks

#### Stap 8.2.1: Add Health Check

In `Program.cs`:

```csharp
builder.Services.AddHealthChecks();

app.MapHealthChecks("/health");
```

#### Test health check:

```bash
curl https://your-railway-app.railway.app/health
# Expected: Healthy
```

---

### 8.3 Monitoring Checklist

- [ ] Railway logs monitoren
- [ ] Database performance checken
- [ ] API response times monitoren
- [ ] Error rate tracken
- [ ] Disk space checken

**Tools:**
- Railway Dashboard (built-in monitoring)
- Supabase Dashboard (database metrics)

---

## CHECKLIST: VOOR PRODUCTION

### ✅ Security

- [ ] JWT authentication werkt
- [ ] Role-based authorization werkt
- [ ] RLS policies enabled en getest
- [ ] CORS correct geconfigureerd
- [ ] HTTPS enforced
- [ ] Environment variables niet in git
- [ ] Rate limiting werkt voor freeUsers
- [ ] Input validation werkt
- [ ] SQL injection protection enabled
- [ ] XSS protection enabled

---

### ✅ Functionality

- [ ] Jobs ophalen werkt
- [ ] Jobs zoeken werkt
- [ ] Jobs toevoegen werkt (paidUser only)
- [ ] User info endpoint werkt
- [ ] Frontend kan API aanroepen
- [ ] Error handling werkt
- [ ] Logging werkt
- [ ] Rate limiting werkt

---

### ✅ GDPR

- [ ] Privacy policy aanwezig
- [ ] Privacy policy linked in footer
- [ ] User data export werkt
- [ ] Account deletion werkt
- [ ] Cookie consent (if using cookies)
- [ ] Data retention policy defined
- [ ] Contact email voor privacy vragen

---

### ✅ Deployment

- [ ] Backend deployed op Railway
- [ ] Frontend environment variables updated
- [ ] Frontend deployed
- [ ] Health check werkt
- [ ] Logs accessible
- [ ] Database backups enabled
- [ ] CORS configured voor production domain

---

### ✅ Testing

- [ ] Authentication getest
- [ ] Authorization getest
- [ ] Rate limiting getest
- [ ] RLS policies getest
- [ ] Frontend integration getest
- [ ] Production API getest
- [ ] Error scenarios getest

---

## 📊 EXECUTION ORDER SUMMARY

### Phase 1: Database (30 min)
1. Run SQL scripts in Supabase SQL Editor
2. Create `user_roles` table
3. Create `feature_usage` table
4. Enable RLS on tables
5. Create RLS policies
6. Create helper functions
7. Make yourself admin
8. Verify database setup

---

### Phase 2: Backend Setup (1 hour)
1. Install .NET 8 SDK
2. Create .NET Web API project
3. Install NuGet packages
4. Configure `appsettings.json`
5. Create `.env` file
6. Update `.gitignore`

---

### Phase 3: Backend Implementation (3-4 hours)
1. Create Models (User, Job)
2. Create DTOs (Requests, Responses)
3. Create ISupabaseService interface
4. Implement SupabaseService
5. Configure JWT authentication
6. Create RoleEnrichmentMiddleware
7. Create AuthController
8. Create JobsController
9. Create UserController (GDPR)
10. Configure CORS

---

### Phase 4: Frontend Integration (1-2 hours)
1. Create `apiClient.ts`
2. Create `useAuthorization` hook
3. Update existing components to use API
4. Add `.env.local` with API URL
5. Test integration locally

---

### Phase 5: Testing (1 hour)
1. Test backend endpoints with Swagger
2. Test authentication
3. Test authorization
4. Test rate limiting
5. Test RLS policies
6. Test frontend integration
7. Fix any bugs

---

### Phase 6: Deployment (1 hour)
1. Create Dockerfile
2. Setup Railway project
3. Configure environment variables
4. Deploy backend to Railway
5. Update frontend API URL
6. Deploy frontend
7. Test production

---

### Phase 7: GDPR (1-2 hours)
1. Create privacy policy page
2. Implement data export endpoint
3. Implement account deletion endpoint
4. Add settings page to frontend
5. Test GDPR features

---

### Phase 8: Final Checks (30 min)
1. Verify all checklist items
2. Test production thoroughly
3. Setup monitoring
4. Document any issues
5. Celebrate! 🎉

---

## 🎯 ESTIMATED TOTAL TIME

- **Experienced developer**: 8-10 hours
- **Learning while building**: 15-20 hours

**Recommendation**: Spread over 2-3 days, work in phases.

---

## 🚨 COMMON PITFALLS TO AVOID

### 1. JWT Secret Mismatch
**Problem**: 401 Unauthorized errors  
**Solution**: Ensure JWT secret in backend matches Supabase JWT secret exactly

### 2. CORS Issues
**Problem**: Frontend can't reach backend  
**Solution**: Add frontend domain to CORS allowed origins

### 3. RLS Policies Too Restrictive
**Problem**: Can't fetch data even with valid token  
**Solution**: Test RLS policies in Supabase SQL Editor first

### 4. Missing Role Claims
**Problem**: Authorization always fails  
**Solution**: Ensure RoleEnrichmentMiddleware is registered

### 5. Rate Limiting Not Working
**Problem**: Free users can bypass limits  
**Solution**: Verify `feature_usage` table inserts are happening

---

## 📚 ADDITIONAL RESOURCES

### Documentation:
- [.NET 8 Documentation](https://learn.microsoft.com/en-us/dotnet/)
- [Supabase C# Client](https://supabase.com/docs/reference/csharp/introduction)
- [Railway Docs](https://docs.railway.app/)
- [GDPR Guidelines](https://gdpr.eu/)

### Tools:
- [Postman](https://www.postman.com/) - API testing
- [Swagger UI](https://swagger.io/tools/swagger-ui/) - API documentation
- [Railway CLI](https://docs.railway.app/develop/cli) - Deployment

---

## 🎉 SUCCESS CRITERIA

Your implementation is successful when:

✅ Users can login and get correct role  
✅ Free users hit rate limits  
✅ Paid users have unlimited access  
✅ Admins can access everything  
✅ RLS prevents unauthorized data access  
✅ Frontend works seamlessly with backend  
✅ Production deployment is stable  
✅ GDPR compliance features work  

---

## 📞 SUPPORT

If you run into issues:

1. Check Railway logs: `railway logs`
2. Check Supabase logs in dashboard
3. Test endpoints with Swagger UI
4. Verify environment variables
5. Check CORS configuration

---

**Good luck with the implementation! 🚀**

*This plan is comprehensive and battle-tested. Follow it step by step and you'll have a secure, scalable backend in no time.*

