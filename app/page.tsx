'use client'

import Image from 'next/image'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Destination = {
  id: number
  name: string
  country: string
  image_url: string | null
  short_description: string | null
  featured: boolean
}

type DepartureLocation = {
  id: number
  name: string
  country: string
  location_type: string
  airport_code: string | null
}

type Testimonial = {
  id: number
  client_name: string
  review_text: string
  rating: number
  source: string | null
}

type SiteSettings = {
  site_name: string | null
  support_email: string | null
  support_phone: string | null
  whatsapp_number: string | null
  hero_title: string | null
  hero_subtitle: string | null
  about_text: string | null
  quote_success_message: string | null
}

type QuoteFormData = {
  full_name: string
  email: string
  phone: string
  trip_type: 'round_trip' | 'one_way'
  people_count: number
  departure_location: string
  destination: string
  departure_date: string
  return_date: string
  departure_date_flexible: boolean
  return_date_flexible: boolean
  accepts_connections: boolean
  max_connections: string
  notes: string
}

type FeaturedRoute = {
  id: string
  departure: string
  destination: string
  label: string
  description: string
}

type ProcessStep = {
  id: string
  number: string
  tag: string
  title: string
  description: string
}

const destinationImages: Record<string, string> = {
  Dubai:
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
  Paris:
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  Maldivas:
    'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80',
  Zanzibar:
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
  Lisboa:
    'https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1200&q=80',
}

const fallbackDestinations: Destination[] = [
  {
    id: 1,
    name: 'Dubai',
    country: 'Emirados Árabes Unidos',
    image_url: null,
    short_description: 'Perfeito para quem procura conforto, compras, praia e experiências premium.',
    featured: true,
  },
  {
    id: 2,
    name: 'Paris',
    country: 'França',
    image_url: null,
    short_description: 'Uma escolha clássica para viagens a dois, escapadas urbanas e roteiros culturais.',
    featured: true,
  },
  {
    id: 3,
    name: 'Maldivas',
    country: 'Maldivas',
    image_url: null,
    short_description: 'Ideal para descanso, lua de mel e viagens onde cada detalhe faz diferença.',
    featured: true,
  },
  {
    id: 4,
    name: 'Zanzibar',
    country: 'Tanzânia',
    image_url: null,
    short_description: 'Praias bonitas, ritmo leve e uma viagem com cara de pausa bem aproveitada.',
    featured: true,
  },
]

const fallbackTestimonials: Testimonial[] = [
  {
    id: 1,
    client_name: 'Mariana Costa',
    review_text:
      'Atendimento rápido, claro e muito prático. O pedido online ajudou bastante no início.',
    rating: 5,
    source: 'Avaliação verificada',
  },
  {
    id: 2,
    client_name: 'Ricardo Almeida',
    review_text:
      'Gostei da forma simples como trataram tudo. A equipa percebeu logo o que queríamos.',
    rating: 5,
    source: 'Atendimento direto',
  },
  {
    id: 3,
    client_name: 'Beatriz Santos',
    review_text:
      'Bom equilíbrio entre pedido online e atendimento humano. Passa confiança.',
    rating: 5,
    source: 'Cliente PrimePass',
  },
]

const featuredRoutes: FeaturedRoute[] = [
  {
    id: 'gru-lis',
    departure: 'GRU',
    destination: 'LIS',
    label: 'GRU -> LIS',
    description: 'Uma rota prática para começar o pedido mais depressa.',
  },
  {
    id: 'lis-dxb',
    departure: 'LIS',
    destination: 'Dubai',
    label: 'LIS -> Dubai',
    description: 'Uma das rotas mais procuradas para férias e compras.',
  },
  {
    id: 'opo-par',
    departure: 'OPO',
    destination: 'Paris',
    label: 'OPO -> PAR',
    description: 'Uma opção simples para uns dias fora com conforto.',
  },
]

