import React, { useEffect, useState } from 'react';
import { Search, User, AlertCircle, Ban, Check, MessageSquare, Calendar, DollarSign, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAdminStore } from '../../stores/adminStore';
import CustomerDetailsModal from '../../components/admin/CustomerDetailsModal';
import BlacklistModal from '../../components/admin/BlacklistModal';
import { exportCustomersCSV } from '../../utils/csvExport';
import type { User as Customer } from '../../types';
import { parseDateInLocalTimezone } from '../../utils/dateUtils';

interface CustomerWithStats extends Customer {
  is_blacklisted?: boolean;
  blacklist_reason?: string;
  total_bookings?: number;
  total_spent?: number;
  last_booking_date?: string;
}

const AdminCustomers: React.FC = () => {
  const { 
    allCustomers,
    loading, 
    error,
    fetchAllCustomers,
    toggleCustomerBlacklist
  } = useAdminStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [showBlacklisted, setShowBlacklisted] = useState(false);
  const [blacklistModalData, setBlacklistModalData] = useState<{
    isOpen: boolean;
    customer: CustomerWithStats | null;
    isBlacklisting: boolean;
  }>({ isOpen: false, customer: null, isBlacklisting: true });

  useEffect(() => {
    fetchAllCustomers();
  }, []); // Only on mount - simple and clean

  const handleBlacklistToggle = (customer: CustomerWithStats) => {
    setBlacklistModalData({
      isOpen: true,
      customer,
      isBlacklisting: !customer.is_blacklisted
    });
  };

  const handleBlacklistConfirm = async (reason?: string) => {
    if (!blacklistModalData.customer) return;
    
    const customer = blacklistModalData.customer;
    const success = await toggleCustomerBlacklist(
      customer.id, 
      blacklistModalData.isBlacklisting, 
      reason
    );
    
    if (success) {
      toast.success(
        blacklistModalData.isBlacklisting 
          ? 'Customer has been blacklisted' 
          : 'Customer has been removed from blacklist'
      );
      await fetchAllCustomers();
    } else {
      toast.error('Failed to update customer status');
    }
    
    setBlacklistModalData({ isOpen: false, customer: null, isBlacklisting: true });
  };

  const filteredCustomers = allCustomers.filter(customer => {
    const matchesSearch = 
      customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);
    
    const matchesBlacklist = showBlacklisted ? true : !customer.is_blacklisted;
    
    return matchesSearch && matchesBlacklist;
  });

  if (loading && allCustomers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleExport = () => {
    try {
      exportCustomersCSV(filteredCustomers);
      toast.success('Customer list exported successfully');
    } catch (error) {
      toast.error('Failed to export customer list');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">View and manage your customers</p>
        </div>
        <Button
          variant="outline"
          leftIcon={<Download size={20} />}
          onClick={handleExport}
          disabled={filteredCustomers.length === 0}
        >
          Export to CSV
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showBlacklisted"
              checked={showBlacklisted}
              onChange={(e) => setShowBlacklisted(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="showBlacklisted" className="text-sm font-medium text-gray-700">
              Show blacklisted
            </label>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
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
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className={customer.is_blacklisted ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.first_name || 'No name'} {customer.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {customer.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    {customer.phone && (
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{customer.total_bookings || 0} bookings</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} className="text-gray-400" />
                        <span>${customer.total_spent || 0}</span>
                      </div>
                    </div>
                    {customer.last_booking_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        Last: {format(parseDateInLocalTimezone(customer.last_booking_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.is_blacklisted ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Blacklisted
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCustomer(customer)}
                        leftIcon={<MessageSquare size={16} />}
                      >
                        Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBlacklistToggle(customer)}
                        className={customer.is_blacklisted ? "text-green-600 border-green-600" : "text-red-600 border-red-600"}
                        leftIcon={customer.is_blacklisted ? <Check size={16} /> : <Ban size={16} />}
                      >
                        {customer.is_blacklisted ? 'Unblock' : 'Blacklist'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria' : 'Customers will appear here once they make bookings'}
          </p>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* Blacklist Modal */}
      <BlacklistModal
        isOpen={blacklistModalData.isOpen}
        customerName={blacklistModalData.customer ? 
          `${blacklistModalData.customer.first_name || 'Unknown'} ${blacklistModalData.customer.last_name || ''}`.trim() 
          : ''
        }
        isBlacklisting={blacklistModalData.isBlacklisting}
        onConfirm={handleBlacklistConfirm}
        onClose={() => setBlacklistModalData({ isOpen: false, customer: null, isBlacklisting: true })}
      />
    </div>
  );
};

export default AdminCustomers;