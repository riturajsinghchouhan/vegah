import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/shared/components/admin/PageHeader';
import { Search, ChevronRight, Ban, CheckCircle, Eye, User } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import Pagination from '@/shared/components/ui/Pagination';
import AdminCustomerDetails from './AdminCustomerDetails';
import { adminService } from '../services/adminService';

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        isBlocked: statusFilter === 'blocked' ? true : statusFilter === 'active' ? false : undefined,
      };
      const res = await adminService.getUsers(params);
      const data = res?.data || res?.items || (Array.isArray(res) ? res : []);
      const meta = res?.meta || {};
      
      const mappedUsers = data.map(u => ({
        id: u._id,
        name: u.fullName || 'User',
        email: u.email || '-',
        phone: u.phone || '-',
        totalBookings: u.stats?.totalBookings || 0,
        activeRental: u.stats?.activeBookings > 0,
        totalSpent: `₹ ${u.stats?.totalSpent || 0}`,
        walletBalance: `₹ ${u.walletBalance || 0}`,
        regDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-',
        status: u.isBlocked ? 'Blocked' : 'Active',
        avatar: u.avatarUrl || ''
      }));
      
      setCustomers(mappedUsers);
      setTotal(meta.total ?? mappedUsers.length);
      setTotalPages(meta.totalPages ?? (Math.ceil((meta.total ?? mappedUsers.length) / pageSize) || 1));
    } catch (error) {
      console.error("Failed to load customers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, statusFilter]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      <PageHeader 
        title="Customer Management" 
        description="View, manage and block users registered on the platform."
      />
      
      {/* Search and Filters Bar */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-4 px-4">
        <div className="flex-1 flex items-center w-full">
          <Search className="text-gray-400 mr-3 shrink-0" size={20} />
          <input 
            type="text" 
            placeholder="Search by Name, Email, Phone, or ID..." 
            className="w-full bg-transparent border-none outline-none text-gray-700 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 text-sm rounded-lg py-2 px-3 bg-gray-50 text-gray-700 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked Only</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="p-8 text-center text-gray-500 font-medium">Loading customers...</div>
      ) : (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-800 text-sm text-white">
                <th className="px-6 py-4 text-center">Customer</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Bookings</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Wallet</th>
                <th className="px-6 py-4">Reg. Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((customer) => (
                <tr 
                  key={customer.id} 
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  {/* Customer Col */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{customer.name}</div>
                        <div className="text-xs text-gray-500">{customer.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Contact Col */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-800">{customer.email}</div>
                    <div className="text-xs text-gray-500">{customer.phone}</div>
                  </td>

                  {/* Bookings Col */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{customer.totalBookings}</div>
                    {customer.activeRental ? (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">ACTIVE RENTAL</span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">No Active</span>
                    )}
                  </td>

                  {/* Total Spent Col */}
                  <td className="px-6 py-4 font-semibold text-gray-900 text-sm">
                    {customer.totalSpent}
                  </td>

                  {/* Wallet Col */}
                  <td className="px-6 py-4 font-semibold text-blue-600 text-sm">
                    {customer.walletBalance}
                  </td>

                  {/* Reg Date Col */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {customer.regDate}
                  </td>

                  {/* Status Col */}
                  <td className="px-6 py-4">
                    {customer.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700"><CheckCircle size={14}/> Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700"><Ban size={14}/> Blocked</span>
                    )}
                  </td>

                  {/* Actions Col */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="outline" 
                        className="bg-white h-8 px-3 text-xs" 
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <Eye size={14} className="mr-1.5" /> View
                      </Button>
                      <Button 
                        variant="outline" 
                        className={`h-8 px-3 text-xs ${customer.status === 'Active' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                        onClick={async () => {
                          try {
                            if (customer.status === 'Active') {
                              await adminService.blockUser(customer.id);
                            } else {
                              await adminService.unblockUser(customer.id);
                            }
                            setCustomers(prev => prev.map(c => 
                              c.id === customer.id ? { ...c, status: c.status === 'Active' ? 'Blocked' : 'Active' } : c
                            ));
                          } catch (error) {
                            console.error("Failed to toggle status", error);
                          }
                        }}
                      >
                        {customer.status === 'Active' ? 'Block' : 'Unblock'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {customers.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Bar */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <Pagination 
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            loading={loading}
          />
        </div>
      </div>
      )}

      {/* Customer Details Modal */}
      <Modal 
        isOpen={!!selectedCustomer} 
        onClose={() => setSelectedCustomer(null)} 
        title="Customer Profile" 
        size="xl"
        accent={false}
      >
        {selectedCustomer && (
          <AdminCustomerDetails customerIdProp={selectedCustomer.id} asModal={true} />
        )}
      </Modal>
    </div>
  );
}
