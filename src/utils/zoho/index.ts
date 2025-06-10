/**
 * Main Zoho API utilities - re-exports all Zoho operations
 * This file provides a centralized import point for all Zoho functionality
 */

// Core utilities
export { zohoApiCall, validateZohoAPI, showNotification } from './core'

// Types
export type {
  ZohoApiResponse,
  ZohoUpdateResponse,
  ZohoDealRecord,
  ZohoContact,
  PMRequestData
} from './types'

// Deal operations
export {
  fetchDealData,
  fetchContactData,
  fetchAccountData,
  findDealPrimaryContact
} from './dealOperations'

// Product operations
export {
  updateProductContractStatus,
  clearAllContractSelections,
  updateContractProductField
} from './productOperations'

// PM Request operations
export { generatePMRequest } from './pmRequestOperations'

// Widget operations
export {
  closeWidget,
  reloadWidget,
  updateContractProductAndClose
} from './widgetOperations'
