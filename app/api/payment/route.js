import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const DUITKU_BASE_URL = process.env.DUITKU_ENV === 'production'
  ? 'https://passport.duitku.com/webapi/api/merchant'
  : 'https://sandbox.duitku.com/webapi/api/merchant'

export async function POST(request) {
  try {
    // 🔐 Auth user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount } = await request.json()

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    const merchantCode = process.env.DUITKU_MERCHANT_CODE
    const apiKey = process.env.DUITKU_MERCHANT_KEY

    // 🧠 Signature sesuai dokumentasi Duitku
    const signature = crypto
      .createHash('md5')
      .update(`${merchantCode}${amount}${apiKey}`)
      .digest('hex')

    const payload = {
      merchantcode: merchantCode,
      amount: amount,
      signature: signature,
    }

    const response = await fetch(
      `${DUITKU_BASE_URL}/paymentmethod/getpaymentmethod`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const data = await response.json()

    console.log('Duitku Payment Method:', JSON.stringify(data))

    if (data.statusCode !== '00') {
      return NextResponse.json(
        { error: data.statusMessage },
        { status: 400 }
      )
    }

    // 🔥 Filter + rapikan response (biar enak dipakai frontend)
    const paymentMethods = data.paymentFee.map((item) => ({
      code: item.paymentMethod,
      name: item.paymentName,
      fee: item.totalFee,
    }))

    return NextResponse.json({
      paymentMethods,
    })

  } catch (error) {
    console.error('Get Payment Method Error:', error)
    return NextResponse.json(
      { error: 'Failed to get payment methods' },
      { status: 500 }
    )
  }
}
