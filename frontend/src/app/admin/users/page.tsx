'use client';

import { useEffect, useState } from 'react';
import { User, Shield, Trash2, RefreshCw, Star } from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    role: string;
    created_at: string;
    updated_at: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const API_URL = 'http://localhost:5001/api';

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('accessToken');
            
            if (!token) {
                setError('No authentication token found. Please login again.');
                setLoading(false);
                return;
            }
            
            const response = await fetch(`${API_URL}/admin/users`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setUsers(data.users);
            } else {
                setError(data.error || 'Failed to fetch users');
                // If token expired, redirect to login
                if (response.status === 403 || response.status === 401) {
                    setTimeout(() => {
                        localStorage.clear();
                        window.location.href = '/login';
                    }, 2000);
                }
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Connection error. Please make sure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const updateUserRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        setUpdating(userId);
        
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setUsers(users.map(user => 
                    user.id === userId ? { ...user, role: newRole } : user
                ));
                alert(`✅ User role updated to ${newRole}`);
            } else {
                alert(data.error || 'Failed to update role');
            }
        } catch (error) {
            console.error('Update role error:', error);
            alert('Failed to update role. Please try again.');
        } finally {
            setUpdating(null);
        }
    };

    const deleteUser = async (userId: string, userName: string) => {
        if (confirm(`⚠️ Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
            setDeleting(userId);
            
            try {
                const token = localStorage.getItem('accessToken');
                const response = await fetch(`${API_URL}/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    setUsers(users.filter(user => user.id !== userId));
                    alert(`✅ ${userName} has been deleted successfully`);
                } else {
                    alert(data.error || 'Failed to delete user');
                }
            } catch (error) {
                console.error('Delete error:', error);
                alert('Failed to delete user. Please try again.');
            } finally {
                setDeleting(null);
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl">
                <p className="font-semibold">Error</p>
                <p>{error}</p>
                <button 
                    onClick={fetchUsers}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6 pt-20">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
                    <p className="text-gray-600 mt-1">View and manage all registered users</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                >
                    <RefreshCw className="w-5 h-5" />
                    <span>Refresh</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{user.full_name}</span>
                                            {user.role === 'admin' && (
                                                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 flex items-center">
                                                    <Star className="w-3 h-3 mr-0.5" />
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{user.phone || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                            user.role === 'admin' 
                                                ? 'bg-purple-100 text-purple-700' 
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => updateUserRole(user.id, user.role)}
                                                disabled={updating === user.id}
                                                className={`p-2 rounded-lg transition ${
                                                    user.role === 'admin' 
                                                        ? 'text-orange-600 hover:bg-orange-50' 
                                                        : 'text-blue-600 hover:bg-blue-50'
                                                } disabled:opacity-50`}
                                                title={user.role === 'admin' ? 'Remove admin privileges' : 'Make admin'}
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteUser(user.id, user.full_name)}
                                                disabled={deleting === user.id}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                                title="Delete user"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {users.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                </div>
            )}
        </div>
    );
}