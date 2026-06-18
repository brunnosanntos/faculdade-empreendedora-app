'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Post = {
  id: string
  autora_id: string
  texto: string
  criado_em: string
  deletado_em?: string
  perfis?: { nome_completo: string, foto_pessoal_url?: string }
}

type Perfil = {
  id: string
  nome_completo: string
  tipo: string
}

function tempoAtras(data: string) {
  const diff = Date.now() - new Date(data).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function diasRestantes(data: string) {
  const criado = new Date(data).getTime()
  const expira = criado + 30 * 24 * 60 * 60 * 1000
  const restantes = Math.ceil((expira - Date.now()) / (24 * 60 * 60 * 1000))
  return Math.max(0, restantes)
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      // Busca perfil
      supabase.from('perfis').select('id, nome_completo, tipo').eq('id', data.user.id).single()
        .then(({ data: p }) => setPerfil(p))
      // Carrega posts
      carregarPosts()
    })

    // Realtime
    const channel = supabase
      .channel('feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts_feed' }, () => {
        carregarPosts()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function carregarPosts() {
    const { data } = await supabase
      .from('posts_feed')
      .select('*, perfis(nome_completo, foto_pessoal_url)')
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })
      .limit(50)
    if (data) setPosts(data)
  }

  async function publicar() {
    if (!texto.trim() || loading) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('posts_feed').insert({ autora_id: user.id, texto: texto.trim() })
    setTexto('')
    await carregarPosts()
    setLoading(false)
  }

  async function excluirPost(id: string) {
    await supabase.from('posts_feed').update({ deletado_em: new Date().toISOString() }).eq('id', id)
    await carregarPosts()
  }

  const ini = (nome: string) => nome?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??'

  const postsFiltrados = posts.filter(p => {
    if (filtro === 'todos') return true
    if (filtro === 'meus') return p.autora_id === perfil?.id
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0d2818', fontFamily: 'Arial', color: '#F5E6C8' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => router.push('/home')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 12px', color: '#F5E6C8', fontSize: 12, cursor: 'pointer' }}>← Início</button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>📸 Feed</span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[{ id: 'todos', label: 'Todos' }, { id: 'meus', label: 'Meus posts' }].map(f => (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              style={{ padding: '6px 14px', borderRadius: 999, border: `1px solid ${filtro === f.id ? '#D4A843' : 'rgba(255,255,255,0.2)'}`, background: filtro === f.id ? 'rgba(212,168,67,0.2)' : 'transparent', color: filtro === f.id ? '#D4A843' : 'rgba(255,255,255,0.55)', fontSize: 12, cursor: 'pointer', fontWeight: filtro === f.id ? 700 : 400 }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#D4A843', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#2D1B00', flexShrink: 0 }}>
              {ini(perfil?.nome_completo || '')}
            </div>
            <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Compartilhe algo com a comunidade..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#F5E6C8', fontFamily: 'Arial', resize: 'none', minHeight: 60, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={publicar} disabled={loading || !texto.trim()}
              style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#D4A843', color: '#2D1B00', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: !texto.trim() ? 0.5 : 1 }}>
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>

        {/* Posts */}
        {postsFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)' }}>
            <p>Nenhum post ainda. Seja a primeira! 🌟</p>
          </div>
        ) : postsFiltrados.map(p => {
          const dias = diasRestantes(p.criado_em)
          const isPropio = p.autora_id === perfil?.id
          return (
            <div key={p.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, marginBottom: 14, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#C8A87A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#2D1B00', flexShrink: 0 }}>
                  {ini(p.perfis?.nome_completo || '')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.perfis?.nome_completo || 'Aluna'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{tempoAtras(p.criado_em)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'rgba(212,168,67,0.6)' }}>⏱ {dias}d restantes</span>
                  {isPropio && (
                    <button onClick={() => excluirPost(p.id)} style={{ background: 'none', border: 'none', color: 'rgba(220,60,60,0.6)', fontSize: 12, cursor: 'pointer' }}>🗑</button>
                  )}
                </div>
              </div>
              <div style={{ padding: '0 14px 14px', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }}>
                {p.texto}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
