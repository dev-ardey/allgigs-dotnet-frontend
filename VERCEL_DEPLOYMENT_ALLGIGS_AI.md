# 🚀 VERCEL DEPLOYMENT GUIDE - allgigs.ai
*Complete stappenplan voor nieuwe productie deployment*

---

## 📋 OVERZICHT

**Wat we doen:**
1. ✅ Nieuw Vercel project aanmaken
2. ✅ GitHub repository linken
3. ✅ Environment variabelen configureren
4. ✅ Custom domain (allgigs.ai) toevoegen
5. ✅ GoDaddy DNS configureren
6. ✅ SSL certificaat (automatisch via Vercel)

**Wat blijft hetzelfde:**
- ✅ Backend op Railway (geen wijzigingen nodig)
- ✅ Supabase database (geen wijzigingen nodig)
- ✅ GitHub code (geen wijzigingen nodig)

---

## 🔧 STAP 1: VERCEL PROJECT AANMAKEN

### **1.1: Ga naar Vercel Dashboard**
1. Open: https://vercel.com/dashboard
2. Login met je GitHub account
3. Klik op **"Add New..."** → **"Project"**

### **1.2: Import GitHub Repository**
1. Selecteer: **"Import Git Repository"**
2. Kies: **`allGigs/allGigs_MVP_v1`** (of `dev-ardey/allGigs-mvp-v2` - welke je gebruikt)
3. Klik **"Import"**

### **1.3: Configure Project Settings**

**Project Name:**
```
allgigs-ai
```

**Framework Preset:**
```
Next.js (automatisch gedetecteerd)
```

**Root Directory:**
```
./ (root)
```

**Build Command:**
```
npm run build
```

**Output Directory:**
```
.next (automatisch)
```

**Install Command:**
```
npm install
```

**⚠️ BELANGRIJK - Environment Variables:**
**Nog NIET invullen hier!** We doen dit in Stap 2.

### **1.4: Deploy**
1. Klik **"Deploy"**
2. Wacht ~2-3 minuten voor eerste build
3. Je krijgt een URL: `allgigs-ai-xxx.vercel.app`

**✅ Check:** Build moet slagen (kan nog errors hebben door missing env vars, dat is OK)

---

## 🔐 STAP 2: ENVIRONMENT VARIABELEN CONFIGUREREN

### **2.1: Ga naar Project Settings**
1. In Vercel dashboard → **"allgigs-ai"** project
2. Klik **"Settings"** tab
3. Klik **"Environment Variables"** in sidebar

### **2.2: Voeg Environment Variables Toe**

**Je hebt 3 variabelen nodig:**

#### **Variable 1: Supabase URL**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://lfwgzoltxrfutexrjahr.supabase.co
Environment: Production, Preview, Development
```

**Waar vind je dit?**
- Supabase Dashboard → Settings → API
- Of check je huidige `.env.local` (als je die hebt)

#### **Variable 2: Supabase Anon Key**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [jouw Supabase anon key]
Environment: Production, Preview, Development
```

**Waar vind je dit?**
- Supabase Dashboard → Settings → API → `anon` `public` key
- **⚠️ Dit is de PUBLIC key (veilig voor frontend)**

#### **Variable 3: Backend API URL**
```
Name: NEXT_PUBLIC_API_BASE_URL
Value: https://allgigs-v3-backend-production.up.railway.app
Environment: Production, Preview, Development
```

**Waar vind je dit?**
- Railway Dashboard → Je backend service → Settings → Domains
- Of check je huidige Railway URL

### **2.3: Save & Redeploy**
1. Klik **"Save"** voor elke variabele
2. Ga naar **"Deployments"** tab
3. Klik op **3 dots** → **"Redeploy"**
4. Selecteer **"Use existing Build Cache"** = OFF (om env vars te laden)
5. Klik **"Redeploy"**

**✅ Check:** Build moet nu slagen zonder errors

---

## 🌐 STAP 3: CUSTOM DOMAIN TOEVOEGEN (allgigs.ai)

### **3.1: Add Domain in Vercel**
1. In Vercel project → **"Settings"** → **"Domains"**
2. Klik **"Add Domain"**
3. Type: `allgigs.ai`
4. Klik **"Add"**

### **3.2: Vercel geeft je DNS Records**
Vercel toont nu:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**⚠️ Noteer deze!** Je hebt ze nodig voor GoDaddy.

