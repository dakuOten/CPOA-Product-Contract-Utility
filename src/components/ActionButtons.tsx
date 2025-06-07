interface ActionButtonsProps {
  isUpdating: boolean
  isPMRequestPending: boolean
  hasContractProduct: boolean
  onCloseAndClear: () => void
  onGeneratePMRequest: () => void
}

export default function ActionButtons({
  isUpdating,
  isPMRequestPending,
  hasContractProduct,
  onCloseAndClear,
  onGeneratePMRequest
}: ActionButtonsProps) {return (
    <div className="space-y-4">
      {/* Actions Card */}
      <div className="modern-card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Available Actions</h3>
        </div>        <div className="px-6 py-4 space-y-4">
          {hasContractProduct ? (
            /* Two-column layout when contract product is selected */
            <div className="grid grid-cols-2 gap-4">
              {/* PM Request Generation Button */}
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-emerald-900">Generate PM Request</h4>
                    <p className="text-xs text-emerald-700">
                      Create a PM Request for the selected contract product
                    </p>
                  </div>
                </div>
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
      </div>
    </div>
  )
}
