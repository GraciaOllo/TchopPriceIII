import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sprout, TrendingUp, Users, Shield, 
  Search, Package, MapPin, Star,
  ArrowRight, Eye, Filter
} from 'lucide-react';
import axios from 'axios';
import TchopPrice from '../../public/images/TchopPrice icon.png';

interface Product {
  _id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  isActive: boolean;
  farmer: {
    name: string;
    region: string;
  };
  location: {
    region: string;
    city: string;
  };
  createdAt: string;
}

interface Price {
  _id: string;
  product: {
    name: string;
    category: string;
    unit: string;
  };
  price: number;
  region: string;
  market: string;
  quality: string;
  createdAt: string;
}

const PublicLanding: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [latestPrices, setLatestPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = [
    { value: 'cereals', label: 'Cereals', icon: '🌾' },
    { value: 'legumes', label: 'Legumes', icon: '🫘' },
    { value: 'tubers', label: 'Tubers', icon: '🥔' },
    { value: 'fruits', label: 'Fruits', icon: '🍎' },
    { value: 'vegetables', label: 'Vegetables', icon: '🥬' },
    { value: 'spices', label: 'Spices', icon: '🌶️' },
    { value: 'cash_crops', label: 'Cash Crops', icon: '☕' }
  ];

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    try {
      setLoading(true);
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      // Fetch recent products without authentication
      const productsResponse = await axios.get(`${BASE_URL}/products/recent?limit=7`);
      setProducts(productsResponse.data.products);

      // Fetch latest prices without authentication
      const pricesResponse = await axios.get(`${BASE_URL}/prices/latest?limit=6`);
      setLatestPrices(pricesResponse.data.prices);
    } catch (error) {
      console.error('Error fetching public data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || { label: category, icon: '🌱' };
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'premium': return 'text-green-600 bg-green-50 border-green-200';
      case 'standard': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && product.isActive;
  });

  const stats = [
    { label: 'Available Products', value: products.length, icon: Package },
    { label: 'Updated Prices', value: latestPrices.length, icon: TrendingUp },
    { label: 'Regions Covered', value: '10', icon: MapPin },
    { label: 'Active Farmers', value: '500+', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
            <div className="bg-green-500 p-.5 rounded-lg">
              <img 
                src={TchopPrice} 
                alt="TchopPrice" 
                className="h-6 w-6 object-contain"
              />
            </div>
              <span className="text-xl font-bold text-gray-900">
                TchopPrice <span className="text-green-600">|||</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-500 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Real-Time Agricultural Prices
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-3xl mx-auto">
              Discover current prices of agricultural products in Cameroon. 
              Reliable information for farmers and buyers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                Join the Community
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors flex items-center justify-center"
              >
                <Eye className="mr-2 h-5 w-5" />
                View Products
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                  <p className="text-gray-600">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest Prices Preview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Latest Market Prices
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Check the most recent prices reported by our community of farmers and buyers.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestPrices.map((price, index) => (
                <motion.div
                  key={price._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl">
                      {getCategoryInfo(price.product.category).icon}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getQualityColor(price.quality)}`}>
                      {price.quality}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {price.product.name}
                  </h3>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>{price.market}, {price.region}</span>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {price.price.toLocaleString()} FCFA
                    </p>
                    <p className="text-sm text-gray-600">
                      per {price.product.unit}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/login"
              className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
            >
              View All Prices
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Products Section */}
      <section id="products" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Recent Products
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover the 7 most recently added products by our farmers.
            </p>
          </motion.div>

          {/* Filters */}
          <div className="mb-8 flex flex-col md:flex-row gap-4 justify-center">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for a product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => {
                const categoryInfo = getCategoryInfo(product.category);
                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-3xl">{categoryInfo.icon}</div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {categoryInfo.label}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {product.name}
                      </h3>
                      
                      <div className="text-xl font-bold text-green-600 mb-3">
                        {product.price.toLocaleString()} FCFA/{product.unit}
                      </div>

                      {product.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">{product.farmer.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-600">{product.location.city}, {product.location.region}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Recent</span>
                        <div className="flex items-center text-green-600">
                          <Star className="h-4 w-4 mr-1" />
                          <span className="font-medium">Available</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/login"
              className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
            >
              View All Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Join the TchopPrice Community
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              Access detailed information, report prices, and connect with other farmers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-green-600 p-2 rounded-lg">
                  <Sprout className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">
                  TchopPrice <span className="text-green-400">|||</span>
                </span>
              </div>
              <p className="text-gray-400">
                Agricultural pricing platform for Cameroonian farmers.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Products</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Real-time Prices</li>
                <li>Market Trends</li>
                <li>Price Alerts</li>
                <li>Historical Data</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Farmers</li>
                <li>Cooperative Buyers</li>
                <li>Buyers</li>
                <li>Partners</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact</li>
                <li>Documentation</li>
                <li>API</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 TchopPrice . All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLanding;