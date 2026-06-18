'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ANO_ATUAL = new Date().getFullYear()

const CAT_CONFIG: Record<string, { emoji: string, cor: string, label: string }> = {
  pessoal:    { emoji: '🙋', cor: '#7A9AC8', label: 'Pessoal' },
  empresa:    { emoji: '🏪', cor: '#D4A843', label: 'Empresa' },
  financeiro: { emoji: '💰', cor: '#5CB040', label: 'Financeiro' },
  viagem:     { emoji: '✈️', cor: '#A87AAB', label: 'Viagem' },
  saude:      { emoji: '💪', cor: '#C87A7A', label: 'Saúde' },
  estudo:     { emoji: '📚', cor: '#7AC8A8', label: 'Estudo' },
}

type Meta = {
  id: string
  titulo: string
  desc?: string
  categoria: string
  total: number
  atual: number
  prazo?: string
  img?: string
  ano: number
  concluida: boolean
}

function fmt(val: number) {
  return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

function parseMoeda(val: string) {
  return parseFloat(val.replace(/[^0-9,]/g, '').replace(',', '.')) || 0
}

export default function Metas() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ titulo: '', desc: '', categoria: 'pessoal', total: '', atual: '', prazo: '' })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      carregarMetas(data.user.id)
    })
  }, [])

  async function carregarMetas(uid: string) {
    // Por enquanto salva no localStorage até ter tabela de metas no Supabase
    const salvas = localStorage.getItem(`metas_${uid}_${ANO_ATUAL}`)
    if (salvas) setMetas(JSON.parse(salvas))
  }

  function salvarMetas(novasMetas: Meta[]) {
    if (userId) localStorage.setItem(`metas_${userId}_${ANO_ATUAL}`, JSON.stringify(novasMetas))
    setMetas(novasMetas)
  }

  function criarMeta() {
    if (!form.titulo || !form.total) return
    const total = parseMoeda(form.total)
    const atual = parseMoeda(form.atual)
    const nova: Meta = {
      id: Date.now().toString(),
      titulo: form.titulo,
      desc: form.desc,
      categoria: form.categoria,
      total,
      atual: Math.min(atual, total),
      prazo: form.prazo,
      ano: ANO_ATUAL,
      concluida: atual >= total,
    }
    const novas = [...metas, nova]
    if (novas.length > 20) { alert('Limite de 20 metas por ano!'); return }
    salvarMetas(novas)
    setModal(false)
    setForm({ titulo: '', desc: '', categoria: 'pessoal', total: '', atual: '', prazo: '' })
  }

  function atualizarValor(id: string, novoValor: string) {
    const val = parseMoeda(novoValor)
    const novas = metas.map(m => m.id === id ? { ...m, atual: Math.min(val, m.total), concluida: val >= m.total } : m)
    salvarMetas(novas)
  }

  function excluirMeta(id: string) {
    if (!confirm('Excluir esta meta?')) return
    salvarMetas(metas.filter(m => m.id !== id))
  }

  const concluidas = metas.filter(m => m.concluida).length
  const pctGeral = metas.length > 0 ? Math.round(metas.reduce((acc, m) => acc + (m.atual / m.total), 0) / metas.length * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#0d2818', fontFamily: 'Arial', color: '#F5E6C8' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => router.push('/home')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 12px', color: '#F5E6C8', fontSize: 12, cursor: 'pointer' }}>← Início</button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>🎯 Metas {ANO_ATUAL}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>renova em Jan/{ANO_ATUAL + 1}</span>
        <button onClick={() => setModal(true)} disabled={metas.length >= 20}
          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#D4A843', color: '#2D1B00', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: metas.length >= 20 ? 0.4 : 1 }}>
          + Nova meta
        </button>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: 16 }}>
        {/* Resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { val: `${metas.length}/20`, lbl: 'Metas criadas' },
            { val: concluidas, lbl: 'Concluídas ✓' },
            { val: `${pctGeral}%`, lbl: 'Progresso geral' },
          ].map(k => (
            <div key={k.lbl} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#D4A843' }}>{k.val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{k.lbl}</div>
            </div>
          ))}
        </div>

        {/* Grid de metas */}
        {metas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🎯</div>
            <p>Nenhuma meta criada ainda.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Clique em "+ Nova meta" para começar!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            {metas.map(m => {
              const pct = Math.min(100, Math.round((m.atual / m.total) * 100))
              const cat = CAT_CONFIG[m.categoria] || CAT_CONFIG.pessoal
              const fillColor = pct >= 100 ? '#5CB040' : pct >= 66 ? '#5CB040' : pct >= 33 ? '#D4A843' : '#C87A30'
              return (
                <div key={m.id} style={{ background: m.concluida ? 'rgba(80,180,60,0.05)' : 'rgba(255,255,255,0.05)', border: `1px solid ${m.concluida ? 'rgba(80,180,60,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, overflow: 'hidden' }}>
                  {/* Imagem/categoria */}
                  <div style={{ height: 100, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, position: 'relative' }}>
                    {cat.emoji}
                    <div style={{ position: 'absolute', top: 8, left: 8, background: `${cat.cor}33`, border: `1px solid ${cat.cor}66`, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: cat.cor }}>
                      {cat.emoji} {cat.label}
                    </div>
                    {m.concluida && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(80,180,60,0.85)', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                        ✓ Concluída!
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{m.titulo}</div>
                    {m.desc && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{m.desc}</div>}

                    {/* Progresso */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#D4A843' }}>{fmt(m.atual)}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}> de {fmt(m.total)}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: fillColor, borderRadius: 999, transition: 'width 0.8s' }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'right', marginTop: 2 }}>
                        falta {fmt(Math.max(0, m.total - m.atual))}
                      </div>
                    </div>

                    {!m.concluida && (
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                        <input id={`inp-${m.id}`} type="text" placeholder="Novo valor guardado (R$)"
                          style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '6px 9px', fontSize: 12, color: '#F5E6C8', outline: 'none' }} />
                        <button onClick={() => {
                          const el = document.getElementById(`inp-${m.id}`) as HTMLInputElement
                          if (el) { atualizarValor(m.id, el.value); el.value = '' }
                        }} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: 'rgba(212,168,67,0.2)', color: '#D4A843', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          Atualizar
                        </button>
                      </div>
                    )}

                    <button onClick={() => excluirMeta(m.id)}
                      style={{ width: '100%', padding: 5, borderRadius: 7, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer' }}>
                      🗑 Excluir
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal nova meta */}
      {modal && (
        <div onClick={() => setModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a2e1a', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 16, padding: 24, maxWidth: 440, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Nova meta 🎯</h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            {[
              { label: 'Nome da meta *', key: 'titulo', placeholder: 'Ex: Viajar para a praia, Comprar carro...' },
              { label: 'Descrição', key: 'desc', placeholder: 'Descreva seu objetivo...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 11px', fontSize: 13, color: '#F5E6C8', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Categoria</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(CAT_CONFIG).map(([id, c]) => (
                  <button key={id} onClick={() => setForm({ ...form, categoria: id })}
                    style={{ padding: '5px 12px', borderRadius: 999, border: `1px solid ${form.categoria === id ? '#D4A843' : 'rgba(255,255,255,0.2)'}`, background: form.categoria === id ? 'rgba(212,168,67,0.15)' : 'transparent', color: form.categoria === id ? '#D4A843' : 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Valor necessário (R$) *', key: 'total', placeholder: 'Ex: 5.000,00' },
                { label: 'Já guardei (R$)', key: 'atual', placeholder: 'Ex: 1.200,00' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 11px', fontSize: 13, color: '#F5E6C8', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Prazo</label>
              <input type="month" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 11px', fontSize: 13, color: '#F5E6C8', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />
            </div>

            <button onClick={criarMeta}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#D4A843', color: '#2D1B00', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Criar meta ✓
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
