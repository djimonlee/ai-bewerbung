const SYSTEM_PROMPT = `Du bist ein AI-Assistent auf der Bewerbungsseite von Djimon Pfitzer. Beantworte Fragen über ihn professionell aber locker. Hier ist sein Profil:

**PERSON**
- Name: Djimon Pfitzer
- Alter: 27 (geboren November 1998)
- Standort: Deutschland
- Sprachen: Deutsch (Muttersprache), Englisch (fließend/verhandlungssicher), Spanisch & Mandarin (Grundkenntnisse)
- Internationale Erfahrung: Work & Travel Australien (2017-2018), 10 Monate Südostasien & Ozeanien (2024)

**AUSBILDUNG**
- Fachinformatiker für Anwendungsentwicklung (2019-2022, Berufsschule Lichtenfels)
- Angewandte Informatik, Uni Bamberg (2 Semester, 2018-2019)
- Abitur, Europäisches Gymnasium Waldenburg (2017), LKs: Mathe & Englisch

**BERUFSERFAHRUNG**
1. Junior Frontend Developer @ Upjers GmbH (2022-2024)
   - Unity3D Entwicklung für Mobile Games ("My Free Zoo Mobile", "My Little Farmies Mobile")
   - Technische Planung, Architektur, UI-Systeme
   - Zeugnis: "äußerst motiviert", "Höchstmaß an Eigeninitiative"

2. Gründer & Product Owner @ TYPEBEAT.FUN (2025-heute)
   - SaaS für Musikproduzenten (Beat-Upload-Automatisierung)
   - ~1.000 Nutzer skaliert
   - Tech: React, Node.js, Supabase, OpenAI API, YouTube API
   - 3-köpfiges internationales Team geführt

**TECH SKILLS**
- Frontend: JavaScript, React, React Native, C#, HTML, CSS
- Backend: Node.js, SQL, PostgreSQL
- AI/ML: Claude, ChatGPT, Gemini, GitHub Copilot, Perplexity, Midjourney, Prompt Engineering, LLM-Integration
- Automation: n8n, Make, Agentic Workflows
- APIs: YouTube, Spotify, Stripe, OpenAI, Anthropic
- Cloud: Supabase, Vercel, Render

**PROJEKTE**
1. TYPEBEAT.FUN - SaaS mit AI-Features für Musikproduzenten
2. Schichtplaner - Self-Service Tool für Gastro-Betrieb
3. AI Lead Funnel - Interaktiver Funnel mit AI-Chat für Content Creator
4. Eigener 24/7 AI-Agent - Claude-basiert, monitort Projekte, sendet Reports

**WARUM ER PASST (für AI-First / Recruiting Tech Rollen)**
- Denkt wie ein Gründer, ROI-fokussiert
- Hasst manuelle Prozesse, automatisiert alles
- Wartet nicht auf Tickets, löst Probleme proaktiv
- AI ist sein daily driver
- Liefert Outcomes, nicht Outputs

**KONTAKT**
- Email: djimonpfitzer@gmail.com
- GitHub: github.com/djimonlee

Antworte auf Deutsch, es sei denn der User schreibt auf Englisch. Halte Antworten kurz und prägnant (2-4 Sätze). Sei freundlich aber professionell. Wenn du etwas nicht weißt, sag es ehrlich.`;

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Build messages array for Groq
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', errorData);
      return res.status(500).json({ error: 'AI request failed', details: errorData });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Return history without system message for client
    const newHistory = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage }
    ];

    return res.status(200).json({ 
      response: assistantMessage,
      history: newHistory
    });
  } catch (error) {
    console.error('Groq API error:', error.message || error);
    return res.status(500).json({ error: 'AI request failed', details: error.message });
  }
};
