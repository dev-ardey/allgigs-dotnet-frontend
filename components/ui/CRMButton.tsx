import React, { useState } from 'react';
import {
    Users,
    X,
    Calendar,
    Phone,
    Mail,
    Building,
    ExternalLink,
    Plus,
    Edit,
    Save,
    Trash2
} from 'lucide-react';

interface CRMContact {
    id: string;
    date: string;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    company: string;
    source: string;
    notes?: string;
}

interface CRMButtonProps {
    className?: string;
}

const CRMButton: React.FC<CRMButtonProps> = ({ className = '' }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [contacts, setContacts] = useState<CRMContact[]>([
        {
            id: '1',
            date: '2025-01-15',
            contact_name: 'Sarah Johnson',
            contact_phone: '+31 20 123 4567',
            contact_email: 'sarah.johnson@techflow.com',
            company: 'TechFlow Solutions',
            source: 'LinkedIn',
            notes: 'Very responsive, prefers email communication'
        },
        {
            id: '2',
            date: '2025-01-14',
            contact_name: 'Mark van der Berg',
            contact_phone: '+31 20 123 4568',
            contact_email: 'mark.vandeberg@innovatecorp.com',
            company: 'InnovateCorp',
            source: 'Website',
            notes: 'Will conduct technical interview'
        },
        {
            id: '3',
            date: '2025-01-13',
            contact_name: 'Lisa Chen',
            contact_phone: '+31 20 123 4569',
            contact_email: 'lisa.chen@startupnl.com',
            company: 'StartupNL',
            source: 'Referral',
            notes: 'Interested in freelance opportunities'
        }
    ]);

    const [editingContact, setEditingContact] = useState<CRMContact | null>(null);
    const [newContact, setNewContact] = useState<Partial<CRMContact>>({
        date: new Date().toISOString().split('T')[0],
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        company: '',
        source: '',
        notes: ''
    });

    const handleAddContact = () => {
        if (newContact.contact_name && newContact.company) {
            const contact: CRMContact = {
                id: Date.now().toString(),
                date: newContact.date || new Date().toISOString().split('T')[0],
                contact_name: newContact.contact_name,
                contact_phone: newContact.contact_phone || '',
                contact_email: newContact.contact_email || '',
                company: newContact.company,
                source: newContact.source || '',
                notes: newContact.notes || ''
            };
            setContacts([contact, ...contacts]);
            setNewContact({
                date: new Date().toISOString().split('T')[0],
                contact_name: '',
                contact_phone: '',
                contact_email: '',
                company: '',
                source: '',
                notes: ''
            });
        }
    };

    const handleEditContact = (contact: CRMContact) => {
        setEditingContact(contact);
    };

    const handleSaveEdit = () => {
        if (editingContact) {
            setContacts(contacts.map(c => c.id === editingContact.id ? editingContact : c));
            setEditingContact(null);
        }
    };

    const handleDeleteContact = (id: string) => {
        setContacts(contacts.filter(c => c.id !== id));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <>
            {/* CRM Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${className}`}
                style={{
                    background: 'linear-gradient(135deg, #0ccf83 0%, #00a870 100%)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                }}
            >
                <Users size={18} />
                <span>CRM</span>
            </button>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <Users size={24} className="text-blue-600" />
                                <h2 className="text-2xl font-bold text-gray-900">AllGigs CRM</h2>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            {/* Add New Contact Form */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <h3 className="text-lg font-semibold mb-4 text-gray-800">Add New Contact</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={newContact.date}
                                            onChange={(e) => setNewContact({...newContact, date: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                                        <input
                                            type="text"
                                            value={newContact.contact_name}
                                            onChange={(e) => setNewContact({...newContact, contact_name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter contact name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                                        <input
                                            type="text"
                                            value={newContact.company}
                                            onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter company name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={newContact.contact_phone}
                                            onChange={(e) => setNewContact({...newContact, contact_phone: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={newContact.contact_email}
                                            onChange={(e) => setNewContact({...newContact, contact_email: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                                        <select
                                            value={newContact.source}
                                            onChange={(e) => setNewContact({...newContact, source: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select source</option>
                                            <option value="LinkedIn">LinkedIn</option>
                                            <option value="Website">Website</option>
                                            <option value="Referral">Referral</option>
                                            <option value="Email">Email</option>
                                            <option value="Phone">Phone</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea
                                        value={newContact.notes}
                                        onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={2}
                                        placeholder="Add any notes about this contact..."
                                    />
                                </div>
                                <button
                                    onClick={handleAddContact}
                                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Add Contact
                                </button>
                            </div>

                            {/* Contacts List */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-gray-800">Contacts ({contacts.length})</h3>
                                <div className="space-y-4">
                                    {contacts.map((contact) => (
                                        <div key={contact.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                            {editingContact?.id === contact.id ? (
                                                // Edit Mode
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <input
                                                            type="text"
                                                            value={editingContact.contact_name}
                                                            onChange={(e) => setEditingContact({...editingContact, contact_name: e.target.value})}
                                                            className="px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editingContact.company}
                                                            onChange={(e) => setEditingContact({...editingContact, company: e.target.value})}
                                                            className="px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                        <input
                                                            type="tel"
                                                            value={editingContact.contact_phone}
                                                            onChange={(e) => setEditingContact({...editingContact, contact_phone: e.target.value})}
                                                            className="px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                        <input
                                                            type="email"
                                                            value={editingContact.contact_email}
                                                            onChange={(e) => setEditingContact({...editingContact, contact_email: e.target.value})}
                                                            className="px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                                        >
                                                            <Save size={16} />
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingContact(null)}
                                                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // View Mode
                                                <div>
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h4 className="text-lg font-semibold text-gray-900">{contact.contact_name}</h4>
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                                    {contact.source}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar size={16} className="text-gray-400" />
                                                                    <span>{formatDate(contact.date)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Building size={16} className="text-gray-400" />
                                                                    <span>{contact.company}</span>
                                                                </div>
                                                                {contact.contact_phone && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Phone size={16} className="text-gray-400" />
                                                                        <span>{contact.contact_phone}</span>
                                                                    </div>
                                                                )}
                                                                {contact.contact_email && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Mail size={16} className="text-gray-400" />
                                                                        <span>{contact.contact_email}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {contact.notes && (
                                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                                    <p className="text-sm text-gray-700">{contact.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2 ml-4">
                                                            <button
                                                                onClick={() => handleEditContact(contact)}
                                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteContact(contact.id)}
                                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CRMButton;
