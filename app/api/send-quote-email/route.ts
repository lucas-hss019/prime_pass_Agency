import { NextResponse } from 'next/server'
import { Resend } from 'resend'

type QuoteEmailPayload = {
  full_name?: string
  email?: string
  phone?: string
  trip_type?: 'round_trip' | 'one_way' | string
  people_count?: number
  departure_name?: string
  destination_name?: string
  departure_date?: string
  return_date?: string
  notes?: string
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '-')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatTripType(value: QuoteEmailPayload['trip_type']) {
  if (value === 'one_way') {
    return 'So ida'
  }

  if (value === 'round_trip') {
    return 'Ida e volta'
  }

  return value || '-'
}

export async function POST(req: Request) {
  const resendApiKey = process.env.RESEND_API_KEY
  const quoteFrom =
    process.env.QUOTE_FROM_EMAIL ||
    'PrimePass Agency <primepassagencytravel@primepassagency.com>'
  const quoteRecipients = (
    process.env.QUOTE_NOTIFICATION_TO ||
    'jorgeneto@primepassagency.com,primepassagencytravel@primepassagency.com'
  )
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!resendApiKey) {
    return NextResponse.json(
      { success: false, message: 'RESEND_API_KEY nao configurada.' },
      { status: 500 }
    )
  }

  if (!quoteRecipients.length) {
    return NextResponse.json(
      { success: false, message: 'Destinatarios do email nao configurados.' },
      { status: 500 }
    )
  }

  try {
    const body = (await req.json()) as QuoteEmailPayload

    if (!body.full_name || !body.email) {
      return NextResponse.json(
        { success: false, message: 'Dados obrigatorios em falta.' },
        { status: 400 }
      )
    }

    const resend = new Resend(resendApiKey)

    const { data, error } = await resend.emails.send({
      from: quoteFrom,
      to: quoteRecipients,
      subject: `Nova cotacao recebida - ${body.full_name}`,
      html: `
        <h2>Nova cotacao recebida</h2>

        <h3>Dados do cliente</h3>
        <p><strong>Nome:</strong> ${escapeHtml(body.full_name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
        <p><strong>Telefone:</strong> ${escapeHtml(body.phone)}</p>

        <h3>Dados da viagem</h3>
        <p><strong>Tipo de viagem:</strong> ${escapeHtml(formatTripType(body.trip_type))}</p>
        <p><strong>Numero de pessoas:</strong> ${escapeHtml(body.people_count)}</p>
        <p><strong>Partida:</strong> ${escapeHtml(body.departure_name)}</p>
        <p><strong>Destino:</strong> ${escapeHtml(body.destination_name)}</p>
        <p><strong>Data de ida:</strong> ${escapeHtml(body.departure_date)}</p>
        <p><strong>Data de volta:</strong> ${escapeHtml(body.return_date)}</p>
        <p><strong>Observacoes:</strong> ${escapeHtml(body.notes)}</p>
      `,
    })

    if (error) {
      console.error(error)
      return NextResponse.json(
        { success: false, message: 'Erro ao enviar email.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, message: 'Erro ao processar envio do email.' },
      { status: 500 }
    )
  }
}
