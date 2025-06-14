import type { ZohoDealData, ZohoProductSubform } from '../types/zoho'
import { validateRequiredFieldsForPMRequest } from '../utils/validation/pmRequestValidation'

interface ActionButtonsProps {
  isUpdating: boolean
  isPMRequestPending: boolean
  hasContractProduct: boolean
  dealData: ZohoDealData
  contractProduct: ZohoProductSubform | null
  onCloseAndClear: () => void
  onGeneratePMRequest: () => void
}

// Comprehensive validation function that includes product-specific rules
const validateRequiredFields = (dealData: ZohoDealData, contractProduct: ZohoProductSubform | null) => {
  if (!contractProduct) {
    return {
      isValid: false,
      missingFields: ['No contract product selected'],
      requiredFields: []
    }
  }
  const productType = contractProduct.Product_Type || ''
  const term = contractProduct.Terms || ''
  
  console.log('🔍 ActionButtons Validation - Product Details:', {
    productType,
    term,
    productName: contractProduct.Products?.name
  })

  // Use the comprehensive validation function
  const missingFields = validateRequiredFieldsForPMRequest(productType, term, dealData)
  
  console.log('📊 ActionButtons Validation Result:', {
    missingFieldsCount: missingFields.length,
    missingFields,
    isValid: missingFields.length === 0
  })
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    requiredFields: [] // This could be enhanced to show all required fields
  }
}

export default function ActionButtons({
  isUpdating,
  isPMRequestPending,
  hasContractProduct,
  dealData,
  contractProduct,
  onCloseAndClear,
  onGeneratePMRequest
}: ActionButtonsProps) {
  
  const validation = validateRequiredFields(dealData, contractProduct)
  const canGeneratePMRequest = hasContractProduct && validation.isValid

  return (
    <div className="space-y-4">
      {/* Actions Card */}
      <div className="modern-card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Available Actions</h3>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          {hasContractProduct ? (
            /* Two-column layout when contract product is selected */
            <div className="grid grid-cols-2 gap-4">
              {/* PM Request Generation Button */}
              <div className={`flex items-center justify-between p-4 rounded-lg border ${
                canGeneratePMRequest 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className={`w-5 h-5 ${
                      canGeneratePMRequest ? 'text-emerald-600' : 'text-gray-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {canGeneratePMRequest ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${
                      canGeneratePMRequest ? 'text-emerald-900' : 'text-gray-600'
                    }`}>
                      Generate PM Request
                    </h4>
                    <p className={`text-xs ${
                      canGeneratePMRequest ? 'text-emerald-700' : 'text-gray-500'
                    }`}>
                      {canGeneratePMRequest 
                        ? 'Create a PM Request for the selected contract product'
                        : 'Missing required fields'
                      }
                    </p>
                  </div>
                </div>
                
                {canGeneratePMRequest ? (
                  <button
                    type="button"
                    onClick={onGeneratePMRequest}
                    disabled={isUpdating || isPMRequestPending}
                    className={`btn-primary ${
                      isUpdating || isPMRequestPending ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUpdating || isPMRequestPending ? (
                      <>
                        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Generate Request
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Required fields missing:</div>
                    <div className="space-y-1">
                      {validation.missingFields.map((field) => (
                        <div key={field} className="flex items-center text-xs text-red-600">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {field}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Clear Contract Selections */}
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-900">Clear & Close</h4>
                    <p className="text-xs text-red-700">
                      Remove all contract selections and close the widget
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCloseAndClear}
                  disabled={isUpdating}
                  className={`btn-danger ${
                    isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUpdating ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Clearing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Close & Clear
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Full-width layout when no contract product is selected */
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-900">Clear & Close</h4>
                  <p className="text-xs text-red-700">
                    Remove all contract selections and close the widget
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseAndClear}
                disabled={isUpdating}
                className={`btn-danger ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUpdating ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Clearing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close & Clear
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Required Fields Validation Notice */}
        {hasContractProduct && !validation.isValid && (
          <div className="px-6 py-4 border-t border-gray-200 bg-amber-50">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-amber-900">Required Fields Missing</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Please ensure the following fields are filled in the deal record before generating a PM Request:
                </p>
                <ul className="mt-2 space-y-1">
                  {validation.missingFields.map((field) => (
                    <li key={field} className="text-sm text-amber-700 flex items-center">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
