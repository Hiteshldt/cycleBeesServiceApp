'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Addon, ServiceBundle } from '@/lib/supabase'
import { formatCurrency, rupeesToPaise, paiseToRupees } from '@/lib/utils'
import { Plus, Edit, Trash2, Save, X, Settings, DollarSign, Package } from 'lucide-react'

interface LaCarteSettings {
  id: string
  real_price_paise: number
  current_price_paise: number
  discount_note: string
  is_active: boolean
}

export default function AdminSettings() {
  // Add-ons state
  const [addons, setAddons] = useState<Addon[]>([])
  const [isLoadingAddons, setIsLoadingAddons] = useState(true)
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
  const [showAddAddonForm, setShowAddAddonForm] = useState(false)
  const [addonFormData, setAddonFormData] = useState({
    name: '',
    description: '',
    price: ''
  })

  // Bundles state
  const [bundles, setBundles] = useState<ServiceBundle[]>([])
  const [isLoadingBundles, setIsLoadingBundles] = useState(true)
  const [editingBundle, setEditingBundle] = useState<ServiceBundle | null>(null)
  const [showAddBundleForm, setShowAddBundleForm] = useState(false)
  const [bundleFormData, setBundleFormData] = useState({
    name: '',
    description: '',
    price: '',
    bullet_points: ['']
  })

  // La Carte settings state
  const [laCarteSettings, setLaCarteSettings] = useState<LaCarteSettings>({
    id: 'lacarte',
    real_price_paise: 9900, // Default ₹99
    current_price_paise: 9900,
    discount_note: '',
    is_active: true
  })
  const [editingLaCarte, setEditingLaCarte] = useState(false)
  const [laCarteFormData, setLaCarteFormData] = useState({
    real_price: '99',
    current_price: '99',
    discount_note: ''
  })

  useEffect(() => {
    fetchAddons()
    fetchBundles()
    fetchLaCarteSettings()
  }, [])

  // Add-ons functions
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
      setIsLoadingAddons(false)
    }
  }

  const handleSaveAddon = async () => {
    try {
      const payload = {
        name: addonFormData.name,
        description: addonFormData.description,
        price_paise: rupeesToPaise(parseInt(addonFormData.price) || 0)
      }

      if (editingAddon) {
        // Update existing addon
        const response = await fetch(`/api/admin/addons/${editingAddon.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          alert('Add-on updated successfully!')
        } else {
          alert('Failed to update add-on')
        }
      } else {
        // Create new addon
        const response = await fetch('/api/admin/addons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          alert('Add-on created successfully!')
        } else {
          alert('Failed to create add-on')
        }
      }

      // Reset form and refresh
      setAddonFormData({ name: '', description: '', price: '' })
      setEditingAddon(null)
      setShowAddAddonForm(false)
      fetchAddons()
    } catch (error) {
      console.error('Error saving addon:', error)
      alert('Error saving add-on')
    }
  }

  const handleToggleAddonStatus = async (addonId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/addons/${addonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (response.ok) {
        fetchAddons()
      } else {
        alert('Failed to update add-on status')
      }
    } catch (error) {
      console.error('Error updating addon status:', error)
    }
  }

  const handleDeleteAddon = async (addonId: string, addonName: string) => {
    if (confirm(`Are you sure you want to delete "${addonName}"?`)) {
      try {
        const response = await fetch(`/api/admin/addons/${addonId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert('Add-on deleted successfully!')
          fetchAddons()
        } else {
          alert('Failed to delete add-on')
        }
      } catch (error) {
        console.error('Error deleting addon:', error)
      }
    }
  }

  const startEditingAddon = (addon: Addon) => {
    setEditingAddon(addon)
    setAddonFormData({
      name: addon.name,
      description: addon.description || '',
      price: paiseToRupees(addon.price_paise).toString()
    })
    setShowAddAddonForm(true)
  }

  const cancelAddonEdit = () => {
    setEditingAddon(null)
    setAddonFormData({ name: '', description: '', price: '' })
    setShowAddAddonForm(false)
  }

  // Bundles functions
  const fetchBundles = async () => {
    try {
      const response = await fetch('/api/admin/bundles')
      if (response.ok) {
        const data = await response.json()
        setBundles(data)
      }
    } catch (error) {
      console.error('Error fetching bundles:', error)
    } finally {
      setIsLoadingBundles(false)
    }
  }

  const handleSaveBundle = async () => {
    try {
      const validBulletPoints = bundleFormData.bullet_points.filter(
        point => point.trim().length > 0
      )

      if (validBulletPoints.length === 0) {
        alert('At least one bullet point is required')
        return
      }

      const payload = {
        name: bundleFormData.name,
        description: bundleFormData.description,
        price_paise: rupeesToPaise(parseInt(bundleFormData.price) || 0),
        bullet_points: validBulletPoints,
        display_order: bundles.length + 1
      }

      if (editingBundle) {
        const response = await fetch(`/api/admin/bundles/${editingBundle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          alert('Bundle updated successfully!')
        } else {
          alert('Failed to update bundle')
        }
      } else {
        const response = await fetch('/api/admin/bundles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          alert('Bundle created successfully!')
        } else {
          alert('Failed to create bundle')
        }
      }

      setBundleFormData({ name: '', description: '', price: '', bullet_points: [''] })
      setEditingBundle(null)
      setShowAddBundleForm(false)
      fetchBundles()
    } catch (error) {
      console.error('Error saving bundle:', error)
      alert('Error saving bundle')
    }
  }

  const handleToggleBundleStatus = async (bundleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/bundles/${bundleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (response.ok) {
        fetchBundles()
      } else {
        alert('Failed to update bundle status')
      }
    } catch (error) {
      console.error('Error updating bundle status:', error)
    }
  }

  const handleDeleteBundle = async (bundleId: string, bundleName: string) => {
    if (confirm(`Are you sure you want to delete "${bundleName}"?`)) {
      try {
        const response = await fetch(`/api/admin/bundles/${bundleId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert('Bundle deleted successfully!')
          fetchBundles()
        } else {
          alert('Failed to delete bundle')
        }
      } catch (error) {
        console.error('Error deleting bundle:', error)
      }
    }
  }

  const startEditingBundle = (bundle: ServiceBundle) => {
    setEditingBundle(bundle)
    setBundleFormData({
      name: bundle.name,
      description: bundle.description || '',
      price: paiseToRupees(bundle.price_paise).toString(),
      bullet_points: [...bundle.bullet_points, '']
    })
    setShowAddBundleForm(true)
  }

  const cancelBundleEdit = () => {
    setEditingBundle(null)
    setBundleFormData({ name: '', description: '', price: '', bullet_points: [''] })
    setShowAddBundleForm(false)
  }

  const addBulletPoint = () => {
    setBundleFormData({
      ...bundleFormData,
      bullet_points: [...bundleFormData.bullet_points, '']
    })
  }

  const removeBulletPoint = (index: number) => {
    if (bundleFormData.bullet_points.length > 1) {
      const newBulletPoints = bundleFormData.bullet_points.filter((_, i) => i !== index)
      setBundleFormData({
        ...bundleFormData,
        bullet_points: newBulletPoints
      })
    }
  }

  const updateBulletPoint = (index: number, value: string) => {
    const newBulletPoints = [...bundleFormData.bullet_points]
    newBulletPoints[index] = value
    setBundleFormData({
      ...bundleFormData,
      bullet_points: newBulletPoints
    })
  }

  // La Carte settings functions
  const fetchLaCarteSettings = async () => {
    try {
      const response = await fetch('/api/admin/lacarte')
      if (response.ok) {
        const settings = await response.json()
        setLaCarteSettings(settings)
        setLaCarteFormData({
          real_price: paiseToRupees(settings.real_price_paise).toString(),
          current_price: paiseToRupees(settings.current_price_paise).toString(),
          discount_note: settings.discount_note
        })
      }
    } catch (error) {
      console.error('Error fetching La Carte settings:', error)
    }
  }

  const handleSaveLaCarteSettings = async () => {
    const realPrice = rupeesToPaise(parseInt(laCarteFormData.real_price) || 99)
    const currentPrice = rupeesToPaise(parseInt(laCarteFormData.current_price) || 99)
    
    try {
      const response = await fetch('/api/admin/lacarte', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          real_price_paise: realPrice,
          current_price_paise: currentPrice,
          discount_note: laCarteFormData.discount_note
        })
      })
      
      if (response.ok) {
        const updatedSettings = await response.json()
        setLaCarteSettings(updatedSettings)
        setEditingLaCarte(false)
        alert('La Carte settings updated successfully!')
      } else {
        alert('Failed to update La Carte settings')
      }
    } catch (error) {
      console.error('Error saving La Carte settings:', error)
      alert('Error saving settings')
    }
  }

  const cancelLaCarteEdit = () => {
    setLaCarteFormData({
      real_price: paiseToRupees(laCarteSettings.real_price_paise).toString(),
      current_price: paiseToRupees(laCarteSettings.current_price_paise).toString(),
      discount_note: laCarteSettings.discount_note
    })
    setEditingLaCarte(false)
  }

  const getDiscountPercentage = () => {
    if (laCarteSettings.real_price_paise <= laCarteSettings.current_price_paise) return 0
    return Math.round(((laCarteSettings.real_price_paise - laCarteSettings.current_price_paise) / laCarteSettings.real_price_paise) * 100)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600">Manage system settings, pricing, and services</p>
      </div>

      {/* La Carte Settings Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">La Carte Service Package</h2>
          </div>
          <Button
            onClick={() => setEditingLaCarte(!editingLaCarte)}
            variant="outline"
            size="sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            {editingLaCarte ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        {editingLaCarte ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="real-price">Real Price (₹)</Label>
                <Input
                  id="real-price"
                  value={laCarteFormData.real_price}
                  onChange={(e) => setLaCarteFormData({ ...laCarteFormData, real_price: e.target.value })}
                  placeholder="Real price"
                />
              </div>
              <div>
                <Label htmlFor="current-price">Current Price (₹)</Label>
                <Input
                  id="current-price"
                  value={laCarteFormData.current_price}
                  onChange={(e) => setLaCarteFormData({ ...laCarteFormData, current_price: e.target.value })}
                  placeholder="Current price"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="discount-note">Discount Note (optional)</Label>
              <Input
                id="discount-note"
                value={laCarteFormData.discount_note}
                onChange={(e) => setLaCarteFormData({ ...laCarteFormData, discount_note: e.target.value })}
                placeholder="e.g., Diwali Sale, New Year Offer"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveLaCarteSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button onClick={cancelLaCarteEdit} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-500">Current Price:</span>
                <div className="flex items-center gap-2">
                  {laCarteSettings.real_price_paise > laCarteSettings.current_price_paise && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatCurrency(laCarteSettings.real_price_paise)}
                    </span>
                  )}
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(laCarteSettings.current_price_paise)}
                  </span>
                  {getDiscountPercentage() > 0 && (
                    <Badge className="bg-red-100 text-red-800">
                      {getDiscountPercentage()}% OFF
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {laCarteSettings.discount_note && (
              <div>
                <span className="text-sm text-gray-500">Note:</span>
                <span className="ml-2 text-sm text-blue-600 font-medium">
                  {laCarteSettings.discount_note}
                </span>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Includes doorstep pickup & delivery, basic tools & equipment
            </p>
          </div>
        )}
      </div>

      {/* Add-ons Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Add-on Services</h2>
          </div>
          <Button
            onClick={() => setShowAddAddonForm(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Service
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddAddonForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">
              {editingAddon ? 'Edit Add-on Service' : 'Add New Service'}
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="addon-name">Service Name</Label>
                <Input
                  id="addon-name"
                  value={addonFormData.name}
                  onChange={(e) => setAddonFormData({ ...addonFormData, name: e.target.value })}
                  placeholder="e.g., Premium Bike Wash"
                />
              </div>
              <div>
                <Label htmlFor="addon-description">Description</Label>
                <Input
                  id="addon-description"
                  value={addonFormData.description}
                  onChange={(e) => setAddonFormData({ ...addonFormData, description: e.target.value })}
                  placeholder="Brief description of the service"
                />
              </div>
              <div>
                <Label htmlFor="addon-price">Price (₹)</Label>
                <Input
                  id="addon-price"
                  value={addonFormData.price}
                  onChange={(e) => setAddonFormData({ ...addonFormData, price: e.target.value })}
                  placeholder="Price in rupees"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveAddon}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingAddon ? 'Update' : 'Create'} Service
                </Button>
                <Button onClick={cancelAddonEdit} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add-ons List */}
        {isLoadingAddons ? (
          <div className="text-center py-8">Loading add-on services...</div>
        ) : addons.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No add-on services configured. Add your first service above.
          </div>
        ) : (
          <div className="space-y-3">
            {addons.map((addon) => (
              <div
                key={addon.id}
                className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{addon.name}</span>
                    <Badge className={addon.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                      {addon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {addon.description && (
                    <p className="text-sm text-gray-600">{addon.description}</p>
                  )}
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(addon.price_paise)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleAddonStatus(addon.id, addon.is_active)}
                  >
                    {addon.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEditingAddon(addon)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteAddon(addon.id, addon.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Bundles Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Service Bundles</h2>
          </div>
          <Button
            onClick={() => setShowAddBundleForm(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Bundle
          </Button>
        </div>

        {/* Add/Edit Bundle Form */}
        {showAddBundleForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">
              {editingBundle ? 'Edit Service Bundle' : 'Add New Bundle'}
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="bundle-name">Bundle Name</Label>
                <Input
                  id="bundle-name"
                  value={bundleFormData.name}
                  onChange={(e) => setBundleFormData({ ...bundleFormData, name: e.target.value })}
                  placeholder="e.g., Complete Care Package"
                />
              </div>
              <div>
                <Label htmlFor="bundle-description">Description (optional)</Label>
                <Input
                  id="bundle-description"
                  value={bundleFormData.description}
                  onChange={(e) => setBundleFormData({ ...bundleFormData, description: e.target.value })}
                  placeholder="Brief description of the bundle"
                />
              </div>
              <div>
                <Label htmlFor="bundle-price">Price (₹)</Label>
                <Input
                  id="bundle-price"
                  value={bundleFormData.price}
                  onChange={(e) => setBundleFormData({ ...bundleFormData, price: e.target.value })}
                  placeholder="Price in rupees"
                />
              </div>
              <div>
                <Label>Bullet Points</Label>
                <div className="space-y-2">
                  {bundleFormData.bullet_points.map((point, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={point}
                        onChange={(e) => updateBulletPoint(index, e.target.value)}
                        placeholder={`Bullet point ${index + 1}`}
                        className="flex-1"
                      />
                      {bundleFormData.bullet_points.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeBulletPoint(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBulletPoint}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bullet Point
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveBundle}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingBundle ? 'Update' : 'Create'} Bundle
                </Button>
                <Button onClick={cancelBundleEdit} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bundles List */}
        {isLoadingBundles ? (
          <div className="text-center py-8">Loading service bundles...</div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No service bundles configured. Add your first bundle above.
          </div>
        ) : (
          <div className="space-y-4">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-lg">{bundle.name}</span>
                      <Badge className={bundle.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {bundle.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {bundle.description && (
                      <p className="text-sm text-gray-600 mb-2">{bundle.description}</p>
                    )}
                    <p className="text-lg font-bold text-purple-600 mb-2">
                      {formatCurrency(bundle.price_paise)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleBundleStatus(bundle.id, bundle.is_active)}
                    >
                      {bundle.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditingBundle(bundle)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteBundle(bundle.id, bundle.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Features:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {bundle.bullet_points.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-600 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}