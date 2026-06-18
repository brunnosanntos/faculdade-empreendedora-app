'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function entrar() {
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('E-mail ou senha incorretos')
      setLoading(false)
      return
    }
    router.push('/home')
  }

  return (
    <div style={{minHeight:'100vh',background:'#0d2818',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial'}}>
      <div style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(212,168,67,0.3)',borderRadius:16,padding:32,width:340}}>
        <h1 style={{color:'#D4A843',fontSize:22,fontWeight:700,marginBottom:4}}>Faculdade da</h1>
        <h1 style={{color:'#F5E6C8',fontSize:22,fontWeight:700,marginBottom:24}}>Empreendedora</h1>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="E-mail"
          type="email"
          style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.07)',color:'#F5E6C8',marginBottom:12,fontSize:14,boxSizing:'border-box'}}
        />
        <input
          value={senha}
          onChange={e => setSenha(e.target.value)}
          placeholder="Senha"
          type="password"
          onKeyDown={e => e.key === 'Enter' && entrar()}
          style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.07)',color:'#F5E6C8',marginBottom:16,fontSize:14,boxSizing:'border-box'}}
        />
        {erro && <p style={{color:'#E04040',fontSize:13,marginBottom:12}}>{erro}</p>}
        <button
          onClick={entrar}
          disabled={loading}
          style={{width:'100%',padding:12,borderRadius:8,border:'none',background:'#D4A843',color:'#2D1B00',fontWeight:700,fontSize:14,cursor:'pointer'}}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p style={{color:'rgba(255,255,255,0.4)',fontSize:12,textAlign:'center',marginTop:16}}>
          Não tem conta? <a href="/cadastro" style={{color:'#D4A843'}}>Cadastre-se</a>
        </p>
      </div>
    </div>
  )
}
