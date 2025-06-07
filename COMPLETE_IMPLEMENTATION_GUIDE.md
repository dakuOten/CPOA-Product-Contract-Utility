# Zoho CRM EmbeddedApp: Contract Product Implementation Guide

## 📋 Overview

This document provides a comprehensive step-by-step guide for the Zoho CRM EmbeddedApp "Contract Product" functionality that allows users to manage contract items within deal records.

## 🆕 Latest Update: Auto-Close Behavior

**NEW FEATURE**: When a user selects a product as a contract item, the widget now:
1. ✅ Updates the selected product's `Is_Contract` field to `true`
2. ✅ Sets all other products' `Is_Contract` fields to `false` (exclusive selection)
3. ✅ Shows a success notification
4. ✅ **Automatically closes the widget after 1.5 seconds**
5. ✅ Triggers `$Client.close()` to notify parent client scripts

*See `REFINED_IMPLEMENTATION_GUIDE.md` for detailed auto-close implementation.*

## 🎯 Project Goals

- **Primary**: Enable exclusive contract selection for products in Zoho CRM Deal records
- **Secondary**: Provide automatic widget close functionality with client script communication
- **Tertiary**: Implement data preservation and user-friendly interface

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Zoho CRM Interface                       │
├─────────────────────────────────────────────────────────────┤
│  🔹 Deal Record (Subform_1 field contains products)        │
│  🔹 Client Scripts (listen for widget close events)        │
└─────────────────────────────────────────────────────────────┘
                            ↕️
┌─────────────────────────────────────────────────────────────┐
│                React TypeScript Widget                      │
├─────────────────────────────────────────────────────────────┤
│  🔸 App.tsx (Main container)                               │
│  🔸 ContractProduct.tsx (Product selection UI)             │
│  🔸 zohoApi.ts (API communication layer)                   │
│  🔸 types/zoho.ts (TypeScript definitions)                 │
└─────────────────────────────────────────────────────────────┘
                            ↕️
┌─────────────────────────────────────────────────────────────┐
│                   Zoho CRM API                             │
├─────────────────────────────────────────────────────────────┤
│  🔹 ZOHO.CRM.API.updateRecord (Subform updates)            │
│  🔹 ZOHO.CRM.API.getRecord (Deal data retrieval)           │
│  🔹 $Client.close() (Widget close communication)           │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Implementation Steps

### Phase 1: Project Setup & Foundation

#### Step 1.1: Initialize React TypeScript Project
```bash
# Create Vite React TypeScript project
npm create vite@latest pm_request_contract -- --template react-ts
cd pm_request_contract
npm install

# Install additional dependencies
npm install @types/node
```

#### Step 1.2: Configure TypeScript for Zoho SDK
```typescript
// tsconfig.json - Enable strict typing with Zoho SDK compatibility
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "verbatimModuleSyntax": true, // Enable for strict type imports
    // ... other options
  }
}
```

#### Step 1.3: Create Zoho Type Definitions
```typescript
// src/types/zoho.ts - Complete type system for Zoho CRM integration
export interface ZohoPageLoadData {
  data: ZohoDealData
  // ... other properties
}

export interface ZohoDealData {
  id: string
  Deal_Name: string
  Subform_1: ZohoProductSubform[]
  // ... other deal fields
}

export interface ZohoProductSubform {
  Is_Contract: boolean
  Products: ZohoProduct
  Quantity: string
  Pricing: string
  Total_Pricing: string
  // ... other product fields
}

// Extend window object for Zoho SDK
declare global {
  interface Window {
    ZOHO: ZohoSDK
    $Client: {
      close: (options: { exit: boolean }) => void
    }
  }
}
```

### Phase 2: Core API Implementation

#### Step 2.1: Create Zoho API Communication Layer
```typescript
// src/utils/zohoApi.ts - Core API functions with exclusive selection logic

export async function updateProductContractStatus(
  dealId: string,
  productIndex: number,
  productData: ZohoProductSubform,
  allProducts: ZohoProductSubform[]
): Promise<ZohoUpdateResponse> {
  
  // ✅ EXCLUSIVE SELECTION: Only one product can be contract at a time
  const updatedProducts = allProducts.map((product, index) => {
    if (index === productIndex) {
      return { ...product, Is_Contract: true }
    } else {
      return { ...product, Is_Contract: false } // Clear others
    }
  });

  // ✅ DATA PRESERVATION: Send ALL products to prevent data loss
  const apiConfig = {
    Entity: "Deals",
    APIData: {
      id: dealId,
      Subform_1: updatedProducts // Critical: Include all products
    },
    Trigger: ["workflow"]
  };

  return await zohoApiCall(() => 
    window.ZOHO.CRM.API.updateRecord(apiConfig)
  );
}
```

