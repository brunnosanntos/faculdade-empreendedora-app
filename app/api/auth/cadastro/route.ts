import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, senha, nome, tipo = 'interessada', ...dados } = await req.json()
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Erro ao criar usuária' }, { status: 400 })
    }

    await supabase
      .from('perfis')
      .update({ tipo, nome_completo: nome, ...dados })
      .eq('id', authData.user.id)

    return NextResponse.json({ user: authData.user, message: 'Cadastro realizado!' })

  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
