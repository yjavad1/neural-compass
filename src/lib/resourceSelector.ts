// This module is designed for Supabase Edge Functions (Deno environment)
// It's imported into the edge function, not used directly in the React app

export async function selectResourceIds(payload: any, attempt = 1, apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 450,
        messages: [
          { 
            role: "system", 
            content: `Return ONLY JSON: {"resource_ids":["id1","id2","id3"]}.
Pick 2–4 IDs from CANDIDATES that best match PHASE and SKILLS.
Never invent IDs. If uncertain, pick the closest 2.`
          },
          { role: "user", content: JSON.stringify(payload) }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content ?? "{}";
    const out = JSON.parse(text);
    const ids = Array.isArray(out.resource_ids) ? out.resource_ids : [];
    return ids;
  } catch (e: any) {
    console.error(`Resource selection attempt ${attempt} failed:`, e);
    
    // Retry on rate limit with backoff
    if ((e.status === 429 || /rate limit/i.test(String(e))) && attempt < 3) {
      console.log(`Rate limited, retrying in ${attempt * 1000}ms...`);
      await new Promise(r => setTimeout(r, attempt * 1000));
      return selectResourceIds(payload, attempt + 1, apiKey);
    }
    
    console.warn('Resource selection failed, returning empty array');
    return [];
  }
}