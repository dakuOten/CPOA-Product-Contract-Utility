# 🚀 Deployment Checklist - Contract Product Widget

Use this checklist to ensure proper deployment of the Contract Product widget to production.

## Pre-Deployment Verification

### ✅ Code Quality

- [ ] All TypeScript errors resolved
- [ ] ESLint passes without warnings
- [ ] No console errors in development mode
- [ ] All TODO comments addressed or documented
- [ ] Code review completed (if applicable)

### ✅ Testing Complete

- [ ] **Local Testing**
  - [ ] Widget loads without errors
  - [ ] Product selection works correctly
  - [ ] API updates successful
  - [ ] Error handling tested
  - [ ] Loading states work properly

- [ ] **Zoho Integration Testing**
  - [ ] PageLoad event receives data correctly
  - [ ] Deal data displays properly
  - [ ] Contract status updates in Zoho CRM
  - [ ] Workflows trigger automatically
  - [ ] No API permission errors

- [ ] **Browser Compatibility**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)
  - [ ] Mobile responsiveness verified

### ✅ Performance

- [ ] Bundle size acceptable (< 1MB)
- [ ] Initial load time < 3 seconds
- [ ] API response time < 2 seconds
- [ ] No memory leaks detected
- [ ] Network requests optimized

## Build Process

### ✅ Production Build

```bash
# 1. Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# 2. Run linting
npm run lint

# 3. Build for production
npm run build

# 4. Test production build locally
npm run preview
```

- [ ] Build completes without errors
- [ ] Preview works correctly
- [ ] All assets load properly
- [ ] No console errors in production build

### ✅ Build Verification

- [ ] `dist` folder created successfully
- [ ] HTML file includes Zoho SDK script
- [ ] CSS and JS files minified
- [ ] Source maps available (if needed)
- [ ] Asset file sizes reasonable

## Deployment Configuration

### ✅ Hosting Setup

**Static Hosting (Vercel/Netlify/GitHub Pages):**
- [ ] Domain configured correctly
- [ ] HTTPS enabled and working
- [ ] Build settings configured
- [ ] Environment variables set (if any)
- [ ] Custom headers configured (CORS, Security)

**Custom Server:**
- [ ] Server configured to serve static files
- [ ] HTTPS certificate installed
- [ ] Security headers configured
- [ ] Compression enabled (gzip)
- [ ] Caching headers set appropriately

### ✅ Security Configuration

- [ ] HTTPS enforced (no HTTP allowed)
- [ ] Proper CORS headers configured
- [ ] Security headers implemented:
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-Frame-Options: DENY
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Referrer-Policy: strict-origin-when-cross-origin

## Zoho CRM Configuration

### ✅ EmbeddedApp Setup

- [ ] **App Creation**
  - [ ] EmbeddedApp created in Zoho Developer Console
  - [ ] App name and description set correctly
  - [ ] Hosting URL updated to production domain
  - [ ] App icon uploaded (if applicable)

- [ ] **Permissions Configuration**
  - [ ] CRM.modules.deals.READ enabled
  - [ ] CRM.modules.deals.UPDATE enabled  
  - [ ] CRM.workflows.TRIGGER enabled (if using workflows)
  - [ ] Minimum required permissions only

- [ ] **Display Configuration**
  - [ ] Display location set to Deal records
  - [ ] Widget dimensions configured appropriately
  - [ ] Display conditions set (if applicable)

### ✅ Installation & Publishing

- [ ] EmbeddedApp installed in Zoho CRM
- [ ] Test installation works correctly
- [ ] App published to target users/roles
- [ ] User permissions verified
- [ ] Installation instructions provided to users

## Post-Deployment Verification

### ✅ Production Testing

- [ ] **Initial Load Test**
  - [ ] Widget loads in Zoho CRM environment
  - [ ] No console errors in production
  - [ ] All styling applied correctly
  - [ ] PageLoad event receives data

