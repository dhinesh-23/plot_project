'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Home, 
  MessageSquare, 
  Eye, 
  TrendingUp, 
  PlusCircle,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Calendar,
  MapPin,
  DollarSign,
  Heart,
  Star,
  Clock,
  ArrowUpRight,
  Building2,
  PhoneCall,
  Mail
} from 'lucide-react';
import { getStoredUser, clearAuth } from '@/lib/auth';

interface Activity {
  id: string;
  type: 'view' | 'inquiry' | 'property';
  title: string;
  time: string;
  status?: string;
}
interface Property {
  id: string;
  title: string;
  price: number;
  city: string;
  views_count: number;
  status: string;
  created_at: string;
  description?: string;
  location?: string;
  property_type?: string;
  transaction_type?: string;
  bedrooms?: number;      
  bathrooms?: number;     
  area_sqft?: number;     
  user_id?: string;
}

interface Inquiry {
  id: string;
  property_id?: string;
  property_title: string;
  message: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(getStoredUser());
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showSimilarModal, setShowSimilarModal] = useState(false);

  const stats = {
    totalViews: myProperties.reduce((sum, p) => sum + (p.views_count || 0), 0),
    totalProperties: myProperties.length,
    totalInquiries: myInquiries.length,
    engagement: myProperties.length > 0 ? Math.round((myInquiries.length / myProperties.length) * 100) : 0
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    const fetchData = async () => {
      try {
        const API_URL = 'http://localhost:5001/api';
        const token = localStorage.getItem('accessToken');
        
        // Fetch properties
        const propertiesRes = await fetch(`${API_URL}/properties`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const propertiesData = await propertiesRes.json();
        
        // Filter properties owned by user
        const allProperties = propertiesData.data || [];
        const userProperties = allProperties.filter((p: any) => p.user_id === user?.id);
        
        // Fetch user's inquiries
        let userInquiries: Inquiry[] = [];
        try {
          const inquiriesRes = await fetch(`${API_URL}/inquiries/my-inquiries`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const inquiriesData = await inquiriesRes.json();
          userInquiries = Array.isArray(inquiriesData) ? inquiriesData : [];
        } catch (err) {
          console.error('Failed to fetch inquiries:', err);
          userInquiries = [];
        }
        
        setMyProperties(userProperties);
        setMyInquiries(userInquiries);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setMyProperties([]);
        setMyInquiries([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, router]);

  const fetchSimilarProperties = async (propertyId: string) => {
    try {
      const API_URL = 'http://localhost:5001/api';
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_URL}/properties/similar/${propertyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Ensure data is an array
      const similar = Array.isArray(data) ? data : data.data || [];
      setSimilarProperties(similar);
    } catch (error) {
      console.error('Failed to fetch similar properties:', error);
      setSimilarProperties([]);
    }
  };

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  const handleSimilarClick = async (property: Property) => {
    setSelectedProperty(property);
    await fetchSimilarProperties(property.id);
    setShowSimilarModal(true);
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const statCards = [
    { 
      title: 'My Properties', 
      value: stats.totalProperties, 
      icon: Building2, 
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: '/my-properties',
      onClick: () => router.push('/my-properties')
    },
    { 
      title: 'Total Views', 
      value: stats.totalViews, 
      icon: Eye, 
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      link: '/my-properties',
      onClick: () => router.push('/my-properties')
    },
    { 
      title: 'Inquiries', 
      value: stats.totalInquiries, 
      icon: MessageSquare, 
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      link: '/inquiries',
      onClick: () => router.push('/inquiries')
    },
    { 
      title: 'Engagement Rate', 
      value: `${stats.engagement}%`, 
      icon: TrendingUp, 
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      link: '/analytics',
      onClick: () => router.push('/analytics')
    },
  ];

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'view': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'inquiry': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'property': return <Home className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-20">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!</h1>
                <p className="text-white/80 text-sm">Here's what's happening with your properties</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/profile/settings"
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid - Clickable Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <button
            key={stat.title}
            onClick={stat.onClick}
            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group text-left w-full cursor-pointer"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className={`h-1 w-full ${stat.bgColor} group-hover:h-1.5 transition-all duration-300`}></div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/properties/create"
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
              <PlusCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">List Property</p>
              <p className="text-xs text-gray-500">Add new listing</p>
            </div>
          </Link>
          <Link 
            href="/properties"
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50 transition group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
              <Home className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Browse</p>
              <p className="text-xs text-gray-500">Find properties</p>
            </div>
          </Link>
          <Link 
            href="/inquiries"
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Messages</p>
              <p className="text-xs text-gray-500">Check inquiries</p>
            </div>
          </Link>
          <Link 
            href="/analytics"
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition group"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Analytics</p>
              <p className="text-xs text-gray-500">View insights</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Properties and Inquiries Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Properties - Clickable Cards */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              My Properties
            </h2>
            <Link href="/my-properties" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {myProperties.length === 0 ? (
              <div className="p-12 text-center">
                <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">You haven't listed any properties yet.</p>
                <Link href="/properties/create" className="inline-block mt-3 text-blue-600 hover:text-blue-700">
                  List your first property →
                </Link>
              </div>
            ) : (
              myProperties.slice(0, 3).map((property) => (
                <div key={property.id} className="block hover:bg-gray-50 transition">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <button
                        onClick={() => handlePropertyClick(property.id)}
                        className="flex-1 text-left cursor-pointer"
                      >
                        <h3 className="font-medium text-gray-900 hover:text-blue-600 transition">
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {property.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ₹{property.price.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {property.views_count} views
                          </span>
                        </div>
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSimilarClick(property)}
                          className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
                          title="Find Similar Properties"
                        >
                          Find Similar
                        </button>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          property.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {property.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Inquiries - Clickable */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              Recent Inquiries
            </h2>
            <Link href="/inquiries" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {!myInquiries || myInquiries.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No inquiries yet.</p>
                <Link href="/properties" className="inline-block mt-3 text-blue-600 hover:text-blue-700">
                  Browse properties →
                </Link>
              </div>
            ) : (
              myInquiries.slice(0, 3).map((inquiry) => (
                <div key={inquiry.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <button
                        onClick={() => inquiry.property_id && handlePropertyClick(inquiry.property_id)}
                        className="text-left cursor-pointer"
                      >
                        <h3 className="font-medium text-gray-900 hover:text-blue-600 transition">
                          {inquiry.property_title || 'Property'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{inquiry.message}</p>
                      </button>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {inquiry.created_at ? new Date(inquiry.created_at).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      inquiry.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {inquiry.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Similar Properties Modal */}
      {showSimilarModal && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Similar to "{selectedProperty.title}"
              </h2>
              <button
                onClick={() => setShowSimilarModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {similarProperties.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No similar properties found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {similarProperties.map((property) => (
                    <div
                      key={property.id}
                      onClick={() => {
                        setShowSimilarModal(false);
                        handlePropertyClick(property.id);
                      }}
                      className="border rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{property.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{property.location}, {property.city}</p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                            <span>{property.bedrooms ?? 0} beds</span>
                            <span>{property.bathrooms ?? 0} baths</span>
                            <span>{property.area_sqft ?? 0} sqft</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600">
                            ₹{property.price.toLocaleString()}
                            {property.transaction_type === 'rent' && '/month'}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{property.property_type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Pro Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-blue-600 font-bold">1</span>
            </div>
            <p className="text-sm text-gray-700">Add high-quality photos to get more views</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-blue-600 font-bold">2</span>
            </div>
            <p className="text-sm text-gray-700">Respond to inquiries quickly to build trust</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-blue-600 font-bold">3</span>
            </div>
            <p className="text-sm text-gray-700">Keep your property details up to date</p>
          </div>
        </div>
      </div>
    </div>
  );
}