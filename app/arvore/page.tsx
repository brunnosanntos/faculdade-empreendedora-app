'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const POSICOES = [
  {y:85, xs:[340]},
  {y:148, xs:[265,340,418]},
  {y:210, xs:[192,272,340,415,492]},
  {y:272, xs:[152,232,308,375,452,530]},
  {y:332, xs:[138,215,288,348,412,482,552]},
  {y:390, xs:[152,222,292,348,408,472,538]},
  {y:446, xs:[168,238,302,348,402,462,522]},
  {y:498, xs:[188,252,312,350,396,450,506]},
  {y:546, xs:[212,272,322,352,392,438,490]},
  {y:590, xs:[240,292,334,358,392,432]},
  {y:628, xs:[268,312,342,362,390,422]},
  {y:662, xs:[292,326,346,366,396]},
  {y:692, xs:[312,338,358,384]},
  {y:716, xs:[325,346,368]},
  {y:736, xs:[334,356]},
]

function gerarPosicoes(total: number) {
  const positions: {x: number, y: number}[] = []
  for (const row of POSICOES) {
    for (const x of row.xs) {
      positions.push({ x, y: row.y })
      if (positions.length >= total) return positions
    }
  }
  return positions
}

type Aluna = {
  id: string
  nome_completo: string
  foto_pessoal_url?: string
  instagram_pessoal?: string
  aprovada_em: string
  lojas?: { nome: string, instagram_loja?: string }[]
  historia_alunas?: { antes?: string, depois?: string }[]
  metricas_alunas?: { seg_pessoal?: number, faturamento?: number, mes_ref: string }[]
}

// Cores para os círculos
const CORES = ['#C8A87A','#A87AAB','#7AC8A8','#C87A7A','#7A9AC8','#A8C87A','#C8B87A','#7AC8C8']

export default function Arvore() {
  const [alunas, setAlunas] = useState<Aluna[]>([])
  const [busca, setBusca] = useState('')
  const [zoom, setZoom] = useState(1)
  const [modal, setModal] = useState<Aluna | null>(null)
  const [estacao, setEstacao] = useState('outono')
  const router = useRouter()

  // Detectar estação do Brasil
  useEffect(() => {
    const mes = new Date().getMonth() + 1
    const dia = new Date().getDate()
    if ((mes === 3 && dia >= 20) || [4,5].includes(mes) || (mes === 6 && dia <= 20)) setEstacao('outono')
    else if ((mes === 6 && dia >= 21) || [7,8].includes(mes) || (mes === 9 && dia <= 22)) setEstacao('inverno')
    else if ((mes === 9 && dia >= 23) || [10,11].includes(mes) || (mes === 12 && dia <= 20)) setEstacao('primavera')
    else setEstacao('verao')
  }, [])

  // Buscar alunas do Supabase via API
  useEffect(() => {
    const params = busca.length >= 2 ? `?q=${encodeURIComponent(busca)}` : ''
    fetch(`/api/arvore${params}`)
      .then(r => r.json())
      .then(d => setAlunas(d.alunas || []))
      .catch(() => {})
  }, [busca])

  const positions = gerarPosicoes(alunas.length)
  const R = alunas.length <= 50 ? 22 : alunas.length <= 100 ? 17 : 12

  const corEstacao: Record<string, string> = {
    outono: '#3d1a00',
    inverno: '#1a1e2e',
    primavera: '#0d3820',
    verao: '#1a4a1a',
  }

  return (
    <div style={{ minHeight: '100vh', background: corEstacao[estacao], fontFamily: 'Arial', transition: 'background 1.2s' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/home')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 12px', color: '#F5E6C8', fontSize: 12, cursor: 'pointer' }}>
          ← Início
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#F5E6C8' }}>🌳 Árvore das Alunas</span>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar aluna..."
          style={{ flex: 1, minWidth: 150, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 10px', color: '#F5E6C8', fontSize: 12, outline: 'none' }} />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.15))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', color: '#F5E6C8', cursor: 'pointer' }}>−</button>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', minWidth: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.15))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', color: '#F5E6C8', cursor: 'pointer' }}>+</button>
          <button onClick={() => setZoom(1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', color: '#F5E6C8', cursor: 'pointer', fontSize: 12 }}>↺</button>
        </div>
        <span style={{ fontSize: 11, color: '#D4A843' }}><strong>{alunas.length}</strong> alunas</span>
      </div>

      {/* Árvore SVG */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: 20, overflow: 'auto' }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', position: 'relative', width: 680, height: 820 }}>
          {/* Badge estação */}
          <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', borderRadius: 999, padding: '4px 14px', fontSize: 12, color: '#F5E6C8', zIndex: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            {estacao === 'outono' ? '🍂' : estacao === 'inverno' ? '❄️' : estacao === 'primavera' ? '🌸' : '☀️'}
            {estacao.charAt(0).toUpperCase() + estacao.slice(1)}
          </div>

          {/* Imagem da árvore */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.02)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 200, opacity: 0.15 }}>
            🌳
          </div>

          {/* Nós SVG */}
          <svg width={680} height={820} style={{ position: 'absolute', inset: 0 }}>
            {alunas.map((a, i) => {
              if (i >= positions.length) return null
              const { x, y } = positions[i]
              const cor = CORES[i % CORES.length]
              const ini = (a.nome_completo || '??').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
              return (
                <g key={a.id} style={{ cursor: 'pointer' }} transform={`translate(${x},${y})`} onClick={() => setModal(a)}>
                  <circle cx={1.5} cy={2.5} r={R} fill="rgba(0,0,0,0.2)" />
                  <circle cx={0} cy={0} r={R} fill="#FFF8EE" stroke={cor} strokeWidth={Math.max(1.5, R * 0.12)} />
                  <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={Math.max(7, R * 0.46)} fontWeight={700} fill="#5A3E1B" fontFamily="Arial,sans-serif">
                    {ini}
                  </text>
                  {R > 14 && (
                    <text x={0} y={R + 10} textAnchor="middle" fontSize={Math.max(6, R * 0.32)} fill="#F5E6C8" fontFamily="Arial,sans-serif">
                      {(a.nome_completo || '').split(' ')[0]}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a2e1a', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 16, padding: 24, maxWidth: 380, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D4A843', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#2D1B00', margin: '0 auto 10px' }}>
                {(modal.nome_completo || '??').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F5E6C8' }}>{modal.nome_completo}</div>
              {modal.lojas?.[0] && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{modal.lojas[0].nome}</div>}
              {modal.instagram_pessoal && (
                <a href={`https://instagram.com/${modal.instagram_pessoal.replace('@','')}`} target="_blank"
                  style={{ fontSize: 12, color: '#D4A843', textDecoration: 'none' }}>{modal.instagram_pessoal}</a>
              )}
            </div>
            {modal.historia_alunas?.[0]?.depois && (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#D4A843', marginBottom: 4, fontWeight: 700 }}>✨ Transformação</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{modal.historia_alunas[0].depois}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
