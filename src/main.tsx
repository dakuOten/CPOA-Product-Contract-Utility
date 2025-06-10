/// <reference types="./types" />
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { type ZohoPageLoadData } from './types/zoho'

// Initialize Zoho EmbeddedApp with proper TypeScript support
function initializeZohoApp(): void {
  try {
    // Check if ZOHO SDK is available
    if (!window.ZOHO) {
      console.error('ZOHO SDK not available')
      return
    }

    // Subscribe to PageLoad event before initialization
    window.ZOHO.embeddedApp?.on("PageLoad", function (data: unknown) {
      console.log("PageLoad data received:", data)

      // Type guard and validate data structure
      const pageLoadData = data as ZohoPageLoadData
      if (!pageLoadData || !pageLoadData.data) {
        console.error('Invalid PageLoad data received:', data)
        return
      }

      // Resize the widget for better visibility
      const zohoUI = window.ZOHO?.CRM?.UI
      if (zohoUI && 'Resize' in zohoUI && typeof zohoUI.Resize === 'function') {
        zohoUI.Resize({ 
          height: "1000", 
          width: "800" 
        }).then(function () {
          renderApp(pageLoadData)
        }).catch(function (error: unknown) {
          console.error('Error resizing widget:', error)
          // Fallback: render without resizing
          renderApp(pageLoadData)
        })
      } else {
        // Fallback: render without resizing if Resize is not available
        renderApp(pageLoadData)
      }
    })

    // Initialize the EmbeddedApp
    window.ZOHO.embeddedApp?.init()
    console.log('ZOHO EmbeddedApp initialized successfully')
    
  } catch (error) {
    console.error('Error initializing ZOHO EmbeddedApp:', error)
  }
}

// Helper function to render the React app
function renderApp(data: ZohoPageLoadData): void {
  const rootElement = document.getElementById('root')
  if (rootElement) {
    const root = createRoot(rootElement)
    root.render(<App data={data} />)
  } else {
    console.error('Root element not found')
  }
}

// Wait for DOM to be ready and ZOHO SDK to be available
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeZohoApp)
} else {
  initializeZohoApp()
}