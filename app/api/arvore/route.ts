import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const busca = searchParams.get('q') || ''
    let query = supabase.from('perfis').select('id, nome_completo, foto_pessoal_url, aprovada_em').eq('tipo', 'aluna').not('aprovada_em', 'is', null).order('aprovada_em', { ascending: false }).limit(250)
    if (busca) query = query.ilike('nome_completo', '%' + busca + '%')
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ alunas: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
