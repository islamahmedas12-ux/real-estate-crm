// Property enums matching the Prisma schema
export type PropertyType =
  | 'APARTMENT'
  | 'VILLA'
  | 'OFFICE'
  | 'SHOP'
  | 'LAND'
  | 'BUILDING'
  | 'CHALET'
  | 'STUDIO'
  | 'DUPLEX'
  | 'PENTHOUSE'

export type PropertyStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'SOLD'
  | 'RENTED'
  | 'OFF_MARKET'

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'SHOP', label: 'Shop' },
  { value: 'LAND', label: 'Land' },
  { value: 'BUILDING', label: 'Building' },
  { value: 'CHALET', label: 'Chalet' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
]

export const PROPERTY_STATUSES: { value: PropertyStatus; label: string; color: string }[] = [
  { value: 'AVAILABLE', label: 'Available', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'RESERVED', label: 'Reserved', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'SOLD', label: 'Sold', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'RENTED', label: 'Rented', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'OFF_MARKET', label: 'Off Market', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' },
]

export interface PropertyImage {
  id: string
  propertyId: string
  url: string
  caption: string | null
  isPrimary: boolean
  order: number
  createdAt: string
}

export interface PropertyAgent {
  id: string
  name: string
  email: string
}

export interface PropertyLead {
  id: string
  title: string
  status: string
  priority: string
  createdAt: string
}

export interface PropertyContract {
  id: string
  type: string
  status: string
  totalAmount: string
  createdAt: string
}

export interface Property {
  id: string
  title: string
  description: string | null
  type: PropertyType
  status: PropertyStatus
  price: string
  area: string
  bedrooms: number | null
  bathrooms: number | null
  floor: number | null
  address: string
  city: string
  region: string
  latitude: string | null
  longitude: string | null
  features: string[] | null
  assignedAgentId: string | null
  assignedAgent: PropertyAgent | null
  images: PropertyImage[]
  leads?: PropertyLead[]
  contracts?: PropertyContract[]
  createdAt: string
  updatedAt: string
}

export interface PropertyFilterParams {
  page?: number
  pageSize?: number
  type?: PropertyType
  status?: PropertyStatus
  minPrice?: string
  maxPrice?: string
  minArea?: string
  maxArea?: string
  city?: string
  bedrooms?: number
  sortBy?: 'createdAt' | 'price' | 'area' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface PropertyListResponse {
  data: Property[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CreatePropertyPayload {
  title: string
  description?: string
  type: PropertyType
  price: string
  area: string
  bedrooms?: number
  bathrooms?: number
  floor?: number
  address: string
  city: string
  region: string
  latitude?: string
  longitude?: string
  features?: string[]
}

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>
