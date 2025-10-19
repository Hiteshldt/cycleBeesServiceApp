'use client'

import { CancelledOrderView } from './components/CancelledOrderView'
import { ConfirmationModal } from './components/ConfirmationModal'
import { ConfirmedOrderView } from './components/ConfirmedOrderView'
import { PublicOrderErrorState } from './components/ErrorState'
import { PublicOrderLoadingState } from './components/LoadingState'
import { ReviewOrderView } from './components/ReviewOrderView'
import { usePublicOrderController } from './hooks/usePublicOrderController'

export default function PublicOrderPage() {
  const controller = usePublicOrderController()

  if (controller.isLoading) {
    return <PublicOrderLoadingState />
  }

  if (!controller.orderData || controller.error) {
    return (
      <PublicOrderErrorState
        message={controller.error ?? 'Something went wrong'}
        onRetry={controller.handleRetry}
      />
    )
  }

  if (controller.isRedirecting) {
    return null
  }

  const { request, items } = controller.orderData

  if (request.status === 'cancelled') {
    return <CancelledOrderView onNeedHelp={controller.handleNeedHelp} />
  }

  if (request.status === 'confirmed') {
    const totals = controller.confirmedData?.totals ?? controller.totals

    return (
      <ConfirmedOrderView
        request={request}
        items={items}
        addons={controller.addons}
        bundles={controller.bundles}
        selectedItems={controller.selectedItems}
        selectedAddons={controller.selectedAddons}
        selectedBundles={controller.selectedBundles}
        laCarte={controller.laCarte}
        laCartePaise={controller.laCartePaise}
        totals={totals}
        onDownloadPdf={controller.handleDownloadConfirmedPDF}
        onNeedHelp={controller.handleNeedHelp}
      />
    )
  }

  return (
    <>
      <ReviewOrderView
        request={request}
        items={items}
        addons={controller.addons}
        bundles={controller.bundles}
        selectedItems={controller.selectedItems}
        selectedAddons={controller.selectedAddons}
        selectedBundles={controller.selectedBundles}
        laCarte={controller.laCarte}
        laCartePaise={controller.laCartePaise}
        totals={controller.totals}
        onNeedHelp={controller.handleNeedHelp}
        onConfirm={controller.handleConfirmOrder}
        onBack={controller.goBack}
      />

      <ConfirmationModal
        open={controller.showConfirmation}
        onCancel={controller.closeConfirmation}
        onConfirm={controller.handleFinalConfirmation}
        isConfirming={controller.isConfirming}
        laCarte={controller.laCarte}
        laCartePaise={controller.laCartePaise}
        totals={{
          subtotal: controller.totals.subtotal,
          addonsTotal: controller.totals.addonsTotal,
          bundlesTotal: controller.totals.bundlesTotal,
          total: controller.totals.total,
        }}
        selectedCounts={{
          services: controller.selectedItems.size,
          addons: controller.selectedAddons.size,
          bundles: controller.selectedBundles.size,
        }}
      />
    </>
  )
}
