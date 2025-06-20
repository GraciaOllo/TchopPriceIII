import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Package, TrendingUp, Shield, 
  Search, Filter, MoreVertical, Eye,
  UserCheck, UserX, Edit, Trash2, Plus,
  CheckCircle, XCircle, AlertTriangle,
  BarChart3, DollarSign, Activity,
  ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown,
  MessageCircle, Phone, Mail, MapPin, User
} from 'lucide-react';
import { userAPI, priceAPI, productAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'farmer' | 'buyer';
  region: string;
  location: string;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  lastLogin: string;
}

interface Price {
  _id: string;
  product: {
    name: string;
    category: string;
  };
  price: number;
  region: string;
  market: string;
  quality: string;
  isVerified: boolean;
  reportedBy: {
    name: string;
    role: string;
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
  quality: string;
  status: string;
  isActive: boolean;
  farmer: {
    _id: string;
    name: string;
    role: string;
    email: string;
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

interface AdminStats {
  totalUsers: number;
  totalPrices: number;
  totalProducts: number;
  verifiedUsers: number;
  verifiedPrices: number;
  todayPrices: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'prices' | 'products'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPrices: 0,
    totalProducts: 0,
    verifiedUsers: 0,
    verifiedPrices: 0,
    todayPrices: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    rejectedProducts: 0
  });
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    reason: ''
  });
  const [contactMessage, setContactMessage] = useState({
    message: '',
    buyerPhone: '',
    buyerEmail: ''
  });
  const [pagination, setPagination] = useState({
    users: { current: 1, pages: 1, total: 0 },
    prices: { current: 1, pages: 1, total: 0 },
    products: { current: 1, pages: 1, total: 0 }
  });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    region: '',
    status: ''
  });

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    region: '',
    location: '',
    role: 'farmer'
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
    address: ''
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
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'prices') {
      fetchPrices();
    } else if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab, filters, pagination.users.current, pagination.prices.current, pagination.products.current]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [userStatsRes, priceStatsRes, productStatsRes] = await Promise.all([
        userAPI.getStats(),
        priceAPI.getStats(),
        productAPI.getStats()
      ]);

      setStats({
        ...userStatsRes.data,
        ...priceStatsRes.data,
        ...productStatsRes.data
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Error loading admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll({
        role: filters.role,
        region: filters.region,
        search: filters.search,
        status: filters.status,
        page: pagination.users.current,
        limit: 10
      });
      setUsers(response.data.users);
      setPagination(prev => ({
        ...prev,
        users: response.data.pagination
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
    }
  };

  const fetchPrices = async () => {
    try {
      const response = await priceAPI.getAll({
        page: pagination.prices.current,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc'
      });
      setPrices(response.data.prices);
      setPagination(prev => ({
        ...prev,
        prices: response.data.pagination
      }));
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('Error loading prices');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({
        page: pagination.products.current,
        limit: 10,
        status: '' // Get all products regardless of status for admin
      });
      console.log('Products response:', response.data);
      setProducts(response.data.products || []);
      setPagination(prev => ({
        ...prev,
        products: response.data.pagination
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
      setProducts([]);
    }
  };

  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      switch (action) {
        case 'verify':
          await userAPI.verify(userId);
          toast.success('User verified successfully');
          break;
        case 'block':
          await userAPI.block(userId, data);
          toast.success('User blocked successfully');
          break;
        case 'unblock':
          await userAPI.unblock(userId);
          toast.success('User unblocked successfully');
          break;
        case 'delete':
          await userAPI.delete(userId);
          toast.success('User deleted successfully');
          break;
      }
      fetchUsers();
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Error ${action}ing user`);
    }
  };

  const handlePriceAction = async (priceId: string, action: string) => {
    try {
      switch (action) {
        case 'verify':
          await priceAPI.verify(priceId);
          toast.success('Price verified successfully');
          break;
        case 'delete':
          await priceAPI.delete(priceId);
          toast.success('Price deleted successfully');
          break;
      }
      fetchPrices();
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Error ${action}ing price`);
    }
  };

  const handleProductStatusUpdate = async () => {
    if (!selectedProduct) return;

    try {
      await productAPI.updateStatus(selectedProduct._id, statusUpdate);
      toast.success(`Product ${statusUpdate.status} successfully`);
      setShowStatusModal(false);
      setStatusUpdate({ status: '', reason: '' });
      setSelectedProduct(null);
      fetchProducts();
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating product status');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(productId);
        toast.success('Product deleted successfully');
        fetchProducts();
        fetchAdminData();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error deleting product');
      }
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userAPI.create(newUser);
      toast.success('User created successfully');
      setShowUserModal(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        phone: '',
        region: '',
        location: '',
        role: 'farmer'
      });
      fetchUsers();
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating user');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await productAPI.create({
        ...newProduct,
        price: parseFloat(newProduct.price),
        quantity: parseFloat(newProduct.quantity)
      });
      toast.success('Product created successfully');
      setShowProductModal(false);
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
        address: ''
      });
      fetchProducts();
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating product');
    }
  };

  const handlePageChange = (tab: string, page: number) => {
    setPagination(prev => ({
      ...prev,
      [tab]: { ...prev[tab as keyof typeof prev], current: page }
    }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-50 border-red-200';
      case 'buyer': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'farmer': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (isVerified: boolean, isBlocked: boolean) => {
    if (isBlocked) return 'text-red-600 bg-red-50';
    if (isVerified) return 'text-green-600 bg-green-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getStatusText = (isVerified: boolean, isBlocked: boolean) => {
    if (isBlocked) return 'Blocked';
    if (isVerified) return 'Verified';
    return 'Pending';
  };

  const getProductStatusColor = (status: string) => {
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'prices', label: 'Prices', icon: DollarSign },
    { id: 'products', label: 'Products', icon: Package }
  ];

  const PaginationComponent = ({ 
    pagination: pag, 
    onPageChange, 
    tab 
  }: { 
    pagination: any, 
    onPageChange: (tab: string, page: number) => void, 
    tab: string 
  }) => (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Showing {((pag.current - 1) * 10) + 1} to {Math.min(pag.current * 10, pag.total)} of {pag.total} results
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(tab, pag.current - 1)}
          disabled={pag.current === 1}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        {Array.from({ length: Math.min(5, pag.pages) }, (_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              onClick={() => onPageChange(tab, page)}
              className={`px-3 py-1 text-sm rounded-md ${
                page === pag.current
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          );
        })}
        
        <button
          onClick={() => onPageChange(tab, pag.current + 1)}
          disabled={pag.current === pag.pages}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-red-100">
          Manage users, products, and prices on the TchopPrice III platform
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Users</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
                      <p className="text-xs text-blue-600">{stats.verifiedUsers} verified</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Price Reports</p>
                      <p className="text-2xl font-bold text-green-900">{stats.totalPrices}</p>
                      <p className="text-xs text-green-600">{stats.todayPrices} today</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Products</p>
                      <p className="text-2xl font-bold text-purple-900">{stats.totalProducts}</p>
                      <p className="text-xs text-purple-600">{stats.approvedProducts} approved</p>
                    </div>
                    <Package className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setShowUserModal(true)}
                  className="p-6 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                >
                  <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="font-medium text-gray-700">Add New User</p>
                </button>

                <button
                  onClick={() => setShowProductModal(true)}
                  className="p-6 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors text-center"
                >
                  <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="font-medium text-gray-700">Add New Product</p>
                </button>

                <div className="p-6 bg-white border border-gray-200 rounded-xl">
                  <Shield className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="font-medium text-gray-700 text-center">Security Status</p>
                  <p className="text-sm text-green-600 text-center mt-1">No threats detected</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Filters and Actions */}
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 mr-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <select
                    value={filters.role}
                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">All Roles</option>
                    <option value="farmer">Farmers</option>
                    <option value="buyer">Buyers</option>
                    <option value="admin">Admins</option>
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                    <option value="blocked">Blocked</option>
                  </select>

                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{pagination.users.total} users</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowUserModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add User</span>
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.location}, {user.region}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.isVerified, user.isBlocked)}`}>
                              {getStatusText(user.isVerified, user.isBlocked)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(user.createdAt), 'PP', { locale: fr })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {!user.isVerified && (
                                <button
                                  onClick={() => handleUserAction(user._id, 'verify')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Verify User"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </button>
                              )}
                              {!user.isBlocked ? (
                                <button
                                  onClick={() => handleUserAction(user._id, 'block', { reason: 'Admin action' })}
                                  className="text-red-600 hover:text-red-900"
                                  title="Block User"
                                >
                                  <UserX className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(user._id, 'unblock')}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Unblock User"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUserAction(user._id, 'delete')}
                                className="text-red-600 hover:text-red-900"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationComponent 
                  pagination={pagination.users} 
                  onPageChange={handlePageChange} 
                  tab="users" 
                />
              </div>
            </motion.div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Product Management</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Package className="h-4 w-4 mr-2" />
                    <span>{pagination.products.total} products</span>
                  </div>
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Product Cards */}
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, index) => (
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
                          <div className="text-3xl">{getCategoryIcon(product.category)}</div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getProductStatusColor(product.status)}`}>
                              {product.status}
                            </span>
                          </div>
                        </div>
                        
                        {/* Product Info */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {product.name}
                        </h3>
                        
                        <div className="text-xl font-bold text-green-600 mb-2">
                          {typeof product.price === 'number' ? product.price.toLocaleString() : 'N/A'} FCFA
                          <span className="text-sm text-gray-500 font-normal">/{product.unit}</span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        {/* Farmer Info */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">{product.farmer && product.farmer.name ? product.farmer.name : 'N/A'}</span>
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
                            <span className="text-xs text-gray-600">{product.location?.city || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Voting and Actions */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
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
                          </div>

                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowContactModal(true);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                          >
                            Contact
                          </button>
                        </div>

                        {/* Admin Actions */}
                        <div className="flex space-x-2 mb-3">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setStatusUpdate({ status: product.status, reason: '' });
                              setShowStatusModal(true);
                            }}
                            className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                          >
                            Update Status
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Metadata */}
                        <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
                          <div className="flex items-center justify-between">
                            <span>Qty: {product.quantity} {product.unit}</span>
                            <span>{format(new Date(product.createdAt), 'PP', { locale: fr })}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <PaginationComponent 
                pagination={pagination.products} 
                onPageChange={handlePageChange} 
                tab="products" 
              />
            </motion.div>
          )}

          {/* Prices Tab */}
          {activeTab === 'prices' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Price Management</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <span>{pagination.prices.total} price reports</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reporter
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {prices.map((price) => (
                        <tr key={price._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{price.product.name}</div>
                            <div className="text-sm text-gray-500">{price.product.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{price.price.toLocaleString()} FCFA</div>
                            <div className="text-sm text-gray-500">{price.quality}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {price.market}, {price.region}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {price.reportedBy.name} ({price.reportedBy.role})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              price.isVerified ? 'text-green-800 bg-green-100' : 'text-yellow-800 bg-yellow-100'
                            }`}>
                              {price.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {!price.isVerified && (
                                <button
                                  onClick={() => handlePriceAction(price._id, 'verify')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Verify Price"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handlePriceAction(price._id, 'delete')}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Price"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationComponent 
                  pagination={pagination.prices} 
                  onPageChange={handlePageChange} 
                  tab="prices" 
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add New User</h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <input
                    type="text"
                    value={newUser.region}
                    onChange={(e) => setNewUser(prev => ({ ...prev, region: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={newUser.location}
                    onChange={(e) => setNewUser(prev => ({ ...prev, location: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="farmer">Farmer</option>
                  <option value="buyer">Buyer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Product</h2>
            
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (FCFA)</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={newProduct.contactPhone}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, contactPhone: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={newProduct.contactEmail}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, contactEmail: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <input
                    type="text"
                    value={newProduct.region}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, region: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={newProduct.city}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, city: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={newProduct.address}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, address: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Product
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Product Status Update Modal */}
      {showStatusModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Update Product Status
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product: {selectedProduct.name}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {statusUpdate.status === 'rejected' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={statusUpdate.reason}
                    onChange={(e) => setStatusUpdate(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> When a product is approved, its price will automatically be added to the market prices.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProductStatusUpdate}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Update Status
                </button>
              </div>
            </div>
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
    </div>
  );
};

export default AdminPanel;