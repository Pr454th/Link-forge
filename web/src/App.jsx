import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const endpoint = (path) => `${API_BASE}${path}`;

async function request(path, options) {
  const response = await fetch(endpoint(path), {
    ...options,
    headers: { ...(options?.body ? { 'Content-Type': 'application/json' } : {}), ...options?.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Something went wrong. Please try again.');
  return payload.data;
}

function normalizeLink(link) {
  return {
    ...link,
    shortUrl: link.shortUrl || `${window.location.origin}/${link.shortCode}`,
    createdAt: link.createdAt || new Date().toISOString(),
    clicks: Number(link.clicks) || 0,
  };
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'arrow') return <svg {...common}><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
  if (name === 'copy') return <svg {...common}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg>;
  if (name === 'external') return <svg {...common}><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></svg>;
  if (name === 'link') return <svg {...common}><path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7" /></svg>;
  return null;
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function App() {
  const [links, setLinks] = useState([]);
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [latest, setLatest] = useState(null);

  const loadLinks = useCallback(async () => {
    try {
      const data = await request('/api/links');
      setLinks(Array.isArray(data) ? data.map(normalizeLink) : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load your links.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  const totalClicks = useMemo(() => links.reduce((total, link) => total + link.clicks, 0), [links]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLatest(null);
    setSubmitting(true);
    try {
      const data = await request('/api/links', {
        method: 'POST',
        body: JSON.stringify({ url: url.trim(), ...(customCode.trim() ? { customCode: customCode.trim() } : {}) }),
      });
      const created = normalizeLink(data);
      setLinks((current) => [created, ...current.filter((link) => link.id !== created.id)]);
      setLatest(created);
      setUrl('');
      setCustomCode('');
    } catch (err) {
      setError(err.message || 'Could not shorten this link.');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopied(link.id);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      setError('Clipboard access is unavailable. You can select and copy the link instead.');
    }
  }

  return (
    <main className="page-shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Link Forge home">
          <span className="brand-mark"><Icon name="link" size={19} /></span>
          <span>link<span className="brand-light">forge</span></span>
        </a>
        <a className="nav-note" href="#your-links">Your links <span aria-hidden="true">↘</span></a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A little link goes a long way</div>
          <h1>Make it short.<br /><span>Make it memorable.</span></h1>
          <p className="hero-subtitle">Turn long, unwieldy URLs into clean links that are ready to go places.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-card"><span className="art-spark">✳</span><span className="art-line line-long" /><span className="art-arrow">↘</span><span className="art-line line-short" /><span className="art-dot" /></div>
          <span className="art-caption">LONG STORY<br />SHORT LINK</span>
        </div>
      </section>

      <section className="creator-card" aria-labelledby="create-title">
        <div className="card-heading">
          <div><span className="step-label">01 / CREATE</span><h2 id="create-title">Your next great link starts here</h2></div>
          <span className="card-icon"><Icon name="link" size={20} /></span>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="long-url">Paste your long URL</label>
          <div className="url-input-wrap"><span className="input-icon"><Icon name="external" size={18} /></span><input id="long-url" type="url" placeholder="https://example.com/a/very/long/link" value={url} onChange={(event) => setUrl(event.target.value)} required /></div>
          <div className="form-bottom">
            <div className="custom-field"><label className="field-label" htmlFor="custom-code">Custom ending <span>(optional)</span></label><div className="slug-input"><span>go/</span><input id="custom-code" type="text" placeholder="your-name" value={customCode} onChange={(event) => setCustomCode(event.target.value)} minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]{3,32}" title="Use 3–32 letters, numbers, hyphens, or underscores" /></div></div>
            <button className="submit-button" type="submit" disabled={submitting || !url.trim()}>{submitting ? <><span className="spinner" /> Making link</> : <>Shorten link <Icon name="arrow" size={17} /></>}</button>
          </div>
        </form>
        {error && <div className="alert" role="alert"><span aria-hidden="true">!</span>{error}<button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
        {latest && <div className="result-card" aria-live="polite"><div className="result-check">✓</div><div className="result-content"><span className="result-label">Your link is ready</span><a href={latest.shortUrl} target="_blank" rel="noreferrer">{latest.shortUrl}</a></div><button className="copy-button result-copy" type="button" onClick={() => copyLink(latest)}><Icon name="copy" size={16} />{copied === latest.id ? 'Copied!' : 'Copy'}</button></div>}
      </section>

      <section className="links-section" id="your-links" aria-labelledby="links-title">
        <div className="section-heading"><div><span className="step-label">02 / YOUR SPACE</span><h2 id="links-title">Your links, at a glance</h2></div><div className="stats"><div className="stat"><span className="stat-value">{links.length}</span><span className="stat-label">links made</span></div><span className="stat-divider" /><div className="stat"><span className="stat-value">{totalClicks}</span><span className="stat-label">total clicks</span></div></div></div>
        <div className="links-table-wrap">
          <div className="table-head"><span>LINK</span><span>CREATED</span><span>CLICKS</span><span className="actions-heading"> </span></div>
          {loading ? <div className="empty-state"><span className="loading-ring" /><p>Gathering your links…</p></div> : links.length === 0 ? <div className="empty-state"><div className="empty-icon"><Icon name="link" size={22} /></div><strong>No links yet</strong><p>Your shortened links will show up here.</p></div> : <div className="link-rows">{links.map((link) => <article className="link-row" key={link.id || link.shortCode}><div className="link-details"><a className="short-link" href={link.shortUrl} target="_blank" rel="noreferrer">{link.shortUrl}<Icon name="external" size={14} /></a><span className="original-url" title={link.originalUrl}>{link.originalUrl}</span></div><span className="created-date">{formatDate(link.createdAt)}</span><span className="click-count"><span className="click-dot" />{link.clicks.toLocaleString()}</span><button className="copy-button row-copy" type="button" onClick={() => copyLink(link)} aria-label={`Copy ${link.shortUrl}`}><Icon name="copy" size={16} /><span>{copied === link.id ? 'Copied' : 'Copy'}</span></button></article>)}</div>}
        </div>
        {!loading && links.length > 0 && <p className="list-footnote">Links stay available while the API is running <span aria-hidden="true">✳</span></p>}
      </section>

      <footer className="footer"><a className="brand footer-brand" href="#top"><span className="brand-mark"><Icon name="link" size={16} /></span><span>link<span className="brand-light">forge</span></span></a><span>Good links take you places.</span><a href="#top" className="back-top">Back to top ↑</a></footer>
    </main>
  );
}

export default App;
