import AdminLayout from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';

const PERMISSIONS = [
  { key: 'manage_bookings',     label: '📋 Bookings',      description: 'View and manage all customer bookings', group: 'Core' },
  { key: 'manage_leads',        label: '🎯 Leads & CRM',   description: 'Access lead pipeline and CRM portal', group: 'Core' },
  { key: 'manage_customers',    label: '👥 Customers',     description: 'View and manage customer accounts', group: 'Core' },
  { key: 'manage_services',     label: '⚙️ Services',      description: 'Create, edit, and delete solar services', group: 'Content' },
  { key: 'manage_testimonials', label: '⭐ Testimonials',  description: 'Add and manage customer testimonials', group: 'Content' },
  { key: 'manage_whatsapp',     label: '💬 WhatsApp',      description: 'Access WhatsApp conversations and bot', group: 'Communication' },
  { key: 'manage_delivery',     label: '🚚 Delivery',      description: 'Update delivery and installation status', group: 'Operations' },
  { key: 'manage_subadmins',    label: '🔐 Sub-Admins',    description: 'Create and manage staff accounts (Admin only)', group: 'Admin' },
  { key: 'manage_settings',     label: '🛠 Settings',       description: 'Access system settings and configuration', group: 'Admin' },
  { key: 'view_reports', label: 'View Reports', description: 'Access dashboard and reports' },
  { key: 'manage_delivery', label: 'Manage Delivery', description: 'Update delivery and installation status' },
  { key: 'manage_settings', label: 'Manage Settings', description: 'Access system settings' }
];

const ROLES = [
  { value: 'staff', label: 'Staff', description: 'Limited access to specific features' },
  { value: 'admin', label: 'Admin', description: 'Full access except staff management' }
];

const SubAdmins = () => {
  const navigate = useNavigate();
  const [subadmins, setSubadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    is_active: true,
    permissions: {
      manage_bookings: true,
      manage_leads: false,
      manage_customers: false,
      manage_services: false,
      manage_testimonials: false,
      manage_whatsapp: false,
      view_reports: false,
      manage_delivery: true,
      manage_settings: false
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchSubAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchSubAdmins = async () => {
    try {
      const response = await adminAPI.getSubAdmins();
      setSubadmins(response.data.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Access denied. Super admin only.');
        navigate('/admin');
        return;
      }
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!editingId && !formData.password)) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      if (editingId) {
        const { password, ...data } = formData;
        await adminAPI.updateSubAdmin(editingId, data);
        toast.success('Staff updated');
      } else {
        await adminAPI.createSubAdmin(formData);
        toast.success('Staff created');
      }
      setShowModal(false);
      resetForm();
      fetchSubAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (subadmin) => {
    setEditingId(subadmin.id);
    const permissions = subadmin.permissions 
      ? (typeof subadmin.permissions === 'string' ? JSON.parse(subadmin.permissions) : subadmin.permissions)
      : {
          manage_bookings: true,
          manage_leads: false,
          manage_customers: false,
          manage_services: false,
          manage_testimonials: false,
          manage_whatsapp: false,
          view_reports: false,
          manage_delivery: true,
          manage_settings: false
        };
    setFormData({
      name: subadmin.name,
      email: subadmin.email,
      password: '',
      role: subadmin.role || 'staff',
      is_active: subadmin.is_active,
      permissions
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await adminAPI.deleteSubAdmin(id);
      toast.success('Staff deleted');
      fetchSubAdmins();
    } catch (error) {
      toast.error('Failed to delete staff');
    }
  };

  const toggleStatus = async (subadmin) => {
    try {
      const permissions = subadmin.permissions 
        ? (typeof subadmin.permissions === 'string' ? JSON.parse(subadmin.permissions) : subadmin.permissions)
        : {};
      await adminAPI.updateSubAdmin(subadmin.id, {
        name: subadmin.name,
        email: subadmin.email,
        role: subadmin.role,
        is_active: !subadmin.is_active,
        permissions
      });
      fetchSubAdmins();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      is_active: true,
      permissions: {
        manage_services: false,
        manage_bookings: true,
        manage_customers: false,
        view_reports: false,
        manage_delivery: true,
        manage_settings: false
      }
    });
  };

  const handlePermissionChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: value }
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Super Admin' },
      admin: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Admin' },
      staff: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Staff' }
    };
    return badges[role] || badges.staff;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <AdminLayout requiredPerm="manage_subadmins" title="Sub-Admins">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage admin and staff accounts with permissions</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            + Add Staff
          </button>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subadmins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No staff members found. Add one to get started.
                  </td>
                </tr>
              ) : (
                subadmins.map((subadmin) => {
                  const roleBadge = getRoleBadge(subadmin.role);
                  return (
                    <tr key={subadmin.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{subadmin.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{subadmin.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${roleBadge.bg} ${roleBadge.text}`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(subadmin)}
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            subadmin.is_active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {subadmin.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                        {new Date(subadmin.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleEdit(subadmin)}
                          className="text-primary-600 hover:text-primary-800 font-medium mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subadmin.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">👑</span>
              <h3 className="font-semibold text-gray-800">Super Admin</h3>
            </div>
            <p className="text-sm text-gray-600">Full access to all features including staff management.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🔐</span>
              <h3 className="font-semibold text-gray-800">Admin</h3>
            </div>
            <p className="text-sm text-gray-600">Access to most features. Cannot manage other staff accounts.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">👤</span>
              <h3 className="font-semibold text-gray-800">Staff</h3>
            </div>
            <p className="text-sm text-gray-600">Limited access based on assigned permissions.</p>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingId ? 'Edit Staff Member' : 'Add Staff Member'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingId ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: role.value })}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        formData.role === role.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-800">{role.label}</p>
                      <p className="text-xs text-gray-500">{role.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">Access Permissions</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => {
                      const all = {};
                      PERMISSIONS.forEach(p => { all[p.key] = true; });
                      setFormData(f => ({ ...f, permissions: all }));
                    }} className="text-xs text-green-700 hover:underline">Select All</button>
                    <span className="text-gray-300">|</span>
                    <button type="button" onClick={() => {
                      const none = {};
                      PERMISSIONS.forEach(p => { none[p.key] = false; });
                      setFormData(f => ({ ...f, permissions: none }));
                    }} className="text-xs text-red-500 hover:underline">Clear All</button>
                  </div>
                </div>
                {['Core', 'Content', 'Communication', 'Operations', 'Admin'].map(group => {
                  const groupPerms = PERMISSIONS.filter(p => p.group === group);
                  return (
                    <div key={group} className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">{group}</p>
                      <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                        {groupPerms.map((perm, i) => (
                          <label key={perm.key}
                            className={"flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-white " + (i > 0 ? 'border-t border-gray-100' : '')}>
                            <div className="relative flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={formData.permissions[perm.key] || false}
                                onChange={(e) => handlePermissionChange(perm.key, e.target.checked)}
                                className="w-4 h-4 accent-green-600 cursor-pointer"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-800">{perm.label}</p>
                                {formData.permissions[perm.key] && (
                                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">✓ On</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{perm.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 mt-2">
                  💡 Staff can only see and access the tabs you enable here. Super Admins always have full access.
                </div>
              </div>

              {editingId && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">Active</label>
                </div>
              )}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
    );
};

export default SubAdmins;
