# AllGigs Frontend (DotNet Backend)

**Frontend repository voor AllGigs applicatie - gekoppeld aan .NET backend**

---

## 🔗 Repository Links

### **Frontend (Dit Repository)**
- **GitHub:** https://github.com/dev-ardey/allgigs-dotnet-frontend
- **Deployment:** Vercel (allgigs.ai)
- **Tech Stack:** Next.js 13, React, TypeScript, Tailwind CSS

### **Backend (Gekoppeld)**
- **GitHub:** https://github.com/allGigs/allgigs-dotnet-backend
- **Deployment:** Railway
- **Tech Stack:** ASP.NET Core, C#, Supabase

---

## 📋 Project Structure

```
Freelance_jobboard/
├── components/          # React components
│   └── ui/             # UI components (LeadCard, LeadsPipeline, etc.)
├── pages/              # Next.js pages
│   ├── dashboard.tsx   # Main dashboard
│   ├── leadSearch.tsx  # Job search page
│   ├── boards.tsx      # Job boards page
│   └── Profile.tsx     # User profile
├── lib/                # Utilities
│   └── apiClient.ts    # Backend API client
├── styles/             # Global styles
└── SupabaseClient.ts   # Supabase client config
```

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- npm of yarn
- Access to Supabase project
- Backend API running (Railway)

### **Installation**

```bash
# Clone repository
git clone https://github.com/dev-ardey/allgigs-dotnet-frontend.git
cd allgigs-dotnet-frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
```

### **Environment Variables**

Create `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API (Railway)
NEXT_PUBLIC_API_BASE_URL=https://allgigs-v3-backend-production.up.railway.app
```

### **Development**

```bash
# Start dev server
npm run dev

# Open http://localhost:3000
```

### **Build**

```bash
# Production build
npm run build

# Start production server
npm start
```

---

## 🔌 Backend Integration

### **API Endpoints**

Alle API calls gaan via `lib/apiClient.ts` naar de backend:

- **Base URL:** `NEXT_PUBLIC_API_BASE_URL`
- **Authentication:** JWT tokens via Supabase session
- **CORS:** Configured in backend (`Program.cs`)

### **Key Endpoints:**
- `/api/applying` - Application records
- `/api/jobclicks` - Job click tracking
- `/api/jobs` - Job listings
- `/api/automationdetails` - Company automation details
- `/api/UserRole/me` - User role check

---

## 📦 Deployment

### **Vercel Deployment**

1. **Connect Repository:**
   - Vercel Dashboard → Add New Project
   - Import: `dev-ardey/allgigs-dotnet-frontend`

2. **Configure Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_BASE_URL`

3. **Add Custom Domain:**
   - Settings → Domains → Add `allgigs.ai`

4. **Deploy:**
   - Automatic on push to `main` branch
   - Manual deploy via Vercel dashboard

### **Production URL:**
- **Live:** https://allgigs.ai
- **Vercel Preview:** https://allgigs-dotnet-frontend.vercel.app

---

## 🏗️ Architecture

### **Frontend → Backend → Supabase**

```
User Browser
    ↓
Next.js Frontend (Vercel)
    ↓
Backend API (Railway) - ASP.NET Core
    ↓
Supabase Database
```

**No direct Supabase calls from frontend** (security best practice)

---

## 📝 Key Features

- ✅ **Dashboard** - Job pipeline management
- ✅ **Lead Search** - Job search & filtering
- ✅ **Job Boards** - Company automation details
- ✅ **Profile** - User settings & preferences
- ✅ **Authentication** - Supabase Auth + JWT
- ✅ **Real-time Updates** - Optimistic UI (planned)

---

## 🔧 Development Notes

### **Current Branch:**
- **Main:** `authorisation` (production-ready)
- **Development:** Various feature branches

### **Important Files:**
- `lib/apiClient.ts` - All backend API calls
- `components/ui/LeadsPipeline.tsx` - Main dashboard component
- `components/ui/LeadCard.tsx` - Individual lead card
- `SupabaseClient.ts` - Supabase configuration

### **Performance Optimizations (Planned):**
- Batch job fetching (80 calls → 1 call)
- Optimistic UI updates
- React.memo for LeadCard
- Parallel API calls
- Database indexing

See `IMPLEMENTATIE_PLAN_TOP_10.md` for details.

---

## 🐛 Troubleshooting

### **CORS Errors:**
- Check backend CORS config includes frontend domain
- Verify `NEXT_PUBLIC_API_BASE_URL` is correct

### **Authentication Issues:**
- Check Supabase redirect URLs include production domain
- Verify environment variables are set correctly

### **Build Errors:**
- Check all environment variables are set
- Verify Node.js version (18+)
- Clear `.next` cache: `rm -rf .next`

---

## 📚 Documentation

- **Backend API:** See backend repository README
- **Deployment Guide:** `VERCEL_DEPLOYMENT_ALLGIGS_AI.md`
- **Performance Analysis:** `PERFORMANCE_EN_RELOAD_ANALYSE.md`
- **Optimization Plan:** `IMPLEMENTATIE_PLAN_TOP_10.md`

---

## 👥 Contributing

1. Create feature branch from `authorisation`
2. Make changes
3. Test locally
4. Push to GitHub
5. Create Pull Request

---

## 📄 License

Private repository - All rights reserved

---

## 🔗 Related Repositories

- **Backend:** https://github.com/allGigs/allgigs-dotnet-backend
- **Old Frontend (MVP):** https://github.com/All-Gigs/allGigs_MVP_v1

---

**Last Updated:** November 2025  
**Maintained by:** dev-ardey  
**Status:** ✅ Production Ready
