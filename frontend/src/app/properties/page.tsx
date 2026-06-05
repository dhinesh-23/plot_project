'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Property } from '@/types';
import PropertyCard from '@/components/PropertyCard';
import { Search, Filter, X } from 'lucide-react';

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        city: '',
        property_type: '',
        minPrice: '',
        maxPrice: '',
        bedrooms: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchProperties();
    }, [filters]);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filters.city) params.city = filters.city;
            if (filters.property_type) params.property_type = filters.property_type;
            if (filters.minPrice) params.minPrice = parseInt(filters.minPrice);
            if (filters.maxPrice) params.maxPrice = parseInt(filters.maxPrice);
            if (filters.bedrooms) params.bedrooms = parseInt(filters.bedrooms);
            
            const response = await api.getProperties(params);
            setProperties(response.data.data);
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setFilters({ ...filters, city: searchTerm });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const clearFilters = () => {
        setFilters({ city: '', property_type: '', minPrice: '', maxPrice: '', bedrooms: '' });
        setSearchTerm('');
    };

    const propertyTypes = ['apartment', 'house', 'villa', 'land', 'commercial'];
    const bedroomOptions = [1, 2, 3, 4, 5];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Hero Banner */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 py-36 mb-12">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Find Your Perfect Property
                    </h1>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto">
                        Browse through our extensive collection of premium properties
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {/* Search and Filter Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Search by city, location, or property name..."
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105"
                        >
                            Search
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition flex items-center gap-2"
                        >
                            <Filter className="w-5 h-5" />
                            Filters
                            {Object.values(filters).some(v => v) && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                        </button>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="mt-6 pt-6 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <select
                                    value={filters.property_type}
                                    onChange={(e) => setFilters({ ...filters, property_type: e.target.value })}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Types</option>
                                    {propertyTypes.map(type => (
                                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                    ))}
                                </select>

                                <select
                                    value={filters.bedrooms}
                                    onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Any Beds</option>
                                    {bedroomOptions.map(bed => (
                                        <option key={bed} value={bed}>{bed}+ Beds</option>
                                    ))}
                                </select>

                                <input
                                    type="number"
                                    value={filters.minPrice}
                                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                    placeholder="Min Price"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />

                                <input
                                    type="number"
                                    value={filters.maxPrice}
                                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                    placeholder="Max Price"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            {(filters.property_type || filters.bedrooms || filters.minPrice || filters.maxPrice) && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1"
                                    >
                                        <X className="w-4 h-4" />
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Results Count */}
                <div className="mb-6 flex justify-between items-center">
                    <p className="text-gray-600">
                        Found <span className="font-semibold text-gray-900">{properties.length}</span> properties
                    </p>
                    <p className="text-sm text-gray-500">
                        Showing {properties.length} of {properties.length} results
                    </p>
                </div>

                {/* Properties Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                        <p className="text-gray-500 text-lg">No properties found matching your criteria.</p>
                        <button
                            onClick={clearFilters}
                            className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}