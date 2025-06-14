import type { ZohoDealRecord } from '../types'

/**
 * Address Processing Module
 * Handles address formatting for PM Request generation
 */

export interface AddressInfo {
  serviceAddress: string
  billingAddress: string
}

/**
 * Builds formatted addresses from deal data
 * @param dealData - The deal record containing address fields
 * @returns Formatted service and billing addresses
 */
export function buildAddresses(dealData: ZohoDealRecord): AddressInfo {
  console.log('🏠 Building addresses from deal data...')
  
  const serviceAddress = buildServiceAddress(dealData)
  const billingAddress = buildBillingAddress(dealData)
  
  console.log('📍 Address Summary:', {
    serviceAddress: serviceAddress || '(No service address)',
    billingAddress: billingAddress || '(No billing address)'
  })
  
  return {
    serviceAddress,
    billingAddress
  }
}

/**
 * Builds service address from deal fields
 */
function buildServiceAddress(dealData: ZohoDealRecord): string {
  const addressParts = [
    dealData.Street || '',
    dealData.City || '',
    dealData.State || '',
    dealData.Zip_Code1 || ''
  ]
  
  const serviceAddress = addressParts
    .filter(part => part.trim() !== '')
    .join(' ')
    .trim()
  
  console.log('🏢 Service Address:', {
    parts: {
      street: dealData.Street || '(empty)',
      city: dealData.City || '(empty)',
      state: dealData.State || '(empty)',
      zip: dealData.Zip_Code1 || '(empty)'
    },
    formatted: serviceAddress || '(empty)'
  })
  
  return serviceAddress
}

/**
 * Builds billing address from deal fields
 */
function buildBillingAddress(dealData: ZohoDealRecord): string {
  const addressParts = [
    dealData.Service_Street || '',
    dealData.Service_City || '',
    dealData.Service_State || '',
    dealData.Service_Zip_Code || ''
  ]
  
  const billingAddress = addressParts
    .filter(part => part.trim() !== '')
    .join(' ')
    .trim()
  
  console.log('🏠 Billing Address:', {
    parts: {
      street: dealData.Service_Street || '(empty)',
      city: dealData.Service_City || '(empty)',
      state: dealData.Service_State || '(empty)',
      zip: dealData.Service_Zip_Code || '(empty)'
    },
    formatted: billingAddress || '(empty)'
  })
  
  return billingAddress
}

/**
 * Validates if an address has minimum required components
 */
export function validateAddress(address: string): boolean {
  if (!address || address.trim() === '') {
    return false
  }
  
  // Basic validation: address should have at least 2 components (e.g., city + state)
  const parts = address.split(' ').filter(part => part.trim() !== '')
  return parts.length >= 2
}

/**
 * Formats address for display purposes
 */
export function formatAddressForDisplay(address: string): string {
  if (!address || address.trim() === '') {
    return 'No address provided'
  }
  
  return address.trim()
}
