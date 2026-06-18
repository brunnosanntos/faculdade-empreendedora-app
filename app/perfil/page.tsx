'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Perfil = {
  id: string
  nome_completo?: string
  cpf?: string
  telefone?: string
  endereco?: string
  instagram_pessoal?: string
  tipo: string
}

type Loja = {
  id?: string
  nome?: string
  instagram_loja?: string
  whatsapp_loja?: string
  site_loja?: string
}

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loja, setLoja] = useState<Loja>({})
  const [loading, setLoading] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      // Busca perfil
      supabase.from('perfis').select('*').eq('id', data.user.id).single()
        .then(({ data: p }) => { if (p) setPerfil(p) })
      // Busca loja
      supabase.from('lojas').select('*').eq('aluna_id', data.user.id).maybeSingle()
        .then(({ data: l }) => { if (l) setLoja(l) })
    })
  }, [])

  async function salvar() {
    setLoading(true)
    setSalvo(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Salva perfil
    await supabase.from('perfis').update({
      nome_completo: perfil?.nome_completo,
      telefone: perfil?.telefone,
      endereco: perfil?.endereco,
      instagram_pessoal: perfil?.instagram_pessoal,
    }).eq('id', user.id)

    // Salva/cria loja
    if (loja.nome) {
      const { data: lojaExiste } = await supabase.from('lojas').select('id').eq('aluna_id', user.id).single()
      if (lojaExiste) {
        await supabase.from('lojas').update({ ...loja }).eq('aluna_id', user.id)
      } else {
        await supabase.from('lojas').insert({ ...loja, aluna_id: user.id })
      }
    }

    setLoading(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 3000)
  }

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const ini = (nome: string) => nome?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??'

  return (
    <div style={{ minHeight: '100vh', background: '#0d2818', fontFamily: 'Arial', color: '#F5E6C8' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => router.push('/home')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 12px', color: '#F5E6C8', fontSize: 12, cursor: 'pointer' }}>← Início</button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>👤 Meu Perfil</span>
        <button onClick={sair} style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Sair</button>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#D4A843,#A87820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#2D1B00', margin: '0 auto 12px' }}>
            {ini(perfil?.nome_completo || '')}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{perfil?.nome_completo || 'Sua conta'}</div>
          <div style={{ fontSize: 12, color: '#D4A843', marginTop: 4, textTransform: 'capitalize' }}>{perfil?.tipo || 'interessada'}</div>
        </div>

        {/* Dados pessoais */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#D4A843', marginBottom: 14 }}>👤 Dados pessoais</div>
          {[
            { label: 'Nome completo', key: 'nome_completo', placeholder: 'Seu nome completo' },
            { label: 'Telefone / WhatsApp', key: 'telefone', placeholder: '(11) 99999-9999' },
            { label: 'Endereço', key: 'endereco', placeholder: 'Cidade, Estado' },
            { label: 'Instagram pessoal', key: 'instagram_pessoal', placeholder: '@seuperfil' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.label}</label>
              <input
                value={(perfil as any)?.[f.key] || ''}
                onChange={e => setPerfil(prev => prev ? { ...prev, [f.key]: e.target.value } : prev)}
                placeholder={f.placeholder}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 11px', fontSize: 13, color: '#F5E6C8', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>

        {/* Dados da loja */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#D4A843', marginBottom: 14 }}>🏪 Minha loja</div>
          {[
            { label: 'Nome da loja', key: 'nome', placeholder: 'Ex: ModaStyle' },
            { label: 'Instagram da loja', key: 'instagram_loja', placeholder: '@sualoja' },
            { label: 'WhatsApp da loja', key: 'whatsapp_loja', placeholder: '(11) 99999-9999' },
            { label: 'Site', key: 'site_loja', placeholder: 'https://sualoja.com.br' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.label}</label>
              <input
                value={(loja as any)[f.key] || ''}
                onChange={e => setLoja(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 11px', fontSize: 13, color: '#F5E6C8', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>

        {/* Botão salvar */}
        <button onClick={salvar} disabled={loading}
          style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: '#D4A843', color: '#2D1B00', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Salvando...' : salvo ? '✓ Salvo!' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
