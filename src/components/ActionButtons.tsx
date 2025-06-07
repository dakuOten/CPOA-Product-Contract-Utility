import type { ZohoProductSubform } from '../types/zoho'

interface ActionButtonsProps {
  isUpdating: boolean
  hasContractProduct: boolean
  products: ZohoProductSubform[]
  formatCurrency: (amount: string | number) => string
  onCloseAndClear: () => void
  onGeneratePMRequest: () => void
}

export default function ActionButtons({
  isUpdating,
  hasContractProduct,
  products,
  formatCurrency,
  onCloseAndClear,
  onGeneratePMRequest
}: ActionButtonsProps) {
  return (
    <>
      {/* Total Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Total Products: {products.length}
          </span>
          <span className="text-gray-600">
            Total Value: {formatCurrency(
              products.reduce((sum, p) => sum + parseFloat(p.Total_Pricing.replace(/,/g, '')), 0)
            )}
          </span>
        </div>
      </div>

      {/* Clear Contract Selections */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Clear Contract Selections
              </h3>
              <p className="text-xs text-gray-600">
                Remove all contract selections and close the widget
              </p>
            </div>
            <button
              type="button"
              onClick={onCloseAndClear}
              disabled={isUpdating}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                isUpdating
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300'
              }`}
            >
              {isUpdating ? 'Clearing...' : 'Close & Clear All'}
            </button>
          </div>
        </div>
      </div>

      {/* PM Request Generation Button (visible only when a contract product is selected) */}
      {hasContractProduct && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Generate PM Request
              </h3>
              <p className="text-xs text-gray-600">
                Create a PM Request for the selected contract product
              </p>
            </div>
            <button
              type="button"
              onClick={onGeneratePMRequest}
              disabled={isUpdating}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                isUpdating
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
              }`}
            >
              {isUpdating ? 'Generating...' : 'Generate PM Request'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
