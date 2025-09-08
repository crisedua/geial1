import { useState, useEffect } from 'react'
import { useDatabase } from '../contexts/DatabaseContext'
import { Contact } from '../types'
import { Plus, Edit, Trash2, Mail, Building, MapPin } from 'lucide-react'

export default function Contacts() {
  const { getContacts, createContact, updateContact, deleteContact } = useDatabase()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    ecosystem: '',
    region: ''
  })

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await getContacts()
        setContacts(data)
      } catch (error) {
        console.error('Error loading contacts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContacts()
  }, [getContacts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingContact) {
        const updated = await updateContact(editingContact.id, formData)
        setContacts(contacts.map(c => c.id === editingContact.id ? updated : c))
        setEditingContact(null)
      } else {
        const newContact = await createContact(formData)
        setContacts([newContact, ...contacts])
      }
      setShowForm(false)
      setFormData({
        name: '',
        email: '',
        organization: '',
        role: '',
        ecosystem: '',
        region: ''
      })
    } catch (error) {
      console.error('Error saving contact:', error)
    }
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      email: contact.email,
      organization: contact.organization,
      role: contact.role,
      ecosystem: contact.ecosystem,
      region: contact.region
    })
    setShowForm(true)
  }

  const handleDelete = async (contactId: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(contactId)
        setContacts(contacts.filter(c => c.id !== contactId))
      } catch (error) {
        console.error('Error deleting contact:', error)
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingContact(null)
    setFormData({
      name: '',
      email: '',
      organization: '',
      role: '',
      ecosystem: '',
      region: ''
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your stakeholder contacts for report distribution
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </button>
      </div>

      {/* Contact Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingContact ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field mt-1"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input-field mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                  Organization
                </label>
                <input
                  type="text"
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="input-field mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ecosystem" className="block text-sm font-medium text-gray-700">
                  Ecosystem
                </label>
                <input
                  type="text"
                  id="ecosystem"
                  value={formData.ecosystem}
                  onChange={(e) => setFormData({...formData, ecosystem: e.target.value})}
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                  Region
                </label>
                <input
                  type="text"
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                  className="input-field mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingContact ? 'Update Contact' : 'Add Contact'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contacts List */}
      <div className="card">
        {contacts.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first contact.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900">
                      {contact.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {contact.email}
                      </div>
                      {contact.organization && (
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          {contact.organization}
                        </div>
                      )}
                      {(contact.ecosystem || contact.region) && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {contact.ecosystem} {contact.region && `• ${contact.region}`}
                        </div>
                      )}
                    </div>
                    {contact.role && (
                      <p className="text-xs text-gray-400 mt-1">{contact.role}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Edit contact"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete contact"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-500 text-center">
        {contacts.length} contact{contacts.length !== 1 ? 's' : ''} total
      </div>
    </div>
  )
}
