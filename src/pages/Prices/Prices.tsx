import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, MapPin, Calendar,
  TrendingUp, ThumbsUp, ThumbsDown, Eye,
  Package, Clock, Users
} from 'lucide-react';
import { priceAPI, productAPI, regionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Price {
  _id: string;
  product: {
    _id: string;
    name: string;
    category: string;
    unit: string;
  };
  price: number;
  region: string;
  market: string;
  quality: string;
  reportedBy: {
    name: string;
    role: string;
  };
  votes: {
    upvotes: any[];
    downvotes: any[];
  };
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
  category: string;
  unit: string;
}

const Prices: React.FC = () => {
  const { user } = useAuth();
  const [prices, setPrices] = useState<Price[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    product: '',
    region: '',
    quality: '',
    sortBy: 'createdAt',
    order: 'desc'
  });

  // New price form
  const [newPrice, setNewPrice] = useState({
    productId: '',
    region: '',
    market: '',
    price: '',
    unit: '',
    quality: 'standard',
    notes: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const [productsRes, regionsRes] = await Promise.all([
        productAPI.getAll(),
        regionAPI.getAll()
      ]);
      
      setProducts(productsRes.data.products);
      setRegions(regionsRes.data.regions);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const response = await priceAPI.getAll({
        product: filters.product,
        region: filters.region,
        quality: filters.quality,
        sortBy: filters.sortBy,
        order: filters.order,
        limit: 50
      });
      
      let filteredPrices = response.data.prices;
      
      // Client-side search filter
      if (filters.search) {
        filteredPrices = filteredPrices.filter(price =>
          price.product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          price.market.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      setPrices(filteredPrices);
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('Error during price loading');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await priceAPI.create({
        ...newPrice,
        price: parseFloat(newPrice.price)
      });
      
      toast.success('Price added successfully!');
      setShowAddModal(false);
      setNewPrice({
        productId: '',
        region: '',
        market: '',
        price: '',
        unit: '',
        quality: 'standard',
        notes: ''
      });
      fetchPrices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error during addition');
    }
  };

  const handleVote = async (priceId: string, type: 'upvote' | 'downvote') => {
    try {
      await priceAPI.vote(priceId, type);
      fetchPrices();
      toast.success('Vote saved!');
    } catch (error) {
      toast.error('Error during vote');
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'premium': return 'text-green-600 bg-green-50 border-green-200';
      case 'standard': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cereals': return '🌾';
      case 'fruits': return '🍎';
      case 'vegetables': return '🥬';
      case 'tubers': return '🥔';
      case 'legumes': return '🫘';
      case 'cash_crops': return '☕';
      default: return '🌱';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Prices</h1>
          <p className="text-gray-600">Consult and signal market prices</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Signal a price</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Product Filter */}
          <select
            value={filters.product}
            onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All products</option>
            {products.map(product => (
              <option key={product._id} value={product._id}>
                {product.name}
              </option>
            ))}
          </select>

          {/* Region Filter */}
          <select
            value={filters.region}
            onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All regions</option>
            {regions.map(region => (
              <option key={region.name} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>

          {/* Quality Filter */}
          <select
            value={filters.quality}
            onChange={(e) => setFilters(prev => ({ ...prev, quality: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All qualities</option>
            <option value="premium">Premium</option>
            <option value="standard">Standard</option>
            <option value="low">low</option>
          </select>

          {/* Sort */}
          <select
            value={`${filters.sortBy}-${filters.order}`}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split('-');
              setFilters(prev => ({ ...prev, sortBy, order }));
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="createdAt-desc">more recentt</option>
            <option value="createdAt-asc">more old</option>
            <option value="price-desc">descending price</option>
            <option value="price-asc">ascending price</option>
          </select>
        </div>
      </div>

      {/* Prices List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : prices.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No prices found within this filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {prices.map((price, index) => (
              <motion.div
                key={price._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">
                      {getCategoryIcon(price.product.category)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {price.product.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getQualityColor(price.quality)}`}>
                          {price.quality}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{price.market}, {price.region}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>par {price.reportedBy.name} ({price.reportedBy.role})</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(price.createdAt), 'PPp', { locale: fr })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {price.price.toLocaleString()} FCFA
                      </p>
                      <p className="text-sm text-gray-600">
                        par {price.product.unit}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVote(price._id, 'upvote')}
                        className="flex items-center space-x-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span className="font-medium">{price.votes.upvotes.length}</span>
                      </button>
                      <button
                        onClick={() => handleVote(price._id, 'downvote')}
                        className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span className="font-medium">{price.votes.downvotes.length}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Price Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Signal a price</h2>
            
            <form onSubmit={handleAddPrice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product
                </label>
                <select
                  value={newPrice.productId}
                  onChange={(e) => setNewPrice(prev => ({ ...prev, productId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} ({product.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <select
                    value={newPrice.region}
                    onChange={(e) => setNewPrice(prev => ({ ...prev, region: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Choose</option>
                    {regions.map(region => (
                      <option key={region.name} value={region.name}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Market
                  </label>
                  <input
                    type="text"
                    value={newPrice.market}
                    onChange={(e) => setNewPrice(prev => ({ ...prev, market: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="market name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (FCFA)
                  </label>
                  <input
                    type="number"
                    value={newPrice.price}
                    onChange={(e) => setNewPrice(prev => ({ ...prev, price: e.target.value }))}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality
                  </label>
                  <select
                    value={newPrice.quality}
                    onChange={(e) => setNewPrice(prev => ({ ...prev, quality: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="premium">Premium</option>
                    <option value="standard">Standard</option>
                    <option value="low">low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnal)
                </label>
                <textarea
                  value={newPrice.notes}
                  onChange={(e) => setNewPrice(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Additional informations..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Publish
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Prices;