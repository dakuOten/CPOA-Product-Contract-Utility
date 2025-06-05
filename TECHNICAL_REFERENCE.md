# Technical Reference: Zoho CRM Contract Product Widget

## 🔧 API Reference

### Core Functions

#### `updateProductContractStatus()`
**Purpose**: Updates a product's contract status with exclusive selection logic

```typescript
async function updateProductContractStatus(
  dealId: string,              // Zoho Deal record ID
  productIndex: number,        // Index of product in subform array
  productData: ZohoProductSubform, // Selected product data
  allProducts: ZohoProductSubform[] // Complete product list
): Promise<ZohoUpdateResponse>
```

**Key Features**:
- ✅ Exclusive selection (only one contract product)
- ✅ Data preservation (sends all products)
- ✅ Comprehensive logging
- ✅ Error handling with user feedback

**Implementation Logic**:
```typescript
// Map through all products to implement exclusive selection
const updatedProducts = allProducts.map((product, index) => {
  if (index === productIndex) {
    return { ...product, Is_Contract: true };  // Target product
  } else {
    return { ...product, Is_Contract: false }; // Clear others
  }
});
```

#### `clearAllContractSelections()`
**Purpose**: Resets all contract selections to false

```typescript
async function clearAllContractSelections(
  dealId: string,
  allProducts: ZohoProductSubform[]
): Promise<ZohoUpdateResponse>
```

**Use Cases**:
- Manual widget close with cleanup
- Reset functionality
- Error recovery

#### `closeWidget()`
**Purpose**: Closes widget with client script communication

```typescript
function closeWidget(message?: string): void
```

**Communication Flow**:
1. **Primary**: `window.$Client.close({exit: true})` - Notifies client scripts
2. **Fallback**: `window.ZOHO.CRM.UI.Popup.close()` - Standard closure

## 🏗️ Component Architecture

### `ContractProduct.tsx` - Main Component

**State Management**:
```typescript
const [isUpdating, setIsUpdating] = useState(false);      // Loading state
const [updateError, setUpdateError] = useState<string | null>(null); // Error state
const [lastUpdatedProduct, setLastUpdatedProduct] = useState<string | null>(null); // Success tracking
```

**Event Handlers**:

1. **Product Selection**:
```typescript
const handleProductSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
  // Extract form data
  const formData = new FormData(event.currentTarget.form!);
  const selectedProductIndex = formData.get('selectedProduct');
  const dealId = formData.get('dealId');
  
  // Update via API
  await updateProductContractStatus(dealId, productIndex, selectedProduct, products);
};
```

2. **Manual Close & Clear**:
```typescript
const handleCloseAndClear = async () => {
  // Clear all selections
  await clearAllContractSelections(dealData.id, products);
  
  // Close widget
  closeWidget('Contract selections cleared - closing widget');
};
```

3. **Lifecycle Cleanup**:
```typescript
useEffect(() => {
  const handleBeforeUnload = () => handleWidgetClose();
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    handleWidgetClose();
  };
}, [products, dealData.id]);
```

### UI Components Structure

```jsx
<ContractProduct>
  <form>
    <input type="hidden" name="dealId" value={dealData.id} />
    
    {products.map((product, index) => (
      <ProductRow key={product.Products.id}>
        <RadioButton 
          name="selectedProduct"
          value={index}
          checked={product.Is_Contract}
          onChange={handleProductSelection}
        />
        <ProductDetails product={product} />
        <StatusBadges product={product} />
      </ProductRow>
    ))}
  </form>
  
  <CloseAndClearButton onClick={handleCloseAndClear} />
</ContractProduct>
```

## 📊 Data Flow

### 1. Widget Initialization
```
Zoho CRM → PageLoad Event → Widget Receives Deal Data → Render UI
```

### 2. Product Selection
```
User Clicks Radio → Extract Form Data → API Call → Update Zoho → UI Refresh
```

### 3. Manual Close
```
User Clicks Close → Clear All Selections → API Call → Close Widget → Notify Client
```

## 🔒 Type System

### Core Interfaces

