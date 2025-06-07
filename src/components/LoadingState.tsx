interface LoadingStateProps {
  hasContractProduct: boolean
}

export default function LoadingState({ hasContractProduct }: LoadingStateProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
        <p className="text-blue-800">
          {hasContractProduct 
            ? 'Processing request...' 
            : 'Updating contract status...'}
        </p>
      </div>
    </div>
  )
}