- [ ] **Functionality Test**
  - [ ] Product list displays correctly
  - [ ] Product selection works
  - [ ] API updates succeed
  - [ ] Success/error messages display
  - [ ] Workflows trigger (if configured)

- [ ] **User Acceptance Test**
  - [ ] Test with actual users
  - [ ] Verify user experience
  - [ ] Collect initial feedback
  - [ ] Document any issues found

### ✅ Monitoring Setup

- [ ] **Error Tracking**
  - [ ] Browser console error monitoring
  - [ ] API failure rate tracking
  - [ ] User feedback collection system

- [ ] **Performance Monitoring**
  - [ ] Page load time tracking
  - [ ] API response time monitoring
  - [ ] Resource usage monitoring

- [ ] **Usage Analytics** (Optional)
  - [ ] User interaction tracking
  - [ ] Feature usage statistics
  - [ ] Performance metrics dashboard

## Documentation & Communication

### ✅ Documentation Updates

- [ ] README.md updated with production URLs
- [ ] Deployment instructions documented
- [ ] API documentation current
- [ ] Troubleshooting guide updated
- [ ] Version changelog maintained

### ✅ Team Communication

- [ ] **Stakeholder Notification**
  - [ ] Deployment announcement sent
  - [ ] Feature documentation shared
  - [ ] Training materials provided (if needed)
  - [ ] Support contact information shared

- [ ] **Technical Team Update**
  - [ ] Deployment notes documented
  - [ ] Monitoring alerts configured
  - [ ] Rollback procedure documented
  - [ ] Support procedures updated

## Rollback Plan

### ✅ Rollback Preparation

- [ ] **Previous Version Backup**
  - [ ] Previous working version tagged in Git
  - [ ] Previous build artifacts archived
  - [ ] Database backup (if applicable)
  - [ ] Configuration backup saved

- [ ] **Rollback Procedure**
  - [ ] Rollback steps documented
  - [ ] Rollback tested in staging
  - [ ] Emergency contact list prepared
  - [ ] Communication plan for rollback

### ✅ Emergency Procedures

- [ ] **Issue Response Plan**
  - [ ] Critical issue escalation path
  - [ ] Emergency contact information
  - [ ] Quick fix deployment process
  - [ ] User communication template

## Final Sign-off

### ✅ Deployment Approval

- [ ] **Technical Lead Approval**
  - [ ] Code review completed
  - [ ] Technical testing verified
  - [ ] Performance requirements met
  - [ ] Security requirements satisfied

- [ ] **Business Stakeholder Approval**
  - [ ] Feature requirements met
  - [ ] User acceptance criteria satisfied
  - [ ] Business logic verified
  - [ ] Deployment timing approved

### ✅ Go-Live Confirmation

- [ ] **Production Deployment**
  - [ ] Production build deployed successfully
  - [ ] Zoho CRM configuration updated
  - [ ] DNS changes propagated (if applicable)
  - [ ] SSL certificates active

- [ ] **Final Verification**
  - [ ] End-to-end functionality verified
  - [ ] User access confirmed
  - [ ] Monitoring systems active
  - [ ] Support team notified and ready

---

## Deployment Commands Summary

```bash
# Pre-deployment verification
npm run lint
npm run build
npm run preview

# Production deployment (example for Vercel)
vercel --prod

# Post-deployment verification
curl -I https://your-production-domain.com
# Should return HTTP 200 with proper headers
```

## Emergency Contacts

- **Technical Lead:** [Name] - [Email] - [Phone]
- **DevOps Engineer:** [Name] - [Email] - [Phone]
- **Business Owner:** [Name] - [Email] - [Phone]
- **Zoho Admin:** [Name] - [Email] - [Phone]

---

**✅ Deployment Date:** ________________  
**✅ Deployed By:** ____________________  
**✅ Version:** _______________________  
**✅ Production URL:** _________________  

**All items checked and verified for production deployment.**
