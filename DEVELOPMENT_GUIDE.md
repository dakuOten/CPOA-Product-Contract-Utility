# Development Guide - Contract Product Widget

This guide provides step-by-step instructions for developing, testing, and deploying the Contract Product widget for Zoho CRM.

## 🔧 Development Setup

### Environment Requirements

1. **Node.js 18+**
   ```bash
   # Check Node version
   node --version
   # Should return v18.0.0 or higher
   ```

2. **Package Manager**
   ```bash
   # Using npm (recommended)
   npm --version
   ```

3. **Development Tools**
   - VS Code with TypeScript extension
   - Git for version control
   - Chrome DevTools for debugging

### Initial Setup

1. **Install Dependencies**
   ```bash
   cd pm_request_contract
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   # Opens at http://localhost:5173
   ```

3. **Verify Installation**
   - Open browser to http://localhost:5173
   - Check console for any errors
   - Verify Tailwind CSS is loading (styles should be applied)

## 🏗️ Architecture Overview

### Core Components Flow

```
index.html (Zoho SDK)
    ↓
main.tsx (SDK Initialization)
    ↓
App.tsx (Data Reception)
    ↓
ContractProduct.tsx (Business Logic)
    ↓
zohoApi.ts (API Integration)
```

### Data Flow

1. **PageLoad Event** → Zoho sends deal data with product subforms
2. **Component Render** → Products displayed with selection interface
3. **User Interaction** → Radio button selection triggers FormData
4. **API Call** → Zoho CRM updateRecord API updates Is_Contract field
5. **UI Update** → Success/error feedback displayed to user
6. **Workflow Trigger** → Zoho workflows execute automatically

## 💻 Code Implementation Details

### 1. Zoho SDK Integration (src/main.tsx)

**Key Implementation Points:**
```typescript
// Critical: Subscribe to events BEFORE initialization
window.ZOHO.embeddedApp.on("PageLoad", function(data) {
  console.log('PageLoad data received:', data)
  setZohoData(data)
  setIsInitialized(true)
})

// Initialize after event subscription
window.ZOHO.embeddedApp.init()
```

**Common Pitfalls:**
- ❌ Calling `init()` before subscribing to events
- ❌ Not checking if ZOHO SDK is loaded
- ❌ Missing error handling for SDK loading

**Best Practices:**
- ✅ Check SDK availability with retry mechanism
- ✅ Subscribe to events before initialization
- ✅ Add proper error handling and logging

### 2. FormData Implementation (src/components/ContractProduct.tsx)

**React 19.1 FormData Pattern:**
```typescript
const handleProductSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const formData = new FormData(event.currentTarget.form!)
  const selectedProductIndex = formData.get('selectedProduct')
  const dealId = formData.get('dealId')
  
  // Immediate API call triggered
  if (selectedProductIndex !== null && dealId) {
    await updateProductContractStatus(/* parameters */)
  }
}
```

**Why FormData:**
- Immediate form submission on radio button change
- Clean data extraction pattern
- Follows React 19.1 best practices
- Better than useState for simple form interactions

### 3. API Integration (src/utils/zohoApi.ts)

**Critical API Structure:**
```typescript
const apiConfig = {
  Entity: "Deals",
  APIData: {
    id: dealId,
    Subform_1: [updatedProduct] // Only send the updated product
  },
  Trigger: ["workflow"] // Automatically trigger workflows
}
```

**Key Points:**
- Send only the updated product record, not entire array
- Include the `id` field for the deal record
- Maintain subform record ID for proper updates
- Use `Trigger: ["workflow"]` for automatic workflow execution

**Error Handling Pattern:**
```typescript
try {
  const response = await zohoApiCall(async () => {
    return new Promise((resolve, reject) => {
      window.ZOHO.CRM.API.updateRecord(apiConfig)
        .then(resolve)
        .catch(reject)
    })
  })
  
  // Handle success
} catch (error) {
  // Handle error
  console.error('API Error:', error)
  setUpdateError(`Failed to update: ${error.message}`)
}
```

### 4. TypeScript Integration (src/types/zoho.ts)

