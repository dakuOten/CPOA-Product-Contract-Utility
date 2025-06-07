import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, isVisible, onClose, duration = 6000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  }[type]

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800'
  }[type]

  const iconColor = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400'
  }[type]
  const Icon = {
    success: () => (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: () => (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    info: () => (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  }[type]
  // Create or get toast container - try parent window first for Zoho widgets
  const getToastContainer = () => {
    // Try to access parent window if in iframe (Zoho widget context)
    const targetDocument = window.parent !== window ? window.parent.document : document
    
    let container = targetDocument.getElementById('toast-container')
    if (!container) {
      container = targetDocument.createElement('div')
      container.id = 'toast-container'
      container.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        pointer-events: none;
        padding: 0;
        width: auto;
        max-width: 90vw;
      `
      targetDocument.body.appendChild(container)
    }
    return container
  }
  const toastElement = (
    <div 
      style={{ 
        position: 'relative',
        zIndex: 1,
        pointerEvents: 'auto',
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease-in-out',
        maxWidth: '400px',
        width: 'auto',
        minWidth: '280px',
        margin: '0 auto'
      }}
    >
      <div 
        className={`w-full ${bgColor} border rounded-lg p-4`}
        style={{ 
          backgroundColor: type === 'success' ? '#f0fdf4' : type === 'error' ? '#fef2f2' : '#eff6ff',
          borderColor: type === 'success' ? '#bbf7d0' : type === 'error' ? '#fecaca' : '#bfdbfe',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid'
        }}
      >
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${iconColor}`}>
            <Icon />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${textColor}`}>
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`inline-flex ${textColor} hover:${textColor.replace('800', '600')} focus:outline-none`}
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  try {
    // Try to render to parent window (Zoho main document) if possible
    const container = getToastContainer()
    return createPortal(toastElement, container)
  } catch (error) {
    // Fallback to current document if parent access fails
    console.warn('Could not access parent window, using local container:', error)
    return createPortal(toastElement, document.body)
  }
}
