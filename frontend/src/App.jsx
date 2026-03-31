import React, { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Send, ExternalLink, Users, Mail, Copy, Plus,
  ChevronDown, ChevronUp, BarChart3, Clock, Building2,
  Sparkles, CheckCircle2, Loader2, FileText, Briefcase,
  Globe, Search, Star, AlertTriangle, UserPlus, RotateCcw, X
} from 'lucide-react'

const API = '/api'

const style = document.createElement('style')
style.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: #f8f9fb; color: #1a1a2e; }
  .app { max-width: 1280px; margin: 0 auto; padding: 20px; }

  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
  .header h1 { font-size: 24px; font-weight: 700; }
  .header h1 span { color: #6366f1; }
  .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  .stats-bar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card { background: white; border-radius: 12px; padding: 16px; border: 1px solid #e5e7eb; }
  .stat-card .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .stat-card .value { font-size: 26px; font-weight: 700; color: #1a1a2e; }
  .stat-card .value.accent { color: #6366f1; }

  .filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
  .filter-btn { padding: 7px 14px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; cursor: pointer; font-size: 12px; color: #374151; transition: all 0.15s; }
  .filter-btn:hover { border-color: #6366f1; color: #6366f1; }
  .filter-btn.active { background: #6366f1; color: white; border-color: #6366f1; }
  .search-input { padding: 7px 12px; border-radius: 8px; border: 1px solid #e5e7eb; font-size: 12px; width: 220px; outline: none; }
  .search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

  .job-list { display: flex; flex-direction: column; gap: 10px; }
  .job-card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; transition: all 0.15s; }
  .job-card:hover { border-color: #c7d2fe; box-shadow: 0 2px 8px rgba(99,102,241,0.06); }
  .job-card-main { display: grid; grid-template-columns: 60px 1fr auto; gap: 14px; padding: 16px 18px; cursor: pointer; align-items: center; }

  .score-circle { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; color: white; }
  .score-high { background: linear-gradient(135deg, #22c55e, #16a34a); }
  .score-mid { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .score-low { background: linear-gradient(135deg, #94a3b8, #64748b); }

  .job-info h3 { font-size: 15px; font-weight: 600; margin-bottom: 3px; }
  .job-info .company { font-size: 13px; color: #6366f1; font-weight: 500; }
  .job-meta { display: flex; gap: 12px; margin-top: 5px; flex-wrap: wrap; }
  .job-meta span { font-size: 11px; color: #6b7280; display: flex; align-items: center; gap: 3px; }

  .badge { padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
  .badge-new { background: #eff6ff; color: #2563eb; }
  .badge-contacts_found { background: #f0fdf4; color: #16a34a; }
  .badge-contacted { background: #fefce8; color: #ca8a04; }
  .badge-applied { background: #f3e8ff; color: #7c3aed; }
  .badge-replied { background: #ecfdf5; color: #059669; }
  .badge-interview { background: #fef3c7; color: #d97706; }
  .badge-offer { background: #d1fae5; color: #065f46; }
  .badge-rejected { background: #fee2e2; color: #dc2626; }
  .badge-dismissed { background: #f3f4f6; color: #6b7280; }
  .badge-high { background: #d1fae5; color: #065f46; }
  .badge-medium { background: #fefce8; color: #ca8a04; }
  .badge-low { background: #fee2e2; color: #dc2626; }
  .badge-draft { background: #eff6ff; color: #2563eb; }
  .badge-sent { background: #d1fae5; color: #065f46; }

  .expanded { border-top: 1px solid #f3f4f6; padding: 18px; background: #fafbfc; }
  .score-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 14px; }
  .score-item { text-align: center; padding: 8px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; }
  .score-item .sl { font-size: 10px; color: #6b7280; }
  .score-item .sv { font-size: 18px; font-weight: 700; }
  .score-item .sm { font-size: 10px; color: #9ca3af; }

  .section { margin-top: 14px; }
  .section-title { font-size: 12px; font-weight: 600; margin-bottom: 8px; color: #374151; display: flex; align-items: center; gap: 5px; }

  .contact-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 6px; }
  .contact-row h4 { font-size: 13px; font-weight: 600; }
  .contact-row p { font-size: 11px; color: #6b7280; }

  .email-box { background: white; border-radius: 8px; border: 1px solid #e5e7eb; padding: 14px; margin-bottom: 8px; }
  .email-box .eto { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
  .email-box .esubj { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
  .email-box .ebody { font-size: 12px; color: #374151; line-height: 1.6; white-space: pre-wrap; max-height: 180px; overflow-y: auto; padding: 10px; background: #f9fafb; border-radius: 6px; }
  .email-box textarea { width: 100%; min-height: 150px; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; font-family: inherit; font-size: 12px; line-height: 1.6; resize: vertical; outline: none; }
  .email-box input { width: 100%; padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 12px; margin-bottom: 6px; outline: none; }

  .btn { padding: 7px 14px; border-radius: 7px; font-size: 12px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 5px; transition: all 0.15s; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-primary { background: #6366f1; color: white; }
  .btn-primary:hover:not(:disabled) { background: #4f46e5; }
  .btn-success { background: #22c55e; color: white; }
  .btn-success:hover:not(:disabled) { background: #16a34a; }
  .btn-outline { background: white; color: #374151; border: 1px solid #e5e7eb; }
  .btn-outline:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
  .btn-sm { padding: 5px 10px; font-size: 11px; }
  .btn-warning { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

  .actions-row { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; display: flex; align-items: center; justify-content: center; }
  .modal { background: white; border-radius: 14px; padding: 24px; width: 90%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
  .modal h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
  .modal label { font-size: 12px; font-weight: 500; color: #374151; display: block; margin-bottom: 4px; margin-top: 12px; }
  .modal input, .modal textarea { width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; outline: none; font-family: inherit; }
  .modal textarea { min-height: 80px; resize: vertical; }
  .modal input:focus, .modal textarea:focus { border-color: #6366f1; }
  .modal-actions { display: flex; gap: 8px; margin-top: 18px; justify-content: flex-end; }
  .modal select { width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; }

  .desc-preview { font-size: 12px; color: #6b7280; line-height: 1.5; max-height: 100px; overflow-y: auto; padding: 10px; background: #f9fafb; border-radius: 6px; margin-bottom: 12px; }

  .toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 18px; border-radius: 10px; background: #1a1a2e; color: white; font-size: 13px; z-index: 200; animation: slideUp 0.3s ease; display: flex; align-items: center; gap: 6px; max-width: 400px; }
  .toast-error { background: #dc2626; }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } }

  .loading { display: flex; align-items: center; justify-content: center; padding: 60px; color: #6b7280; gap: 8px; }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .empty { text-align: center; padding: 80px 20px; color: #9ca3af; }
  .empty h3 { font-size: 16px; color: #6b7280; margin-bottom: 6px; }
  .pagination { display: flex; justify-content: center; gap: 8px; margin-top: 16px; }

  @media (max-width: 768px) {
    .stats-bar { grid-template-columns: repeat(3, 1fr); }
    .score-grid { grid-template-columns: repeat(3, 1fr); }
    .job-card-main { grid-template-columns: 48px 1fr; }
  }
`
document.head.appendChild(style)

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

const scoreClass = s => s >= 60 ? 'score-high' : s >= 35 ? 'score-mid' : 'score-low'

// ─── Toast ───
function Toast({ message, isError, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, isError ? 6000 : 3000); return () => clearTimeout(t) }, [])
  return <div className={`toast ${isError ? 'toast-error' : ''}`}><CheckCircle2 size={14} /> {message}</div>
}

// ─── Add Job Modal ───
function AddJobModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ title: '', company: '', url: '', description: '', location: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = async () => {
    if (!form.title || !form.company) return
    setSaving(true)
    try {
      await onAdd(form)
      onClose()
    } catch { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Add Job Manually</h2>
        <label>Job Title *</label>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Entrepreneur in Residence" />
        <label>Company *</label>
        <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. Leena AI" />
        <label>Location</label>
        <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. India, Remote" />
        <label>Job URL</label>
        <input value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..." />
        <label>Description (paste the job description)</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Paste job description here for better scoring..." />
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving || !form.title || !form.company}>
            {saving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Add & Score
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Contact Modal ───
function AddContactModal({ jobId, company, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', email: '', title: '', contact_type: 'hiring_manager' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = async () => {
    if (!form.name || !form.email) return
    setSaving(true)
    try {
      await onAdd(jobId, form)
      onClose()
    } catch { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Add Contact at {company}</h2>
        <label>Name *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Adit Jain" />
        <label>Email *</label>
        <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. adit@leena.ai" />
        <label>Title</label>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. CEO & Co-founder" />
        <label>Contact Type</label>
        <select value={form.contact_type} onChange={e => set('contact_type', e.target.value)}>
          <option value="hiring_manager">Senior Leader</option>
          <option value="hr">HR / Recruiting</option>
        </select>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving || !form.name || !form.email}>
            {saving ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />} Add Contact
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Email Card ───
function EmailCard({ email, onSend, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [subject, setSubject] = useState(email.subject)
  const [body, setBody] = useState(email.body)

  const handleSave = async () => { await onEdit(email.id, subject, body); setEditing(false) }

  const handleSend = () => {
    // Build mailto URL and open it
    const mailto = `mailto:${encodeURIComponent(email.to_email)}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`
    window.open(mailto, '_blank')
    // Also copy body to clipboard as backup
    navigator.clipboard.writeText(email.body).catch(() => {})
    onSend(email.id)
  }

  return (
    <div className="email-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="eto">To: {email.to_name} ({email.to_email}) · {email.email_type === 'hr' ? 'HR' : 'Leader'}</span>
        <span className={`badge badge-${email.status}`}>{email.status}</span>
      </div>
      {editing ? (
        <>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />
          <textarea value={body} onChange={e => setBody(e.target.value)} />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>Save</button>
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <div className="esubj">{email.subject}</div>
          <div className="ebody">{email.body}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {email.status === 'draft' && (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><FileText size={12} /> Edit</button>
                <button className="btn btn-success btn-sm" onClick={handleSend}><Send size={12} /> Send (opens email client)</button>
              </>
            )}
            <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard.writeText(email.body); }}><Copy size={12} /> Copy</button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Job Card ───
function JobCard({ job, onStatusChange, onToast, onAddContact }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState({})
  const [contacts, setContacts] = useState(job.contacts || [])
  const [emails, setEmails] = useState(job.emails || [])
  const [notes, setNotes] = useState(job.notes || '')
  const [apolloUrl, setApolloUrl] = useState(null)
  const [linkedinUrl, setLinkedinUrl] = useState(null)
  const [suggestions, setSuggestions] = useState([])

  const setL = (k, v) => setLoading(prev => ({ ...prev, [k]: v }))

  const suggestContacts = async () => {
    setL('contacts', true)
    try {
      const res = await api(`/jobs/${job.id}/contacts/suggest`, { method: 'POST' })
      setSuggestions(res.suggestions || [])
      setApolloUrl(res.apollo_url || null)
      setLinkedinUrl(res.linkedin_url || null)
      onToast(res.message || 'Search links ready — find contacts on Apollo or LinkedIn')
    } catch (e) {
      onToast(`Failed: ${e.message}`, true)
      setApolloUrl(`https://app.apollo.io/#/people?organizationName=${encodeURIComponent(job.company)}`)
      setLinkedinUrl(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(job.company)}`)
    }
    setL('contacts', false)
  }

  const draftEmails = async () => {
    setL('emails', true)
    try {
      const res = await api(`/jobs/${job.id}/emails/draft`, { method: 'POST' })
      setEmails(res.emails || [])
      onToast(`Drafted ${res.emails?.length || 0} emails`)
    } catch (e) { onToast(`Draft failed: ${e.message}`, true) }
    setL('emails', false)
  }

  const sendEmail = async (emailId) => {
    try {
      await api(`/emails/${emailId}/send`, { method: 'POST' })
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, status: 'sent' } : e))
      onToast('Email client opened + marked as sent')
    } catch (e) { onToast('Failed to update status', true) }
  }

  const editEmail = async (emailId, subject, body) => {
    try {
      await api(`/emails/${emailId}`, { method: 'PUT', body: JSON.stringify({ subject, body }) })
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, subject, body } : e))
    } catch (e) { onToast('Edit failed', true) }
  }

  const rescore = async () => {
    setL('rescore', true)
    try {
      const res = await api(`/jobs/${job.id}/rescore`, { method: 'POST' })
      onToast(`Re-scored: ${res.scores?.total_score}/100`)
      window.location.reload()
    } catch (e) { onToast('Re-score failed', true) }
    setL('rescore', false)
  }

  const applyBlurb = async () => {
    setL('apply', true)
    try {
      const res = await api(`/jobs/${job.id}/apply-blurb`, { method: 'POST' })
      await navigator.clipboard.writeText(res.blurb)
      if (res.apply_url) window.open(res.apply_url, '_blank')
      onToast('Application blurb copied! Mark as Applied when you submit.')
    } catch (e) { onToast('Failed', true) }
    setL('apply', false)
  }

  const saveNotes = async () => {
    try {
      await api(`/jobs/${job.id}/status`, { method: 'PUT', body: JSON.stringify({ status: job.status, notes }) })
      onToast('Notes saved')
    } catch {}
  }

  const contactsWithEmail = contacts.filter(c => c.email)

  return (
    <div className="job-card">
      <div className="job-card-main" onClick={() => setExpanded(!expanded)}>
        <div className={`score-circle ${scoreClass(job.total_score)}`}>
          {job.total_score?.toFixed?.(0) ?? '—'}
        </div>
        <div className="job-info">
          <h3>{job.title}</h3>
          <div className="company">{job.company}</div>
          <div className="job-meta">
            <span><Globe size={11} /> {job.location || 'Not specified'}</span>
            <span><Clock size={11} /> {job.date_posted || 'Unknown'}</span>
            <span><Building2 size={11} /> {job.source}</span>
            {job.is_remote ? <span><Sparkles size={11} /> Remote</span> : null}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
          <span className={`badge badge-${job.status}`}>{job.status.replace(/_/g, ' ')}</span>
          {expanded ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
        </div>
      </div>

      {expanded && (
        <div className="expanded">
          {/* Score Breakdown */}
          <div className="score-grid">
            {[
              { l: 'Title Fit', v: job.title_fit_score, m: 30 },
              { l: 'Scope', v: job.scope_score, m: 25 },
              { l: 'Recency', v: job.recency_score, m: 20 },
              { l: 'Domain', v: job.domain_match_score, m: 15 },
              { l: 'Stage', v: job.company_stage_score, m: 10 },
            ].map(i => (
              <div className="score-item" key={i.l}>
                <div className="sl">{i.l}</div>
                <div className="sv">{i.v?.toFixed?.(1) ?? '—'}</div>
                <div className="sm">/ {i.m}</div>
              </div>
            ))}
          </div>

          {job.score_reasoning && <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 12, lineHeight: 1.4 }}>{job.score_reasoning}</p>}

          {/* Description Preview */}
          {job.description && (
            <div className="desc-preview">{job.description.slice(0, 500)}{job.description.length > 500 ? '...' : ''}</div>
          )}

          {/* Actions */}
          <div className="actions-row">
            <button className="btn btn-primary btn-sm" onClick={suggestContacts} disabled={loading.contacts}>
              {loading.contacts ? <Loader2 size={12} className="spin" /> : <Search size={12} />} Find Contacts (AI)
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => onAddContact(job.id, job.company)}>
              <UserPlus size={12} /> Add Contact
            </button>
            <button className="btn btn-primary btn-sm" onClick={draftEmails} disabled={loading.emails || contactsWithEmail.length === 0}
              title={contactsWithEmail.length === 0 ? 'Add contacts with email first' : ''}>
              {loading.emails ? <Loader2 size={12} className="spin" /> : <Mail size={12} />}
              {emails.length > 0 ? 'Re-draft Emails' : 'Draft Emails'}
            </button>
            <button className="btn btn-success btn-sm" onClick={applyBlurb} disabled={loading.apply}>
              {loading.apply ? <Loader2 size={12} className="spin" /> : <ExternalLink size={12} />} Open & Apply
            </button>
            <button className="btn btn-outline btn-sm" onClick={rescore} disabled={loading.rescore}>
              {loading.rescore ? <Loader2 size={12} className="spin" /> : <RotateCcw size={12} />} Re-score
            </button>
            <select value={job.status} onChange={e => onStatusChange(job.id, e.target.value)}
              style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 11 }}>
              {['new','contacts_found','contacted','applied','replied','interview','offer','rejected','dismissed']
                .map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </div>

          {/* Contact Search Panel (shows after clicking Find Contacts) */}
          {(apolloUrl || suggestions.length > 0) && contacts.length === 0 && (
            <div style={{ padding: '14px', background: '#fffbeb', borderRadius: 8, marginBottom: 12, border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#92400e' }}>
                Find contacts for {job.company}:
              </div>
              {suggestions.length > 0 && (
                <div style={{ fontSize: 11, color: '#78716c', marginBottom: 8 }}>
                  AI suggests searching for: {suggestions.map((s, i) => (
                    <span key={i} style={{ display: 'inline-block', padding: '2px 8px', background: 'white', borderRadius: 4, margin: '2px 4px 2px 0', border: '1px solid #e5e7eb' }}>{s}</span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {apolloUrl && (
                  <a href={apolloUrl} target="_blank" rel="noreferrer" className="btn btn-warning btn-sm">
                    <Search size={12} /> Search on Apollo
                  </a>
                )}
                {linkedinUrl && (
                  <a href={linkedinUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                    <Search size={12} /> Search on LinkedIn
                  </a>
                )}
                <button className="btn btn-outline btn-sm" onClick={() => onAddContact(job.id, job.company)}>
                  <UserPlus size={12} /> Add Contact Manually
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
                Find 1 HR person + 2 senior leaders → add them above → then draft emails
              </div>
            </div>
          )}

          {/* Contacts */}
          {contacts.length > 0 && (
            <div className="section">
              <div className="section-title"><Users size={13} /> Contacts ({contacts.length})</div>
              {contacts.map(c => (
                <div className="contact-row" key={c.id || c.email}>
                  <div>
                    <h4>{c.name}</h4>
                    <p>{c.title} · {c.email || 'No email'}{c.reason ? ` · ${c.reason}` : ''}</p>
                    {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#6366f1' }}>LinkedIn →</a>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {c.confidence && <span className={`badge badge-${c.confidence}`}>{c.confidence}</span>}
                    <span className={`badge badge-${c.contact_type === 'hr' ? 'new' : 'applied'}`}>
                      {c.contact_type === 'hr' ? 'HR' : 'Leader'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Draft error hint */}
          {contacts.length > 0 && contactsWithEmail.length === 0 && (
            <p style={{ fontSize: 11, color: '#dc2626', marginTop: 8 }}>
              ⚠ Found contacts but none have verified email. Add contacts with email manually to draft outreach.
            </p>
          )}

          {/* Emails */}
          {emails.length > 0 && (
            <div className="section">
              <div className="section-title"><Mail size={13} /> Emails ({emails.length})</div>
              {emails.map(e => <EmailCard key={e.id} email={e} onSend={sendEmail} onEdit={editEmail} />)}
            </div>
          )}

          {/* Notes */}
          <div className="section">
            <div className="section-title">Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes..."
              style={{ width: '100%', minHeight: 50, padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, resize: 'vertical', outline: 'none' }} />
            <button className="btn btn-outline btn-sm" style={{ marginTop: 4 }} onClick={saveNotes}>Save Notes</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main App ───
export default function App() {
  const [jobs, setJobs] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [toast, setToast] = useState(null)
  const [toastError, setToastError] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [minScore, setMinScore] = useState(null)
  const [showAddJob, setShowAddJob] = useState(false)
  const [addContactFor, setAddContactFor] = useState(null) // { jobId, company }
  const [page, setPage] = useState(1)
  const PER_PAGE = 25

  const showToast = useCallback((msg, isError = false) => { setToast(msg); setToastError(isError) }, [])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (minScore) params.set('min_score', minScore)
      const res = await api(`/jobs${params.toString() ? '?' + params : ''}`)
      setJobs(res.jobs || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fetchStats = async () => {
    try { setStats(await api('/stats')) } catch {}
  }

  const handleScrape = async () => {
    setScraping(true)
    showToast('Scraping jobs from Google Jobs + Adzuna...')
    try {
      const res = await api('/scrape', { method: 'POST' })
      if (res.status === 'warning') {
        showToast(res.message, true)
      } else {
        showToast(`Scraped! ${res.jobs_inserted} new jobs. Now click "Score Jobs" to rank them.`)
      }
      fetchJobs(); fetchStats()
    } catch (e) { showToast('Scraping failed: ' + e.message, true) }
    setScraping(false)
  }

  const handleScore = async () => {
    setScoring(true)
    showToast('Scoring jobs with Claude AI... this may take a minute.')
    try {
      const res = await api('/score', { method: 'POST' })
      showToast(`Done! ${res.jobs_scored} scored, ${res.deal_breakers} filtered out.`)
      fetchJobs(); fetchStats()
    } catch (e) { showToast('Scoring failed: ' + e.message, true) }
    setScoring(false)
  }

  const handleAddJob = async (form) => {
    const res = await api('/jobs/manual', { method: 'POST', body: JSON.stringify(form) })
    showToast(`Added "${form.title}" — scored ${res.scores?.total_score ?? '?'}/100`)
    fetchJobs(); fetchStats()
  }

  const handleAddContact = async (jobId, form) => {
    await api(`/jobs/${jobId}/contacts/manual`, { method: 'POST', body: JSON.stringify(form) })
    showToast(`Added ${form.name} as contact`)
    fetchJobs()
  }

  const handleStatusChange = async (jobId, status) => {
    try {
      await api(`/jobs/${jobId}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j))
      fetchStats()
    } catch (e) { showToast('Failed', true) }
  }

  useEffect(() => { fetchJobs(); fetchStats() }, [statusFilter, minScore])
  useEffect(() => { setPage(1) }, [searchQuery, statusFilter, minScore])

  const filtered = jobs.filter(j => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return j.title?.toLowerCase().includes(q) || j.company?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const statuses = [null, 'new', 'contacts_found', 'contacted', 'applied', 'replied', 'interview']

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <h1><span>Job Search</span> Assistant</h1>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => setShowAddJob(true)}><Plus size={14} /> Add Job</button>
          <button className="btn btn-outline" onClick={() => window.open('/api/export/jobs.csv', '_blank')}><BarChart3 size={14} /> Export CSV</button>
          <button className="btn btn-primary" onClick={handleScrape} disabled={scraping}>
            {scraping ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
            {scraping ? 'Scraping...' : 'Scrape Jobs'}
          </button>
          <button className="btn btn-primary" onClick={handleScore} disabled={scoring}>
            {scoring ? <Loader2 size={14} className="spin" /> : <Star size={14} />}
            {scoring ? 'Scoring...' : 'Score Jobs'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card"><div className="label">Total Jobs</div><div className="value accent">{stats.total_jobs || 0}</div></div>
        <div className="stat-card"><div className="label">Contacted</div><div className="value">{stats.total_contacted || 0}</div></div>
        <div className="stat-card"><div className="label">Applied</div><div className="value">{stats.total_applied || 0}</div></div>
        <div className="stat-card"><div className="label">Emails Sent</div><div className="value">{stats.total_emails_sent || 0}</div></div>
        <div className="stat-card"><div className="label">Avg Score</div><div className="value">{(stats.avg_score || 0).toFixed(1)}</div></div>
      </div>

      {/* Filters */}
      <div className="filters">
        {statuses.map(s => (
          <button key={s ?? 'all'} className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}>
            {s ? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
        <input className="search-input" placeholder="Search title, company, location..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <select className="filter-btn" value={minScore ?? ''} onChange={e => setMinScore(e.target.value || null)}>
          <option value="">Any Score</option>
          <option value="60">60+</option>
          <option value="40">40+</option>
          <option value="20">20+</option>
        </select>
      </div>

      {/* Jobs */}
      {loading ? (
        <div className="loading"><Loader2 size={20} className="spin" /> Loading...</div>
      ) : paginated.length === 0 ? (
        <div className="empty">
          <Briefcase size={40} strokeWidth={1} />
          <h3>{jobs.length === 0 ? 'No jobs yet' : 'No jobs match filters'}</h3>
          <p>{jobs.length === 0 ? 'Click "Scrape Jobs" then "Score Jobs" to get started' : 'Try adjusting your filters'}</p>
        </div>
      ) : (
        <>
          <div className="job-list">
            {paginated.map(job => (
              <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} onToast={showToast}
                onAddContact={(jobId, company) => setAddContactFor({ jobId, company })} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} className={`filter-btn ${page === i + 1 ? 'active' : ''}`}
                  onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showAddJob && <AddJobModal onClose={() => setShowAddJob(false)} onAdd={handleAddJob} />}
      {addContactFor && (
        <AddContactModal jobId={addContactFor.jobId} company={addContactFor.company}
          onClose={() => setAddContactFor(null)} onAdd={handleAddContact} />
      )}

      {toast && <Toast message={toast} isError={toastError} onClose={() => { setToast(null); setToastError(false) }} />}
    </div>
  )
}
