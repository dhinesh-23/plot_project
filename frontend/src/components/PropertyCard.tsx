import Link from 'next/link';
import { MapPin, Bed, Bath, Square, Eye, Heart, Home } from 'lucide-react';
import { Property } from '@/types';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const getPriceDisplay = () => {
    if (property.transaction_type === 'rent') {
      return `₹${property.price.toLocaleString()}/month`;
    }
    return `₹${property.price.toLocaleString()}`;
  };

  const getPropertyTypeColor = () => {
    const colors = {
      apartment: 'bg-blue-100 text-blue-700',
      house: 'bg-green-100 text-green-700',
      villa: 'bg-purple-100 text-purple-700',
      land: 'bg-orange-100 text-orange-700',
      commercial: 'bg-pink-100 text-pink-700',
    };
    return colors[property.property_type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="property-card bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
      {/* Image Placeholder */}
      <div className="relative h-56 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <Home className="w-16 h-16 text-white/30" />
        <button className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition">
          <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
        </button>
        <span className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${getPropertyTypeColor()}`}>
          {property.property_type}
        </span>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition">
            <Link href={`/properties/${property.id}`}>{property.title}</Link>
          </h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{getPriceDisplay()}</div>
            <div className="text-xs text-gray-500 capitalize">{property.transaction_type}</div>
          </div>
        </div>

        <div className="flex items-center text-gray-500 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{property.location}, {property.city}</span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {property.description}
        </p>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex space-x-4">
            <div className="flex items-center text-gray-600 text-sm">
              <Bed className="w-4 h-4 mr-1" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <Bath className="w-4 h-4 mr-1" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <Square className="w-4 h-4 mr-1" />
              <span>{property.area_sqft} sqft</span>
            </div>
          </div>
          <div className="flex items-center text-gray-500 text-xs">
            <Eye className="w-3 h-3 mr-1" />
            <span>{property.views_count} views</span>
          </div>
        </div>
      </div>
    </div>
  );
}