---

## 🔗 STAP 4: GODADDY DNS CONFIGUREREN

### **4.1: Login GoDaddy**
1. Ga naar: https://www.godaddy.com
2. Login → **"My Products"** → **"DNS"**

### **4.2: Find allgigs.ai Domain**
1. Zoek **"allgigs.ai"** in je domain list
2. Klik op **"DNS"** of **"Manage DNS"**

### **4.3: Configure DNS Records**

**⚠️ BELANGRIJK:** Verwijder eerst oude records die conflicteren!

#### **Record 1: Root Domain (A Record)**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 600 (of 1 hour)
```

#### **Record 2: WWW Subdomain (CNAME)**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600 (of 1 hour)
```

**Of als Vercel een andere waarde geeft, gebruik die!**

### **4.4: Save & Wait**
1. Klik **"Save"** voor elke record
2. **Wacht 5-60 minuten** voor DNS propagation
3. Check status: https://dnschecker.org/#A/allgigs.ai

**✅ Check:** DNS moet naar Vercel IP's wijzen

---

## 🔒 STAP 5: SSL CERTIFICAAT (AUTOMATISCH)

### **5.1: Vercel Configureert Automatisch**
- Vercel detecteert je domain
- Request Let's Encrypt SSL certificaat
- **Dit duurt 1-5 minuten**

### **5.2: Check SSL Status**
1. In Vercel → **"Settings"** → **"Domains"**
2. Check **"allgigs.ai"** status
3. Moet zeggen: **"Valid Configuration"** + **"SSL Certificate Active"**

**✅ Check:** https://allgigs.ai moet werken (na DNS propagation)

---

## 🧪 STAP 6: TESTING

### **6.1: Test Domain**
1. Open: https://allgigs.ai
2. Check: Site laadt correct
3. Check: Login werkt
4. Check: Dashboard laadt

### **6.2: Test Environment Variables**
1. Open browser console
2. Check: Geen errors over missing env vars
3. Check: API calls gaan naar Railway backend
4. Check: Supabase auth werkt

### **6.3: Test All Features**
- ✅ Login/Logout
- ✅ Dashboard
- ✅ LeadSearch
- ✅ Boards
- ✅ Profile

---

## 📊 STAP 7: MONITORING

### **7.1: Vercel Analytics**
1. In Vercel → **"Analytics"** tab
2. Check: Page views, performance
3. Check: Error rates

### **7.2: Railway Backend Logs**
1. Railway Dashboard → Backend service → **"Logs"**
2. Check: Requests komen binnen van allgigs.ai
3. Check: Geen CORS errors

### **7.3: Supabase Logs**
1. Supabase Dashboard → **"Logs"**
2. Check: Auth requests van allgigs.ai
3. Check: Database queries werken

---

## ⚠️ BELANGRIJKE NOTITIES

### **CORS Configuration**
Je Railway backend moet `allgigs.ai` toestaan in CORS policy.

**File:** `/Users/.../allgigs-backend/AllGigs.Api/Program.cs` (line ~64)

**Huidige Production CORS policy:**
```csharp
var allowedOrigins = new[] 
{ 
    "https://allgigs.eu",
    "https://www.allgigs.eu",
    "https://allgigs.com",
    "https://www.allgigs.com",
    "https://allgigs.vercel.app",
    "https://allgigs-production.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
};
```

**Update naar:**
```csharp
var allowedOrigins = new[] 
{ 
    "https://allgigs.ai",           // ← TOEVOEGEN
    "https://www.allgigs.ai",       // ← TOEVOEGEN
    "https://allgigs.eu",
    "https://www.allgigs.eu",
    "https://allgigs.com",
    "https://www.allgigs.com",
    "https://allgigs.vercel.app",
    "https://allgigs-production.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
};
```

**Stappen:**
1. Update `Program.cs` met nieuwe origins
2. Commit & push naar backend repo
3. Railway deployt automatisch
4. Test: https://allgigs.ai → geen CORS errors

**Als dit niet werkt:**
- Backend moet opnieuw deployed worden met nieuwe CORS origins
- Check Railway logs voor CORS errors

---

### **Supabase Redirect URLs**
Supabase moet weten dat `allgigs.ai` een geldige redirect URL is.

