'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Peca = {
  id: string
  nome: string
  categoria: string
  cor: string
  tamanho: string
  quantidade: number
  preco: number
  condicao: string
  material?: string
  descricao?: string
  troca?: string
  vendedora_id: string
  criado_em: string
  perfis?: { nome_completo: string }
}

const CATEGORIAS = ['Calça', 'Blusa', 'Vestido', 'Saia', 'Casaco', 'Shorts', 'Conjunto', 'Acessório', 'Calçado']
const CORES = [
  { label: 'Preto', hex: '#000' }, { label: 'Branco', hex: '#fff' },
  { label: 'Vermelho', hex: '#C0392B' }, { label: 'Azul', hex: '#2980B9' },
  { label: 'Verde', hex: '#27AE60' }, { label: 'Amarelo', hex: '#F39C12' },
  { label: 'Rosa', hex: '#F8BBD0' }, { label: 'Cinza', hex: '#ECF0F1' },
  { label: 'Marrom', hex: '#795548' }, { label: 'Roxo', hex: '#8E44AD' },
]
const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XG', '36', '38', '40', '42', '44', '46']

function fmt(val: number) {
  return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

function diasRestantes(data: string) {
  const expira = new Date(data).getTime() + 30 * 24 * 60 * 60 * 1000
  return Math.max(0, Math.ceil((expira - Date.now()) / (24 * 60 * 60 * 1000)))
}

export default function Marketplace() {
  const [tab, setTab] = useState<'comprar' | 'vender' | 'minhas'>('comprar')
  const [pecas, setPecas] = useState<Peca[]>([])
  const [minhas, setMinhas] = useState<Peca[]>([])
  const [busca, setBusca] = useState('')
  const [catFiltro, setCatFiltro] = useState('')
  const [modal, setModal] = useState<Peca | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '', categoria: '', cor: '', tamanho: '', quantidade: '', preco: '',
    condicao: 'Nova com etiqueta', material: '', descricao: '', troca: 'Não'
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      carregarPecas()
      carregarMinhas(data.user.id)
    })
  }, [])

  async function carregarPecas() {
    const { data } = await supabase
      .from('pecas_marketplace')
      .select('*, perfis(nome_completo)')
      .is('vendido_em', null)
      .order('criado_em', { ascending: false })
      .limit(100)
    if (data) setPecas(data)
  }

  async function carregarMinhas(uid: string) {
    const { data } = await supabase
      .from('pecas_marketplace')
      .select('*')
      .eq('vendedora_id', uid)
      .order('criado_em', { ascending: false })
    if (data) setMinhas(data)
  }

  async function publicarPeca() {
    if (!form.nome || !form.categoria || !form.preco) return
    const { error } = await supabase.from('pecas_marketplace').insert({
      nome: form.nome,
      categoria: form.categoria,
      cor: form.cor,
      tamanho: form.tamanho,
      quantidade: parseInt(form.quantidade) || 1,
      preco: parseFloat(form.preco.replace(/[^0-9,]/g, '').replace(',', '.')) || 0,
      condicao: form.condicao,
      material: form.material,
      descricao: form.descricao,
      troca: form.troca,
      vendedora_id: userId,
    })
    if (!error) {
      setForm({ nome: '', categoria: '', cor: '', tamanho: '', quantidade: '', preco: '', condicao: 'Nova com etiqueta', material: '', descricao: '', troca: 'Não' })
      await carregarPecas()
      await carregarMinhas(userId!)
      setTab('minhas')
    }
  }

  async function removerPeca(id: string) {
    if (!confirm('Remover esta peça?')) return
    await supabase.from('pecas_marketplace').delete().eq('id', id)
    await carregarMinhas(userId!)
    await carregarPecas()
  }

  const pecasFiltradas = pecas.filter(p => {
    const buscaOk = !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.categoria.toLowerCase().includes(busca.toLowerCase())
    const catOk = !catFiltro || p.categoria === catFiltro
    return buscaOk && catOk
  })

  const cardStyle = (p: Peca) => ({
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s'
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0d2818', fontFamily: 'Arial', color: '#F5E6C8' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => router.push('/home')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 12px', color: '#F5E6C8', fontSize: 12, cursor: 'pointer' }}>← Início</button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>🛍️ Marketplace</span>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: 16 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[{ id: 'comprar', label: '🛍️ Comprar' }, { id: 'vender', label: '📦 Vender' }, { id: 'minhas', label: 'Minhas peças' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${tab === t.id ? '#D4A843' : 'rgba(255,255,255,0.15)'}`, background: tab === t.id ? 'rgba(212,168,67,0.2)' : 'transparent', color: tab === t.id ? '#D4A843' : 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontWeight: tab === t.id ? 700 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ABA COMPRAR */}
        {tab === 'comprar' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Buscar peça..."
                style={{ flex: 1, minWidth: 150, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#F5E6C8', outline: 'none' }} />
              <select value={catFiltro} onChange={e => setCatFiltro(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '0 10px', fontSize: 12, color: '#F5E6C8', height: 33 }}>
                <option value="">Todas</option>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {pecasFiltradas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)' }}>
                <p style={{ fontSize: 32 }}>🛍️</p>
                <p>Nenhuma peça disponível ainda.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {pecasFiltradas.map(p => (
                  <div key={p.id} style={cardStyle(p)} onClick={() => setModal(p)}>
                    <div style={{ height: 140, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>👗</div>
                    <div style={{ padding: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{p.nome}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>{p.cor} · {p.tamanho} · Qtd: {p.quantidade}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#D4A843', marginBottom: 4 }}>{fmt(p.preco)}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>⏱ {diasRestantes(p.criado_em)}d · por {p.perfis?.nome_completo?.split(' ')[0]}</div>
                      <button onClick={e => { e.stopPropagation(); setModal(p) }}
                        style={{ width: '100%', padding: '6px', borderRadius: 8, border: 'none', background: '#D4A843', color: '#2D1B00', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ABA VENDER */}
        {tab === 'vender' && (
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#D4A843', marginBottom: 16 }}>📦 Cadastrar peça para venda</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Nome da peça *', key: 'nome', placeholder: 'Ex: Calça Wide Leg' },
                { label: 'Material', key: 'material', placeholder: 'Ex: Viscose, Cotton' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#F5E6C8', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Categoria *</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#F5E6C8', outline: 'none' }}>
                  <option value="">Selecione</option>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Quantidade *</label>
                <input type="number" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} placeholder="Ex: 5" min="1"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#F5E6C8', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Preço unit. *</label>
                <input value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} placeholder="R$ 0,00"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#F5E6C8', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase' }}>Tamanho</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TAMANHOS.map(t => (
                  <button key={t} onClick={() => setForm({ ...form, tamanho: t })}
                    style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${form.tamanho === t ? '#D4A843' : 'rgba(255,255,255,0.2)'}`, background: form.tamanho === t ? 'rgba(212,168,67,0.2)' : 'transparent', color: form.tamanho === t ? '#D4A843' : 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase' }}>Cor</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CORES.map(c => (
                  <div key={c.label} onClick={() => setForm({ ...form, cor: c.label })} title={c.label}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c.hex, border: `2px solid ${form.cor === c.label ? '#F5E6C8' : 'transparent'}`, cursor: 'pointer', transform: form.cor === c.label ? 'scale(1.2)' : 'scale(1)', boxShadow: c.hex === '#fff' ? '0 0 0 1px rgba(255,255,255,0.3)' : 'none' }} />
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Condição</label>
                <select value={form.condicao} onChange={e => setForm({ ...form, condicao: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#F5E6C8', outline: 'none' }}>
                  <option>Nova com etiqueta</option>
                  <option>Nova sem etiqueta</option>
                  <option>Seminova</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Aceita troca?</label>
                <select value={form.troca} onChange={e => setForm({ ...form, troca: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#F5E6C8', outline: 'none' }}>
                  <option>Não</option>
                  <option>Sim, aceito troca</option>
                  <option>Aceito troca com volta</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Descrição</label>
              <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva a peça..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#F5E6C8', outline: 'none', minHeight: 70, resize: 'none', boxSizing: 'border-box' }} />
            </div>

            <button onClick={publicarPeca} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#D4A843', color: '#2D1B00', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 14 }}>
              Publicar peça no marketplace
            </button>
          </div>
        )}

        {/* ABA MINHAS */}
        {tab === 'minhas' && (
          <div>
            {minhas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)' }}>
                <p style={{ fontSize: 32 }}>📦</p>
                <p>Você ainda não publicou nenhuma peça.</p>
                <button onClick={() => setTab('vender')} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#D4A843', color: '#2D1B00', fontWeight: 700, cursor: 'pointer' }}>
                  Publicar peça
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {minhas.map(p => (
                  <div key={p.id} style={cardStyle(p)}>
                    <div style={{ height: 100, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👗</div>
                    <div style={{ padding: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{p.nome}</div>
                      <div style={{ fontSize: 11, color: '#D4A843', marginBottom: 6 }}>{fmt(p.preco)}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>⏱ {diasRestantes(p.criado_em)}d restantes</div>
                      <button onClick={() => removerPeca(p.id)}
                        style={{ width: '100%', padding: '5px', borderRadius: 7, border: '1px solid rgba(220,60,60,0.3)', background: 'transparent', color: 'rgba(220,60,60,0.7)', fontSize: 11, cursor: 'pointer' }}>
                        🗑 Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal detalhe peça */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a2e1a', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ height: 160, background: 'rgba(255,255,255,0.04)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, marginBottom: 14 }}>👗</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{modal.nome}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#D4A843', marginBottom: 12 }}>{fmt(modal.preco)} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>por unidade</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Categoria', val: modal.categoria },
                { label: 'Cor', val: modal.cor },
                { label: 'Tamanho', val: modal.tamanho },
                { label: 'Quantidade', val: `${modal.quantidade} peças` },
                { label: 'Condição', val: modal.condicao },
                { label: 'Material', val: modal.material || 'N/A' },
              ].map(i => (
                <div key={i.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 3 }}>{i.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{i.val}</div>
                </div>
              ))}
            </div>
            {modal.descricao && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 10 }}>{modal.descricao}</p>}
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>
              Troca: {modal.troca} · Vendedora: {modal.perfis?.nome_completo}
            </div>
            <button onClick={() => setModal(null)}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#D4A843', color: '#2D1B00', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              💬 Entrar em contato
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
