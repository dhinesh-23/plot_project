export interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    role: 'user' | 'agent' | 'admin';
    created_at: string;
}

export interface Property {
    id: string;
    user_id: string;
    title: string;
    description: string;
    property_type: 'apartment' | 'house' | 'villa' | 'land' | 'commercial';
    transaction_type: 'sale' | 'rent';
    price: number;
    area_sqft: number;
    bedrooms: number;
    bathrooms: number;
    city: string;
    location: string;
    latitude?: number;
    longitude?: number;
    images: string[];
    status: 'active' | 'sold' | 'rented' | 'inactive';
    views_count: number;
    created_at: string;
    updated_at: string;
    owner_name?: string;
    owner_email?: string;
    owner_phone?: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    accessToken: string;
    refreshToken: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}