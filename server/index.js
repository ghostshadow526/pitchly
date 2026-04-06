import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Load env from the project root (../.env relative to this file),
// independent of how/where the server is started.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const port = process.env.PORT || 5000;
const resend = new Resend(process.env.RESEND_API_KEY);
const licensesPath = path.join(__dirname, 'licenses.json');

app.use(cors());
app.use(express.json());

const readLicenses = () => {
  try {
    const data = fs.readFileSync(licensesPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const saveLicenses = (licenses) => {
  fs.writeFileSync(licensesPath, JSON.stringify(licenses, null, 2));
};

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

app.post('/api/gumroad-ping', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const uuid = uuidv4();
    const licenseKey = `PTCH-${uuid.substring(0, 8)}`;

    const licenses = readLicenses();
    licenses.push({
      email,
      key: licenseKey,
      active: true,
      date: new Date().toISOString()
    });
    saveLicenses(licenses);

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Your Pitchly Pro Access Code 🚀',
      html: `
        <h2>Welcome to Pitchly Pro!</h2>
        <p>Thanks for your purchase! Here is your access code:</p>
        <h1 style='color: #4F46E5'>${licenseKey}</h1>
        <p>Go to your Pitchly app and click 'Already paid?' then enter this code to unlock unlimited emails.</p>
        <p>Reply to this email if you need any help!</p>
        <p>- Abbas, Founder of Pitchly</p>
      `
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error in gumroad-ping:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
});

app.post('/api/verify-license', (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'License key is required' });
    }

    const licenses = readLicenses();
    const license = licenses.find(l => l.key === key && l.active === true);

    if (license) {
      return res.json({ valid: true, email: license.email });
    }

    res.json({ valid: false });
  } catch (error) {
    console.error('Error in verify-license:', error);
    res.status(500).json({ error: 'Failed to verify license' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, '../client/dist')));

// Serve index.html for any non-API routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(port, () => {
  console.log(`Pitchly server running on port ${port}`);
});
