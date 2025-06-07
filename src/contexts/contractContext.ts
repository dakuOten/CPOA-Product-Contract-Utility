import { createContext } from 'react'
import type { ZohoProductSubform } from '../types/zoho'

// Contract Context for sharing state between components
export const ContractContext = createContext<{
  products: ZohoProductSubform[]
  searchTerm: string
  filterType: 'all' | 'contract'
  setSearchTerm: (term: string) => void
  setFilterType: (type: 'all' | 'contract') => void
  formatCurrency: (amount: string | number) => string
} | null>(null)
