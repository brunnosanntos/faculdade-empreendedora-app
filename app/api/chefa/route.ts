import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `Você é a Chefa.IA, assistente especializada em vendas de moda da plataforma Faculdade da Empreendedora. Ajuda lojistas brasileiras a vender mais com estratégias práticas. Responda sempre em português brasileiro. Máximo 400 palavras.`

export async function POST(req: NextRequest) {
  try {
    const { messages, category } = await req.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1000,
        system: SYSTEM_PROMPT + (category ? ` Categoria: ${category}` : ''),
        messages: messages.slice(-10),
      }),
    })

    const data = await response.json()
    const reply = data.content?.[0]?.text || 'Tente novamente.'
    return NextResponse.json({ reply })

  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
