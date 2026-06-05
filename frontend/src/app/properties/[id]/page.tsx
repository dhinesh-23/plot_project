'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, Bed, Bath, Square, Eye, Calendar, 
  DollarSign, Home, Building2, ChevronLeft, 
  Heart, Share2, Phone, Mail, MessageCircle,
  ArrowRight, TrendingUp, Shield, Award
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number | string;
  city: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  property_type: string;
  transaction_type: string;
  views_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
}

interface SimilarProperty {
  id: string;
  title: string;
  price: number | string;
  city: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  property_type: string;
  transaction_type: string;
  owner_name?: string;
}

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [similarProperties, setSimilarProperties] = useState<SimilarProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:5001/api';

  useEffect(() => {
    if (id) {
      fetchProperty();
      fetchSimilarProperties();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await fetch(`${API_URL}/properties/${id}`);
      const data = await response.json();
      setProperty(data);
    } catch (error) {
      console.error('Failed to fetch property:', error);
      setError('Property not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarProperties = async () => {
    try {
      const response = await fetch(`${API_URL}/properties/similar/${id}`);
      const data = await response.json();
      setSimilarProperties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch similar properties:', error);
      setSimilarProperties([]);
    }
  };

  const sendInquiry = async () => {
    if (!inquiryMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${API_URL}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          property_id: id,
          message: inquiryMessage,
          phone: inquiryPhone
        })
      });

      if (response.ok) {
        setSent(true);
        setShowInquiry(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send inquiry');
      }
    } catch (error) {
      console.error('Failed to send inquiry:', error);
      alert('Failed to send inquiry. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Helper function to format price
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0' : numPrice.toLocaleString();
  };

  // Helper function to get numeric price
  const getNumericPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? 0 : numPrice;
  };

  const getPropertyTypeIcon = () => {
    switch(property?.property_type) {
      case 'apartment': return <Building2 className="w-5 h-5" />;
      case 'house': return <Home className="w-5 h-5" />;
      case 'villa': return <Home className="w-5 h-5" />;
      default: return <Building2 className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Loading property details...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🏠</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
        <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
        <Link href="/properties" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          <ChevronLeft className="w-5 h-5" />
          Browse Properties
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    property.property_type === 'villa' ? 'bg-purple-100 text-purple-700' :
                    property.property_type === 'apartment' ? 'bg-blue-100 text-blue-700' :
                    property.property_type === 'house' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {property.property_type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    property.transaction_type === 'sale' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'
                  }`}>
                    {property.transaction_type === 'sale' ? 'For Sale' : 'For Rent'}
                  </span>
                  {property.status === 'active' && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                <div className="flex items-center gap-2 mt-2 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{property.location}, {property.city}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  ₹{formatPrice(property.price)}
                  {property.transaction_type === 'rent' && <span className="text-lg">/month</span>}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <Eye className="w-4 h-4" />
                  <span>{property.views_count || 0} views</span>
                </div>
              </div>
            </div>

            {/* Image Placeholder - You can add actual images later */}
            <div className="relative h-64 md:h-96 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mb-6">
              <Home className="w-24 h-24 text-white/30" />
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
            </div>

            {/* Property Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Bed className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="font-semibold text-gray-900">{property.bedrooms || 0}</div>
                <div className="text-xs text-gray-500">Bedrooms</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Bath className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="font-semibold text-gray-900">{property.bathrooms || 0}</div>
                <div className="text-xs text-gray-500">Bathrooms</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Square className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="font-semibold text-gray-900">{property.area_sqft || 0}</div>
                <div className="text-xs text-gray-500">Sq Ft</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="font-semibold text-gray-900">{formatDate(property.created_at)}</div>
                <div className="text-xs text-gray-500">Listed On</div>
              </div>
            </div>

            {/* Key Features */}
            <div className="mt-6 pt-6 border-t">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Verified Property</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>Premium Listing</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>Price Negotiable</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Home className="w-4 h-4 text-orange-600" />
                  <span>Ready to Move</span>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Properties */}
          {similarProperties.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Similar Properties</h2>
                <Link href="/properties" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {similarProperties.map((similar) => (
                  <div
                    key={similar.id}
                    onClick={() => router.push(`/properties/${similar.id}`)}
                    className="border rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition">
                          {similar.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{similar.location}, {similar.city}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span>{similar.bedrooms || 0} beds</span>
                          <span>{similar.bathrooms || 0} baths</span>
                          <span>{similar.area_sqft || 0} sqft</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">
                          ₹{formatPrice(similar.price)}
                          {similar.transaction_type === 'rent' && <span className="text-xs">/mo</span>}
                        </div>
                        <span className="text-xs text-gray-500 capitalize">{similar.property_type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Contact Owner Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Owner</h2>
            
            {property.owner_name && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {property.owner_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{property.owner_name}</p>
                    <p className="text-xs text-gray-500">Property Owner</p>
                  </div>
                </div>
              </div>
            )}

            {!showInquiry ? (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const token = localStorage.getItem('accessToken');
                    if (!token) {
                      router.push('/login');
                      return;
                    }
                    setShowInquiry(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Inquire Now
                </button>
                
                {property.owner_phone && (
                  <a
                    href={`tel:${property.owner_phone}`}
                    className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    Call {property.owner_phone}
                  </a>
                )}
                
                {property.owner_email && (
                  <a
                    href={`mailto:${property.owner_email}`}
                    className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    Send Email
                  </a>
                )}
              </div>
            ) : sent ? (
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-green-600 text-4xl mb-2">✓</div>
                <p className="text-green-700 font-medium">Inquiry Sent!</p>
                <p className="text-sm text-green-600 mt-1">The owner will contact you soon.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Message *</label>
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="I'm interested in this property. Please share more details..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Phone (Optional)</label>
                  <input
                    type="tel"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 1234567890"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowInquiry(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendInquiry}
                    disabled={sending}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Share Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Share This Property</h3>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: property.title, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }
                }}
                className="flex-1 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}
                className="flex-1 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}