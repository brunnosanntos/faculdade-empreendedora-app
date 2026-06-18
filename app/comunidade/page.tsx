'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Msg = {
  id: string
  autora_id: string
  texto: string
  criado_em: string
  deletado_em?: string
  perfis?: { nome_completo: string }
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

export default function Comunidade() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      supabase.from('perfis').select('id, nome_completo, tipo').eq('id', data.user.id).single()
        .then(({ data: p }) => setPerfil(p))
      carregarMsgs()
    })

    // Realtime
    const channel = supabase
      .channel('comunidade-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensagens_chat'
      }, payload => {
        setMsgs(prev => [...prev, payload.new as Msg])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function carregarMsgs() {
    const { data } = await supabase
      .from('mensagens_chat')
      .select('*, perfis(nome_completo)')
      .is('deletado_em', null)
      .order('criado_em', { ascending: true })
      .limit(100)
    if (data) {
      setMsgs(data)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  async function enviar() {
    if (!texto.trim() || loading) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('mensagens_chat').insert({ autora_id: user.id, texto: texto.trim() })
    setTexto('')
    setLoading(false)
  }

  async function excluir(id: string) {
    await supabase.from('mensagens_chat').update({ deletado_em: new Date().toISOString() }).eq('id', id)
    setMsgs(prev => prev.filter(m => m.id !== id))
  }

  const ini = (nome: string) => nome?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??'

  return (
    <div style={{ height: '100vh', background: '#0d2818', fontFamily: 'Arial', color: '#F5E6C8', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={() => router.push('/home')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 12px', color: '#F5E6C8', fontSize: 12, cursor: 'pointer' }}>← Início</button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>💬 Comunidade</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5CB040' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Online</span>
        </div>
      </div>

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
            <p>Nenhuma mensagem ainda.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Seja a primeira a falar!</p>
          </div>
        )}
        {msgs.map(m => {
          const isPropia = m.autora_id === perfil?.id
          const nome = m.perfis?.nome_completo || 'Aluna'
          return (
            <div key={m.id} style={{ display: 'flex', gap: 8, flexDirection: isPropia ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
              {!isPropia && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#C8A87A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#2D1B00', flexShrink: 0 }}>
                  {ini(nome)}
                </div>
              )}
              <div style={{ maxWidth: '75%' }}>
                {!isPropia && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 3, marginLeft: 4 }}>{nome}</div>
                )}
                <div style={{ position: 'relative', group: 'msg' } as any}>
                  <div style={{ padding: '9px 13px', borderRadius: isPropia ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: isPropia ? 'rgba(212,168,67,0.2)' : 'rgba(255,255,255,0.08)', fontSize: 13, lineHeight: 1.5, color: '#F5E6C8' }}>
                    {m.texto}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, justifyContent: isPropia ? 'flex-end' : 'flex-start' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{tempoAtras(m.criado_em)}</span>
                    {isPropia && (
                      <button onClick={() => excluir(m.id)} style={{ background: 'none', border: 'none', color: 'rgba(220,60,60,0.5)', fontSize: 11, cursor: 'pointer', padding: 0 }}>🗑</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            rows={1}
            style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '9px 13px', fontSize: 13, color: '#F5E6C8', fontFamily: 'Arial', resize: 'none', outline: 'none', minHeight: 40, maxHeight: 120 }}
          />
          <button onClick={enviar} disabled={loading || !texto.trim()}
            style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: '#D4A843', color: '#2D1B00', fontSize: 18, cursor: 'pointer', flexShrink: 0, opacity: !texto.trim() ? 0.5 : 1 }}>
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