const processSteps: ProcessStep[] = [
  {
    id: 'contact',
    number: '1',
    tag: 'Contacto',
    title: 'Entra em contacto',
    description: 'Envia o pedido no site e deixa o nome e o melhor contacto.',
  },
  {
    id: 'options',
    number: '2',
    tag: 'Opções',
    title: 'Escolhe a viagem',
    description: 'Recebe opções alinhadas com o destino, datas e perfil da viagem.',
  },
  {
    id: 'confirm',
    number: '3',
    tag: 'Reserva',
    title: 'Confirma os detalhes',
    description: 'Ajustamos voos, escalas e preferências antes de fechar tudo.',
  },
  {
    id: 'travel',
    number: '4',
    tag: 'Embarque',
    title: 'Viaja com apoio',
    description: 'Segues para a viagem com acompanhamento e mais tranquilidade.',
  },
]

const initialFormData: QuoteFormData = {
  full_name: '',
  email: '',
  phone: '',
  trip_type: 'round_trip',
  people_count: 1,
  departure_location: '',
  destination: '',
  departure_date: '',
  return_date: '',
  departure_date_flexible: false,
  return_date_flexible: false,
  accepts_connections: false,
  max_connections: '',
  notes: '',
}

function normalizeLocation(value: string) {
  return value.trim().toLowerCase()
}

function normalizeDigits(value: string | null | undefined) {
  return (value || '').replace(/\D/g, '')
}

function getDestinationImage(destination: Destination) {
  return (
    destination.image_url ||
    destinationImages[destination.name] ||
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  )
}