```typescript
// Main page load data structure
interface ZohoPageLoadData {
  data: ZohoDealData;
}

// Deal record structure
interface ZohoDealData {
  id: string;
  Deal_Name: string;
  Account_Name: ZohoAccount;
  Stage: string;
  Subform_1: ZohoProductSubform[]; // Products array
}

// Individual product in subform
interface ZohoProductSubform {
  Is_Contract: boolean;           // Contract flag (our target field)
  Main_Product: boolean;          // Zoho system field
  Products: ZohoProduct;          // Product reference
  Quantity: string;               // Quantity ordered
  Terms: string;                  // Contract terms
  Pricing: string;                // Unit price
  Total_Pricing: string;          // Total line price
  Product_Type2: string;          // Product category
}

// Product reference data
interface ZohoProduct {
  name: string;                   // Product display name
  id: string;                     // Zoho Product ID
}

// API response structure
interface ZohoUpdateResponse {
  data: Array<{
    code: string;                 // Success/Error code
    details: {
      Modified_Time: string;
      Modified_By: ZohoUser;
      id: string;
    };
    message: string;              // Response message
    status: string;               // Success/Error status
  }>;
}
```

### Global Type Extensions

```typescript
declare global {
  interface Window {
    ZOHO: {
      embeddedApp: {
        on: (event: string, callback: (data: ZohoPageLoadData) => void) => void;
        init: () => void;
      };
      CRM: {
        UI: {
          Resize: (dimensions: { height: string; width: string }) => Promise<void>;
          Popup?: {
            close: () => void;
          };
        };
        API: {
          updateRecord: (config: any) => Promise<ZohoUpdateResponse>;
          getRecord: (config: any) => Promise<ZohoApiResponse>;
        };
      };
    };
    $Client: {
      close: (options: { exit: boolean }) => void;
    };
  }
}
```

## 🛠️ Configuration

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false
  }
});
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "verbatimModuleSyntax": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

## 🔍 Error Handling Strategy

### API Error Handling
```typescript
try {
  const response = await updateProductContractStatus(/*...*/);
  // Success handling
  showNotification('Success message', 'success');
} catch (error) {
  // Error handling
  setUpdateError(`Failed to update: ${error.message}`);
  showNotification('Error message', 'error');
} finally {
  // Cleanup
  setIsUpdating(false);
}
```

### Validation Checks
```typescript
// SDK availability
if (!window.ZOHO?.CRM?.API) {
  throw new Error('Zoho CRM API not available');
}

// Data validation
if (!data?.data) {
  console.error('Invalid PageLoad data received:', data);
  return;
}

// Form data validation
if (selectedProductIndex !== null && dealId) {
  // Proceed with update
}
```

## 📈 Performance Considerations

### Optimization Strategies

1. **Efficient Re-renders**:
   - Use `useState` for minimal state updates
   - Implement proper `key` props for list items
   - Avoid unnecessary component re-creation

2. **API Efficiency**:
   - Batch operations when possible
   - Include all required data in single calls
   - Implement proper error recovery

3. **Memory Management**:
   - Clean up event listeners in `useEffect`
   - Avoid memory leaks in async operations
   - Proper component unmounting

### Bundle Size Optimization
```json
// package.json - Keep dependencies minimal
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}
```

## 🧪 Testing Considerations

### Test Scenarios

1. **Exclusive Selection**:
   - Select product A → Verify only A is marked as contract
   - Select product B → Verify A is unmarked, only B is marked

2. **Data Preservation**:
   - Update contract status → Verify all other product data unchanged
   - Clear all selections → Verify product data intact

3. **Error Handling**:
   - Network failures → Verify error messages displayed
   - Invalid data → Verify graceful degradation

4. **Widget Lifecycle**:
   - Normal close → Verify cleanup executed
   - Manual close → Verify selections cleared

### Mock Implementation for Testing
```typescript
// Mock Zoho SDK for testing
const mockZohoSDK = {
  CRM: {
    API: {
      updateRecord: jest.fn().mockResolvedValue(mockResponse),
      getRecord: jest.fn().mockResolvedValue(mockDealData)
    },
    UI: {
      Resize: jest.fn().mockResolvedValue(undefined)
    }
  },
  embeddedApp: {
    on: jest.fn(),
    init: jest.fn()
  }
};

Object.defineProperty(window, 'ZOHO', {
  value: mockZohoSDK,
  writable: true
});
```

---

**This technical reference provides the complete implementation details for maintaining and extending the Contract Product widget functionality.**
