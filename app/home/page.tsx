'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const modulos = [
  { icon: '🌳', label: 'Árvore', sub: 'Comunidade de alunas', href: '/arvore' },
  { icon: '📸', label: 'Feed', sub: 'Posts e novidades', href: '/feed' },
  { icon: '💬', label: 'Comunidade', sub: 'Chat das alunas', href: '/comunidade' },
  { icon: '🛍️', label: 'Marketplace', sub: 'Compre e venda', href: '/marketplace' },
  { icon: '✨', label: 'Chefa.IA', sub: 'Assistente de vendas', href: '/chefa' },
  { icon: '🎯', label: 'Metas', sub: 'Meus objetivos', href: '/metas' },
  { icon: '🏭', label: 'Fornecedor', sub: 'Parceiros e planos', href: '/fornecedor' },
  { icon: '👤', label: 'Meu Perfil', sub: 'Dados e configurações', href: '/perfil' },
]

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      supabase.from('perfis').select('*').eq('id', data.user.id).single()
        .then(({ data: p }) => setPerfil(p))
    })
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{minHeight:'100vh',background:'#0d2818',fontFamily:'Arial',padding:20}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:32,maxWidth:700,margin:'0 auto 32px'}}>
        <div>
          <div style={{fontSize:20,fontWeight:700,color:'#D4A843'}}>Faculdade da</div>
          <div style={{fontSize:20,fontWeight:700,color:'#F5E6C8'}}>Empreendedora</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>
            {perfil?.nome_completo?.split(' ')[0] || user?.email}
          </span>
          <button onClick={sair} style={{padding:'6px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:'rgba(255,255,255,0.5)',fontSize:12,cursor:'pointer'}}>
            Sair
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{maxWidth:700,margin:'0 auto'}}>
        <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,marginBottom:20}}>
          Bem-vinda! O que você quer fazer hoje?
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {modulos.map(m => (
            <div key={m.href} onClick={() => router.push(m.href)}
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,padding:'20px 12px',cursor:'pointer',textAlign:'center',transition:'all 0.2s'}}>
              <div style={{fontSize:32,marginBottom:8}}>{m.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:'#F5E6C8',marginBottom:4}}>{m.label}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
