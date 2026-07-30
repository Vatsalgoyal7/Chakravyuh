# Cloudflare Pages Migration Plan

## Overview
This document outlines the migration strategy for deploying the Chakravyuh sports event website from Vercel to Cloudflare Pages.

## Current Setup
- **Platform**: Vercel
- **Framework**: React + Vite
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Media**: Cloudinary (fallback)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Migration Steps

### 1. Prepare Cloudflare Account
- Create Cloudflare account (if not already exists)
- Add custom domain (if applicable)
- Configure DNS settings

### 2. Create Cloudflare Pages Project
- Go to Cloudflare Dashboard → Pages → Create a project
- Connect to GitHub repository
- Select build settings:
  - **Framework preset**: Vite
  - **Build command**: `npm run build`
  - **Build output directory**: `dist`
  - **Node.js version**: 18.x or latest

### 3. Environment Variables
Add the following environment variables in Cloudflare Pages:
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 4. Firebase Configuration
- No changes required - Firebase works with any hosting platform
- Ensure Firebase Auth domain whitelist includes Cloudflare domain
- Update Firebase Storage CORS rules if needed

### 5. Cloudinary Configuration
- No changes required - Cloudinary works with any hosting platform
- Ensure allowed origins include Cloudflare domain

### 6. Custom Domain (Optional)
- Add custom domain in Cloudflare Pages
- Configure SSL/TLS (Full mode recommended)
- Update DNS records

### 7. Testing Checklist
- [ ] Build succeeds on Cloudflare
- [ ] Environment variables are properly loaded
- [ ] Firebase authentication works
- [ ] Firestore operations work
- [ ] Firebase Storage uploads work
- [ ] Cloudinary uploads work (if used as fallback)
- [ ] Public registration flow works
- [ ] Admin portal works
- [ ] Payment verification system works
- [ ] Analytics dashboard loads correctly

### 8. DNS Transition (if using custom domain)
- Update DNS records to point to Cloudflare
- Wait for DNS propagation (up to 48 hours)
- Monitor for any issues

### 9. Vercel Cleanup
- Archive or delete Vercel project after successful migration
- Cancel Vercel subscription (if applicable)

## Benefits of Cloudflare Pages
- **Cost**: Free tier with unlimited bandwidth
- **Performance**: Global CDN with 300+ locations
- **Security**: Built-in DDoS protection and SSL
- **Build Time**: Faster builds compared to Vercel free tier
- **Edge Functions**: Support for edge computing (if needed in future)

## Potential Issues & Solutions

### Issue: Build fails due to Node.js version
**Solution**: Set Node.js version to 18.x in Cloudflare Pages settings

### Issue: Environment variables not loading
**Solution**: Ensure all variables are prefixed with `VITE_` for client-side access

### Issue: Firebase Auth domain whitelist
**Solution**: Add Cloudflare domain to Firebase Console → Authentication → Authorized domains

### Issue: CORS errors with Firebase Storage
**Solution**: Update Firebase Storage CORS rules to allow Cloudflare domain

## Rollback Plan
If issues arise during migration:
1. Switch DNS back to Vercel
2. Debug and fix issues
3. Retry migration

## Estimated Timeline
- **Preparation**: 30 minutes
- **Migration**: 1 hour
- **Testing**: 2 hours
- **DNS Transition**: 24-48 hours (if using custom domain)
- **Total**: 2-3 days (including DNS propagation)

## Post-Migration Tasks
- Monitor Cloudflare Analytics
- Set up Cloudflare Page Rules (if needed)
- Configure Cloudflare Workers (if needed for caching)
- Update documentation with new deployment process
