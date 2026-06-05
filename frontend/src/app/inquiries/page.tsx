'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Eye, Calendar, Clock, ChevronRight, RefreshCw } from 'lucide-react';

interface Inquiry {
    id: string;
    property_id: string;
    property_title: string;
    message: string;
    phone: string;
    status: 'pending' | 'responded' | 'closed';
    created_at: string;
}

export default function InquiriesPage() {
    const router = useRouter();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const API_URL = 'http://localhost:5001/api';

    const fetchInquiries = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await fetch(`${API_URL}/inquiries/my-inquiries`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setInquiries(Array.isArray(data) ? data : []);
                setError('');
            } else {
                setError(data.error || 'Failed to fetch inquiries');
            }
        } catch (err) {
            console.error('Fetch inquiries error:', err);
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, []);

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Inquiries</h1>
                    <p className="text-gray-600 mt-1">Track all your property inquiries</p>
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

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
                    {error}
                </div>
            )}

            {inquiries.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No inquiries yet</h3>
                    <p className="text-gray-500 mb-6">You haven't made any property inquiries yet.</p>
                    <Link
                        href="/properties"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                    >
                        Browse Properties
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                        <div
                            key={inquiry.id}
                            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-6"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <Link
                                    href={`/properties/${inquiry.property_id}`}
                                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition"
                                >
                                    {inquiry.property_title || 'Property'}
                                </Link>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                                    {getStatusText(inquiry.status)}
                                </span>
                            </div>
                            
                            <p className="text-gray-600 mb-4 line-clamp-2">{inquiry.message}</p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(inquiry.created_at)}
                                </span>
                                {inquiry.phone && (
                                    <span className="flex items-center gap-1">
                                        <span>📞</span>
                                        {inquiry.phone}
                                    </span>
                                )}
                            </div>
                            
                            <div className="mt-4 pt-3 border-t flex justify-end">
                                <Link
                                    href={`/properties/${inquiry.property_id}`}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                                >
                                    View Property
                                    <Eye className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}