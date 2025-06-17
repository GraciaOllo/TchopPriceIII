import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Users, Package, 
  AlertCircle, Eye, ThumbsUp, ThumbsDown, 
  MapPin, Clock, Filter, BarChart3, DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { priceAPI, productAPI, marketDataAPI } from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  reportedBy: {
    name: string;
    role: string;
  };
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  createdAt: string;
}

interface MarketSummary {
  [key: string]: {
    currentPrice: number;
    change: number;
    changePercent: number;
    currency: string;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [latestPrices, setLatestPrices] = useState<Price[]>([]);
  const [marketSummary, setMarketSummary] = useState<MarketSummary>({});
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [stats, setStats] = useState({
    totalPrices: 0,
    totalProducts: 0,
    averagePrice: 0,
    priceChange: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, [selectedRegion]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch latest prices
      const pricesResponse = await priceAPI.getLatest({ 
        region: selectedRegion,
        limit: 10 
      });
      setLatestPrices(pricesResponse.data.prices);

      // Fetch basic stats
      const allPricesResponse = await priceAPI.getAll({ limit: 100 });
      const productsResponse = await productAPI.getAll();
      
      setStats({
        totalPrices: allPricesResponse.data.pagination.total,
        totalProducts: productsResponse.data.products.length,
        averagePrice: calculateAveragePrice(allPricesResponse.data.prices),
        priceChange: Math.random() * 20 - 10 // Mock data
      });

      // Fetch market summary for cash crops
      if (user) {
        try {
          const marketResponse = await marketDataAPI.getSummary();
          setMarketSummary(marketResponse.data.summary);
        } catch (error) {
          console.error('Error fetching market data:', error);
        }
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAveragePrice = (prices: Price[]) => {
    if (prices.length === 0) return 0;
    const sum = prices.reduce((acc, price) => acc + price.price, 0);
    return Math.round(sum / prices.length);
  };

  const handleVote = async (priceId: string, type: 'upvote' | 'downvote') => {
    try {
      await priceAPI.vote(priceId, type);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'premium': return 'text-green-600 bg-green-50';
      case 'standard': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
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

  const getCashCropIcon = (crop: string) => {
    switch (crop) {
      case 'coffee': return '☕';
      case 'cocoa': return '🍫';
      case 'cotton': return '🌾';
      case 'sugar': return '🍯';
      case 'palm_oil': return '🌴';
      default: return '🌱';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {user?.name}! 👋
        </h1>
        <p className="text-green-100 mb-4">
          Here's an overview of the latest market prices in your region ({user?.region})
        </p>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>{user?.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="capitalize">{user?.role}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(), 'PPP', { locale: fr })}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Price Reports</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPrices}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Price</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averagePrice} FCFA</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Price Change</p>
              <p className={`text-2xl font-bold ${stats.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.priceChange >= 0 ? '+' : ''}{stats.priceChange.toFixed(1)}%
              </p>
            </div>
            <div className={`${stats.priceChange >= 0 ? 'bg-green-50' : 'bg-red-50'} p-3 rounded-lg`}>
              {stats.priceChange >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Cash Crops Market Summary */}
      {Object.keys(marketSummary).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-6 w-6 mr-2" />
              Global Cash Crop Prices (Nasdaq)
            </h2>
            <p className="text-gray-600 text-sm mt-1">Real-time international market prices</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(marketSummary).map(([crop, data]) => (
                <div key={crop} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{getCashCropIcon(crop)}</span>
                    <span className={`text-sm font-medium ${
                      data.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.change >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 capitalize mb-1">
                    {crop.replace('_', ' ')}
                  </h3>
                  <p className="text-lg font-bold text-gray-900">
                    ${data.currentPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">{data.currency}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Latest Prices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Latest Market Prices
            </h2>
            <div className="flex items-center space-x-3">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="">All Regions</option>
                <option value="Centre">Centre</option>
                <option value="Littoral">Littoral</option>
                <option value="West">West</option>
                <option value="North">North</option>
                <option value="South">South</option>
              </select>
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="p-6">
          {latestPrices.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No prices available at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {latestPrices.map((price, index) => (
                <motion.div
                  key={price._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {getCategoryIcon(price.product.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {price.product.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{price.market}, {price.region}</span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(price.quality)}`}>
                          {price.quality}
                        </span>
                        <span>•</span>
                        <span>{format(new Date(price.createdAt), 'PPp', { locale: fr })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {price.price.toLocaleString()} FCFA
                      </p>
                      <p className="text-sm text-gray-600">
                        per {price.product.unit}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVote(price._id, 'upvote')}
                        className="flex items-center space-x-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-xs">{price.votes.upvotes.length}</span>
                      </button>
                      <button
                        onClick={() => handleVote(price._id, 'downvote')}
                        className="flex items-center space-x-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span className="text-xs">{price.votes.downvotes.length}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;