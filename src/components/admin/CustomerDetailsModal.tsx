import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, DollarSign, FileText, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { useAdminStore } from '../../stores/adminStore';
import type { User as Customer, Booking } from '../../types';

interface CustomerWithStats extends Customer {
  is_blacklisted?: boolean;
  blacklist_reason?: string;
  total_bookings?: number;
  total_spent?: number;
  last_booking_date?: string;
}

interface CustomerDetailsModalProps {
  customer: CustomerWithStats;
  onClose: () => void;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({ customer, onClose }) => {
  const { 
    getCustomerBookings, 
    getCustomerNotes, 
    addCustomerNote 
  } = useAdminStore();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'bookings' | 'notes'>('info');

  useEffect(() => {
    loadCustomerData();
  }, [customer.id]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const [bookingsData, notesData] = await Promise.all([
        getCustomerBookings(customer.id),
        getCustomerNotes(customer.id)
      ]);
      setBookings(bookingsData);
      setNotes(notesData);
    } catch (error) {
      toast.error('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    const success = await addCustomerNote(customer.id, newNote);
    if (success) {
      toast.success('Note added successfully');
      setNewNote('');
      loadCustomerData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Customer Details</h2>
            <p className="text-gray-500 text-sm mt-1">
              {customer.first_name} {customer.last_name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'info' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('info')}
          >
            Information
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'bookings' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings ({bookings.length})
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'notes' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('notes')}
          >
            Notes ({notes.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Information Tab */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {customer.is_blacklisted && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                        <div>
                          <h4 className="font-semibold text-red-800">Customer Blacklisted</h4>
                          <p className="text-sm text-red-600 mt-1">
                            Reason: {customer.blacklist_reason || 'No reason provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                            <span className="text-sm">{customer.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-4">Statistics</h3>
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Total Bookings</span>
                            <span className="font-semibold text-lg">{customer.total_bookings || 0}</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Total Spent</span>
                            <span className="font-semibold text-lg">${customer.total_spent || 0}</span>
                          </div>
                        </div>
                        {customer.last_booking_date && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Last Booking</span>
                              <span className="font-semibold">
                                {format(new Date(customer.last_booking_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-500">No bookings found</p>
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">
                                {booking.car?.make} {booking.car?.model}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${booking.total_price}</div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(booking.created_at), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {/* Add Note Form */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-3">Add New Note</h4>
                    <div className="flex gap-2">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Enter note about this customer..."
                        className="flex-1 px-3 py-2 border rounded-lg resize-none"
                        rows={2}
                      />
                      <Button
                        variant="primary"
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        leftIcon={<Plus size={16} />}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Notes List */}
                  {notes.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-500">No notes yet</p>
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="border rounded-lg p-4">
                        <p className="text-gray-800 mb-2">{note.note}</p>
                        <div className="text-xs text-gray-500">
                          {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;