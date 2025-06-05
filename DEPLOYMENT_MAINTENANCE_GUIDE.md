# Deployment & Maintenance Guide

## 🚀 Deployment Process

### Pre-Deployment Checklist

#### ✅ Code Quality Verification
```bash
# 1. Build verification
npm run build

# 2. Type checking
npx tsc --noEmit

# 3. Linting (if configured)
npm run lint

# 4. Bundle size check
du -sh dist/
```

#### ✅ Functionality Testing
- [ ] **Exclusive Selection**: Only one product marked as contract
- [ ] **Data Preservation**: All product data retained after updates
- [ ] **Manual Close**: Widget closes properly with cleanup
- [ ] **Error Handling**: Graceful error recovery and user feedback
- [ ] **API Communication**: Successful Zoho CRM API integration

#### ✅ Browser Compatibility
- [ ] **Chrome**: Latest version
- [ ] **Firefox**: Latest version  
- [ ] **Safari**: Latest version
- [ ] **Edge**: Latest version

### Deployment Steps

#### Step 1: Build Production Assets
```bash
cd pm_request_contract
npm install
npm run build
```

**Expected Output**:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── vite.svg
```

#### Step 2: Prepare Zoho CRM Integration

**Create Widget Configuration**:
```javascript
// Zoho CRM Widget Configuration
{
  "name": "PM Request Contract",
  "description": "Manage contract products for deal records",
  "type": "embedded_app",
  "permissions": [
    "CRM.modules.deals.READ",
    "CRM.modules.deals.UPDATE",
    "CRM.modules.products.READ"
  ],
  "entry_point": "index.html",
  "width": "800px",
  "height": "600px"
}
```

#### Step 3: Upload to Zoho CRM

1. **Access Zoho CRM Setup**:
   - Navigate to Setup → Developer Space → Extensions
   - Create new extension or update existing

2. **Upload Files**:
   - Upload all files from `dist/` folder
   - Maintain folder structure
   - Ensure `index.html` is the entry point

3. **Configure Permissions**:
   - Enable Deal module read/write access
   - Enable Product module read access
   - Configure API rate limits if needed

4. **Set Widget Placement**:
   - Add widget to Deal detail page
   - Configure visibility rules (optional)
   - Set user/role permissions

#### Step 4: Client Script Integration (Optional)

**For enhanced widget communication**:
```javascript
// Client Script to handle widget close events
$Client.onWidgetClose = function(data) {
  if (data.exit === true) {
    console.log('Contract Product widget closed');
    // Refresh deal record or perform other actions
    location.reload();
  }
};
```

## 🔧 Maintenance Procedures

### Regular Monitoring

#### ✅ Weekly Checks
- **API Performance**: Monitor response times and error rates
- **User Feedback**: Check for reported issues or feature requests
- **Browser Console**: Review any JavaScript errors in production

#### ✅ Monthly Reviews
- **Zoho CRM Updates**: Verify compatibility with CRM updates
- **Security Patches**: Update dependencies if security issues found
- **Performance Metrics**: Analyze widget usage and performance data

#### ✅ Quarterly Updates
- **Dependency Updates**: Update React, TypeScript, and Vite versions
- **Feature Enhancements**: Implement user-requested improvements
- **Code Refactoring**: Optimize performance and maintainability

### Common Issues & Solutions

#### Issue 1: Widget Not Loading
**Symptoms**: Blank widget or initialization errors

**Diagnosis**:
```javascript
// Check browser console for errors
console.log('ZOHO SDK Available:', !!window.ZOHO);
console.log('PageLoad Data:', data);
```

**Solutions**:
1. Verify Zoho SDK is loaded before widget initialization
2. Check network connectivity and CORS policies
3. Validate PageLoad data structure
4. Review widget permissions in Zoho CRM

#### Issue 2: API Update Failures
**Symptoms**: Contract status not updating in Zoho CRM

**Diagnosis**:
```javascript
// Enhanced API error logging
try {
  const response = await updateProductContractStatus(/*...*/);
  console.log('API Success:', response);
} catch (error) {
  console.error('API Error Details:', {
    message: error.message,
    stack: error.stack,
    dealId: dealId,
    productIndex: productIndex
  });
}
```

**Solutions**:
1. Check API permissions and rate limits
2. Verify deal ID and product data validity
3. Review subform field mapping
4. Test with minimal data payload

#### Issue 3: Data Loss in Subform
**Symptoms**: Products disappearing after contract updates

**Root Cause**: Not sending complete product list in API update

**Solution**:
```typescript
// Ensure ALL products are included
const apiConfig = {
  Entity: "Deals",
  APIData: {
    id: dealId,
    Subform_1: updatedProducts // Must include ALL products
  },
  Trigger: ["workflow"]
};
```

#### Issue 4: Widget Not Closing Properly
**Symptoms**: Widget remains open after manual close

**Diagnosis**:
```javascript
// Test close methods
try {
  window.$Client.close({exit: true});
  console.log('$Client.close() successful');
} catch (error) {
  console.error('$Client.close() failed:', error);
  // Try fallback
  window.ZOHO?.CRM?.UI?.Popup?.close();
}
```

**Solutions**:
1. Verify `$Client` API availability
2. Implement fallback close methods
3. Check client script configuration
4. Review widget permissions

### Performance Optimization

#### Bundle Size Optimization
```bash
# Analyze bundle size
npx vite-bundle-analyzer dist/

