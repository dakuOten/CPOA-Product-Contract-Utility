import { useMemo } from 'react'
import type { ZohoProductSubform } from '../types/zoho'
import { ContractContext } from './contractContext'

// Context provider component
export function ContractProvider({ 
  children, 
  products, 
  searchTerm, 
  filterType, 
  setSearchTerm, 
  setFilterType, 
  formatCurrency 
}: {
  children: React.ReactNode
  products: ZohoProductSubform[]
  searchTerm: string
  filterType: 'all' | 'contract'
  setSearchTerm: (term: string) => void
  setFilterType: (type: 'all' | 'contract') => void
  formatCurrency: (amount: string | number) => string
}) {

  
  const contextValue = useMemo(() => ({
    products,
    searchTerm,
    filterType,
    setSearchTerm,
    setFilterType,
    formatCurrency
  }), [products, searchTerm, filterType, setSearchTerm, setFilterType, formatCurrency])

  return (
    <ContractContext.Provider value={contextValue}>
      {children}
    </ContractContext.Provider>
  )
}
