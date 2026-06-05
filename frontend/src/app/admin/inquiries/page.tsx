'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageSquare, 
  Eye, 
  Calendar, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Mail,
  Phone,
  User,
  Home,
  ChevronRight
} from 'lucide-react';

interface Inquiry {
    id: string;
    property_id: string;
    user_id: string;
    message: string;
    phone: string;
    status: 'pending' | 'responded' | 'closed';
    created_at: string;
    property_title: string;
    property_price: string;
    property_city: string;
    user_name?: string;
    user_email?: string;
    user_phone?: string;
}

export default function AdminInquiries() {
    const router = useRouter();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [updating, setUpdating] = useState<string | null>(null);

    const API_URL = 'http://localhost:5001/api';

    const fetchInquiries = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                router.push('/login');
                return;
            }

            // First, check if user is admin
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            
            if (!user || user.role !== 'admin') {
                setError('Admin access required');
                setLoading(false);
                return;
            }

            // Fetch all inquiries - you'll need to create this endpoint
            // For now, we'll fetch properties and then their inquiries
            const propertiesRes = await fetch(`${API_URL}/properties`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const propertiesData = await propertiesRes.json();
            const properties = propertiesData.data || [];

            // Fetch inquiries for each property
            const allInquiries: Inquiry[] = [];
            for (const property of properties) {
                try {
                    const inquiriesRes = await fetch(`${API_URL}/inquiries/property/${property.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (inquiriesRes.ok) {
                        const propertyInquiries = await inquiriesRes.json();
                        allInquiries.push(...propertyInquiries.map((inq: any) => ({
                            ...inq,
                            property_title: property.title,
                            property_price: property.price,
                            property_city: property.city
                        })));
                    }
                } catch (err) {
                    console.error(`Failed to fetch inquiries for property ${property.id}:`, err);
                }
            }

            // Sort by created date descending
            allInquiries.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setInquiries(allInquiries);
            setError('');
        } catch (err) {
            console.error('Fetch inquiries error:', err);
            setError('Failed to fetch inquiries. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Alternative: Direct API endpoint (you need to add this to backend)
    // For now, we'll use the method above

    const updateInquiryStatus = async (inquiryId: string, newStatus: string) => {
        setUpdating(inquiryId);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/inquiries/${inquiryId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setInquiries(inquiries.map(inquiry =>
                    inquiry.id === inquiryId ? { ...inquiry, status: newStatus as any } : inquiry
                ));
                alert(`Inquiry marked as ${newStatus}`);
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Update status error:', error);
            alert('Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchInquiries();
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'responded': return 'bg-green-100 text-green-700';
            case 'closed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusText = (status: string) => {
        switch(status) {
            case 'pending': return 'Pending';
            case 'responded': return 'Responded';
            case 'closed': return 'Closed';
            default: return status;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays === 1) return 'Yesterday';
        return date.toLocaleDateString('en-IN');
    };

    useEffect(() => {
        fetchInquiries();
    }, []);

    const filteredInquiries = selectedStatus === 'all' 
        ? inquiries 
        : inquiries.filter(i => i.status === selectedStatus);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Inquiries</h1>
                    <p className="text-gray-600 mt-1">View and manage all customer inquiries</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setSelectedStatus('all')}
                    className={`px-4 py-2 rounded-lg transition ${
                        selectedStatus === 'all' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    All ({inquiries.length})
                </button>
                <button
                    onClick={() => setSelectedStatus('pending')}
                    className={`px-4 py-2 rounded-lg transition ${
                        selectedStatus === 'pending' 
                            ? 'bg-yellow-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Pending ({inquiries.filter(i => i.status === 'pending').length})
                </button>
                <button
                    onClick={() => setSelectedStatus('responded')}
                    className={`px-4 py-2 rounded-lg transition ${
                        selectedStatus === 'responded' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Responded ({inquiries.filter(i => i.status === 'responded').length})
                </button>
                <button
                    onClick={() => setSelectedStatus('closed')}
                    className={`px-4 py-2 rounded-lg transition ${
                        selectedStatus === 'closed' 
                            ? 'bg-gray-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Closed ({inquiries.filter(i => i.status === 'closed').length})
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
                    {error}
                </div>
            )}

            {filteredInquiries.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No inquiries yet</h3>
                    <p className="text-gray-500">When customers inquire about properties, they will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredInquiries.map((inquiry) => (
                        <div
                            key={inquiry.id}
                            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-6"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <Link
                                            href={`/properties/${inquiry.property_id}`}
                                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition flex items-center gap-1"
                                        >
                                            <Home className="w-4 h-4" />
                                            {inquiry.property_title || 'Property'}
                                        </Link>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                                            {getStatusText(inquiry.status)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 mb-2">
                                        {inquiry.property_city && `📍 ${inquiry.property_city}`}
                                        {inquiry.property_price && ` • ₹${parseFloat(inquiry.property_price).toLocaleString()}`}
                                    </div>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(inquiry.created_at)}
                                    </div>
                                </div>
                            </div>

                            {/* Inquiry Message */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                <p className="text-gray-700">{inquiry.message}</p>
                            </div>

                            {/* User Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <User className="w-4 h-4" />
                                    <span>{inquiry.user_name || 'User'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    <a href={`mailto:${inquiry.user_email}`} className="text-blue-600 hover:underline">
                                        {inquiry.user_email || 'No email'}
                                    </a>
                                </div>
                                {inquiry.phone && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="w-4 h-4" />
                                        <a href={`tel:${inquiry.phone}`} className="hover:text-blue-600">
                                            {inquiry.phone}
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 pt-3 border-t">
                                {inquiry.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => updateInquiryStatus(inquiry.id, 'responded')}
                                            disabled={updating === inquiry.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Mark as Responded
                                        </button>
                                        <button
                                            onClick={() => updateInquiryStatus(inquiry.id, 'closed')}
                                            disabled={updating === inquiry.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Close
                                        </button>
                                    </>
                                )}
                                {inquiry.status === 'responded' && (
                                    <button
                                        onClick={() => updateInquiryStatus(inquiry.id, 'closed')}
                                        disabled={updating === inquiry.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Close Inquiry
                                    </button>
                                )}
                                <Link
                                    href={`/properties/${inquiry.property_id}`}
                                    className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Property
                                </Link>
                                {inquiry.user_email && (
                                    <a
                                        href={`mailto:${inquiry.user_email}?subject=Regarding your inquiry about ${inquiry.property_title}&body=Dear Customer,%0D%0A%0D%0AThank you for your inquiry about ${inquiry.property_title}.%0D%0A%0D%0A${inquiry.message}%0D%0A%0D%0ABest regards,%0D%0AReal Estate Team`}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Reply via Email
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}