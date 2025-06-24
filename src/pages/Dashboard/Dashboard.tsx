import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Users, Package, 
  AlertCircle, Eye, ThumbsUp, ThumbsDown, 
  MapPin, Clock, Filter, BarChart3, DollarSign,
  Plus, MessageCircle, Star, CheckCircle, Phone, Mail, User,
  ShoppingCart, Send, Reply, CreditCard, Wallet
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { priceAPI, productAPI, marketDataAPI } from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

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
    upvotes: any[];
    downvotes: any[];
  };
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  quantity: number;
  status: string;
  farmer: {
    _id: string;
    name: string;
    email: string;
    role: string;
    region: string;
  };
  contactPhone: string;
  contactEmail: string;
  location: {
    region: string;
    city: string;
    address: string;
  };
  votes: {
    upvotes: any[];
    downvotes: any[];
  };
  createdAt: string;
}

interface Contact {
  _id: string;
  buyer: {
    name: string;
    email: string;
  };
  product: {
    name: string;
  };
  message: string;
  status: string;
  farmerResponse?: string;
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
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [marketSummary, setMarketSummary] = useState<MarketSummary>({});
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactMessage, setContactMessage] = useState({
    message: '',
    buyerPhone: '',
    buyerEmail: ''
  });
  const [orderDetails, setOrderDetails] = useState({
    quantity: 1,
    totalAmount: 0
  });
  const [paymentDetails, setPaymentDetails] = useState({
    phone: '',
    amount: 0,
    description: ''
  });
  const [responseMessage, setResponseMessage] = useState('');
  const [stats, setStats] = useState({
    totalPrices: 0,
    totalProducts: 0,
    myProductsCount: 0,
    pendingContacts: 0,
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

      // Fetch farmer-specific data
      if (user?.role === 'farmer') {
        const myProductsResponse = await productAPI.getMyProducts({ limit: 5 });
        setMyProducts(myProductsResponse.data.products);

        const contactsResponse = await productAPI.getContacts({ 
          limit: 10 
        });
        setContacts(contactsResponse.data.contacts);
      }

      // Fetch all approved products for buyers
      if (user?.role === 'buyer') {
        const allProductsResponse = await productAPI.getAll({ 
          status: 'approved',
          limit: 8 
        });
        setAllProducts(allProductsResponse.data.products);
      }

      // Fetch basic stats
      const allPricesResponse = await priceAPI.getAll({ limit: 100 });
      const productsResponse = await productAPI.getAll();
      
      setStats({
        totalPrices: allPricesResponse.data.pagination.total,
        totalProducts: productsResponse.data.products.length,
        myProductsCount: user?.role === 'farmer' ? myProducts.length : 0,
        pendingContacts: user?.role === 'farmer' ? contacts.filter(c => c.status === 'pending').length : 0,
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

  const handleVote = async (productId: string, type: 'upvote' | 'downvote') => {
    try {
      await productAPI.vote(productId, type);
      fetchDashboardData(); // Refresh data
      toast.success('Vote recorded!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error voting');
    }
  };

  const handleContactFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await productAPI.contactFarmer(selectedProduct._id, contactMessage);
      toast.success('Contact request sent!');
      setShowContactModal(false);
      setContactMessage({
        message: '',
        buyerPhone: '',
        buyerEmail: ''
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error sending contact request');
    }
  };

  const handleBuyProduct = (product: Product) => {
    setSelectedProduct(product);
    setOrderDetails({
      quantity: 1,
      totalAmount: product.price
    });
    setShowBuyModal(true);
  };

  const handleQuantityChange = (quantity: number) => {
    if (selectedProduct && quantity > 0) {
      setOrderDetails({
        quantity,
        totalAmount: selectedProduct.price * quantity
      });
    }
  };

  const handleProceedToPayment = () => {
    if (selectedProduct) {
      setPaymentDetails({
        phone: '',
        amount: orderDetails.totalAmount,
        description: `Purchase of ${orderDetails.quantity} ${selectedProduct.unit} of ${selectedProduct.name}`
      });
      setShowBuyModal(false);
      setShowPaymentModal(true);
    }
  };

  const handleCampayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Campay API integration
      const campayData = {
        amount: paymentDetails.amount.toString(),
        currency: "XAF",
        external_reference: `order_${Date.now()}`,
        phone_number: paymentDetails.phone,
        description: paymentDetails.description,
        return_url: `${window.location.origin}/payment/success`,
        failure_url: `${window.location.origin}/payment/failure`
      };

      // Mock Campay API call - In production, this would go through your backend
      toast.success('Payment initiated! Redirecting to Campay...');
      
      // Simulate payment processing
      setTimeout(() => {
        toast.success('Payment successful! Order placed.');
        setShowPaymentModal(false);
        setPaymentDetails({ phone: '', amount: 0, description: '' });
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

  const handleRespondToContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;

    try {
      await productAPI.respondToContact(selectedContact._id, { response: responseMessage });
      toast.success('Response sent successfully!');
      setResponseMessage('');
      setSelectedContact(null);
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error sending response');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
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

  const canVote = (product: Product) => {
    return product.status === 'pending' && 
           (user?.role === 'farmer' || user?.role === 'admin') && 
           product.farmer._id !== user?.id;
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
    <div className="flex">
      {/* Messages Sidebar for Farmers */}
      {user?.role === 'farmer' && (
        <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Messages
            </h2>
          </div>
          
          <div className="p-4">
            {contacts.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div 
                    key={contact._id} 
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{contact.buyer.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        contact.status === 'pending' ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'
                      }`}>
                        {contact.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Product: <span className="font-medium">{contact.product.name}</span>
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">{contact.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {format(new Date(contact.createdAt), 'PPp', { locale: fr })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 ${user?.role === 'farmer' ? 'ml-0' : ''} space-y-8 p-8`}>
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 text-white"
        >
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-green-100 mb-4">
            Here's an overview of the latest market activity in your region ({user?.region})
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

          {user?.role === 'farmer' && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">My Products</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.myProductsCount}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <Star className="h-6 w-6 text-purple-600" />
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
                    <p className="text-sm font-medium text-gray-600">Messages</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingContacts}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {user?.role === 'buyer' && (
            <>
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
            </>
          )}
        </div>

        {/* Role-specific sections */}
        {user?.role === 'farmer' && (
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            {/* My Products */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">My Products</h2>
                  <Link
                    to="/products"
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    View All →
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {myProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No products yet</p>
                    <Link
                      to="/products"
                      className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Product</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myProducts.map((product) => (
                      <div key={product._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getCategoryIcon(product.category)}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-green-600 font-medium">
                                {product.price.toLocaleString()} FCFA/{product.unit}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                                {product.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {canVote(product) && (
                            <>
                              <button
                                onClick={() => handleVote(product._id, 'upvote')}
                                className="flex items-center space-x-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <ThumbsUp className="h-4 w-4" />
                                <span className="text-xs">{product.votes.upvotes.length}</span>
                              </button>
                              <button
                                onClick={() => handleVote(product._id, 'downvote')}
                                className="flex items-center space-x-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <ThumbsDown className="h-4 w-4" />
                                <span className="text-xs">{product.votes.downvotes.length}</span>
                              </button>
                            </>
                          )}
                          {product.status === 'pending' && !canVote(product) && (
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 px-2 py-1 text-green-600 bg-green-50 rounded-lg">
                                <ThumbsUp className="h-4 w-4" />
                                <span className="text-xs">{product.votes.upvotes.length}</span>
                              </div>
                              <div className="flex items-center space-x-1 px-2 py-1 text-red-600 bg-red-50 rounded-lg">
                                <ThumbsDown className="h-4 w-4" />
                                <span className="text-xs">{product.votes.downvotes.length}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Buyer Dashboard - Available Products */}
        {user?.role === 'buyer' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Available Products</h2>
                <Link
                  to="/products"
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
            </div>

            <div className="p-6">
              {allProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No products available at the moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {allProducts.map((product) => (
                    <div key={product._id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{getCategoryIcon(product.category)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                      
                      <div className="text-lg font-bold text-green-600 mb-3">
                        {product.price.toLocaleString()} FCFA/{product.unit}
                      </div>

                      {/* Farmer Contact Info */}
                      <div className="bg-white rounded-lg p-3 mb-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">{product.farmer.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{product.contactPhone}</span>
                        </div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{product.contactEmail}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{product.location.city}, {product.location.region}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => handleBuyProduct(product)}
                          className="w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span>Buy Now</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowContactModal(true);
                          }}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>Contact Farmer</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Cash Crops Market Summary */}
        {Object.keys(marketSummary).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
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
          transition={{ delay: 0.8 }}
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
                <Link
                  to="/prices"
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View All →
                </Link>
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
                        <div className="flex items-center space-x-1 px-2 py-1 text-green-600 bg-green-50 rounded-lg">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-xs">{price.votes.upvotes.length}</span>
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-1 text-red-600 bg-red-50 rounded-lg">
                          <ThumbsDown className="h-4 w-4" />
                          <span className="text-xs">{price.votes.downvotes.length}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Buy {selectedProduct.name}
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-green-600 font-bold">{selectedProduct.price.toLocaleString()} FCFA/{selectedProduct.unit}</p>
                <p className="text-sm text-gray-600">Available: {selectedProduct.quantity} {selectedProduct.unit}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.quantity}
                  value={orderDetails.quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total Amount:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {orderDetails.totalAmount.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowBuyModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToPayment}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Proceed to Payment</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Modal with Campay */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Wallet className="h-6 w-6 mr-2" />
              Campay Payment
            </h2>
            
            <form onSubmit={handleCampayPayment} className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-700">
                  <strong>Amount to pay:</strong> {paymentDetails.amount.toLocaleString()} FCFA
                </p>
                <p className="text-xs text-green-600 mt-1">{paymentDetails.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Money Number
                </label>
                <input
                  type="tel"
                  value={paymentDetails.phone}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  placeholder="6XXXXXXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports MTN Mobile Money and Orange Money
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Payment Process:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Enter your mobile money number</li>
                  <li>2. Click "Pay with Campay"</li>
                  <li>3. Approve the transaction on your phone</li>
                  <li>4. Receive confirmation</li>
                </ol>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Pay with Campay</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Contact {selectedProduct.farmer.name}
            </h2>
            
            <form onSubmit={handleContactFarmer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Phone
                </label>
                <input
                  type="tel"
                  value={contactMessage.buyerPhone}
                  onChange={(e) => setContactMessage(prev => ({ ...prev, buyerPhone: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="6XXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  value={contactMessage.buyerEmail}
                  onChange={(e) => setContactMessage(prev => ({ ...prev, buyerEmail: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={contactMessage.message}
                  onChange={(e) => setContactMessage(prev => ({ ...prev, message: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  placeholder="I'm interested in your product..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Send Message
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Message Response Modal for Farmers */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Message from {selectedContact.buyer.name}
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Product: {selectedContact.product.name}</p>
                <p className="text-gray-900">{selectedContact.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {format(new Date(selectedContact.createdAt), 'PPp', { locale: fr })}
                </p>
              </div>

              {selectedContact.farmerResponse && (
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 mb-2">Your Response:</p>
                  <p className="text-gray-900">{selectedContact.farmerResponse}</p>
                </div>
              )}

              {selectedContact.status === 'pending' && (
                <form onSubmit={handleRespondToContact}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Response
                    </label>
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={4}
                      placeholder="Type your response..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedContact(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>Send Response</span>
                    </button>
                  </div>
                </form>
              )}

              {selectedContact.status === 'responded' && (
                <button
                  onClick={() => setSelectedContact(null)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;