**Complete Type Coverage:**
```typescript
// Product subform structure
interface ZohoProductSubform {
  Is_Contract: boolean
  Main_Product: boolean
  Products: ZohoProduct
  Product_Type2: string
  Quantity: number
  Terms: string
  Pricing: number
  Total_Pricing: string
  Vendor: string | null
}

// Global ZOHO object typing
declare global {
  interface Window {
    ZOHO: {
      embeddedApp: {
        on: (event: string, callback: (data: ZohoPageLoadData) => void) => void
        init: () => void
      }
      CRM: {
        API: {
          updateRecord: (options: ZohoUpdateOptions) => Promise<ZohoUpdateResponse>
        }
      }
    }
  }
}
```

**Important Notes:**
- Use `@ts-expect-error` for Zoho global objects (not `@ts-ignore`)
- Ensure all data structures match actual Zoho API responses
- Add `id` field to deal data interface for API calls

## 🧪 Testing Procedures

### 1. Local Development Testing

**Setup Test Environment:**
```bash
# Start development server
npm run dev

# Test in different scenarios:
# 1. Deal with multiple products
# 2. Deal with single product
# 3. Deal with no products
# 4. Products already marked as contract
```

**Manual Test Cases:**
1. **Widget Loading**
   - Widget appears in Zoho CRM
   - No console errors on load
   - All products display correctly

2. **Product Selection**
   - Radio buttons work correctly
   - Only one product selectable at a time
   - Already-contracted products are disabled

3. **API Integration**
   - Selection triggers immediate API call
   - Loading state displays during update
   - Success/error feedback works
   - Zoho workflows trigger correctly

4. **Error Scenarios**
   - Network errors display proper messages
   - API errors are handled gracefully
   - Multiple rapid selections are handled

### 2. Zoho CRM Integration Testing

**Test Data Setup:**
```javascript
// Create test deal with products in Zoho CRM
{
  "Deal_Name": "Test Contract Deal",
  "Subform_1": [
    {
      "Products": { "name": "Test Product 1", "id": "123" },
      "Is_Contract": false,
      "Quantity": 1,
      "Pricing": 100.00,
      "Total_Pricing": "100.00"
    },
    {
      "Products": { "name": "Test Product 2", "id": "456" },
      "Is_Contract": true,
      "Quantity": 2,
      "Pricing": 50.00,
      "Total_Pricing": "100.00"
    }
  ]
}
```

**Verification Steps:**
1. Navigate to test deal in Zoho CRM
2. Verify widget loads with correct product data
3. Select non-contracted product
4. Verify `Is_Contract` field updates in Zoho
5. Confirm workflow execution (if configured)

### 3. Browser Compatibility

**Test Browsers:**
- Chrome (primary)
- Firefox
- Safari
- Edge

**Mobile Testing:**
- Chrome Mobile
- Safari Mobile
- Responsive design verification

## 🚀 Deployment Process

### 1. Build Process

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Build for production
npm run build

# Test production build locally
npm run preview
```

### 2. Pre-Deployment Checklist

- [ ] All TypeScript errors resolved
- [ ] ESLint passes without errors
- [ ] Manual testing completed
- [ ] API integration verified
- [ ] Error handling tested
- [ ] Performance acceptable (< 3s load time)
- [ ] Mobile responsiveness verified

### 3. Hosting Deployment

**Static Hosting (Recommended):**
```bash
# Build the project
npm run build

# Deploy dist folder to:
# - Vercel: vercel deploy
# - Netlify: netlify deploy --dir=dist
# - GitHub Pages: Push to gh-pages branch
```

**Custom Server:**
```bash
# Install serve globally
npm install -g serve

# Serve production build
serve -s dist -l 3000
```

### 4. Zoho CRM Configuration

**EmbeddedApp Setup:**
1. Go to Zoho CRM → Setup → Developer Hub → EmbeddedApps
2. Create new EmbeddedApp:
   - **Name:** Contract Product Manager
   - **Type:** EmbeddedApp
   - **Hosting:** External
   - **URL:** Your production domain
   - **Display Location:** Deal Records

3. Configure permissions:
   - CRM.modules.deals.READ
   - CRM.modules.deals.UPDATE
   - CRM.workflows.TRIGGER

4. Install and publish to users

## 🔍 Debugging Guide

### 1. Common Debug Scenarios

**Widget Not Loading:**
```javascript
// Check in browser console
console.log('ZOHO SDK available:', !!window.ZOHO)
console.log('EmbeddedApp available:', !!window.ZOHO?.embeddedApp)