# Optimize images and assets
# Minimize CSS and JavaScript
# Remove unused dependencies
```

#### API Performance
```typescript
// Implement request caching where appropriate
const cache = new Map();

async function getCachedDealData(dealId: string) {
  if (cache.has(dealId)) {
    return cache.get(dealId);
  }
  
  const data = await fetchDealData(dealId);
  cache.set(dealId, data);
  return data;
}
```

#### Memory Management
```typescript
// Proper cleanup in useEffect
useEffect(() => {
  const controller = new AbortController();
  
  // API calls with abort signal
  fetchData({ signal: controller.signal });
  
  return () => {
    controller.abort(); // Cancel pending requests
  };
}, []);
```

### Security Considerations

#### ✅ Input Validation
```typescript
// Validate all user inputs
function validateDealId(dealId: string): boolean {
  return typeof dealId === 'string' && dealId.length > 0;
}

function validateProductIndex(index: number, maxLength: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < maxLength;
}
```

#### ✅ API Security
```typescript
// Sanitize API payloads
function sanitizeProductData(product: ZohoProductSubform): ZohoProductSubform {
  return {
    ...product,
    // Remove any potentially harmful fields
    // Validate data types and ranges
  };
}
```

#### ✅ Error Information
```typescript
// Don't expose sensitive information in error messages
function getSafeErrorMessage(error: Error): string {
  if (error.message.includes('unauthorized')) {
    return 'Permission denied. Please contact administrator.';
  }
  return 'An error occurred. Please try again.';
}
```

### Backup & Recovery

#### Configuration Backup
```bash
# Backup widget configuration
cp -r dist/ backup/$(date +%Y%m%d)/

# Export Zoho CRM widget settings
# Document API permissions and configurations
```

#### Rollback Procedure
1. **Immediate**: Revert to previous widget version in Zoho CRM
2. **Code Level**: Restore from Git repository
3. **Configuration**: Restore saved widget settings
4. **Testing**: Verify functionality after rollback

### Monitoring & Alerts

#### Error Monitoring
```javascript
// Implement error tracking
window.addEventListener('error', (event) => {
  console.error('Widget Error:', {
    message: event.error.message,
    stack: event.error.stack,
    filename: event.filename,
    lineno: event.lineno
  });
  
  // Send to monitoring service if available
});
```

#### Performance Monitoring
```javascript
// Track widget performance
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'measure') {
      console.log(`${entry.name}: ${entry.duration}ms`);
    }
  }
});

performanceObserver.observe({ entryTypes: ['measure'] });
```

### Documentation Updates

#### Keep Updated:
- [ ] **API Changes**: Document any Zoho CRM API updates
- [ ] **Feature Changes**: Update user guides for new functionality
- [ ] **Troubleshooting**: Add new issues and solutions
- [ ] **Performance**: Document optimization improvements

---

**This guide ensures reliable deployment and ongoing maintenance of the Contract Product widget with minimal downtime and optimal performance.**
