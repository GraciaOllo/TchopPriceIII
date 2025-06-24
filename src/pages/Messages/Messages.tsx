import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
MessageCircle, Send, Reply, User, Clock, 
CheckCircle, AlertCircle, Search, Filter
} from 'lucide-react';
import { productAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

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
buyerPhone: string;
buyerEmail: string;
createdAt: string;
respondedAt?: string;
}

const Messages: React.FC = () => {
const { user } = useAuth();
const [contacts, setContacts] = useState<Contact[]>([]);
const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
const [responseMessage, setResponseMessage] = useState('');
const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState({
search: '',
status: ''
});

useEffect(() => {
fetchContacts();
}, [filters]);

const fetchContacts = async () => {
try {
    setLoading(true);
    const response = await productAPI.getContacts({
    status: filters.status,
    limit: 50
    });
    
    let filteredContacts = response.data.contacts;
    
    // Client-side search filter
    if (filters.search) {
    filteredContacts = filteredContacts.filter(contact =>
        contact.buyer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        contact.product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        contact.message.toLowerCase().includes(filters.search.toLowerCase())
    );
    }
    
    setContacts(filteredContacts);
} catch (error) {
    console.error('Error fetching contacts:', error);
    toast.error('Error loading messages');
} finally {
    setLoading(false);
}
};

const handleRespondToContact = async (e: React.FormEvent) => {
e.preventDefault();
if (!selectedContact || !responseMessage.trim()) return;

try {
    await productAPI.respondToContact(selectedContact._id, { response: responseMessage });
    toast.success('Response sent successfully!');
    setResponseMessage('');
    fetchContacts();
    
    // Update selected contact
    setSelectedContact(prev => prev ? {
    ...prev,
    status: 'responded',
    farmerResponse: responseMessage,
    respondedAt: new Date().toISOString()
    } : null);
} catch (error: any) {
    toast.error(error.response?.data?.message || 'Error sending response');
}
};

const getStatusColor = (status: string) => {
switch (status) {
    case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'responded': return 'text-green-600 bg-green-50 border-green-200';
    case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
}
};

const getStatusIcon = (status: string) => {
switch (status) {
    case 'pending': return <AlertCircle className="h-4 w-4" />;
    case 'responded': return <CheckCircle className="h-4 w-4" />;
    default: return <MessageCircle className="h-4 w-4" />;
}
};

if (loading) {
return (
    <div className="flex items-center justify-center min-h-96">
    <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading messages...</p>
    </div>
    </div>
);
}

return (
<div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
    <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">Manage buyer inquiries and communications</p>
    </div>
    <div className="flex items-center space-x-2 text-sm text-gray-600">
        <MessageCircle className="h-4 w-4" />
        <span>{contacts.length} messages</span>
    </div>
    </div>

    {/* Filters */}
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
            type="text"
            placeholder="Search messages..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        </div>

        <select
        value={filters.status}
        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="responded">Responded</option>
        <option value="closed">Closed</option>
        </select>
    </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Messages List */}
    <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Inbox</h2>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
        {contacts.length === 0 ? (
            <div className="p-6 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No messages found</p>
            </div>
        ) : (
            <div className="divide-y divide-gray-100">
            {contacts.map((contact) => (
                <motion.div
                key={contact._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedContact?._id === contact._id ? 'bg-green-50 border-r-2 border-green-600' : ''
                }`}
                onClick={() => setSelectedContact(contact)}
                >
                <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{contact.buyer.name}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(contact.status)}`}>
                    {getStatusIcon(contact.status)}
                    <span className="ml-1">{contact.status}</span>
                    </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                    Product: <span className="font-medium">{contact.product.name}</span>
                </p>
                
                <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                    {contact.message}
                </p>
                
                <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{format(new Date(contact.createdAt), 'PPp', { locale: fr })}</span>
                </div>
                </motion.div>
            ))}
            </div>
        )}
        </div>
    </div>

    {/* Message Detail */}
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
        {selectedContact ? (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                <h2 className="text-lg font-semibold text-gray-900">
                    Message from {selectedContact.buyer.name}
                </h2>
                <p className="text-sm text-gray-600">
                    About: {selectedContact.product.name}
                </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedContact.status)}`}>
                {getStatusIcon(selectedContact.status)}
                <span className="ml-2">{selectedContact.status}</span>
                </span>
            </div>
            </div>

            {/* Message Content */}
            <div className="flex-1 p-6 space-y-6">
            {/* Buyer's Message */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                <User className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-900">{selectedContact.buyer.name}</span>
                <span className="text-sm text-gray-500">
                    {format(new Date(selectedContact.createdAt), 'PPp', { locale: fr })}
                </span>
                </div>
                
                <p className="text-gray-900 mb-3">{selectedContact.message}</p>
                
                <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Email:</strong> {selectedContact.buyerEmail}</p>
                <p><strong>Phone:</strong> {selectedContact.buyerPhone}</p>
                </div>
            </div>

            {/* Farmer's Response */}
            {selectedContact.farmerResponse && (
                <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                    <User className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">Your Response</span>
                    {selectedContact.respondedAt && (
                    <span className="text-sm text-gray-500">
                        {format(new Date(selectedContact.respondedAt), 'PPp', { locale: fr })}
                    </span>
                    )}
                </div>
                <p className="text-gray-900">{selectedContact.farmerResponse}</p>
                </div>
            )}

            {/* Response Form */}
            {selectedContact.status === 'pending' && (
                <form onSubmit={handleRespondToContact} className="space-y-4">
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
                    placeholder="Type your response to the buyer..."
                    />
                </div>

                <div className="flex justify-end">
                    <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                    <Send className="h-4 w-4" />
                    <span>Send Response</span>
                    </button>
                </div>
                </form>
            )}

            {selectedContact.status === 'responded' && (
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-blue-700 font-medium">Response sent successfully!</p>
                <p className="text-blue-600 text-sm">The buyer has been notified of your response.</p>
                </div>
            )}
            </div>
        </div>
        ) : (
        <div className="h-full flex items-center justify-center">
            <div className="text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a message to view details</p>
            </div>
        </div>
        )}
    </div>
    </div>
</div>
);
};

export default Messages;