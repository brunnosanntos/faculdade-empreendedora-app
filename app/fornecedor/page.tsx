'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const PLANOS = [
  {
    id: 'basico',
    nome: 'Básico',
    preco: 'R$ 97/mês',
    features: [
      '✓ 10 posts por mês',
      '✓ Foto e vídeo',
      '✓ Badge de fornecedor',
      '✓ Perfil no diretório',
      '⏱ Posts expiram em 30 dias',
      '✗ Posts permanentes',
    ]
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 'R$ 197/mês',
    popular: true,
    features: [
      '✓ Posts ilimitados',
      '✓ Foto, vídeo e stories',
      '✓ Badge verificado ✓',
      '✓ Destaque no feed',
      '✓ Relatório de alcance',
      '✓ Posts permanentes 🔒',
    ]
  }
]

const SEGMENTOS = [
  'Moda feminina', 'Moda plus size', 'Moda fitness', 'Acessórios',
  'Calçados', 'Moda masculina', 'Moda infantil', 'Lingerie'
]

type Fornecedor = {
  id: string
  nome: string
  segmento: string
  plano: string
  posts: number
  verificado: boolean
}

const FORNECEDORES_DEMO: Fornecedor[] = [
  { id: '1', nome: 'ModaTop Atacado', segmento: 'Moda feminina', plano: 'Pro', posts: 47, verificado: true },
  { id: '2', nome: 'Eleganza Atacado', segmento: 'Moda plus size', plano: 'Básico', posts: 31, verificado: false },
  { id: '3', nome: 'StyleFit Atacado', segmento: 'Moda fitness', plano: 'Pro', posts: 18, verificado: true },
]

export default function Fornecedor() {
  const [planoSel, setPlanoSel] = useState('pro')
  const [form, setForm] = useState({
    empresa: '', cnpj: '', email: '', whatsapp: '', instagram: '', site: '',
    segmento: '', apresentacao: ''
  })
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
    })
  }, [])

  async function enviarCadastro() {
    if (!form.empresa || !form.email) return
    setLoading(true)
    // Por enquanto só simula o envio
    await new Promise(r => setTimeout(r, 1000))
    setEnviado(true)
    setLoading(false)
  }

  const ini = (nome: string) => nome.substring(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: '#0d2818', fontFamily: 'Arial', color: '#F5E6C8' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => router.push('/home')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 12px', color: '#F5E6C8', fontSize: 12, cursor: 'pointer' }}>← Início</button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>🏭 Fornecedor Parceiro</span>
      </div>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: 16 }}>

        {/* Header card */}
        <div style={{ background: 'linear-gradient(135deg,rgba(26,77,46,0.9),rgba(45,106,31,0.7))', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 16, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#D4A843,#A87820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏭</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Seja um Fornecedor Parceiro</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              Alcance centenas de lojistas de moda em uma única plataforma
            </div>
          </div>
        </div>

        {/* Planos */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Escolha seu plano</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PLANOS.map(p => (
              <div key={p.id} onClick={() => setPlanoSel(p.id)}
                style={{ border: `1.5px solid ${planoSel === p.id ? '#D4A843' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: 16, cursor: 'pointer', background: planoSel === p.id ? 'rgba(212,168,67,0.08)' : 'transparent' }}>
                {p.popular && (
                  <div style={{ display: 'inline-block', background: '#D4A843', color: '#2D1B00', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, marginBottom: 8 }}>MAIS POPULAR</div>
                )}
                <div style={{ fontSize: 22, fontWeight: 700, color: '#D4A843', marginBottom: 4 }}>
                  {p.preco.split('/')[0]}<span style={{ fontSize: 13, fontWeight: 400 }}>/mês</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{p.nome}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 2 }}>
                  {p.features.map((f, i) => <div key={i}>{f}</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulário */}
        {!enviado ? (
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#D4A843', marginBottom: 14 }}>Dados do fornecedor</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Nome da empresa *', key: 'empresa', placeholder: 'Ex: ModaTop Atacado' },
                { label: 'CNPJ', key: 'cnpj', placeholder: '00.000.000/0001-00' },
                { label: 'E-mail *', key: 'email', placeholder: 'contato@empresa.com' },
                { label: 'WhatsApp', key: 'whatsapp', placeholder: '(11) 99999-9999' },
                { label: 'Instagram', key: 'instagram', placeholder: '@suaempresa' },
                { label: 'Site', key: 'site', placeholder: 'https://...' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#F5E6C8', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Segmento</label>
              <select value={form.segmento} onChange={e => setForm({ ...form, segmento: e.target.value })}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#F5E6C8', outline: 'none' }}>
                <option value="">Selecione</option>
                {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Apresentação</label>
              <textarea value={form.apresentacao} onChange={e => setForm({ ...form, apresentacao: e.target.value })}
                placeholder="Fale sobre sua empresa, diferenciais, como trabalha..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#F5E6C8', outline: 'none', minHeight: 70, resize: 'none', boxSizing: 'border-box' }} />
            </div>

            <button onClick={enviarCadastro} disabled={loading}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#D4A843', color: '#2D1B00', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 14 }}>
              {loading ? 'Enviando...' : 'Enviar cadastro e assinar'}
            </button>
          </div>
        ) : (
          <div style={{ background: 'rgba(80,180,60,0.08)', border: '1px solid rgba(80,180,60,0.3)', borderRadius: 14, padding: 24, textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Cadastro enviado!</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Entraremos em contato em até 24h para finalizar sua assinatura.</div>
          </div>
        )}

        {/* Diretório */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#D4A843', marginBottom: 14 }}>🏭 Fornecedores parceiros</div>
          {FORNECEDORES_DEMO.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#D4A843', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#2D1B00', flexShrink: 0 }}>
                {ini(f.nome)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {f.nome} {f.verificado && <span style={{ color: '#D4A843' }}>✓</span>}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{f.segmento} · {f.posts} posts</div>
              </div>
              <div style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: f.plano === 'Pro' ? 'rgba(212,168,67,0.2)' : 'rgba(255,255,255,0.08)', color: f.plano === 'Pro' ? '#D4A843' : 'rgba(255,255,255,0.5)', border: `1px solid ${f.plano === 'Pro' ? '#D4A843' : 'rgba(255,255,255,0.15)'}` }}>
                {f.plano}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