**Check:**
1. Supabase Dashboard → **"Authentication"** → **"URL Configuration"**
2. **"Redirect URLs"** moet bevatten:
   ```
   https://allgigs.ai/**
   https://www.allgigs.ai/**
   ```

**Als dit niet werkt:**
- Login redirects falen
- Users kunnen niet inloggen

---

## 🔄 ROLLBACK PLAN

**Als iets fout gaat:**

### **Option 1: Disable Domain**
1. Vercel → Settings → Domains
2. Klik **"Remove"** naast allgigs.ai
3. Domain wordt niet meer gebruikt

### **Option 2: Revert DNS**
1. GoDaddy → DNS Management
2. Verwijder A en CNAME records
3. Domain wijst niet meer naar Vercel

### **Option 3: Switch Back to Old Domain**
1. Gebruik oude Vercel URL tijdelijk
2. Fix issues
3. Switch terug naar allgigs.ai

---

## ✅ CHECKLIST

**Voor deployment:**
- [ ] Vercel project aangemaakt
- [ ] GitHub repo gelinkt
- [ ] Environment variabelen geconfigureerd
- [ ] Build slaagt zonder errors
- [ ] Domain toegevoegd in Vercel
- [ ] DNS records geconfigureerd in GoDaddy
- [ ] DNS propagation compleet (check dnschecker.org)
- [ ] SSL certificaat actief
- [ ] https://allgigs.ai werkt
- [ ] Login werkt
- [ ] Dashboard werkt
- [ ] Backend CORS updated (als nodig)
- [ ] Supabase redirect URLs updated (als nodig)

---

## 🎯 VERWACHTE RESULTATEN

**Na completion:**
- ✅ https://allgigs.ai → Live site
- ✅ https://www.allgigs.ai → Redirect naar allgigs.ai
- ✅ SSL certificaat actief (groen slotje)
- ✅ Alle features werken
- ✅ Backend communicatie werkt
- ✅ Supabase auth werkt

**Performance:**
- ✅ Vercel Edge Network (global CDN)
- ✅ Automatic HTTPS
- ✅ Fast page loads

---

## 💡 TIPS

1. **DNS Propagation:** Kan 5-60 minuten duren. Wees geduldig.
2. **SSL Certificate:** Vercel doet dit automatisch, maar kan 1-5 min duren.
3. **Environment Variables:** Zorg dat je de juiste waarden hebt (check Supabase/Railway dashboards).
4. **CORS:** Als backend errors geeft, check CORS config in Railway backend.
5. **Testing:** Test altijd in incognito mode (fresh state).

---

## 🆘 TROUBLESHOOTING

### **Problem: Build fails**
**Solution:** Check environment variables zijn correct geconfigureerd

### **Problem: Domain not working**
**Solution:** 
- Check DNS propagation: https://dnschecker.org
- Wacht 30-60 minuten
- Check GoDaddy DNS records zijn correct

### **Problem: SSL not working**
**Solution:**
- Wacht 5-10 minuten (Vercel request certificaat)
- Check Vercel domain status
- Check DNS is correct

### **Problem: CORS errors**
**Solution:**
- Update Railway backend CORS config
- Add `https://allgigs.ai` to allowed origins
- Redeploy backend

### **Problem: Login doesn't work**
**Solution:**
- Check Supabase redirect URLs
- Add `https://allgigs.ai/**` to allowed URLs
- Check environment variables zijn correct

---

## 📞 NEXT STEPS

**Na succesvolle deployment:**
1. ✅ Test alle features
2. ✅ Monitor Vercel analytics
3. ✅ Check Railway backend logs
4. ✅ Update bookmarks/documentation
5. ✅ Share new URL met team/users

**Optional:**
- Setup custom email (info@allgigs.ai)
- Configure Vercel analytics
- Setup error tracking (Sentry)

---

## ✅ CONCLUSIE

**Wat je nu hebt:**
- ✅ Production-ready deployment op allgigs.ai
- ✅ SSL certificaat (automatisch)
- ✅ Global CDN (Vercel Edge)
- ✅ Fast performance
- ✅ Professional domain

**Backend blijft op Railway** (geen wijzigingen nodig, alleen CORS update als nodig).

**Database blijft op Supabase** (geen wijzigingen nodig, alleen redirect URLs update als nodig).

**Code blijft op GitHub** (geen wijzigingen nodig).

---

**Klaar om te beginnen?** Start met **Stap 1** (Vercel project aanmaken)!