#### Step 2.2: Implement Widget Close & Clear Functionality
```typescript
// Clear all contract selections
export async function clearAllContractSelections(
  dealId: string,
  allProducts: ZohoProductSubform[]
): Promise<ZohoUpdateResponse> {
  
  const updatedProducts = allProducts.map(product => ({
    ...product,
    Is_Contract: false // Reset all contracts
  }));
  
  // Send complete product list to preserve data
  const apiConfig = {
    Entity: "Deals",
    APIData: { id: dealId, Subform_1: updatedProducts },
    Trigger: ["workflow"]
  };
  
  return await zohoApiCall(() => 
    window.ZOHO.CRM.API.updateRecord(apiConfig)
  );
}

// Manual widget close with client script communication
export function closeWidget(message?: string): void {
  try {
    // Primary method: Notify client scripts
    window.$Client.close({ exit: true });
  } catch (error) {
    // Fallback: Standard popup close
    window.ZOHO?.CRM?.UI?.Popup?.close();
  }
}
```

### Phase 3: User Interface Development

#### Step 3.1: Main Application Container
```typescript
// src/App.tsx - Clean, focused main component
const App = ({ data }: AppProps) => {
  const [showRawData, setShowRawData] = useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            PM Request Contract
          </h1>
          <p className="text-gray-600">
            Manage contract products for deal records
          </p>
        </div>
        
        {/* Main functionality */}
        <ContractProduct dealData={data.data} />
        
        {/* Debug section (optional) */}
        {/* ... debug UI ... */}
      </div>
    </div>
  );
};
```

