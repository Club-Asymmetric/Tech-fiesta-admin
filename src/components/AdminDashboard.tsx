"use client";

import { useState, useEffect } from 'react';
import { 
  getAllRegistrations, 
  FirebaseRegistration,
  updateRegistrationStatus as updateStatusInFirebase,
  updatePaymentStatus as updatePaymentInFirebase
} from '@/services/registrationService';
import { Download, Search, Filter, Eye, Mail, Phone, Edit2, Check, X, BarChart3, Users } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<FirebaseRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<FirebaseRegistration | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await getAllRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRegistrationStatus = async (registrationId: string, newStatus: string) => {
    try {
      const success = await updateStatusInFirebase(registrationId, newStatus as any);
      
      if (success) {
        // Update local state only if Firebase update was successful
        setRegistrations(prev => 
          prev.map(reg => 
            reg.id === registrationId 
              ? { ...reg, status: newStatus as any }
              : reg
          )
        );
        setEditingStatus(null);
      } else {
        alert('Failed to update status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const updatePaymentStatus = async (registrationId: string, newPaymentStatus: string) => {
    try {
      const success = await updatePaymentInFirebase(registrationId, newPaymentStatus as any);
      
      if (success) {
        // Update local state only if Firebase update was successful
        setRegistrations(prev => 
          prev.map(reg => 
            reg.id === registrationId 
              ? { ...reg, paymentStatus: newPaymentStatus as any }
              : reg
          )
        );
        setEditingPayment(null);
      } else {
        alert('Failed to update payment status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status. Please try again.');
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.college.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || reg.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Calculate basic stats for the dashboard
  const totalMembers = registrations.reduce((total, reg) => {
    return total + (reg.teamSize || 1);
  }, 0);

  const exportToCSV = () => {
    const csvHeaders = [
      'Registration ID',
      'Name', 
      'Email',
      'WhatsApp',
      'College',
      'Department',
      'Year',
      'Selected Events',
      'Selected Workshops',
      'Non-Tech Events',
      'Team Size',
      'Status',
      'Payment Status',
      'Created At'
    ];

    const csvData = filteredRegistrations.map(reg => [
      reg.registrationId,
      reg.name,
      reg.email,
      reg.whatsapp,
      reg.college,
      reg.department,
      reg.year,
      reg.selectedEvents.map(event => 
        typeof event === 'object' && event.title ? event.title : event
      ).join('; '),
      reg.selectedWorkshops.map(workshop => 
        typeof workshop === 'object' && workshop.title ? workshop.title : workshop
      ).join('; '),
      reg.selectedNonTechEvents.map(event => 
        typeof event === 'object' && event.title ? event.title : event
      ).join('; '),
      reg.teamSize,
      reg.status,
      reg.paymentStatus,
      reg.createdAt.toDate().toLocaleDateString()
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tech-fiesta-registrations-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading registrations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Tech Fiesta 2025 - Registration Dashboard</h1>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Link>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-blue-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Total Registrations</h3>
                <p className="text-3xl font-bold">{registrations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-cyan-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Total Members</h3>
                <p className="text-3xl font-bold">{totalMembers}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-600 p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Confirmed</h3>
            <p className="text-3xl font-bold">
              {registrations.filter(r => r.status === 'confirmed').length}
            </p>
          </div>
          <div className="bg-yellow-600 p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Pending</h3>
            <p className="text-3xl font-bold">
              {registrations.filter(r => r.status === 'pending').length}
            </p>
          </div>
          <div className="bg-purple-600 p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Payment Verified</h3>
            <p className="text-3xl font-bold">
              {registrations.filter(r => r.paymentStatus === 'verified').length}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, registration ID, or college..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Registration ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">College</th>
                  <th className="px-4 py-3 text-left">Events</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((registration) => (
                  <tr key={registration.id} className="border-b border-gray-700">
                    <td className="px-4 py-3 font-mono text-blue-400">
                      {registration.registrationId}
                    </td>
                    <td className="px-4 py-3">{registration.name}</td>
                    <td className="px-4 py-3">{registration.college}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs">
                        E: {registration.selectedEvents.length} | 
                        W: {registration.selectedWorkshops.length} | 
                        NT: {registration.selectedNonTechEvents.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {editingStatus === registration.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs"
                              defaultValue={registration.status}
                              onChange={(e) => updateRegistrationStatus(registration.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <button
                              onClick={() => setEditingStatus(null)}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              registration.status === 'confirmed' ? 'bg-green-600' :
                              registration.status === 'pending' ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}>
                              {registration.status}
                            </span>
                            <button
                              onClick={() => setEditingStatus(registration.id)}
                              className="p-1 text-gray-400 hover:text-blue-400"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {editingPayment === registration.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs"
                              defaultValue={registration.paymentStatus}
                              onChange={(e) => updatePaymentStatus(registration.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="verified">Verified</option>
                              <option value="failed">Failed</option>
                            </select>
                            <button
                              onClick={() => setEditingPayment(null)}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              registration.paymentStatus === 'verified' ? 'bg-green-600' :
                              registration.paymentStatus === 'pending' ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}>
                              {registration.paymentStatus}
                            </span>
                            <button
                              onClick={() => setEditingPayment(registration.id)}
                              className="p-1 text-gray-400 hover:text-blue-400"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {registration.createdAt.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedRegistration(registration)}
                          className="p-1 text-blue-400 hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <a
                          href={`mailto:${registration.email}`}
                          className="p-1 text-green-400 hover:text-green-300"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                        <a
                          href={`https://wa.me/${registration.whatsapp}`}
                          className="p-1 text-green-400 hover:text-green-300"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRegistrations.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-400">
            No registrations found matching your criteria.
          </div>
        )}
      </div>

      {/* Registration Detail Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Registration Details</h2>
                <button
                  onClick={() => setSelectedRegistration(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-blue-400">Personal Information</h3>
                  <p><strong>Name:</strong> {selectedRegistration.name}</p>
                  <p><strong>Email:</strong> {selectedRegistration.email}</p>
                  <p><strong>WhatsApp:</strong> {selectedRegistration.whatsapp}</p>
                  <p><strong>College:</strong> {selectedRegistration.college}</p>
                  <p><strong>Department:</strong> {selectedRegistration.department}</p>
                  <p><strong>Year:</strong> {selectedRegistration.year}</p>
                </div>

                {selectedRegistration.selectedEvents.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-green-400">Technical Events</h3>
                    <p>{selectedRegistration.selectedEvents.map(event => 
                      typeof event === 'object' && event.title ? event.title : event
                    ).join(', ')}</p>
                  </div>
                )}

                {selectedRegistration.selectedWorkshops.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-purple-400">Workshops</h3>
                    <p>{selectedRegistration.selectedWorkshops.map(workshop => 
                      typeof workshop === 'object' && workshop.title ? workshop.title : workshop
                    ).join(', ')}</p>
                  </div>
                )}

                {selectedRegistration.selectedNonTechEvents.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-yellow-400">Non-Tech Events</h3>
                    <p>{selectedRegistration.selectedNonTechEvents.map(event => 
                      typeof event === 'object' && event.title ? event.title : event
                    ).join(', ')}</p>
                  </div>
                )}

                {selectedRegistration.teamMembers && selectedRegistration.teamMembers.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-orange-400">Team Members</h3>
                    {selectedRegistration.teamMembers.map((member, index) => (
                      <div key={index} className="ml-4">
                        <p><strong>Member {index + 2}:</strong> {member.name} ({member.email})</p>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-red-400">Registration Info</h3>
                  <p><strong>Registration ID:</strong> {selectedRegistration.registrationId}</p>
                  <p><strong>Status:</strong> {selectedRegistration.status}</p>
                  <p><strong>Payment Status:</strong> {selectedRegistration.paymentStatus}</p>
                  <p><strong>Created:</strong> {selectedRegistration.createdAt.toDate().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
