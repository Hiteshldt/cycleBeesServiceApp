'use client'

import { AlertCircle, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CancelledOrderViewProps = {
  onNeedHelp: () => void
}

export function CancelledOrderView({ onNeedHelp }: CancelledOrderViewProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Cancelled</h1>
        <p className="text-gray-600 mb-4">
          This service request has been cancelled. If you have any questions, please contact us.
        </p>
        <Button onClick={onNeedHelp} variant="outline">
          <MessageCircle className="h-4 w-4 mr-2" />
          Contact Us
        </Button>
      </div>
    </div>
  )
}