#### Step 3.2: Contract Product Selection Interface
```typescript
// src/components/ContractProduct.tsx - Core product selection UI

export default function ContractProduct({ dealData }: ContractProductProps) {
  const products: ZohoProductSubform[] = dealData.Subform_1 || [];
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // ✅ EXCLUSIVE SELECTION: Radio button implementation
  const handleProductSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const formData = new FormData(event.currentTarget.form!);
    const selectedProductIndex = formData.get('selectedProduct');
    const dealId = formData.get('dealId');
    
    if (selectedProductIndex !== null && dealId) {
      const productIndex = parseInt(selectedProductIndex as string);
      const selectedProduct = products[productIndex];
      
      setIsUpdating(true);
      try {
        await updateProductContractStatus(
          dealId as string,
          productIndex,
          selectedProduct,
          products // Pass all products for data preservation
        );
        
        showNotification(
          `Successfully tagged "${selectedProduct.Products.name}" as contract item.`,
          'success'
        );
      } catch (error) {
        setUpdateError(`Failed to update: ${error.message}`);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // ✅ MANUAL CLOSE: Clear and close functionality
  const handleCloseAndClear = async () => {
    setIsUpdating(true);
    try {
      await clearAllContractSelections(dealData.id, products);
      closeWidget('Contract selections cleared - closing widget');
    } catch (error) {
      setUpdateError(`Failed to clear: ${error.message}`);
      closeWidget('Manual close with error');
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ CLEANUP: Widget lifecycle management
  useEffect(() => {
    const handleBeforeUnload = () => handleWidgetClose();
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleWidgetClose();
    };
  }, [products, dealData.id]);

  return (
    <div className="space-y-4">
      {/* Product selection form */}
      <form className="space-y-4">
        <input type="hidden" name="dealId" value={dealData.id} />
        
        {products.map((product, index) => (
          <div key={`${product.Products.id}-${index}`} 
               className={`p-4 ${product.Is_Contract ? 'bg-green-50' : 'bg-white'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  {/* ✅ RADIO BUTTON: Exclusive selection */}
                  <input
                    type="radio"
                    name="selectedProduct"
                    value={index}
                    checked={product.Is_Contract}
                    onChange={handleProductSelection}
                    disabled={isUpdating}
                    className="w-5 h-5 text-blue-600"
                  />
                  
                  <div>
                    <h4 className="font-medium">{product.Products.name}</h4>
                    <p className="text-sm text-gray-600">{product.Product_Type}</p>
                  </div>
                </div>
                
                {/* Product details grid */}
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <span className="ml-1 font-medium">{product.Quantity}</span>
                  </div>
                  {/* ... other product details ... */}
                </div>
              </div>
              
              {/* Status badges */}
              <div className="flex-shrink-0 ml-4">
                {product.Is_Contract && (
                  <span className="px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                    Contract Item
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </form>
      
      {/* ✅ MANUAL CLOSE BUTTON */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium">Clear Contract Selections</h3>
            <p className="text-xs text-gray-600">Remove all selections and close widget</p>
          </div>
          <button
            type="button"
            onClick={handleCloseAndClear}
            disabled={isUpdating}
            className="px-4 py-2 bg-red-50 text-red-700 border-red-200 rounded-md"
          >
            {isUpdating ? 'Clearing...' : 'Close & Clear All'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Phase 4: Zoho SDK Integration

#### Step 4.1: Initialize Zoho EmbeddedApp
```typescript
// src/main.tsx - Proper Zoho SDK initialization

function initializeZohoApp(): void {
  try {
    if (!window.ZOHO) {
      console.error('ZOHO SDK not available');
      return;
    }

    // ✅ PAGELOAD EVENT: Subscribe before initialization
    window.ZOHO.embeddedApp.on("PageLoad", function (data: ZohoPageLoadData) {
      console.log("PageLoad data received:", data);
      
      if (!data?.data) {
        console.error('Invalid PageLoad data');
        return;
      }

      // ✅ WIDGET RESIZE: Optimize display
      window.ZOHO.CRM.UI.Resize({ 
        height: "600", 
        width: "800" 
      }).then(() => {
        renderApp(data);
      }).catch((error) => {
        console.error('Resize error:', error);
        renderApp(data); // Fallback
      });
    });

    // ✅ INITIALIZE: Start the embedded app
    window.ZOHO.embeddedApp.init();
    console.log('ZOHO EmbeddedApp initialized successfully');
    
  } catch (error) {
    console.error('Error initializing ZOHO EmbeddedApp:', error);
  }
}

function renderApp(data: ZohoPageLoadData): void {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App data={data} />);
  }
}

// ✅ DOM READY: Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeZohoApp);
} else {
  initializeZohoApp();
}
```

## 🔧 Key Implementation Features

### ✅ Exclusive Contract Selection
- **Logic**: Only one product can be marked as contract at any time
- **Implementation**: Map through all products, set target to `true`, others to `false`
- **UI**: Radio buttons with `checked={product.Is_Contract}`

### ✅ Data Preservation
- **Challenge**: Zoho CRM replaces entire subform array on update
- **Solution**: Always send ALL products in `Subform_1` field
- **Result**: No data loss, all existing records maintained

### ✅ Manual Widget Close
- **Method**: `$Client.close({exit: true})` for client script communication
- **Fallback**: `ZOHO.CRM.UI.Popup.close()` for standard closure
- **Cleanup**: Clear all contract selections before closing

### ✅ Error Handling & User Experience
- **API Errors**: Comprehensive try-catch with user-friendly messages
- **Loading States**: Visual indicators during API calls
- **Validation**: Input validation and data structure checks
- **Notifications**: Success/error feedback for all operations

## 🏃‍♂️ Build & Deployment

### Step 5.1: Build for Production
```bash
# Install dependencies
npm install

# Run TypeScript compilation and build
npm run build

# Output: dist/ folder ready for deployment
```

### Step 5.2: Deployment to Zoho
1. **Upload Files**: Upload `dist/` contents to Zoho CRM
2. **Create Widget**: Configure as EmbeddedApp widget in Zoho CRM
3. **Set Permissions**: Ensure proper API access permissions
4. **Test Integration**: Verify PageLoad data and API functionality

## 📝 Usage Instructions

### For End Users:
1. **Open Deal Record**: Navigate to any deal with products in `Subform_1`
2. **Launch Widget**: Click the "PM Request Contract" widget
3. **Select Product**: Choose one product using radio buttons
4. **Automatic Update**: Selection immediately updates Zoho CRM
5. **Manual Close**: Use "Close & Clear All" button to clear selections and close

### For Administrators:
1. **Monitor API Calls**: Check browser console for detailed logging
2. **Verify Data**: Ensure `Is_Contract` field updates properly
3. **Client Scripts**: Implement listeners for `$Client.close()` events
4. **Permissions**: Verify widget has proper CRM API access

## 🎯 Success Metrics

- ✅ **Exclusive Selection**: Only one product marked as contract
- ✅ **Data Integrity**: No loss of existing product data
- ✅ **Manual Control**: User-controlled widget closing
- ✅ **Error Resilience**: Graceful handling of API failures
- ✅ **Type Safety**: Full TypeScript coverage with strict typing

## 🔍 Troubleshooting

### Common Issues:
1. **Build Errors**: Ensure all imports use `type` keyword for types
2. **API Failures**: Check Zoho CRM permissions and API limits
3. **Data Loss**: Verify all products included in update payload
4. **Widget Not Closing**: Confirm `$Client` API availability

### Debug Tools:
- Browser console for API call logging
- Network tab for API request/response analysis
- React DevTools for component state inspection

---

**This implementation provides a robust, user-friendly solution for managing contract products in Zoho CRM with exclusive selection, data preservation, and manual control features.**
