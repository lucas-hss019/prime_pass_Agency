import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      full_name,
      email,
      phone,
      trip_type,
      people_count,
      departure_name,
      destination_name,
      departure_date,
      return_date,
      notes,
    } = body

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['jorgeneto@primepassagency.com'],
      subject: `Nova cotação recebida - ${full_name}`,
      html: `
        <h2>Nova cotação recebida</h2>

        <h3>Dados do cliente</h3>
        <p><strong>Nome:</strong> ${full_name || '-'}</p>
        <p><strong>Email:</strong> ${email || '-'}</p>
        <p><strong>Telefone:</strong> ${phone || '-'}</p>

        <h3>Dados da viagem</h3>
        <p><strong>Tipo de viagem:</strong> ${trip_type || '-'}</p>
        <p><strong>Número de pessoas:</strong> ${people_count || '-'}</p>
        <p><strong>Partida:</strong> ${departure_name || '-'}</p>
        <p><strong>Destino:</strong> ${destination_name || '-'}</p>
        <p><strong>Data de ida:</strong> ${departure_date || '-'}</p>
        <p><strong>Data de volta:</strong> ${return_date || '-'}</p>
        <p><strong>Observações:</strong> ${notes || '-'}</p>
      `,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erro ao enviar email.' },
      { status: 500 }
    )
  }
}