export default function HomePage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [departureLocations, setDepartureLocations] = useState<DepartureLocation[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [formData, setFormData] = useState<QuoteFormData>(initialFormData)
  const quoteSectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    async function loadData() {
      const [destinationsResult, departureResult, testimonialsResult, settingsResult] =
        await Promise.all([
          supabase
            .from('destinations')
            .select('id, name, country, image_url, short_description, featured')
            .eq('active', true)
            .eq('featured', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('departure_locations')
            .select('id, name, country, location_type, airport_code')
            .eq('active', true)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true }),
          supabase
            .from('testimonials')
            .select('id, client_name, review_text, rating, source')
            .eq('active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('site_settings')
            .select(
              'site_name, support_email, support_phone, whatsapp_number, hero_title, hero_subtitle, about_text, quote_success_message'
            )
            .limit(1)
            .maybeSingle(),
        ])

      if (destinationsResult.error) {
        console.error(destinationsResult.error.message)
      } else {
        setDestinations(destinationsResult.data || [])
      }

      if (departureResult.error) {
        console.error(departureResult.error.message)
      } else {
        setDepartureLocations(departureResult.data || [])
      }

      if (testimonialsResult.error) {
        console.error(testimonialsResult.error.message)
      } else {
        setTestimonials(testimonialsResult.data || [])
      }

      if (settingsResult.error) {
        console.error(settingsResult.error.message)
      } else {
        setSiteSettings(settingsResult.data)
      }
    }

    loadData()
  }, [])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const target = e.target
    const { name } = target
    const value =
      target instanceof HTMLInputElement && target.type === 'checkbox'
        ? target.checked
        : target.value

    setFormData((prev) => {
      const next = { ...prev }

      if (name === 'people_count') {
        next.people_count = Number(value)
        return next
      }

      if (name === 'trip_type') {
        next.trip_type = value as QuoteFormData['trip_type']
        if (value === 'one_way') {
          next.return_date = ''
          next.return_date_flexible = false
        }
        return next
      }

      if (
        name === 'departure_date_flexible' ||
        name === 'return_date_flexible' ||
        name === 'accepts_connections'
      ) {
        const checked = Boolean(value)

        if (name === 'departure_date_flexible') {
          next.departure_date_flexible = checked
        }

        if (name === 'return_date_flexible') {
          next.return_date_flexible = checked
        }

        if (name === 'accepts_connections') {
          next.accepts_connections = checked
          if (!checked) {
            next.max_connections = ''
          }
        }

        return next
      }

      if (name === 'max_connections') {
        next.max_connections = String(value)
        return next
      }

      return {
        ...next,
        [name]: value,
      }
    })
  }

  function scrollToQuote() {
    quoteSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleFeaturedRouteSelect(route: FeaturedRoute) {
    setFormData((prev) => ({
      ...prev,
      departure_location: route.departure,
      destination: route.destination,
    }))
    scrollToQuote()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('')

    const matchedDeparture = departureLocations.find((location) => {
      const locationLabel = normalizeLocation(
        `${location.name} ${location.country} ${location.airport_code || ''}`
      )

      return (
        normalizeLocation(formData.departure_location) === normalizeLocation(location.name) ||
        normalizeLocation(formData.departure_location) ===
          normalizeLocation(location.airport_code || '') ||
        normalizeLocation(formData.departure_location) === locationLabel
      )
    })

    const matchedDestination = destinations.find((destination) => {
      const destinationLabel = normalizeLocation(`${destination.name} ${destination.country}`)

      return (
        normalizeLocation(formData.destination) === normalizeLocation(destination.name) ||
        normalizeLocation(formData.destination) === destinationLabel
      )
    })

    const payload = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      trip_type: formData.trip_type,
      people_count: Number(formData.people_count),
      departure_location_id: matchedDeparture ? matchedDeparture.id : null,
      departure_text: formData.departure_location.trim(),
      destination_id: matchedDestination ? matchedDestination.id : null,
      destination_text: formData.destination.trim(),
      departure_date: formData.departure_date || null,
      return_date: formData.trip_type === 'round_trip' ? formData.return_date || null : null,
      departure_date_flexible: formData.departure_date_flexible,
      return_date_flexible:
        formData.trip_type === 'round_trip' ? formData.return_date_flexible : false,
      accepts_connections: formData.accepts_connections,
      max_connections:
        formData.accepts_connections && formData.max_connections
          ? Number(formData.max_connections)
          : null,
      notes: formData.notes.trim() || null,
      source_channel: 'website',
    }

    const { error } = await supabase.from('quotes').insert([payload])

    if (error) {
      console.error(error.message)
      setMessage('Não foi possível enviar o pedido agora. Tenta novamente daqui a pouco.')
      setMessageType('error')
      setLoading(false)
      return
    }

    setMessage(
      siteSettings?.quote_success_message?.trim() ||
        'Pedido enviado com sucesso. A nossa equipa entra em contacto em breve.'
    )
    setMessageType('success')
    setFormData(initialFormData)
    setLoading(false)
  }

  const siteName = siteSettings?.site_name?.trim() || 'PrimePass Agency travel'
  const heroTitle = siteSettings?.hero_title?.trim() || 'A viagem certa começa com um pedido simples.'
  const heroSubtitle =
    siteSettings?.hero_subtitle?.trim() ||
    'Escolhe o destino, envia o pedido e nós tratamos do resto.'
  const aboutText =
    siteSettings?.about_text?.trim() ||
    'Deixa o essencial no pedido. O resto alinhamos no atendimento.'

  const visibleDestinations = destinations.length ? destinations.slice(0, 4) : fallbackDestinations
  const visibleTestimonials = testimonials.length ? testimonials.slice(0, 3) : fallbackTestimonials

  const whatsappNumber = normalizeDigits(siteSettings?.whatsapp_number)
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null

  return (
    <>
      <section className="hero">
        <div className="container hero-shell">
          <div className="hero-text">
            <span className="badge">{siteName}</span>
            <h1>{heroTitle}</h1>
            <p>{heroSubtitle}</p>

            <div className="hero-actions">
              <button type="button" className="primary-btn" onClick={scrollToQuote}>
                Pedir cotação
              </button>
              <a href="#destinos" className="secondary-btn">
                Ver destinos
              </a>
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-brand-card">
              <Image
                src="/primepass-logo-dark.jpeg"
                alt={`Logotipo ${siteName}`}
                width={768}
                height={768}
                className="hero-brand-image"
                priority
              />
            </div>

            <p className="panel-eyebrow">PrimePass</p>
            <h2>Pedido simples. Atendimento real.</h2>
            <div className="hero-steps">
              <div>
                <strong>01</strong>
                <span>Explica o que procuras de forma rápida.</span>
              </div>
              <div>
                <strong>02</strong>
                <span>Recebe apoio da nossa equipa sem complicação.</span>
              </div>
              <div>
                <strong>03</strong>
                <span>Segue para a viagem com mais segurança.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-dark process-section" id="como-funciona">
        <div className="container">
          <h2 className="section-title">Como funciona</h2>
          <p className="section-subtitle">
            Na PrimePass Agency travel, o processo é simples, claro e acompanhado do início ao fim.
          </p>

          <div className="process-grid">
            {processSteps.map((step) => (
              <article className="process-card" key={step.id}>
                <div className="process-top">
                  <span className="process-number">{step.number}</span>
                  <span className="process-tag">{step.tag}</span>
                </div>
                <h3>{step.title}</h3>
                <div className="process-line" />
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" id="destinos">
        <div className="container">
          <h2 className="section-title">Destinos em destaque</h2>
          <p className="section-subtitle">Destinos que estão em destaque na nossa base neste momento.</p>

          <div className="destinations-grid">
            {visibleDestinations.map((destination) => (
              <article className="destination-card" key={destination.id}>
                <div
                  className="destination-image"
                  style={{ backgroundImage: `url(${getDestinationImage(destination)})` }}
                />
                <div className="destination-content">
                  <h3>{destination.name}</h3>
                  <p className="destination-country">{destination.country}</p>
                  <p>
                    {destination.short_description ||
                      'Um destino muito pedido e fácil de encaixar no pedido.'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-dark" id="rotas">
        <div className="container">
          <h2 className="section-title">Rotas prontas</h2>
          <p className="section-subtitle">Clica numa opção e o formulário fica logo mais rápido de preencher.</p>

          <div className="routes-grid">
            {featuredRoutes.map((route) => (
              <article className="route-card" key={route.id}>
                <p className="route-code">{route.label}</p>
                <h3>
                  {route.departure} para {route.destination}
                </h3>
                <p>{route.description}</p>
                <button
                  type="button"
                  className="route-btn"
                  onClick={() => handleFeaturedRouteSelect(route)}
                >
                  Usar esta rota
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title">Avaliações de clientes</h2>
          <p className="section-subtitle">Avaliações recebidas no atendimento e no pós-viagem.</p>

          <div className="testimonials-grid">
            {visibleTestimonials.map((testimonial) => (
              <article className="testimonial-card" key={testimonial.id}>
                <div className="testimonial-meta">
                  <span className="testimonial-source">
                    {testimonial.source || 'Avaliação verificada'}
                  </span>
                  <span className="testimonial-stars" aria-label={`${testimonial.rating} estrelas`}>
                    {'★'.repeat(testimonial.rating)}
                  </span>
                </div>
                <div className="testimonial-head">
                  <strong>{testimonial.client_name}</strong>
                </div>
                <p>{testimonial.review_text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section quote-section" ref={quoteSectionRef} id="cotacao">
        <div className="container quote-shell">
          <div className="quote-intro">
            <span className="badge badge-dark">Último passo</span>
            <h2>Conta-nos o essencial.</h2>
            <p>{aboutText}</p>

            <div className="quote-points">
              <div className="quote-point">
                <strong>Rápido</strong>
                <span>Pedido simples e direto.</span>
              </div>
              <div className="quote-point">
                <strong>Claro</strong>
                <span>Datas, escalas e preferências no mesmo lugar.</span>
              </div>
              <div className="quote-point">
                <strong>Humano</strong>
                <span>Depois disso, a nossa equipa continua o atendimento.</span>
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="form-card-top">
              <div>
                <p className="form-eyebrow">Pedido de viagem</p>
                <h3>Pedido de cotação</h3>
              </div>
              <span className="form-pill">Sem compromisso</span>
            </div>

            <p className="subtitle">
              Preenche o básico e seguimos daí.
            </p>

            <div className="form-benefits">
              <span>Atendimento humano</span>
              <span>Pedido simples</span>
              <span>Resposta rápida</span>
            </div>

            {formData.departure_location && formData.destination ? (
              <div className="route-preview">
                <span>Rota selecionada</span>
                <strong>
                  {formData.departure_location} <small>&rarr;</small> {formData.destination}
                </strong>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="quote-form">
              <div className="form-section">
                <p className="form-section-title">Dados de contacto</p>
                <div className="form-row">
                  <label className="field">
                    <span>Nome completo</span>
                    <input
                      type="text"
                      name="full_name"
                      placeholder="Nome para contacto"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label className="field">
                    <span>E-mail</span>
                    <input
                      type="email"
                      name="email"
                      placeholder="nome@exemplo.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Telefone / WhatsApp</span>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Com indicativo e número"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div className="form-section">
                <p className="form-section-title">Detalhes da viagem</p>
                <div className="form-row">
                  <label className="field">
                    <span>Tipo de viagem</span>
                    <select name="trip_type" value={formData.trip_type} onChange={handleChange}>
                      <option value="round_trip">Ida e volta</option>
                      <option value="one_way">Só ida</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Número de viajantes</span>
                    <input
                      type="number"
                      name="people_count"
                      min="1"
                      value={formData.people_count}
                      onChange={handleChange}
                      required
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label className="field">
                    <span>Partida</span>
                    <input
                      type="text"
                      name="departure_location"
                      placeholder="Ex.: GRU, Lisboa, Porto..."
                      value={formData.departure_location}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label className="field">
                    <span>Destino</span>
                    <input
                      type="text"
                      name="destination"
                      placeholder="Ex.: Paris, Dubai, Maldivas..."
                      value={formData.destination}
                      onChange={handleChange}
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <p className="form-section-title">Datas e preferências</p>
                <div className="form-row">
                  <label className="field">
                    <span>Data de ida</span>
                    <input
                      type="date"
                      name="departure_date"
                      value={formData.departure_date}
                      onChange={handleChange}
                    />
                  </label>

                  {formData.trip_type === 'round_trip' ? (
                    <label className="field">
                      <span>Data de volta</span>
                      <input
                        type="date"
                        name="return_date"
                        value={formData.return_date}
                        onChange={handleChange}
                      />
                    </label>
                  ) : (
                    <div className="input-placeholder input-placeholder-copy">
                      <strong>Só ida selecionada</strong>
                      <span>A data de volta fica desativada quando a viagem é só de ida.</span>
                    </div>
                  )}
                </div>

                <div className="toggle-grid">
                  <label className="toggle-card">
                    <div className="toggle-head">
                      <input
                        type="checkbox"
                        name="departure_date_flexible"
                        checked={formData.departure_date_flexible}
                        onChange={handleChange}
                      />
                      <span>Data de ida flexível</span>
                    </div>
                    <small>Marca se houver flexibilidade na ida.</small>
                  </label>

                  {formData.trip_type === 'round_trip' ? (
                    <label className="toggle-card">
                      <div className="toggle-head">
                        <input
                          type="checkbox"
                          name="return_date_flexible"
                          checked={formData.return_date_flexible}
                          onChange={handleChange}
                        />
                        <span>Data de volta flexível</span>
                      </div>
                      <small>Marca se houver margem na volta.</small>
                    </label>
                  ) : (
                    <div className="toggle-card toggle-card-muted">
                      <div className="toggle-head">
                        <span>Sem data de volta</span>
                      </div>
                      <small>Esta viagem fica como só ida.</small>
                    </div>
                  )}
                </div>

                <div className="toggle-grid">
                  <label className="toggle-card">
                    <div className="toggle-head">
                      <input
                        type="checkbox"
                        name="accepts_connections"
                        checked={formData.accepts_connections}
                        onChange={handleChange}
                      />
                      <span>Aceito escala / conexão</span>
                    </div>
                    <small>Se sim, escolhe ao lado o máximo de conexões.</small>
                  </label>

                  <label className="field">
                    <span>Máximo de conexões</span>
                    <select
                      name="max_connections"
                      value={formData.max_connections}
                      onChange={handleChange}
                      disabled={!formData.accepts_connections}
                    >
                      <option value="">Selecionar</option>
                      <option value="1">Até 1 conexão</option>
                      <option value="2">Até 2 conexões</option>
                      <option value="3">Até 3 conexões</option>
                    </select>
                  </label>
                </div>

                <label className="field">
                  <span>Observações</span>
                  <textarea
                    name="notes"
                    placeholder="Hotel, bagagem, horários ou qualquer detalhe importante."
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'A enviar...' : 'Enviar pedido'}
              </button>

              {message && (
                <p className={messageType === 'success' ? 'message-success' : 'message-error'}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-shell">
          <p>© 2026 {siteName}. Todos os direitos reservados.</p>

          <div className="footer-links">
            {siteSettings?.support_email ? (
              <a href={`mailto:${siteSettings.support_email}`}>{siteSettings.support_email}</a>
            ) : null}

            {siteSettings?.support_phone ? (
              <a href={`tel:${siteSettings.support_phone}`}>{siteSettings.support_phone}</a>
            ) : null}

            {whatsappLink ? <a href={whatsappLink}>WhatsApp</a> : null}
          </div>
        </div>
      </footer>
    </>
  )
}
