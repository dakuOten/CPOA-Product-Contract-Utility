/**
 * Widget control operations for Zoho embedded apps
 * Handles widget closing, reloading, and state management
 */

import { updateContractProductField } from './productOperations'

/**
 * Closes widget and notifies client script using $Client.close API
 * This is the primary method for closing the widget
 * @param message - Optional message to log
 */
export function closeWidget(message?: string): void {
  if (message) {
    console.log(message)
  }
  
  try {
    // Use $Client.close to notify client script and close widget
    $Client.close({
      exit: true
    })
    console.log('Widget closed using $Client.close API')
  } catch (error) {
    console.error('Error closing widget with $Client.close:', error)
    
    // Fallback: try regular popup close
    try {
      if (window.ZOHO?.CRM?.UI?.Popup?.close) {
        window.ZOHO.CRM.UI.Popup.close()
        console.log('Widget closed using fallback Popup.close')
      }
    } catch (fallbackError) {
      console.error('Fallback close also failed:', fallbackError)
    }
  }
}

/**
 * Reloads the widget to refresh data from Zoho CRM
 * This helps capture the latest state when Zoho data might be stale
 * @param message - Optional message to log
 */
export function reloadWidget(message?: string): void {
  if (message) {
    console.log(message)
  }
  
  console.log('=== RELOADING WIDGET TO REFRESH DATA ===')
  
  try {
    // Use window.location.reload to refresh the entire widget
    window.location.reload()
    console.log('Widget reloaded successfully')
  } catch (error) {
    console.error('Error reloading widget:', error)
    
    // Fallback: try to use Zoho UI refresh if available
    try {
      if (window.ZOHO?.CRM?.UI?.Popup?.closeReload) {
        window.ZOHO.CRM.UI.Popup.closeReload()
        console.log('Widget reloaded using Zoho closeReload')
      } else {
        // As last resort, just reload the page
        window.location.assign(window.location.href)
      }
    } catch (fallbackError) {
      console.error('Fallback reload also failed:', fallbackError)
    }
  }
}

/**
 * Updates Contract_Product field and closes widget
 * This function updates the deal's Contract_Product field before closing
 * @param dealId - The Zoho Deal ID
 * @param contractProductValue - Value to set for Contract_Product field
 * @param message - Optional message to log
 */
export async function updateContractProductAndClose(
  dealId: string,
  contractProductValue: boolean,
  message?: string
): Promise<void> {
  if (message) {
    console.log(message)
  }
  
  console.log('=== UPDATING CONTRACT_PRODUCT FIELD AND CLOSING ===')
  console.log('Deal ID:', dealId)
  console.log('Contract_Product value:', contractProductValue)
  
  try {
    // Update the field
    await updateContractProductField(dealId, contractProductValue)
    
    // Close widget after successful update
    closeWidget('Contract_Product field updated, closing widget')
    
  } catch (error) {
    console.error('=== CONTRACT_PRODUCT UPDATE FAILED ===')
    console.error('Error:', error)
    
    // Still close widget even if update fails
    closeWidget('Contract_Product update failed, closing widget anyway')
  }
}
