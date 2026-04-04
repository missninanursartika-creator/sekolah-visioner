import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const DUITKU_BASE_URL = process.env.DUITKU_ENV === 'production'
  ? 'https://passport.duitku.com/webapi/api/merchant'
  : 'https://sandbox.duitku.com/webapi/api/merchant'

const PLANS = {
  pro_monthly: {
    name: 'Sekolah Visioner Pro — Bulanan',
    amount: 299000,
    duration: 30,
  },
  pro_yearly: {
    name: 'Sekolah Visioner Pro — Tahunan',
    amount: 2490000,
    duration: 365,
  },
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan } = await request.json()
    const planData = PLANS[plan]
    if (!planData) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const merchantCode = process.env.DUITKU_MERCHANT_CODE
    const apiKey = process.env.DUITKU_MERCHANT_KEY
    const merchantOrderId = `SV-${Date.now()}-${user.id.slice(0, 8)}`
    const amount = planData.amount
    const signature = crypto
        .createHash('md5')
        .update(`${merchantCode}${merchantOrderId}${amount}${apiKey}`)
        .digest('hex')

const payload = {
  merchantCode,
  paymentAmount: amount,
  merchantOrderId,
  productDetails: planData.name,
  email: user.email,
  customerVaName: profile?.full_name || user.email,
  phoneNumber: '',
  paymentMethod: 'VC', // VC = semua metode pembayaran
  itemDetails: [{
    name: planData.name,
    price: amount,
    quantity: 1,
  }],
  callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`,
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing?status=success`,
  signature,
  expiryPeriod: 60,
}

    const response = await fetch(`${DUITKU_BASE_URL}/v2/inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    console.log('Duitku response:', JSON.stringify(data))

    if (data.statusCode !== '00') {
      return NextResponse.json({ error: data.statusMessage }, { status: 400 })
    }

    // Simpan ke DB
    await supabase.from('payments').insert({
      user_id: user.id,
      merchant_order_id: merchantOrderId,
      amount,
      status: 'pending',
      duitku_reference: data.reference,
    })

    return NextResponse.json({
      paymentUrl: data.paymentUrl,
      reference: data.reference,
      merchantOrderId,
    })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}