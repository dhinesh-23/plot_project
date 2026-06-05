'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Home, Users, MessageSquare, Eye, TrendingUp, DollarSign } from 'lucide-react';

interface Stats {
    totalProperties: number;
    totalUsers: number;
    totalInquiries: number;
    totalViews: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalProperties: 0,
        totalUsers: 0,
        totalInquiries: 0,
        totalViews: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentProperties, setRecentProperties] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const properties = await api.getProperties();
                setStats({
                    totalProperties: properties.data.data.length,
                    totalUsers: 2,
                    totalInquiries: 0,
                    totalViews: properties.data.data.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0)
                });
                setRecentProperties(properties.data.data.slice(0, 5));
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const statCards = [
        { title: 'Total Properties', value: stats.totalProperties, icon: Home, color: 'bg-blue-500' },
        { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-green-500' },
        { title: 'Total Inquiries', value: stats.totalInquiries, icon: MessageSquare, color: 'bg-purple-500' },
        { title: 'Total Views', value: stats.totalViews, icon: Eye, color: 'bg-orange-500' },
    ];

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
    }

    return (
        <div className='pt-20'>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back to your admin panel</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => (
                    <div key={stat.title} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                            </div>
                            <div className={`${stat.color} p-3 rounded-xl`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Properties */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Properties</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {recentProperties.map((property: any) => (
                                <tr key={property.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{property.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{property.city}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">₹{property.price.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{property.views_count || 0}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 capitalize">
                                            {property.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}