import { calculateRequestTotals } from '@/lib/requestTotals'

const baseSource = {
  subtotal_paise: 0,
  total_paise: 0,
  lacarte_paise: 0,
  status: 'pending' as const,
}

describe('lib/requestTotals', () => {
  it('adds la-carte price for requests with no items', () => {
    const result = calculateRequestTotals({
      ...baseSource,
      lacarte_paise: 15000,
      total_paise: 0,
    })
    expect(result.total_paise).toBe(15000)
    expect(result.subtotal_paise).toBe(0)
  })

  it('uses fallback la-carte pricing when request value is missing', () => {
    const result = calculateRequestTotals(
      {
        ...baseSource,
        subtotal_paise: 20000,
        total_paise: 20000,
        lacarte_paise: null,
        status: 'sent',
      },
      { fallbackLaCartePaise: 9900 }
    )
    expect(result.total_paise).toBe(29900)
  })

  it('never lowers totals when stored total already includes addons', () => {
    const result = calculateRequestTotals(
      {
        ...baseSource,
        subtotal_paise: 10000,
        total_paise: 35000,
        lacarte_paise: 0,
        status: 'confirmed',
      },
      { items: [{ price_paise: 10000 }] }
    )
    expect(result.total_paise).toBe(35000)
  })

  it('prefers live item pricing over stale subtotal_paise', () => {
    const result = calculateRequestTotals(
      {
        ...baseSource,
        subtotal_paise: 0,
      },
      {
        items: [{ price_paise: 5000 }, { price_paise: 7000 }],
      }
    )
    expect(result.subtotal_paise).toBe(12000)
    expect(result.total_paise).toBe(12000)
  })
})
