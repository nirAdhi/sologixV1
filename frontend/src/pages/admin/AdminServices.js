import AdminLayout from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI, uploadAPI } from '../../utils/api';
import { BRANDING } from '../../utils/branding';
import { parseFeatures } from '../../components/ServiceCard';

const API_URL = BRANDING.apiUrl;

// Helper to check if URL is likely an image
const isImageUrl = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  // Check for image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
  
  // Check for image MIME type in URL
  const hasImageMime = lowerUrl.includes('image/') || 
                       lowerUrl.includes('jpeg') || 
                       lowerUrl.includes('png') || 
                       lowerUrl.includes('jpg');
  
  // Common image hosting patterns
  const isImageHost = lowerUrl.includes('imgur.com') || 
                      lowerUrl.includes('cloudinary.com') || 
                      lowerUrl.includes('drive.google.com/file') ||
                      lowerUrl.includes('drive.google.com/uc');
  
  return hasImageExtension || hasImageMime || isImageHost;
};

// Helper to get image URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('data:')) return imageUrl;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_URL}${imageUrl}`;
};

const AdminServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [quickUrl, setQuickUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [imageMappings, setImageMappings] = useState([]);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [mappingForm, setMappingForm] = useState({ service_id: '', google_drive_url: '' });
  const [syncing, setSyncing] = useState(false);
  const [cloudinaryImages, setCloudinaryImages] = useState([]);
  const [loadingCloudinary, setLoadingCloudinary] = useState(false);
  const [cloudinaryNextCursor, setCloudinaryNextCursor] = useState(null);
  const [showCloudinaryBrowser, setShowCloudinaryBrowser] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_hours: 4,
    features: [''],
    image_url: '',
    is_active: true
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchServices();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'image-sync') {
      fetchImageMappings();
    }
  }, [activeTab]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getServices();
      setServices(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const fetchImageMappings = async () => {
    setLoadingMappings(true);
    try {
      const response = await uploadAPI.getImageMappings();
      setImageMappings(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch image mappings');
    } finally {
      setLoadingMappings(false);
    }
  };

  const fetchCloudinaryImages = async (cursor = null) => {
    setLoadingCloudinary(true);
    try {
      const params = { max_results: 12 };
      if (cursor) params.next_cursor = cursor;
      const response = await uploadAPI.listCloudinaryImages(params);
      const data = response.data.data;
      
      // Check for warning or error
      if (data.warning) {
        toast(data.warning, { icon: '⚠️' });
      }
      if (data.error) {
        toast.error(data.error);
      }
      
      setCloudinaryImages(prev => cursor ? [...prev, ...data.resources] : data.resources);
      setCloudinaryNextCursor(data.next_cursor);
    } catch (error) {
      toast.error('Failed to fetch Cloudinary images');
    } finally {
      setLoadingCloudinary(false);
    }
  };

  const handleSelectCloudinaryImage = async (cloudinaryUrl) => {
    if (!selectedService) return;
    try {
      const response = await fetch(`${API_URL}/api/upload/save-image-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          imageUrl: cloudinaryUrl,
          serviceId: selectedService.id
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Cloudinary image assigned to service');
        fetchServices();
        setShowImageModal(false);
        setShowCloudinaryBrowser(false);
      } else {
        toast.error(data.message || 'Failed to assign image');
      }
    } catch (error) {
      toast.error('Failed to assign image');
    }
  };

  const handleMappingFormChange = (e) => {
    const { name, value } = e.target;
    setMappingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateMapping = async () => {
    if (!mappingForm.google_drive_url.trim()) {
      toast.error('Please enter a Google Drive URL');
      return;
    }
    try {
      await uploadAPI.createImageMapping({
        service_id: mappingForm.service_id || null,
        google_drive_url: mappingForm.google_drive_url.trim()
      });
      toast.success('Mapping created');
      setMappingForm({ service_id: '', google_drive_url: '' });
      fetchImageMappings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create mapping');
    }
  };

  const handleDeleteMapping = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mapping?')) return;
    try {
      await uploadAPI.deleteImageMapping(id);
      toast.success('Mapping deleted');
      fetchImageMappings();
    } catch (error) {
      toast.error('Failed to delete mapping');
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const result = await uploadAPI.syncFromDrive();
      toast.success(result.data.message);
      fetchImageMappings();
      fetchServices(); // Update service images
    } catch (error) {
      toast.error(error.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSingle = async (id) => {
    setSyncing(true);
    try {
      const result = await uploadAPI.syncFromDrive(id);
      toast.success(result.data.message);
      fetchImageMappings();
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_hours: 4,
      features: [''],
      image_url: '',
      is_active: true
    });
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    // Safe parse: features may be an array, JSON string, double-encoded JSON or plain text
    const features = parseFeatures(service.features);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      price: service.price ?? '',
      duration_hours: service.duration_hours || 4,
      features: features.length > 0 ? features : [''],
      image_url: service.image_url || '',
      is_active: service.is_active === true || service.is_active === 1 || service.is_active === '1'
    });
    setShowModal(true);
  };

  const openImageModal = (service) => {
    setSelectedService(service);
    setPreviewImage(null);
    setShowImageModal(true);
  };

  const handleFileSelect = (file) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Max 10MB allowed.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const savePreviewImage = async () => {
    if (!previewImage || !selectedService) return;
    
    try {
      const response = await fetch(`${API_URL}/api/upload/save-image-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          imageUrl: previewImage,
          serviceId: selectedService.id
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Image saved successfully');
        fetchServices();
        setShowImageModal(false);
        setPreviewImage(null);
      } else {
        toast.error(data.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save image');
    }
  };

  const handleDeleteImage = async () => {
    if (!selectedService?.image_url) return;
    
    try {
      await fetch(`${API_URL}/api/upload/delete-service-image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          imageUrl: selectedService.image_url,
          serviceId: selectedService.id
        })
      });
      toast.success('Image deleted');
      fetchServices();
      setShowImageModal(false);
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  // Handle import from Google Drive
  const handleGoogleDriveImport = async () => {
    if (!googleDriveUrl.trim()) {
      toast.error('Please enter a Google Drive URL');
      return;
    }
    
    if (!selectedService) {
      toast.error('No service selected');
      return;
    }

    setImporting(true);
    
    try {
      const result = await uploadAPI.uploadFromDrive({
        googleDriveUrl: googleDriveUrl.trim(),
        serviceId: selectedService.id,
        serviceName: selectedService.name
      });

      if (result.data.success) {
        toast.success('Image imported from Google Drive!');
        setGoogleDriveUrl('');
        fetchServices();
        setShowImageModal(false);
      } else {
        toast.error(result.data.message || 'Failed to import image');
      }
    } catch (error) {
      console.error('Google Drive import error:', error);
      toast.error(error.response?.data?.message || 'Failed to import from Google Drive');
    } finally {
      setImporting(false);
    }
  };

  const handleQuickUrlUpdate = async () => {
    if (!quickUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    
    if (!selectedService) {
      toast.error('No service selected');
      return;
    }

    // Check if URL looks like an image
    const url = quickUrl.trim();
    if (!isImageUrl(url)) {
      const proceed = window.confirm(
        'This URL may not be an image (PDF, document, etc.). Images will display directly, but other files will show as links. Continue?'
      );
      if (!proceed) return;
    }

    try {
      // Use the admin API to update service directly
      await adminAPI.updateService(selectedService.id, {
        ...selectedService,
        // always a real array — sending the DB's JSON string back double-encodes it
        features: parseFeatures(selectedService.features),
        image_url: url
      });
      
      toast.success('Image URL updated successfully');
      setQuickUrl('');
      fetchServices();
      setShowImageModal(false);
    } catch (error) {
      console.error('Quick URL update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update image URL');
    }
  };

  const handleSubmit = async () => {
    try {
      const price = parseFloat(formData.price);
      const duration = parseInt(formData.duration_hours, 10);
      const data = {
        ...formData,
        price: Number.isFinite(price) ? price : 0,
        duration_hours: Number.isFinite(duration) ? duration : 4,
        // always a real array of non-empty strings
        features: parseFeatures(formData.features),
        is_active: !!formData.is_active
      };

      if (editingService) {
        await adminAPI.updateService(editingService.id, data);
        toast.success('Service updated successfully');
      } else {
        await adminAPI.createService(data);
        toast.success('Service created successfully');
      }
      
      setShowModal(false);
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save service');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    try {
      await adminAPI.deleteService(id);
      toast.success('Service deleted');
      fetchServices();
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  return (
    <AdminLayout requiredPerm="manage_services" title="Services">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'services' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">All Services</h2>
              <button onClick={openCreateModal} className="btn-primary">
                + Add New Service
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div key={service.id} className="bg-white rounded-xl shadow overflow-hidden">
                    <div 
                      className="h-48 bg-gray-200 relative cursor-pointer group"
                      onClick={() => openImageModal(service)}
                    >
                      {service.image_url ? (
                        <img 
                          src={getImageUrl(service.image_url)}
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">☀️</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 font-medium">
                          {service.image_url ? 'Change Image' : 'Add Image'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">{service.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{service.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary-600">
                          ₹{parseInt(service.price).toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm text-gray-500">{service.duration_hours} hours</span>
                      </div>
                      <div className="flex space-x-2 mt-3 pt-3 border-t">
                        <button
                          onClick={() => openEditModal(service)}
                          className="text-blue-600 hover:text-blue-700 text-sm flex-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openImageModal(service)}
                          className="text-green-600 hover:text-green-700 text-sm flex-1"
                        >
                          {service.image_url ? 'Change Image' : 'Add Image'}
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {services.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">No services found</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'image-sync' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Image Sync (Google Drive → Cloudinary)</h2>
              <button 
                onClick={handleSyncAll}
                disabled={syncing || imageMappings.length === 0}
                className="btn-primary flex items-center"
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔄</span>
                    Sync All Images
                  </>
                )}
              </button>
            </div>

            {/* Add Mapping Form */}
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <h3 className="text-md font-semibold text-gray-800 mb-4">Add New Mapping</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service (Optional)</label>
                  <select
                    name="service_id"
                    value={mappingForm.service_id}
                    onChange={handleMappingFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a service</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive URL *</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      name="google_drive_url"
                      value={mappingForm.google_drive_url}
                      onChange={handleMappingFormChange}
                      placeholder="https://drive.google.com/file/d/FILE_ID/view"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={handleCreateMapping}
                      disabled={!mappingForm.google_drive_url.trim()}
                      className="btn-primary"
                    >
                      Add Mapping
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mappings Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-md font-semibold text-gray-800">Image Mappings</h3>
              </div>
              
              {loadingMappings ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : imageMappings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No image mappings found. Add your first Google Drive image mapping above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Google Drive URL</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cloudinary Image</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Synced</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {imageMappings.map((mapping) => (
                        <tr key={mapping.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {mapping.service_name || <span className="text-gray-400 italic">No service</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={mapping.google_drive_url}>
                              {mapping.google_drive_url}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {mapping.cloudinary_url ? (
                              <img 
                                src={mapping.cloudinary_url} 
                                alt="Cloudinary" 
                                className="h-12 w-12 object-cover rounded"
                              />
                            ) : (
                              <span className="text-sm text-gray-400">Not synced</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mapping.last_synced_at 
                              ? new Date(mapping.last_synced_at).toLocaleString()
                              : 'Never'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleSyncSingle(mapping.id)}
                              disabled={syncing}
                              className="text-green-600 hover:text-green-900"
                              title="Sync this image"
                            >
                              🔄
                            </button>
                            <button
                              onClick={() => handleDeleteMapping(mapping.id)}
                              disabled={syncing}
                              className="text-red-600 hover:text-red-900"
                              title="Delete mapping"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Image Upload Modal */}
      {showImageModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedService.name} - Image
              </h3>
              <button onClick={() => setShowImageModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="mb-4">
              {selectedService.image_url ? (
                <img 
                  src={getImageUrl(selectedService.image_url)}
                  alt={selectedService.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Quick URL Update - Simplest Option */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Quick URL Update (Easiest)</h4>
                <p className="text-xs text-blue-600 mb-3">
                  Paste any direct image URL (e.g., from Google Drive, Imgur, Unsplash, etc.)
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={quickUrl}
                    onChange={(e) => setQuickUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleQuickUrlUpdate}
                    disabled={!quickUrl.trim()}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    Set Image URL
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR USE OTHER METHODS</span>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    handleFileSelect(file);
                  } else {
                    toast.error('Please drop an image file');
                  }
                }}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer"
                onClick={() => document.getElementById('fileInput').click()}
              >
                <input
                  type="file"
                  id="fileInput"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                <div className="text-gray-500">
                  <p className="text-4xl mb-2">📁</p>
                  <p className="font-medium">Drag & drop an image here</p>
                  <p className="text-sm">or click to browse</p>
                </div>
              </div>

              {/* Preview */}
              {previewImage && (
                <div className="relative">
                  <img src={previewImage} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Save Button */}
              {previewImage && (
                <button
                  onClick={savePreviewImage}
                  className="btn-primary w-full"
                >
                  Save Image
                </button>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="text"
                  id="imageUrlInput"
                  placeholder="https://example.com/image.jpg"
                  className="input-field"
                  defaultValue={selectedService.image_url?.startsWith('http') ? selectedService.image_url : ''}
                />
              </div>
              <button
                onClick={async () => {
                  const imageUrl = document.getElementById('imageUrlInput').value;
                  if (!imageUrl) {
                    toast.error('Please enter an image URL');
                    return;
                  }
                  try {
                    const response = await fetch(`${API_URL}/api/upload/save-image-url`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ 
                        imageUrl,
                        serviceId: selectedService.id
                      })
                    });
                    const data = await response.json();
                    if (data.success) {
                      toast.success('Image URL saved');
                      fetchServices();
                      setShowImageModal(false);
                    } else {
                      toast.error(data.message || 'Failed to save');
                    }
                  } catch (error) {
                    toast.error('Failed to save image URL');
                  }
                }}
                className="btn-primary w-full"
              >
                Save Image URL
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR IMPORT FROM GOOGLE DRIVE</span>
                </div>
              </div>

              {/* Google Drive Import */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Drive Image URL
                </label>
                <input
                  type="text"
                  value={googleDriveUrl}
                  onChange={(e) => setGoogleDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/FILE_ID/view"
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste a Google Drive shareable link (make sure it's set to "Anyone with the link can view")
                </p>
              </div>
              <button
                onClick={handleGoogleDriveImport}
                disabled={importing || !googleDriveUrl.trim()}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">☁️</span>
                    Import from Google Drive
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR SELECT FROM CLOUDINARY</span>
                </div>
              </div>

              {/* Cloudinary Browser */}
              <button
                onClick={() => {
                  setShowCloudinaryBrowser(!showCloudinaryBrowser);
                  if (!showCloudinaryBrowser && cloudinaryImages.length === 0) {
                    fetchCloudinaryImages();
                  }
                }}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center"
              >
                <span className="mr-2">🖼️</span>
                {showCloudinaryBrowser ? 'Hide Cloudinary Library' : 'Browse Cloudinary Library'}
              </button>

              {showCloudinaryBrowser && (
                <div className="mt-4">
                  {loadingCloudinary ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                        {cloudinaryImages.map((img) => (
                          <div 
                            key={img.public_id}
                            onClick={() => handleSelectCloudinaryImage(img.secure_url)}
                            className="cursor-pointer border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500"
                          >
                            <img 
                              src={img.secure_url} 
                              alt={img.public_id}
                              className="w-full h-20 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      {cloudinaryNextCursor && (
                        <button
                          onClick={() => fetchCloudinaryImages(cloudinaryNextCursor)}
                          className="mt-2 w-full py-2 text-sm text-primary-600 hover:text-primary-700"
                        >
                          Load More
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              
              {selectedService.image_url && (
                <button
                  onClick={handleDeleteImage}
                  className="w-full py-2 px-4 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
                >
                  Remove Image
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Service Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="input-field"
                  placeholder="e.g., Residential Solar Installation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="input-field"
                  placeholder="Describe the service..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    className="input-field"
                    placeholder="150000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                  <input
                    type="number"
                    name="duration_hours"
                    value={formData.duration_hours}
                    onChange={handleFormChange}
                    className="input-field"
                    placeholder="4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="Feature description"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  + Add Feature
                </button>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <label className="ml-2 text-sm text-gray-700">Active (visible to customers)</label>
              </div>

              <button onClick={handleSubmit} className="btn-primary w-full">
                {editingService ? 'Update Service' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
    );
};

export default AdminServices;
