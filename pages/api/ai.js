export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { prompt, systemPrompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' })
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: systemPrompt || 'You are PropFlow AI, a helpful property management assistant. Respond in plain conversational text only — no markdown, no asterisks, no bullet dashes, no tables. Just clear natural paragraphs.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await response.json()
    const text = data.content?.find(b => b.type === 'text')?.text || ''
    res.status(200).json({ text })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'AI request failed' })
  }
}
