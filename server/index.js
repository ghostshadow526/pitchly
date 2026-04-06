import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from the project root (../.env relative to this file),
// independent of how/where the server is started.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: 'Groq API key is not configured on the server.' });
    }

    const groq = new Groq({ apiKey });

    const {
      founderName,
      founderRole,
      targetName,
      targetProfile,
      goal,
      tone
    } = req.body;

    if (!founderName || !targetName || !goal || !tone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const systemPrompt = `You are an expert cold email copywriter for startup founders. Generate highly personalized, concise cold emails that feel human, specific, and non-spammy.`;

    const userPrompt = `Generate 3 distinct cold email variants for a startup founder.

Founder name: ${founderName}
What they do: ${founderRole}
Target person / company: ${targetName}
Target LinkedIn / description: ${targetProfile || 'N/A'}
Goal of outreach: ${goal}
Tone: ${tone}

Requirements:
- Write 3 clearly separated email variants.
- Each variant should have a subject line and body.
- Keep the body to 2–4 short paragraphs.
- Make each variant meaningfully different in approach.
- Do not use placeholders like [Name] – use the provided names where possible.
Return the emails in a simple numbered list format (1., 2., 3.).`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 1200
    });

    const content = completion.choices?.[0]?.message?.content || '';

    // Naive split into 3 variants by numbered list
    const variants = content
      .split(/\n(?=\d+\.)/)
      .map(part => part.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (!variants.length) {
      return res.status(500).json({ error: 'No email variants generated' });
    }

    res.json({ variants });
  } catch (error) {
    console.error('Error generating emails:', error);

    if (error.response?.status === 401) {
      return res.status(500).json({ error: 'Invalid or missing Groq API key on server' });
    }

    res.status(500).json({ error: 'Failed to generate emails. Please try again.' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Pitchly server running on port ${port}`);
});