// Check network tab for:
// - 404 errors on widget URL
// - CORS errors
// - SSL certificate issues
```

**PageLoad Event Not Firing:**
```javascript
// Add debug logging in main.tsx
window.ZOHO.embeddedApp.on("PageLoad", function(data) {
  console.log('PageLoad event received:', data)
  console.log('Data type:', typeof data)
  console.log('Data keys:', Object.keys(data))
})
```

**API Updates Failing:**
```javascript
// Add debug logging in zohoApi.ts
console.log('API Config:', JSON.stringify(apiConfig, null, 2))
console.log('API Response:', response)
console.log('Error Details:', error)
```

### 2. Debug Tools

**Browser DevTools:**
- Console: JavaScript errors and logging
- Network: API call monitoring
- Application: Local storage and session data
- Performance: Load time analysis

**Zoho CRM Debug:**
- CRM Developer Console for API testing
- Workflow execution logs
- EmbeddedApp installation status

### 3. Logging Strategy

**Production Logging:**
```typescript
const DEBUG_MODE = process.env.NODE_ENV === 'development'

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data)
  }
}
```

**Error Tracking:**
```typescript
function trackError(error: Error, context: string) {
  console.error(`[ERROR] ${context}:`, error)
  // Add error tracking service integration here
}
```

## 📈 Performance Optimization

### 1. Bundle Size Optimization

```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Optimize imports
# Use tree-shaking friendly imports
import { specific } from 'library'
// Instead of
import * as library from 'library'
```

### 2. Runtime Performance

**API Call Optimization:**
```typescript
// Debounce rapid selections
const debouncedUpdate = useMemo(
  () => debounce(updateProductContractStatus, 300),
  []
)
```

**Rendering Optimization:**
```typescript
// Memoize expensive calculations
const totalValue = useMemo(() => 
  products.reduce((sum, p) => sum + parseFloat(p.Total_Pricing.replace(/,/g, '')), 0),
  [products]
)
```

### 3. Network Optimization

- Enable gzip compression on hosting
- Use CDN for static assets
- Implement proper caching headers
- Minimize API calls with intelligent caching

## 🔐 Security Best Practices

### 1. Data Security

```typescript
// Never log sensitive data
console.log('Product data:', {
  ...product,
  sensitiveField: '[REDACTED]'
})

// Validate all inputs
function validateProductIndex(index: unknown): number {
  if (typeof index !== 'string' || !/^\d+$/.test(index)) {
    throw new Error('Invalid product index')
  }
  return parseInt(index)
}
```

### 2. API Security

- All API calls use Zoho's built-in authentication
- No API keys stored in client-side code
- Proper error handling without exposing internal details
- Input validation for all user interactions

### 3. Deployment Security

- HTTPS required for production
- Proper CORS configuration
- Security headers configured
- Regular dependency updates

## 📝 Maintenance Guidelines

### 1. Regular Updates

**Monthly Tasks:**
- Update dependencies: `npm update`
- Security audit: `npm audit`
- Performance review
- User feedback analysis

**Quarterly Tasks:**
- Zoho API compatibility check
- Browser compatibility testing
- Performance benchmarking
- Documentation updates

### 2. Monitoring

**Key Metrics:**
- Widget load time
- API success rate
- Error frequency
- User adoption

**Alerting:**
- Set up monitoring for API failures
- Track widget load errors
- Monitor performance degradation

### 3. Version Control

**Branching Strategy:**
```bash
# Feature development
git checkout -b feature/new-feature

# Bug fixes
git checkout -b hotfix/critical-bug

# Releases
git checkout -b release/v1.2.0
```

**Deployment Tags:**
```bash
# Tag releases
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

---

This development guide provides the technical foundation for building, testing, and maintaining the Contract Product widget. Follow these guidelines to ensure consistent, reliable, and secure development practices.
