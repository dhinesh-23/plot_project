'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Property } from '@/types';
import { Edit, Trash2, Eye, Plus, X, Check } from 'lucide-react';
import Link from 'next/link';

export default function AdminProperties() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProperty, setNewProperty] = useState<Partial<Property>>({
        title: '',
        description: '',
        price: 0,
        city: '',
        location: '',
        bedrooms: 0,
        bathrooms: 0,
        area_sqft: 0,
        property_type: 'house',
        transaction_type: 'sale',
        status: 'active'
    });

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const response = await api.getProperties({ limit: 100 });
            setProperties(response.data.data);
        } catch (error) {
            console.error('Failed to fetch properties:', error);
            alert('Failed to load properties. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    // 🔥 FIXED: Delete handler is now properly implemented
    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
            try {
                await api.deleteProperty(id);
                await fetchProperties();
                alert('Property deleted successfully!');
            } catch (error: any) {
                console.error('Failed to delete property:', error);
                const errorMsg = error.response?.data?.error || 'Failed to delete property. Please try again.';
                alert(errorMsg);
            }
        }
    };

    const handleEdit = (property: Property) => {
        setEditingProperty(property);
    };

    // 🔥 FIXED: Update handler now uses the correct API method
    const handleUpdate = async () => {
        if (!editingProperty) return;
        
        try {
            await api.updateProperty(editingProperty.id, editingProperty);
            await fetchProperties();
            setEditingProperty(null);
            alert('Property updated successfully!');
        } catch (error: any) {
            console.error('Failed to update property:', error);
            const errorMsg = error.response?.data?.error || 'Failed to update property. Please try again.';
            alert(errorMsg);
        }
    };

    const handleAdd = async () => {
        if (!newProperty.title || !newProperty.description || !newProperty.price || !newProperty.city) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await api.createProperty(newProperty);
            await fetchProperties();
            setShowAddModal(false);
            setNewProperty({
                title: '',
                description: '',
                price: 0,
                city: '',
                location: '',
                bedrooms: 0,
                bathrooms: 0,
                area_sqft: 0,
                property_type: 'house',
                transaction_type: 'sale',
                status: 'active'
            });
            alert('Property added successfully!');
        } catch (error: any) {
            console.error('Failed to add property:', error);
            const errorMsg = error.response?.data?.error || 'Failed to add property. Please try again.';
            alert(errorMsg);
        }
    };

    const propertyTypes = ['apartment', 'house', 'villa', 'land', 'commercial'];
    const transactionTypes = ['sale', 'rent'];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6 pt-20">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Properties</h1>
                    <p className="text-gray-600 mt-1">View, edit, add, and manage all property listings</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition transform hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Property</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {properties.map((property) => (
                                <tr key={property.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{property.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{property.city}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        ₹{property.price.toLocaleString()}
                                        {property.transaction_type === 'rent' && '/month'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 capitalize">
                                            {property.property_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{property.views_count || 0}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-2">
                                            <Link
                                                href={`/properties/${property.id}`}
                                                target="_blank"
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="View Property"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>
                                            <button
                                                onClick={() => handleEdit(property)}
                                                className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                title="Edit Property"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(property.id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Delete Property"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingProperty && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingProperty(null)}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">Edit Property</h2>
                                <button
                                    onClick={() => setEditingProperty(null)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={editingProperty.title}
                                        onChange={(e) => setEditingProperty({...editingProperty, title: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                    <textarea
                                        value={editingProperty.description}
                                        onChange={(e) => setEditingProperty({...editingProperty, description: e.target.value})}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                                        <input
                                            type="number"
                                            value={editingProperty.price}
                                            onChange={(e) => setEditingProperty({...editingProperty, price: parseFloat(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                        <input
                                            type="text"
                                            value={editingProperty.city}
                                            onChange={(e) => setEditingProperty({...editingProperty, city: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={editingProperty.location}
                                        onChange={(e) => setEditingProperty({...editingProperty, location: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                                        <select
                                            value={editingProperty.property_type}
                                            onChange={(e) => setEditingProperty({...editingProperty, property_type: e.target.value as any})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {propertyTypes.map(type => (
                                                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                                        <select
                                            value={editingProperty.transaction_type}
                                            onChange={(e) => setEditingProperty({...editingProperty, transaction_type: e.target.value as any})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {transactionTypes.map(type => (
                                                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                                        <input
                                            type="number"
                                            value={editingProperty.bedrooms}
                                            onChange={(e) => setEditingProperty({...editingProperty, bedrooms: parseInt(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                                        <input
                                            type="number"
                                            value={editingProperty.bathrooms}
                                            onChange={(e) => setEditingProperty({...editingProperty, bathrooms: parseInt(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Area (sqft)</label>
                                        <input
                                            type="number"
                                            value={editingProperty.area_sqft}
                                            onChange={(e) => setEditingProperty({...editingProperty, area_sqft: parseFloat(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        onClick={() => setEditingProperty(null)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>Save Changes</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Property Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">Add New Property</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={newProperty.title}
                                        onChange={(e) => setNewProperty({...newProperty, title: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter property title"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                    <textarea
                                        value={newProperty.description}
                                        onChange={(e) => setNewProperty({...newProperty, description: e.target.value})}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter property description"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                                        <input
                                            type="number"
                                            value={newProperty.price}
                                            onChange={(e) => setNewProperty({...newProperty, price: parseFloat(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter price"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                        <input
                                            type="text"
                                            value={newProperty.city}
                                            onChange={(e) => setNewProperty({...newProperty, city: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter city"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={newProperty.location}
                                        onChange={(e) => setNewProperty({...newProperty, location: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter specific location"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                                        <select
                                            value={newProperty.property_type}
                                            onChange={(e) => setNewProperty({...newProperty, property_type: e.target.value as any})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {propertyTypes.map(type => (
                                                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                                        <select
                                            value={newProperty.transaction_type}
                                            onChange={(e) => setNewProperty({...newProperty, transaction_type: e.target.value as any})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {transactionTypes.map(type => (
                                                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                                        <input
                                            type="number"
                                            value={newProperty.bedrooms}
                                            onChange={(e) => setNewProperty({...newProperty, bedrooms: parseInt(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                                        <input
                                            type="number"
                                            value={newProperty.bathrooms}
                                            onChange={(e) => setNewProperty({...newProperty, bathrooms: parseInt(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Area (sqft)</label>
                                        <input
                                            type="number"
                                            value={newProperty.area_sqft}
                                            onChange={(e) => setNewProperty({...newProperty, area_sqft: parseFloat(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAdd}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
                                    >
                                        Add Property
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}