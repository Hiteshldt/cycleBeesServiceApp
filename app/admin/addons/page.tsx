'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Addon } from '@/lib/supabase'
import { formatCurrency, rupeesToPaise } from '@/lib/utils'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'

export default function AddonManagement() {
  const [addons, setAddons] = useState<Addon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: ''
  })

  useEffect(() => {
    fetchAddons()
  }, [])

  const fetchAddons = async () => {
    try {
      const response = await fetch('/api/admin/addons')
      if (response.ok) {
        const data = await response.json()
        setAddons(data)
      }
    } catch (error) {
      console.error('Error fetching addons:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAddon = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price_paise: rupeesToPaise(parseInt(formData.price) || 0)
      }

      if (editingAddon) {
        // Update existing addon
        const response = await fetch(`/api/admin/addons/${editingAddon.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (response.ok) {
          fetchAddons()
          setEditingAddon(null)
          resetForm()
        }
      } else {
        // Create new addon
        const response = await fetch('/api/admin/addons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (response.ok) {
          fetchAddons()
          setShowAddForm(false)
          resetForm()
        }
      }
    } catch (error) {
      console.error('Error saving addon:', error)
    }
  }

  const handleDeleteAddon = async (id: string) => {
    if (confirm('Are you sure you want to delete this add-on?')) {
      try {
        const response = await fetch(`/api/admin/addons/${id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          fetchAddons()
        }
      } catch (error) {
        console.error('Error deleting addon:', error)
      }
    }
  }

  const handleToggleActive = async (addon: Addon) => {
    try {
      const response = await fetch(`/api/admin/addons/${addon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !addon.is_active })
      })
      
      if (response.ok) {
        fetchAddons()
      }
    } catch (error) {
      console.error('Error toggling addon status:', error)
    }
  }

  const startEdit = (addon: Addon) => {
    setEditingAddon(addon)
    setFormData({
      name: addon.name,
      description: addon.description || '',
      price: Math.round(addon.price_paise / 100).toString()
    })
    setShowAddForm(false)
  }

  const cancelEdit = () => {
    setEditingAddon(null)
    setShowAddForm(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '' })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading add-ons...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add-on Services Management</h1>
          <p className="text-gray-600">Manage add-on services for customer requests</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm || !!editingAddon}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Add-on
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingAddon) && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingAddon ? 'Edit Add-on Service' : 'Add New Add-on Service'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Premium Wash & Polish"
              />
            </div>
            
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="200"
              />
            </div>
            
            <div className="md:col-span-1">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Service description (optional)"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSaveAddon}
              disabled={!formData.name || !formData.price}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingAddon ? 'Update' : 'Save'} Add-on
            </Button>
            <Button variant="outline" onClick={cancelEdit}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Addons List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {addons.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No add-on services found.</p>
            <Button className="mt-4" onClick={() => setShowAddForm(true)}>
              Add your first add-on service
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Service Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {addons.map((addon) => (
                  <tr key={addon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {addon.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {addon.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(addon.price_paise)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        className={addon.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                        }
                      >
                        {addon.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(addon)}
                          disabled={!!editingAddon || showAddForm}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(addon)}
                        >
                          {addon.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteAddon(addon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}