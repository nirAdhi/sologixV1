import AdminLayout from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';

const AdminTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    payment_status: '',
    payment_method: '',
    payment_gateway: '',
    search: '',
    date_from: '',
    date_to: ''
  });
  const [expandedRow, setExpandedRow] = useState(null);
  const [transactionLog, setTransactionLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchSummary();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchSummary = async () => {
    try {
      const response = await adminAPI.getTransactionsSummary();
      setSummary(response.data.data);
    } catch (error) {
      console.error('Failed to fetch summary');
    }
  };

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit };
      if (filters.payment_status) params.payment_status = filters.payment_status;
      if (filters.payment_method) params.payment_method = filters.payment_method;
      if (filters.payment_gateway) params.payment_gateway = filters.payment_gateway;
      if (filters.search) params.search = filters.search;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const response = await adminAPI.getTransactions(params);
      setTransactions(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionLog = async (bookingId) => {
    if (expandedRow === bookingId) {
      setExpandedRow(null);
      return;
    }
    setLoadingLog(true);
    setExpandedRow(bookingId);
    try {
      const response = await adminAPI.getTransactionLog(bookingId);
      setTransactionLog(response.data.data);
    } catch (error) {
      setTransactionLog([]);
    } finally {
      setLoadingLog(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchTransactions(1);
  };

  const clearFilters = () => {
    setFilters({
      payment_status: '',
      payment_method: '',
      payment_gateway: '',
      search: '',
      date_from: '',
      date_to: ''
    });
    setTimeout(() => fetchTransactions(1), 100);
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      pending_verification: 'bg-orange-100 text-orange-800 border-orange-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      refunded: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentStatusText = (status) => {
    const texts = {
      pending: '⏳ Pending',
      pending_verification: '🔍 Verifying',
      completed: '✅ Completed',
      failed: '❌ Failed',
      refunded: '↩️ Refunded'
    };
    return texts[status] || status;
  };

  const getMethodBadge = (method) => {
    if (!method) return { text: '—', style: 'bg-gray-50 text-gray-400' };
    const methods = {
      upi: { text: '📱 UPI', style: 'bg-purple-50 text-purple-700' },
      card: { text: '💳 Card', style: 'bg-blue-50 text-blue-700' },
      netbanking: { text: '🏦 NetBanking', style: 'bg-indigo-50 text-indigo-700' },
      wallet: { text: '👛 Wallet', style: 'bg-pink-50 text-pink-700' },
      manual_upi: { text: '📱 Manual UPI', style: 'bg-orange-50 text-orange-700' },
      unknown: { text: '❓ Unknown', style: 'bg-gray-50 text-gray-500' }
    };
    return methods[method] || { text: method, style: 'bg-gray-50 text-gray-500' };
  };

  const getGatewayBadge = (gateway) => {
    if (!gateway || gateway === 'none') return { text: '—', style: '' };
    const gateways = {
      razorpay: { text: '⚡ Razorpay', style: 'text-blue-600 font-medium' },
      manual_upi: { text: '📲 Manual UPI', style: 'text-orange-600 font-medium' }
    };
    return gateways[gateway] || { text: gateway, style: '' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <AdminLayout requiredPerm="manage_bookings" title="Transactions">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm text-gray-500">Total Collected</p>
              <p className="text-2xl font-bold text-green-600 mt-1">₹{Number(summary.totalCollected || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-400 mt-1">from {summary.totalTransactions || 0} transactions</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm text-gray-500">Pending Verification</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{summary.pendingVerification || 0}</p>
              <p className="text-xs text-gray-400 mt-1">awaiting admin review</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{summary.failedCount || 0}</p>
              <p className="text-xs text-gray-400 mt-1">declined / errors</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm text-gray-500">Gateway Split</p>
              <div className="flex gap-3 mt-1">
                <div>
                  <span className="text-lg font-bold text-blue-600">{summary.razorpayCount || 0}</span>
                  <span className="text-xs text-gray-400 block">Razorpay</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-orange-600">{summary.upiCount || 0}</span>
                  <span className="text-xs text-gray-400 block">Manual UPI</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Method Breakdown */}
        {summary?.methodBreakdown?.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Payment Method Breakdown</h3>
            <div className="flex flex-wrap gap-4">
              {summary.methodBreakdown.map((m, i) => {
                const badge = getMethodBadge(m.payment_method);
                return (
                  <div key={i} className={`${badge.style} px-4 py-2 rounded-lg`}>
                    <span className="font-medium">{badge.text}</span>
                    <span className="text-gray-500 ml-2">×{m.count}</span>
                    <span className="text-gray-500 ml-1">(₹{Number(m.total).toLocaleString('en-IN')})</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid md:grid-cols-6 gap-3">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search name, email, ID..."
              className="input-field"
            />
            <select name="payment_status" value={filters.payment_status} onChange={handleFilterChange} className="input-field">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select name="payment_method" value={filters.payment_method} onChange={handleFilterChange} className="input-field">
              <option value="">All Methods</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="netbanking">NetBanking</option>
              <option value="wallet">Wallet</option>
              <option value="manual_upi">Manual UPI</option>
            </select>
            <select name="payment_gateway" value={filters.payment_gateway} onChange={handleFilterChange} className="input-field">
              <option value="">All Gateways</option>
              <option value="razorpay">Razorpay</option>
              <option value="manual_upi">Manual UPI</option>
            </select>
            <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} className="input-field" />
            <div className="flex gap-2">
              <button onClick={applyFilters} className="btn-primary flex-1 text-sm">
                Filter
              </button>
              <button onClick={clearFilters} className="btn-secondary text-sm px-3">
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gateway</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((tx) => {
                      const method = getMethodBadge(tx.payment_method);
                      const gateway = getGatewayBadge(tx.payment_gateway);
                      return (
                        <React.Fragment key={tx.booking_id}>
                          <tr className={`hover:bg-gray-50 ${expandedRow === tx.booking_id ? 'bg-blue-50' : ''}`}>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-800">{formatDate(tx.updated_at)}</p>
                              {tx.payment_completed_at && (
                                <p className="text-xs text-green-600">Paid: {formatDate(tx.payment_completed_at)}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-primary-600 text-sm">{tx.booking_id}</span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-800">{tx.customer_name}</p>
                              <p className="text-xs text-gray-500">{tx.customer_phone}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-700">{tx.service_name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-gray-800">₹{Number(tx.total_amount).toLocaleString('en-IN')}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${method.style}`}>{method.text}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs ${gateway.style}`}>{gateway.text}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full border ${getPaymentStatusBadge(tx.payment_status)}`}>
                                {getPaymentStatusText(tx.payment_status)}
                              </span>
                              {tx.payment_failure_reason && (
                                <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={tx.payment_failure_reason}>
                                  {tx.payment_failure_reason}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => fetchTransactionLog(tx.booking_id)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {expandedRow === tx.booking_id ? 'Hide Log' : 'View Log'}
                              </button>
                              {tx.payment_id && (
                                <p className="text-xs text-gray-400 mt-1 max-w-[120px] truncate" title={tx.payment_id}>
                                  Ref: {tx.payment_id}
                                </p>
                              )}
                            </td>
                          </tr>
                          {/* Expanded Transaction Log */}
                          {expandedRow === tx.booking_id && (
                            <tr>
                              <td colSpan={9} className="px-4 py-4 bg-blue-50 border-t border-blue-100">
                                <div className="mb-2 flex items-center gap-2">
                                  <span className="font-semibold text-sm text-gray-700">Transaction Audit Log</span>
                                  <span className="text-xs text-gray-500">— {tx.booking_id}</span>
                                </div>
                                {loadingLog ? (
                                  <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500 inline-block"></div>
                                  </div>
                                ) : transactionLog.length === 0 ? (
                                  <p className="text-sm text-gray-500">No transaction log entries found.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {transactionLog.map((log, idx) => (
                                      <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200 text-xs">
                                        <div className="flex flex-wrap items-center gap-3 mb-1">
                                          <span className={`px-2 py-0.5 rounded font-medium ${
                                            log.status === 'captured' ? 'bg-green-100 text-green-700' :
                                            log.status === 'failed' ? 'bg-red-100 text-red-700' :
                                            log.status === 'created' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                          }`}>
                                            {log.status}
                                          </span>
                                          <span className="text-gray-500">{log.transaction_type}</span>
                                          {log.payment_method && (
                                            <span className="text-gray-600">via {log.payment_method}</span>
                                          )}
                                          {log.amount && (
                                            <span className="font-medium text-gray-800">₹{Number(log.amount).toLocaleString('en-IN')}</span>
                                          )}
                                          <span className="text-gray-400 ml-auto">{formatDateTime(log.created_at)}</span>
                                        </div>
                                        {log.failure_reason && (
                                          <p className="text-red-600 mt-1">❌ {log.failure_reason}</p>
                                        )}
                                        {log.razorpay_payment_id && (
                                          <p className="text-gray-500 mt-1">Payment ID: {log.razorpay_payment_id}</p>
                                        )}
                                        {log.razorpay_order_id && (
                                          <p className="text-gray-500">Order ID: {log.razorpay_order_id}</p>
                                        )}
                                        {log.gateway_response && (
                                          <details className="mt-1">
                                            <summary className="text-blue-500 cursor-pointer">Gateway Response</summary>
                                            <pre className="mt-1 bg-gray-50 p-2 rounded text-xs text-gray-600 overflow-x-auto">
                                              {JSON.stringify(typeof log.gateway_response === 'string' ? JSON.parse(log.gateway_response) : log.gateway_response, null, 2)}
                                            </pre>
                                          </details>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchTransactions(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 rounded border disabled:opacity-50 text-sm"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchTransactions(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 rounded border disabled:opacity-50 text-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {transactions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No transactions found matching your filters</p>
              </div>
            )}
          </>
        )}
      </main>
    </AdminLayout>
    );
};

export default AdminTransactions;
