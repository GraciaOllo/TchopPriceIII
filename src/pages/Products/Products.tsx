import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Package, Grid, List, MapPin, Phone, Mail,
  ThumbsUp, ThumbsDown, MessageCircle, User, Star,
  Clock, Eye, Filter, Heart, Share2
} from 'lucide-react';
import { productAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  quantity: number;
  quality: string;
  image: string;
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
  status: string;
  votes: {
    upvotes: any[];
    downvotes: any[];
  };
  isActive: boolean;
  createdAt: string;
}

interface Comment {
  _id: string;
  user: {
    name: string;
    role: string;
  };
  content: string;
  createdAt: string;
  replies?: Comment[];
}

const Products: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [contactMessage, setContactMessage] = useState({
    message: '',
    buyerPhone: '',
    buyerEmail: ''
  });

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    region: '',
    status: 'approved'
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    unit: '',
    quantity: '',
    quality: 'standard',
    contactPhone: '',
    contactEmail: '',
    region: '',
    city: '',
    address: '',
    image: ''
  });

  const categories = [
    { value: 'cereals', label: 'Cereals', icon: '🌾' },
    { value: 'legumes', label: 'Legumes', icon: '🫘' },
    { value: 'tubers', label: 'Tubers', icon: '🥔' },
    { value: 'fruits', label: 'Fruits', icon: '🍎' },
    { value: 'vegetables', label: 'Vegetables', icon: '🥬' },
    { value: 'spices', label: 'Spices', icon: '🌶️' },
    { value: 'cash_crops', label: 'Cash Crops', icon: '☕' }
  ];

  const units = ['kg', 'ton', 'bag', 'bunch', 'piece', 'liter'];

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll({
        category: filters.category,
        region: filters.region,
        status: filters.status,
        search: filters.search,
        limit: 50
      });
      console.log('Fetched products:', response.data.products);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (productId: string) => {
    try {
      const response = await productAPI.getComments(productId);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await productAPI.create({
        ...newProduct,
        price: parseFloat(newProduct.price),
        quantity: parseFloat(newProduct.quantity)
      });
      toast.success('Product added successfully!');
      setShowAddModal(false);
      setNewProduct({
        name: '',
        category: '',
        description: '',
        price: '',
        unit: '',
        quantity: '',
        quality: 'standard',
        contactPhone: '',
        contactEmail: '',
        region: '',
        city: '',
        address: '',
        image: ''
      });
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error adding product');
    }
  };

  const handleVote = async (productId: string, type: 'upvote' | 'downvote') => {
    try {
      await productAPI.vote(productId, type);
      fetchProducts();
      toast.success('Vote recorded!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error voting');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !newComment.trim()) return;

    try {
      await productAPI.addComment(selectedProduct._id, { content: newComment });
      setNewComment('');
      fetchComments(selectedProduct._id);
      toast.success('Comment added!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error adding comment');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const canVote = (product: Product) => {
    return product.status === 'pending' && 
           (user?.role === 'farmer' || user?.role === 'admin') && 
           product.farmer._id !== user?.id;
  };

  const canAddProduct = user?.role === 'farmer';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agricultural Products</h1>
          <p className="text-gray-600">Browse and discover products from local farmers</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {canAddProduct && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          {/* Region Filter */}
          <input
            type="text"
            placeholder="Filter by region..."
            value={filters.region}
            onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Products Display */}
      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No products found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => {
            const categoryInfo = getCategoryInfo(product.category);
            return (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">{categoryInfo.icon}</div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getQualityColor(product.quality)}`}>
                        {product.quality}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {product.price.toLocaleString()} FCFA
                    <span className="text-sm text-gray-500 font-normal">/{product.unit}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Farmer Info */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
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

                  {/* Voting Section - Only for farmers and admins on pending products */}
                  {product.status === 'pending' && (user?.role === 'farmer' || user?.role === 'admin') && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {canVote(product) ? (
                          <>
                            <button
                              onClick={() => handleVote(product._id, 'upvote')}
                              className="flex items-center space-x-1 px-3 py-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span className="text-sm font-medium">{product.votes?.upvotes?.length || 0}</span>
                            </button>
                            <button
                              onClick={() => handleVote(product._id, 'downvote')}
                              className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                            >
                              <ThumbsDown className="h-4 w-4" />
                              <span className="text-sm font-medium">{product.votes?.downvotes?.length || 0}</span>
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1 px-3 py-2 text-green-600 bg-green-50 rounded-lg border border-green-200">
                              <ThumbsUp className="h-4 w-4" />
                              <span className="text-sm font-medium">{product.votes?.upvotes?.length || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1 px-3 py-2 text-red-600 bg-red-50 rounded-lg border border-red-200">
                              <ThumbsDown className="h-4 w-4" />
                              <span className="text-sm font-medium">{product.votes?.downvotes?.length || 0}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Comments Button */}
                  {product.status === 'approved' && (
                    <div className="mb-4">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowCommentsModal(true);
                          fetchComments(product._id);
                        }}
                        className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 w-full justify-center"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">Comments</span>
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Quantity: {product.quantity} {product.unit}
                    </div>

                    {user?.role === 'buyer' && product.status === 'approved' && (
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowContactModal(true);
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        Contact Farmer
                      </button>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span>{format(new Date(product.createdAt), 'PP', { locale: fr })}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="divide-y divide-gray-100">
            {products.map((product, index) => {
              const categoryInfo = getCategoryInfo(product.category);
              return (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{categoryInfo.icon}</div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getQualityColor(product.quality)}`}>
                          {product.quality}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </div>
                      
                      <div className="text-xl font-bold text-green-600 mb-2">
                        {product.price.toLocaleString()} FCFA/{product.unit}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>By: {product.farmer.name}</span>
                        <span>•</span>
                        <span>{product.location.city}, {product.location.region}</span>
                        <span>•</span>
                        <span>Qty: {product.quantity} {product.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Voting for pending products - only farmers and admins */}
                      {product.status === 'pending' && (user?.role === 'farmer' || user?.role === 'admin') && (
                        <>
                          {canVote(product) ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleVote(product._id, 'upvote')}
                                className="flex items-center space-x-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                              >
                                <ThumbsUp className="h-4 w-4" />
                                <span className="text-sm">{product.votes?.upvotes?.length || 0}</span>
                              </button>
                              <button
                                onClick={() => handleVote(product._id, 'downvote')}
                                className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                              >
                                <ThumbsDown className="h-4 w-4" />
                                <span className="text-sm">{product.votes?.downvotes?.length || 0}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 px-3 py-2 text-green-600 bg-green-50 rounded-lg border border-green-200">
                                <ThumbsUp className="h-4 w-4" />
                                <span className="text-sm">{product.votes?.upvotes?.length || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1 px-3 py-2 text-red-600 bg-red-50 rounded-lg border border-red-200">
                                <ThumbsDown className="h-4 w-4" />
                                <span className="text-sm">{product.votes?.downvotes?.length || 0}</span>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Comments for approved products */}
                      {product.status === 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowCommentsModal(true);
                            fetchComments(product._id);
                          }}
                          className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-sm">Comments</span>
                        </button>
                      )}

                      {/* Contact button for buyers on approved products */}
                      {user?.role === 'buyer' && product.status === 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowContactModal(true);
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Contact Farmer
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Product Modal - Only for farmers */}
      {showAddModal && canAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Product</h2>
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., White Corn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (FCFA)
                  </label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity Available
                  </label>
                  <input
                    type="number"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: e.target.value }))}
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
                    value={newProduct.quality}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, quality: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="premium">Premium</option>
                    <option value="standard">Standard</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={newProduct.contactPhone}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, contactPhone: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="6XXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={newProduct.contactEmail}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, contactEmail: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <input
                    type="text"
                    value={newProduct.region}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, region: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Centre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={newProduct.city}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, city: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Yaoundé"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={newProduct.address}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, address: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Full address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Describe your product..."
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
                  Add Product
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Contact Modal - Only for buyers */}
      {showContactModal && selectedProduct && user?.role === 'buyer' && (
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

      {/* Comments Modal */}
      {showCommentsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Comments on {selectedProduct.name}
              </h2>
              <button
                onClick={() => setShowCommentsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Post
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="border-b border-gray-100 pb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">{comment.user.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {comment.user.role}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.createdAt), 'PPp', { locale: fr })}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Products;