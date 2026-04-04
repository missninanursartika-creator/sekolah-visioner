import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      merchantCode,
      amount,
      merchantOrderId,
      resultCode,
      signature,
    } = body

    // Verifikasi signature
    const apiKey = process.env.DUITKU_MERCHANT_KEY
    const expectedSignature = crypto
      .createHash('md5')
      .update(`${merchantCode}${amount}${merchantOrderId}${apiKey}`)
      .digest('hex')

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = await createClient()

    // Update status payment
    const status = resultCode === '00' ? 'paid' : 'failed'
    const { data: payment } = await supabase
      .from('payments')
      .update({ status, duitku_reference: body.reference })
      .eq('merchant_order_id', merchantOrderId)
      .select()
      .single()

    // Upgrade user ke pro jika berhasil
    if (status === 'paid' && payment) {
      await supabase
        .from('profiles')
        .update({ plan: 'pro' })
        .eq('id', payment.user_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}   