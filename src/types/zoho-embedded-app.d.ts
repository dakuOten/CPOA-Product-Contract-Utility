// Zoho Embedded App TypeScript Definitions
// This file provides type definitions for the Zoho CRM Embedded App API

// Define specific types for API responses
export interface ZohoAPIResponse {
  status: string
  data?: unknown
  message?: string
}

export interface ZohoRecord {
  id?: string
  [key: string]: unknown
}

export interface ZohoSearchOptions {
  Entity: string
  Type: string
  Query?: string
  Criteria?: string
}

export interface ZohoUpdateOptions {
  Entity: string
  APIData: ZohoRecord
  RecordID: string
}

export interface ZohoInsertOptions {
  Entity: string
  APIData: ZohoRecord
}

export interface ZohoGetOptions {
  Entity: string
  RecordID: string
}

export interface ZohoConnectionOptions {
  url: string
  method: string
  param_type?: number
  parameters?: Record<string, unknown>
}

// Extend the global Window interface
declare global {
  interface Window {
    ZOHO?: {
      embeddedApp?: {
        init(): void
        on(event: 'PageLoad', callback: (data: unknown) => void): void
        get(entity: string): Promise<ZohoAPIResponse>
        set(entity: string, data: unknown): Promise<ZohoAPIResponse>
      }
      CRM?: {
        UI?: {
          Resize?: (options: {
            height?: string | number
            width?: string | number
          }) => Promise<void>
          Popup?: {
            close?(): void
            closeReload?(): void
          }
          Record?: {
            refresh?(): void
          }
        }
        API?: {
          searchRecords?(options: ZohoSearchOptions): Promise<ZohoAPIResponse>
          updateRecord?(options: ZohoUpdateOptions): Promise<ZohoAPIResponse>
          insertRecord?(options: ZohoInsertOptions): Promise<ZohoAPIResponse>
          getRecord?(options: ZohoGetOptions): Promise<ZohoAPIResponse>
        }
        CONNECTION?: {
          invoke?(connectionName: string, options: ZohoConnectionOptions): Promise<ZohoAPIResponse>
        }
      }
    }
  }
}
