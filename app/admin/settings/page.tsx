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
    <div className="space-y-3">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-20"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-xl">
              <Settings className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Admin Settings
            </h1>
            <p className="text-gray-600 text-sm">⚙️ Manage system settings, pricing, and services</p>
          </div>
        </div>
      </div>

      {/* Two-Column Layout for better space utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Left Column - La Carte Settings and Add-ons */}
        <div className="space-y-3">
          {/* Compact La Carte Settings */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-gray-900">La Carte Package</h2>
          </div>
          <Button
            onClick={() => setEditingLaCarte(!editingLaCarte)}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs rounded-xl border-gray-300 hover:border-green-400 hover:bg-green-50"
          >
            <Edit className="h-4 w-4 mr-1" />
            {editingLaCarte ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        {editingLaCarte ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="real-price" className="text-xs font-medium text-gray-700">💰 Real Price (₹)</Label>
                <Input
                  id="real-price"
                  value={laCarteFormData.real_price}
                  onChange={(e) => setLaCarteFormData({ ...laCarteFormData, real_price: e.target.value })}
                  placeholder="Real price"
                  className="h-9 text-sm rounded-xl border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="current-price" className="text-xs font-medium text-gray-700">🏷️ Current Price (₹)</Label>
                <Input
                  id="current-price"
                  value={laCarteFormData.current_price}
                  onChange={(e) => setLaCarteFormData({ ...laCarteFormData, current_price: e.target.value })}
                  placeholder="Current price"
                  className="h-9 text-sm rounded-xl border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="discount-note" className="text-xs font-medium text-gray-700">📝 Discount Note</Label>
              <Input
                id="discount-note"
                value={laCarteFormData.discount_note}
                onChange={(e) => setLaCarteFormData({ ...laCarteFormData, discount_note: e.target.value })}
                placeholder="e.g., Diwali Sale, New Year Offer"
                className="h-9 text-sm rounded-xl border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-200"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveLaCarteSettings}
                className="h-8 px-3 text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                onClick={cancelLaCarteEdit}
                variant="outline"
                className="h-8 px-3 text-xs rounded-xl border-gray-300 hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
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
                  <Badge className="bg-red-100 text-red-800 text-xs px-2 py-0.5">
                    {getDiscountPercentage()}% OFF
                  </Badge>
                )}
              </div>
            </div>
            {laCarteSettings.discount_note && (
              <div className="bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-xs text-blue-600 font-medium">
                  🎉 {laCarteSettings.discount_note}
                </span>
              </div>
            )}
            <p className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              📦 Includes doorstep pickup & delivery, basic tools & equipment
            </p>
          </div>
        )}
          </div>

          {/* Compact Add-ons Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Add-on Services</h2>
          </div>
          <Button
            onClick={() => setShowAddAddonForm(true)}
            className="h-8 px-3 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Service
          </Button>
        </div>

        {/* Compact Add/Edit Form */}
        {showAddAddonForm && (
          <div className="mb-4 p-3 border rounded-xl bg-blue-50/50 border-blue-200/50">
            <h3 className="font-medium mb-2 text-sm text-gray-800">
              {editingAddon ? '✏️ Edit Service' : '➕ Add New Service'}
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="addon-name" className="text-xs font-medium text-gray-700">Service Name</Label>
                  <Input
                    id="addon-name"
                    value={addonFormData.name}
                    onChange={(e) => setAddonFormData({ ...addonFormData, name: e.target.value })}
                    placeholder="e.g., Premium Bike Wash"
                    className="h-9 text-sm rounded-xl border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addon-price" className="text-xs font-medium text-gray-700">Price (₹)</Label>
                  <Input
                    id="addon-price"
                    value={addonFormData.price}
                    onChange={(e) => setAddonFormData({ ...addonFormData, price: e.target.value })}
                    placeholder="Price in rupees"
                    className="h-9 text-sm rounded-xl border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="addon-description" className="text-xs font-medium text-gray-700">Description</Label>
                <Input
                  id="addon-description"
                  value={addonFormData.description}
                  onChange={(e) => setAddonFormData({ ...addonFormData, description: e.target.value })}
                  placeholder="Brief description of the service"
                  className="h-9 text-sm rounded-xl border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveAddon}
                  className="h-8 px-3 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {editingAddon ? 'Update' : 'Create'}
                </Button>
                <Button
                  onClick={cancelAddonEdit}
                  variant="outline"
                  className="h-8 px-3 text-xs rounded-xl border-gray-300 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Compact Add-ons List */}
        {isLoadingAddons ? (
          <div className="text-center py-4 text-sm text-gray-500">Loading add-on services...</div>
        ) : addons.length === 0 ? (
          <div className="text-center py-4 text-gray-500 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="text-lg mb-1">📦</div>
            <p className="text-sm">No add-on services configured</p>
            <p className="text-xs">Click "Add Service" to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {addons.map((addon) => (
              <div
                key={addon.id}
                className="flex items-center justify-between p-3 border border-gray-200/50 rounded-xl hover:bg-blue-50/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{addon.name}</span>
                    <Badge className={`text-xs px-2 py-0.5 ${addon.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {addon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {addon.description && (
                    <p className="text-xs text-gray-600 truncate">{addon.description}</p>
                  )}
                  <p className="text-sm font-bold text-blue-600">
                    {formatCurrency(addon.price_paise)}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleAddonStatus(addon.id, addon.is_active)}
                    className="h-7 px-2 text-xs rounded-lg border-gray-300 hover:border-green-400 hover:bg-green-50"
                  >
                    {addon.is_active ? 'Off' : 'On'}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => startEditingAddon(addon)}
                    className="!h-9 !w-9 rounded-lg border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  >
                    <Edit className="h-6 w-6" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleDeleteAddon(addon.id, addon.name)}
                    className="!h-9 !w-9 rounded-lg border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  >
                    <Trash2 className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>

        {/* Right Column - Service Bundles */}
        <div className="space-y-3">
          {/* Compact Service Bundles Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Service Bundles</h2>
          </div>
          <Button
            onClick={() => setShowAddBundleForm(true)}
            className="h-8 px-3 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Bundle
          </Button>
        </div>

        {/* Compact Bundle Form */}
        {showAddBundleForm && (
          <div className="mb-4 p-3 border rounded-xl bg-purple-50/50 border-purple-200/50">
            <h3 className="font-medium mb-2 text-sm text-gray-800">
              {editingBundle ? '✏️ Edit Bundle' : '📦 Add New Bundle'}
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="bundle-name" className="text-xs font-medium text-gray-700">Bundle Name</Label>
                  <Input
                    id="bundle-name"
                    value={bundleFormData.name}
                    onChange={(e) => setBundleFormData({ ...bundleFormData, name: e.target.value })}
                    placeholder="e.g., Complete Care Package"
                    className="h-9 text-sm rounded-xl border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bundle-price" className="text-xs font-medium text-gray-700">Price (₹)</Label>
                  <Input
                    id="bundle-price"
                    value={bundleFormData.price}
                    onChange={(e) => setBundleFormData({ ...bundleFormData, price: e.target.value })}
                    placeholder="Price in rupees"
                    className="h-9 text-sm rounded-xl border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="bundle-description" className="text-xs font-medium text-gray-700">Description</Label>
                <Input
                  id="bundle-description"
                  value={bundleFormData.description}
                  onChange={(e) => setBundleFormData({ ...bundleFormData, description: e.target.value })}
                  placeholder="Brief description of the bundle"
                  className="h-9 text-sm rounded-xl border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Features</Label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {bundleFormData.bullet_points.map((point, index) => (
                    <div key={index} className="flex gap-1">
                      <Input
                        value={point}
                        onChange={(e) => updateBulletPoint(index, e.target.value)}
                        placeholder={`Feature ${index + 1}`}
                        className="flex-1 h-8 text-sm rounded-lg border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                      />
                      {bundleFormData.bullet_points.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeBulletPoint(index)}
                          className="h-8 w-8 p-0 rounded-lg border-red-300 text-red-600 hover:bg-red-50"
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
                    className="h-8 px-3 text-xs rounded-lg border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Feature
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveBundle}
                  className="h-8 px-3 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {editingBundle ? 'Update' : 'Create'}
                </Button>
                <Button
                  onClick={cancelBundleEdit}
                  variant="outline"
                  className="h-8 px-3 text-xs rounded-xl border-gray-300 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Compact Bundles List */}
        {isLoadingBundles ? (
          <div className="text-center py-4 text-sm text-gray-500">Loading service bundles...</div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-4 text-gray-500 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="text-lg mb-1">📦</div>
            <p className="text-sm">No service bundles configured</p>
            <p className="text-xs">Click "Add Bundle" to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="border border-gray-200/50 rounded-xl p-3 hover:bg-purple-50/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{bundle.name}</span>
                      <Badge className={`text-xs px-2 py-0.5 ${bundle.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {bundle.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {bundle.description && (
                      <p className="text-xs text-gray-600 truncate mb-1">{bundle.description}</p>
                    )}
                    <p className="text-sm font-bold text-purple-600">
                      {formatCurrency(bundle.price_paise)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleBundleStatus(bundle.id, bundle.is_active)}
                      className="h-7 px-2 text-xs rounded-lg border-gray-300 hover:border-green-400 hover:bg-green-50"
                    >
                      {bundle.is_active ? 'Off' : 'On'}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => startEditingBundle(bundle)}
                      className="!h-9 !w-9 rounded-lg border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                    >
                      <Edit className="h-6 w-6" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDeleteBundle(bundle.id, bundle.name)}
                      className="!h-9 !w-9 rounded-lg border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">✨ Features:</p>
                  <div className="grid grid-cols-1 gap-0.5">
                    {bundle.bullet_points.slice(0, 3).map((point, index) => (
                      <div key={index} className="flex items-start gap-1">
                        <span className="text-purple-600 text-xs mt-0.5">•</span>
                        <span className="text-xs text-gray-600 leading-tight">{point}</span>
                      </div>
                    ))}
                    {bundle.bullet_points.length > 3 && (
                      <p className="text-xs text-gray-500 italic">
                        +{bundle.bullet_points.length - 3} more features...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>

      </div>
    </div>
  )
}