import React, { useState } from 'react';

const MAX_FREE_GENERATIONS = 5;

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

type Goal = 'Partnership' | 'Press Coverage' | 'Beta Users' | 'Investor';
type Tone = 'Casual' | 'Professional' | 'Short & Direct';

interface FormState {
  founderName: string;
  founderRole: string;
  targetName: string;
  targetProfile: string;
  goal: Goal;
  tone: Tone;
}

const defaultForm: FormState = {
  founderName: '',
  founderRole: '',
  targetName: '',
  targetProfile: '',
  goal: 'Partnership',
  tone: 'Casual',
};

function App() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<string[]>([]);
  const [generationsUsed, setGenerationsUsed] = useState<number>(() => {
    const stored = localStorage.getItem('pitchly_count');
    return stored ? Number(stored) || 0 : 0;
  });
  const [isPaid, setIsPaid] = useState<boolean>(() => {
    return localStorage.getItem('pitchly_paid') === 'true';
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const canGenerate = isPaid || generationsUsed < MAX_FREE_GENERATIONS;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGenerate) {
      setShowUpgradeModal(true);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate emails');
      }

      const data: { variants: string[] } = await response.json();
      setVariants(data.variants || []);

      const nextCount = generationsUsed + 1;
      setGenerationsUsed(nextCount);
      localStorage.setItem('pitchly_count', String(nextCount));

      if (!isPaid && nextCount >= MAX_FREE_GENERATIONS) {
        setShowUpgradeModal(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Optional: could add a small toast/snackbar later
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const remaining = Math.max(0, MAX_FREE_GENERATIONS - generationsUsed);

  const handleLicenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLicenseError(null);

    const trimmed = licenseKey.trim();
    const isValid = trimmed.length === 19 && trimmed.startsWith('PTCH');

    if (!isValid) {
      setLicenseError('Invalid key, please check and try again');
      setToast({ type: 'error', message: 'Invalid key, please check and try again' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    localStorage.setItem('pitchly_paid', 'true');
    localStorage.setItem('pitchly_count', '0');
    setIsPaid(true);
    setGenerationsUsed(0);
    setShowUpgradeModal(false);
    setLicenseKey('');
    setLicenseError(null);
    setToast({ type: 'success', message: 'License activated! You now have unlimited access.' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://raw.githubusercontent.com/ghostshadow526/pitchly/main/a-minimal-modern-logo-design-featuring-a_bPdvYICiTeC70NBrNtDDgA_y9FuFC6nTWKx7j0C8NdMNQ_sd.jpeg"
              alt="Pitchly logo"
              className="h-8 w-8 rounded-lg object-cover border border-slate-800"
            />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Pitchly</h1>
              <p className="text-xs text-slate-400">
                AI cold outreach email personalizer for founders
              </p>
            </div>
          </div>
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
            {isPaid ? 'Pitchly Pro — Unlimited' : `Free · ${remaining} generations left`}
          </span>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-10 lg:py-14 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] items-start">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
                Ship thoughtful cold emails, in seconds.
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Drop in who you are, who you&apos;re reaching out to, and your goal.
                Pitchly crafts three tight, personalized emails you can ship right away.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-sky-500/10 text-sky-400 text-xs font-medium">
                  1
                </span>
                <p>
                  Tell Pitchly who you are and who you&apos;re reaching out to.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-sky-500/10 text-sky-400 text-xs font-medium">
                  2
                </span>
                <p>
                  Choose your goal and tone. Pitchly writes 3 distinct angles.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-sky-500/10 text-sky-400 text-xs font-medium">
                  3
                </span>
                <p>
                  Copy the one that feels right, tweak, and hit send.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.95)]">
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-medium text-slate-200">
                  <span>Founder name</span>
                </label>
                <input
                  name="founderName"
                  value={form.founderName}
                  onChange={handleChange}
                  required
                  placeholder="Abbas"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none ring-0 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-200">What do you build?</label>
                <input
                  name="founderRole"
                  value={form.founderRole}
                  onChange={handleChange}
                  placeholder="Founder of a SaaS tool that helps startups track investor updates."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none ring-0 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-200">Target person / company</label>
                <input
                  name="targetName"
                  value={form.targetName}
                  onChange={handleChange}
                  required
                  placeholder="Sarah, partner at SeedCraft Ventures"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none ring-0 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-200">
                  LinkedIn URL or quick context
                </label>
                <textarea
                  name="targetProfile"
                  value={form.targetProfile}
                  onChange={handleChange}
                  rows={3}
                  placeholder="LinkedIn URL or a quick line like: invests in B2B SaaS, ex-operator, big on founder updates."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none ring-0 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-200">Goal</label>
                  <select
                    name="goal"
                    value={form.goal}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none ring-0 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Partnership">Partnership</option>
                    <option value="Press Coverage">Press Coverage</option>
                    <option value="Beta Users">Beta Users</option>
                    <option value="Investor">Investor</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-200">Tone</label>
                  <select
                    name="tone"
                    value={form.tone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none ring-0 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Casual">Casual</option>
                    <option value="Professional">Professional</option>
                    <option value="Short & Direct">Short &amp; Direct</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !canGenerate}
                className="relative inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-slate-50" />
                    Generating 3 variants...
                  </span>
                ) : canGenerate ? (
                  'Generate emails'
                ) : (
                  'Free limit reached'
                )}
              </button>
            </form>
          </div>
        </section>

        <section className="border-t border-slate-800/80 bg-slate-950/60">
          <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-slate-100 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                  ✉
                </span>
                Email variants
              </h3>
              <p className="text-[11px] text-slate-500">
                Pitchly generates 3 distinct angles per run.
              </p>
            </div>

            {variants.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-6 text-center text-xs text-slate-500">
                Run your first generation to see email ideas here.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {variants.map((variant, index) => (
                <article
                  key={index}
                  className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-100 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300">
                      <span className="h-5 w-5 flex items-center justify-center rounded-md bg-slate-800 text-[10px] text-slate-100">
                        {index + 1}
                      </span>
                      Variant {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(variant)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-[11px] text-slate-200 leading-relaxed">
                    {variant}
                  </pre>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h2 className="text-xl font-semibold tracking-tight mb-2">Upgrade to Pitchly Pro 🚀</h2>
            <p className="text-sm text-slate-300 mb-4">You've used your 5 free emails</p>

            <a
              href="https://pitchly.gumroad.com/l/pitchly"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-sky-400"
            >
              Get Unlimited Access — $19
            </a>

            <p className="mb-2 text-xs text-slate-400">
              Already paid? Enter your license key below
            </p>

            <form onSubmit={handleLicenseSubmit} className="space-y-2">
              <input
                type="text"
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value)}
                placeholder="PTCH-XXXXXXXXXXXXXXX"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none ring-0 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              {licenseError && (
                <div className="text-xs text-red-300">{licenseError}</div>
              )}
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:border-sky-500 hover:bg-slate-900/80"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-500 text-emerald-950'
              : 'bg-red-500 text-red-50'
          }`}
        >
          {toast.message}
        </div>
      )}

      <footer className="border-t border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between text-[11px] text-slate-500">
          <span>Made by Abbas</span>
          <span className="text-slate-600">Pitch smarter, not louder.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
