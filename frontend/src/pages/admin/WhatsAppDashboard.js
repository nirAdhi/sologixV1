import AdminLayout from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { whatsappAPI } from '../../utils/api';

const WhatsAppDashboard = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchConversations();
  }, [navigate]);

  const fetchConversations = async () => {
    try {
      const response = await whatsappAPI.getConversations();
      setConversations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (phone) => {
    setLoadingMessages(true);
    try {
      const response = await whatsappAPI.getMessages(phone);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (phone) => {
    setSelectedPhone(phone);
    fetchMessages(phone);
  };

  const startNewConversation = async () => {
    const phone = prompt('Enter phone number (with country code, e.g., 919876543210):');
    if (!phone) return;

    try {
      await whatsappAPI.startConversation(phone);
      toast.success('Conversation started');
      fetchConversations();
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const getStepLabel = (step) => {
    const labels = {
      'START': 'New',
      'ASK_PHONE': 'Getting Phone',
      'ASK_SERVICE': 'Selecting Service',
      'ASK_DATE': 'Choosing Date',
      'ASK_ADDRESS': 'Getting Address',
      'ASK_EMAIL': 'Getting Email',
      'COMPLETE': 'Completed'
    };
    return labels[step] || step;
  };

  const getStepColor = (step) => {
    const colors = {
      'START': 'bg-green-100 text-green-800',
      'ASK_PHONE': 'bg-blue-100 text-blue-800',
      'ASK_SERVICE': 'bg-purple-100 text-purple-800',
      'ASK_DATE': 'bg-yellow-100 text-yellow-800',
      'ASK_ADDRESS': 'bg-orange-100 text-orange-800',
      'ASK_EMAIL': 'bg-indigo-100 text-indigo-800',
      'COMPLETE': 'bg-gray-100 text-gray-800'
    };
    return colors[step] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout requiredPerm="manage_whatsapp" title="WhatsApp">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Active Conversations</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active conversations</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.phone)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedPhone === conv.phone
                        ? 'bg-green-50 border border-green-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">{conv.phone}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStepColor(conv.current_step)}`}>
                        {getStepLabel(conv.current_step)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(conv.updated_at).toLocaleString('en-IN')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="md:col-span-2 bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {selectedPhone ? `Chat with ${selectedPhone}` : 'Select a conversation'}
            </h2>
            
            {!selectedPhone ? (
              <p className="text-gray-500 text-center py-12">Select a conversation to view messages</p>
            ) : loadingMessages ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No messages yet</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.direction === 'INBOUND' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                        msg.direction === 'INBOUND'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-green-100 text-gray-800'
                      }`}
                    >
                      {msg.image_url && (
                        <img 
                          src={msg.image_url} 
                          alt="WhatsApp shared content" 
                          className="w-full h-40 object-cover rounded mb-2"
                        />
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(msg.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="mt-6 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">WhatsApp Setup Instructions</h2>
          <div className="text-gray-600 space-y-2">
            <p>1. Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Facebook Developers</a> and create a WhatsApp app</p>
            <p>2. Get your <strong>Phone Number ID</strong> and <strong>Access Token</strong></p>
            <p>3. Set webhook URL to: <code className="bg-gray-100 px-2 py-1 rounded">https://your-app.railway.app/api/whatsapp/webhook</code></p>
            <p>4. Add the following environment variables in Railway:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>WHATSAPP_TOKEN</code> - Your Facebook access token</li>
              <li><code>WHATSAPP_PHONE_ID</code> - Your phone number ID</li>
              <li><code>WHATSAPP_VERIFY_TOKEN</code> - Any random string for verification</li>
            </ul>
          </div>
        </div>
      </main>
    </AdminLayout>
    );
};

export default WhatsAppDashboard;
