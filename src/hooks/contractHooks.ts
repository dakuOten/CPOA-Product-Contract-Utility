import { useRef, useCallback } from 'react'
import type { ZohoProductSubform } from '../types/zoho'
import { clearAllContractSelections, closeWidget } from '../utils/zohoApi'

// Extend Window interface for our cleanup functions
declare global {
  interface Window {
    __contractWidgetCleanupSet?: boolean
    __contractWidgetCleanup?: () => Promise<void>
  }
}

// Custom hook for cleanup logic using React 19 patterns
export function useContractCleanup(products: ZohoProductSubform[], dealId: string) {
  const cleanupRef = useRef<(() => Promise<void>) | undefined>(undefined)
  
  cleanupRef.current = useCallback(async () => {
    try {
      if (products.length > 0 && dealId) {
        await clearAllContractSelections(dealId, products)
      }
      closeWidget('Widget cleanup completed - notifying client script')
    } catch (error) {
      console.error('Failed to clear contract selections on widget close:', error)
      closeWidget('Widget closing with error - notifying client script')
    }
  }, [products, dealId])
  
  // Set up cleanup listeners only once
  if (typeof window !== 'undefined' && !window.__contractWidgetCleanupSet) {
    window.__contractWidgetCleanupSet = true
    
    const handleBeforeUnload = () => {
      cleanupRef.current?.()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.__contractWidgetCleanup = async () => {
      if (cleanupRef.current) {
        await cleanupRef.current()
      }
    }
  }
}

// Currency formatting hook
export function useCurrencyFormatter() {
  return useCallback((amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num)
  }, [])
}
