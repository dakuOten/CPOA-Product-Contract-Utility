/**
 * Helper function to promisify Zoho API calls with error handling
 * Wraps Zoho API calls to provide consistent error handling and logging
 * @param apiFunction - The Zoho API function to execute
 * @returns Promise with the API response
 */
export async function zohoApiCall<T>(apiFunction: () => Promise<T>): Promise<T> {
  try {
    const result = await apiFunction()
    return result
  } catch (error) {
    console.error('Zoho API Call Error:', error)
    throw new Error(`Zoho API Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validates if Zoho CRM API is available
 * @throws Error if Zoho API is not available
 */
export function validateZohoAPI(): void {
  if (!window.ZOHO?.CRM?.API) {
    throw new Error('Zoho CRM API not available')
  }
}

/**
 * Shows notification message (logging only)
 * Widget closing will be handled by manual close buttons using $Client.close
 * @param message - Message to display
 * @param type - Type of notification (success, error, info)
 */
export function showNotification(
  message: string, 
  type: 'success' | 'error' | 'info' = 'info'
): void {
  console.log(`[${type.toUpperCase()}] ${message}`)
}
