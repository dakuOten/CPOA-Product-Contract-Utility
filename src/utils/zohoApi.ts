/**
 * Legacy Zoho API utilities file
 * This file now re-exports from the modular Zoho utilities for backward compatibility
 * 
 * The Zoho functionality has been split into separate modules:
 * - zoho/core.ts - Core utilities and helper functions
 * - zoho/types.ts - TypeScript interfaces and types
 * - zoho/dealOperations.ts - Deal and contact fetching operations
 * - zoho/productOperations.ts - Product contract status operations
 * - zoho/pmRequestOperations.ts - PM Request generation
 * - zoho/widgetOperations.ts - Widget control operations
 * - zoho/index.ts - Main export file
 */

// Re-export everything from the modular structure for backward compatibility
export * from './zoho'


