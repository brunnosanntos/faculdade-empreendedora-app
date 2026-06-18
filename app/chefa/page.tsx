'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIAS = [
  { id: 'fotos', emoji: '📸', label: 'Fotos', sub: 'Produto & lookbook' },
  { id: 'videos', emoji: '🎥', label: 'Vídeos & Reels', sub: 'Roteiros prontos' },
  { id: 'lives', emoji: '📡', label: 'Lives', sub: 'Scripts de vendas' },
  { id: 'copy', emoji: '✍️', label: 'Legendas & Copy', sub: 'Instagram pronto' },
  { id: 'campanhas', emoji: '🛍️', label: 'Campanhas', sub: 'Ações de vendas' },
  { id: 'estoque', emoji: '📦', label: 'Estoque', sub: 'Giro & liquidação' },
]

const SUGESTOES: Record<string, string[]> = {
  fotos: ['Como fotografar sem estúdio?', 'Melhores ângulos para roupas', 'Iluminação natural para fotos'],
  videos: ['Roteiro de Reel de 30s', 'Reel de lançamento de coleção', 'Como fazer transições'],
  lives: ['Script de abertura de live', 'Como apresentar preço na live', 'Como fechar venda na live'],
  copy: ['Legenda para lançamento', 'Copy para story de produto', 'Hashtags para moda feminina'],
  campanhas: ['Campanha de Dia das Mães', 'Black Friday para lojistas', 'Lançamento de coleção nova'],
  estoque: ['Como liquidar sem perder margem', 'Precificação de peças de moda', 'Mix ideal de produtos'],
}

type Msg = { role: 'user' | 'assistant', content: string }

export default function ChefaIA() {
  const [categoria, setCategoria] = useState('fotos')
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: 'Olá! Sou a **Chefa.IA** 🌟\n\nPosso te ajudar com fotos, vídeos, lives, legendas, campanhas e estoque. Por onde quer começar?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function enviar(texto?: string) {
    const msg = texto || input.trim()
    if (!msg || loading) return
    setInput('')
    const novaMsg: Msg = { role: 'user', content: msg }
    const histAtual = [...msgs, novaMsg]
    setMsgs(histAtual)
    setLoading(true)

    try {
      const res = await fetch('/api/chefa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: histAtual.map(m => ({ role: m.role, content: m.content })),
          category: categoria
        })
      })
      const data = await res.json()
      setMsgs([...histAtual, { role: 'assistant', content: data.reply || 'Tente novamente.' }])
    } catch {
      setMsgs([...histAtual, { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }])
    }
    setLoading(false)
  }

  function formatMsg(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d2818', fontFamily: 'Arial', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => router.push('/home')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 12px', color: '#F5E6C8', fontSize: 12, cursor: 'pointer' }}>
          ← Início
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#D4A843' }}>✨ Chefa.IA</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Sua assistente de vendas</span>
      </div>

      <div style={{ flex: 1, maxWidth: 700, margin: '0 auto', width: '100%', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Categorias */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {CATEGORIAS.map(c => (
            <div key={c.id} onClick={() => setCategoria(c.id)}
              style={{ background: categoria === c.id ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${categoria === c.id ? '#D4A843' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{c.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F5E6C8' }}>{c.label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Sugestões */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(SUGESTOES[categoria] || []).map(s => (
            <button key={s} onClick={() => enviar(s)}
              style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(212,168,67,0.06)', color: 'rgba(212,168,67,0.8)', fontSize: 11, cursor: 'pointer' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Chat */}
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: m.role === 'assistant' ? 'linear-gradient(135deg,#D4A843,#A87820)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                  {m.role === 'assistant' ? '✨' : 'AP'}
                </div>
                <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 12, background: m.role === 'assistant' ? 'rgba(255,255,255,0.07)' : 'rgba(212,168,67,0.15)', color: '#F5E6C8', fontSize: 13, lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: formatMsg(m.content) }} />
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#D4A843,#A87820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✨</div>
                <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Pensando...</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
              placeholder="Pergunte qualquer coisa sobre vendas, fotos, vídeos..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#F5E6C8', outline: 'none' }}
            />
            <button onClick={() => enviar()} disabled={loading}
              style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: '#D4A843', color: '#2D1B00', fontSize: 18, cursor: 'pointer' }}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
