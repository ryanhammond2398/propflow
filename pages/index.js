import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { INITIAL_DATA, fmt, calcOwnerPayout } from '../lib/data'

const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'properties', icon: '🏠', label: 'Properties' },
  { id: 'tenants', icon: '👥', label: 'Tenants' },
  { id: 'expenses', icon: '🧾', label: 'Expenses' },
  { id: 'payouts', icon: '💸', label: 'Owner Payouts' },
  { id: '1099s', icon: '📋', label: '1099 Reports' },
  { id: 'ai', icon: '✨', label: 'AI Assistant' },
]

export default function PropFlow() {
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState(INITIAL_DATA)
  const [modal, setModal] = useState(null)
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your PropFlow AI assistant. I can help you understand your portfolio, draft owner reports, flag late payment risks, and answer any property management questions. Try asking me something or pick a suggestion below." }
  ])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [payoutModal, setPayoutModal] = useState(null)
  const [expenseForm, setExpenseForm] = useState({ propertyId: '', contractorId: '', description: '', amount: '', date: '', category: 'Maintenance' })
  const [propertyForm, setPropertyForm] = useState({ name: '', address: '', owner: '', ownerEmail: '', rent: '', status: 'occupied', tenant: '' })
  const [tenantForm, setTenantForm] = useState({ name: '', email: '', phone: '', propertyId: '', rentAmount: '', leaseEnd: '' })
  const messagesEndRef = useRef(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [aiMessages])

  const totalRent = data.properties.filter(p => p.status === 'occupied').reduce((s, p) => s + p.rent, 0)
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0)
  const totalMgmt = data.properties.filter(p => p.status === 'occupied').reduce((s, p) => s + p.rent * (data.mgmtFeePercent / 100), 0)
  const totalPayouts = data.properties.filter(p => p.status === 'occupied').reduce((s, p) => s + calcOwnerPayout(p, data.expenses, data.mgmtFeePercent).ownerPayout, 0)
  const lateCount = data.tenants.filter(t => t.paymentStatus === 'late').length
  const vacantCount = data.properties.filter(p => p.status === 'vacant').length

  const callAI = async (userMsg) => {
    const portfolioContext = `Portfolio: ${data.properties.length} properties, ${data.tenants.length} tenants. Monthly rent: ${fmt(totalRent)}. Expenses: ${fmt(totalExpenses)}. Owner payouts: ${fmt(totalPayouts)}. Late tenants: ${lateCount}. Vacant: ${vacantCount}. Management fee: ${data.mgmtFeePercent}%.`
    setAiMessages(m => [...m, { role: 'user', text: userMsg }])
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg,
          systemPrompt: `You are PropFlow AI, a smart property management assistant. You help landlords and property managers understand their portfolio, draft professional communications, identify risks, and make better decisions. Be concise, practical, and specific. Write in plain conversational text only — no markdown, no asterisks, no bullet points with dashes, no tables, no headers with pound signs. Just clear natural paragraphs. Current portfolio context: ${portfolioContext}`
        })
      })
      const json = await res.json()
      setAiMessages(m => [...m, { role: 'assistant', text: json.text || 'Sorry, something went wrong.' }])
    } catch {
      setAiMessages(m => [...m, { role: 'assistant', text: 'Connection error. Please try again.' }])
    }
    setAiLoading(false)
  }

  const sendAI = () => { if (!aiInput.trim() || aiLoading) return; callAI(aiInput); setAiInput('') }

  const addExpense = () => {
    const e = { ...expenseForm, id: Date.now(), propertyId: parseInt(expenseForm.propertyId), contractorId: parseInt(expenseForm.contractorId), amount: parseFloat(expenseForm.amount) || 0 }
    setData(d => ({ ...d, expenses: [...d.expenses, e] }))
    setModal(null)
    setExpenseForm({ propertyId: '', contractorId: '', description: '', amount: '', date: '', category: 'Maintenance' })
  }

  const addProperty = () => {
    const p = { ...propertyForm, id: Date.now(), rent: parseFloat(propertyForm.rent) || 0 }
    setData(d => ({ ...d, properties: [...d.properties, p] }))
    setModal(null)
    setPropertyForm({ name: '', address: '', owner: '', ownerEmail: '', rent: '', status: 'occupied', tenant: '' })
  }

  const addTenant = () => {
    const t = { ...tenantForm, id: Date.now(), propertyId: parseInt(tenantForm.propertyId), rentAmount: parseFloat(tenantForm.rentAmount) || 0, paymentStatus: 'paid', daysLate: 0 }
    setData(d => ({ ...d, tenants: [...d.tenants, t] }))
    setModal(null)
    setTenantForm({ name: '', email: '', phone: '', propertyId: '', rentAmount: '', leaseEnd: '' })
  }

  const markPaid = (tenantId) => {
    setData(d => ({ ...d, tenants: d.tenants.map(t => t.id === tenantId ? { ...t, paymentStatus: 'paid', daysLate: 0 } : t) }))
  }

  const downloadPDF = async (property) => {
    const { totalExpenses, mgmtFeeAmt, ownerPayout, propExpenses } = calcOwnerPayout(property, data.expenses, data.mgmtFeePercent)
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    doc.setFontSize(18); doc.setFont('helvetica', 'bold')
    doc.text('PropFlow — Owner Statement', 20, 20)
    doc.setFontSize(11); doc.setFont('helvetica', 'normal')
    doc.text(`Property: ${property.name}`, 20, 35)
    doc.text(`Owner: ${property.owner}`, 20, 42)
    doc.text(`Period: ${data.currentMonth}`, 20, 49)
    doc.line(20, 55, 190, 55)
    doc.text(`Rent Collected:`, 20, 65); doc.text(fmt(property.rent), 150, 65)
    let y = 72
    propExpenses.forEach(e => { doc.text(`  — ${e.description}:`, 20, y); doc.text(`-${fmt(e.amount)}`, 150, y); y += 7 })
    doc.text(`Management Fee (${data.mgmtFeePercent}%):`, 20, y); doc.text(`-${fmt(mgmtFeeAmt)}`, 150, y); y += 7
    doc.line(20, y, 190, y); y += 8
    doc.setFont('helvetica', 'bold')
    doc.text('Owner Payout:', 20, y); doc.text(fmt(ownerPayout), 150, y)
    doc.save(`${property.name.replace(/\s+/g, '-')}-statement-${data.currentMonth.replace(/\s+/g, '-')}.pdf`)
  }

  const contractor1099s = data.contractors.map(c => {
    const total = data.expenses.filter(e => e.contractorId === c.id).reduce((s, e) => s + e.amount, 0)
    return { ...c, ytdPaid: total }
  })

  const getProperty = (id) => data.properties.find(p => p.id === id)
  const getContractor = (id) => data.contractors.find(c => c.id === id)

  const AI_SUGGESTIONS = [
    "Which tenants are at risk of late payment?",
    "Write a June owner report for Patricia Wells",
    "How can I reduce my expenses this month?",
    "Who needs a 1099 this year?",
    "What's my net income after all payouts?",
  ]

  return (
    <>
      <Head>
        <title>PropFlow — Property Management</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="app-layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">Prop<span>Flow</span></div>
            <div className="logo-sub">Property Management</div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="nav-section-label">Menu</div>
              {NAV.map(n => (
                <button key={n.id} className={`nav-item${page === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)}>
                  <span className="nav-icon">{n.icon}</span>
                  {n.label}
                  {n.id === 'tenants' && lateCount > 0 && <span className="badge red" style={{ marginLeft: 'auto', fontSize: 10 }}>{lateCount}</span>}
                  {n.id === 'properties' && vacantCount > 0 && <span className="badge yellow" style={{ marginLeft: 'auto', fontSize: 10 }}>{vacantCount}</span>}
                </button>
              ))}
            </div>
          </nav>
          <div className="sidebar-footer">
            <div className="user-pill">
              <div className="user-avatar">RH</div>
              <div>
                <div className="user-name">Ryan Hammond</div>
                <div className="user-plan">Pro Plan</div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main-content">
          <div className="topbar">
            <div className="topbar-title">{NAV.find(n => n.id === page)?.label}</div>
            <div className="topbar-actions">
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{data.currentMonth}</span>
              {page === 'expenses' && <button className="primary sm" onClick={() => setModal('expense')}>+ Add Expense</button>}
              {page === 'properties' && <button className="primary sm" onClick={() => setModal('property')}>+ Add Property</button>}
              {page === 'tenants' && <button className="primary sm" onClick={() => setModal('tenant')}>+ Add Tenant</button>}
            </div>
          </div>

          {/* DASHBOARD */}
          {page === 'dashboard' && (
            <div className="page">
              <div className="page-header">
                <div className="page-title">Good morning, Ryan 👋</div>
                <div className="page-sub">{data.currentMonth} — here's your portfolio at a glance</div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">💰 Rent Collected</div>
                  <div className="stat-value">{fmt(totalRent)}</div>
                  <div className="stat-change up">↑ {data.properties.filter(p => p.status === 'occupied').length} occupied units</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">🧾 Total Expenses</div>
                  <div className="stat-value">{fmt(totalExpenses)}</div>
                  <div className="stat-change">{data.expenses.length} transactions</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">🏦 Mgmt Fees ({data.mgmtFeePercent}%)</div>
                  <div className="stat-value">{fmt(totalMgmt)}</div>
                  <div className="stat-change up">Your earnings</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">💸 Owner Payouts</div>
                  <div className="stat-value">{fmt(totalPayouts)}</div>
                  <div className="stat-change">Due this month</div>
                </div>
              </div>

              {/* Alerts */}
              {(lateCount > 0 || vacantCount > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem' }}>
                  {lateCount > 0 && (
                    <div style={{ background: 'var(--red-bg)', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>⚠️ {lateCount} tenant{lateCount > 1 ? 's' : ''} with late payment</span>
                      <button className="sm danger" onClick={() => setPage('tenants')}>View →</button>
                    </div>
                  )}
                  {vacantCount > 0 && (
                    <div style={{ background: 'var(--yellow-bg)', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--yellow)', fontWeight: 600 }}>🏠 {vacantCount} vacant propert{vacantCount > 1 ? 'ies' : 'y'} — losing {fmt(data.properties.filter(p => p.status === 'vacant').reduce((s, p) => s + p.rent, 0))}/mo</span>
                      <button className="sm" onClick={() => setPage('properties')}>View →</button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid-2">
                <div className="card">
                  <div className="card-header"><span className="card-title">Properties Overview</span><button className="ghost sm" onClick={() => setPage('properties')}>View all →</button></div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Property</th><th>Owner</th><th>Rent</th><th>Status</th></tr></thead>
                      <tbody>
                        {data.properties.slice(0, 4).map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.name}</strong></td>
                            <td className="text-muted">{p.owner}</td>
                            <td>{fmt(p.rent)}</td>
                            <td><span className={`badge ${p.status === 'occupied' ? 'green' : 'yellow'}`}>{p.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><span className="card-title">Recent Expenses</span><button className="ghost sm" onClick={() => setPage('expenses')}>View all →</button></div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Description</th><th>Property</th><th>Amount</th></tr></thead>
                      <tbody>
                        {data.expenses.slice(0, 4).map(e => (
                          <tr key={e.id}>
                            <td>{e.description}</td>
                            <td className="text-muted truncate" style={{ maxWidth: 100 }}>{getProperty(e.propertyId)?.name}</td>
                            <td className="text-red">−{fmt(e.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROPERTIES */}
          {page === 'properties' && (
            <div className="page">
              <div className="page-header">
                <div className="page-title">Properties</div>
                <div className="page-sub">{data.properties.length} total · {data.properties.filter(p => p.status === 'occupied').length} occupied · {vacantCount} vacant</div>
              </div>
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Property</th><th>Address</th><th>Owner</th><th>Tenant</th><th>Rent</th><th>Status</th></tr></thead>
                    <tbody>
                      {data.properties.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td className="text-muted" style={{ fontSize: 12 }}>{p.address}</td>
                          <td>{p.owner}</td>
                          <td>{p.tenant || <span className="text-muted">—</span>}</td>
                          <td>{fmt(p.rent)}</td>
                          <td><span className={`badge ${p.status === 'occupied' ? 'green' : 'yellow'}`}>{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TENANTS */}
          {page === 'tenants' && (
            <div className="page">
              <div className="page-header">
                <div className="page-title">Tenants</div>
                <div className="page-sub">{data.tenants.length} tenants · {lateCount} late</div>
              </div>
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Tenant</th><th>Property</th><th>Rent</th><th>Lease Ends</th><th>Payment</th><th></th></tr></thead>
                    <tbody>
                      {data.tenants.map(t => (
                        <tr key={t.id}>
                          <td>
                            <strong>{t.name}</strong>
                            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{t.email}</div>
                          </td>
                          <td>{getProperty(t.propertyId)?.name}</td>
                          <td>{fmt(t.rentAmount)}</td>
                          <td style={{ fontSize: 12 }}>{t.leaseEnd}</td>
                          <td>
                            {t.paymentStatus === 'paid'
                              ? <span className="badge green">✓ Paid</span>
                              : <span className="badge red">⚠ {t.daysLate} days late</span>
                            }
                          </td>
                          <td>
                            {t.paymentStatus === 'late' && (
                              <button className="sm success" onClick={() => markPaid(t.id)}>Mark Paid</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* EXPENSES */}
          {page === 'expenses' && (
            <div className="page">
              <div className="page-header">
                <div className="page-title">Expenses</div>
                <div className="page-sub">Total: {fmt(totalExpenses)} · {data.expenses.length} transactions</div>
              </div>
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Date</th><th>Description</th><th>Property</th><th>Contractor</th><th>Category</th><th>Amount</th></tr></thead>
                    <tbody>
                      {data.expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => (
                        <tr key={e.id}>
                          <td style={{ fontSize: 12 }}>{e.date}</td>
                          <td>{e.description}</td>
                          <td className="text-muted">{getProperty(e.propertyId)?.name}</td>
                          <td className="text-muted">{getContractor(e.contractorId)?.name}</td>
                          <td><span className="badge gray">{e.category}</span></td>
                          <td className="text-red font-mono">−{fmt(e.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAYOUTS */}
          {page === 'payouts' && (
            <div className="page">
              <div className="page-header">
                <div className="page-title">Owner Payouts</div>
                <div className="page-sub">Total payouts due: {fmt(totalPayouts)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.properties.filter(p => p.status === 'occupied').map(p => {
                  const { totalExpenses, mgmtFeeAmt, ownerPayout } = calcOwnerPayout(p, data.expenses, data.mgmtFeePercent)
                  return (
                    <div key={p.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Owner: {p.owner} · {p.ownerEmail}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                          Rent: {fmt(p.rent)} − Expenses: {fmt(totalExpenses)} − Fee: {fmt(mgmtFeeAmt)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>Owner payout</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{fmt(ownerPayout)}</div>
                        </div>
                        <span className="badge green">Ready</span>
                        <button className="primary sm" onClick={() => setPayoutModal(p)}>Statement</button>
                        <button className="sm" onClick={() => downloadPDF(p)}>⬇ PDF</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 1099s */}
          {page === '1099s' && (
            <div className="page">
              <div className="page-header">
                <div className="page-title">1099 Reports</div>
                <div className="page-sub">Tax year 2026 · {contractor1099s.filter(c => c.ytdPaid >= 600).length} contractors require 1099-NEC</div>
              </div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-header">
                  <span className="card-title">Contractor Payments YTD</span>
                  <button className="primary sm" onClick={() => {
                    const csv = ['Contractor,Type,YTD Paid,1099 Required', ...contractor1099s.map(c => `${c.name},${c.type},${c.ytdPaid},${c.ytdPaid >= 600 ? 'Yes' : 'No'}`)].join('\n')
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = '1099-report-2026.csv'; a.click()
                  }}>⬇ Export CSV</button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Contractor</th><th>Type</th><th>Phone</th><th>Email</th><th>YTD Paid</th><th>1099 Required</th></tr></thead>
                    <tbody>
                      {contractor1099s.map(c => (
                        <tr key={c.id}>
                          <td><strong>{c.name}</strong></td>
                          <td>{c.type}</td>
                          <td className="text-muted">{c.phone}</td>
                          <td className="text-muted">{c.email}</td>
                          <td className="font-mono">{fmt(c.ytdPaid)}</td>
                          <td>
                            {c.ytdPaid >= 600
                              ? <span className="badge red">Yes — file 1099-NEC</span>
                              : <span className="badge gray">No (under $600)</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)' }}>
                  ⚠️ 1099-NEC required for contractors paid $600+ in a calendar year. Consult your accountant for filing deadlines.
                </div>
              </div>
            </div>
          )}

          {/* AI ASSISTANT */}
          {page === 'ai' && (
            <div className="ai-panel">
              <div className="ai-suggestions">
                {AI_SUGGESTIONS.map((s, i) => (
                  <button key={i} className="ai-suggestion" onClick={() => { setAiInput(s); setTimeout(() => callAI(s), 100); setAiInput('') }}>{s}</button>
                ))}
              </div>
              <div className="ai-messages">
                {aiMessages.map((m, i) => (
                  <div key={i} className={`ai-msg ${m.role}`}>
                    <div className="ai-avatar">{m.role === 'assistant' ? '✨' : '👤'}</div>
                    <div className="ai-bubble">{m.text}</div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="ai-msg assistant">
                    <div className="ai-avatar">✨</div>
                    <div className="ai-bubble"><span className="spinner dark" /></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="ai-input-bar">
                <input className="ai-input" type="text" placeholder="Ask anything about your portfolio..." value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAI()} />
                <button className="primary" onClick={sendAI} disabled={aiLoading || !aiInput.trim()}>Send</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PAYOUT MODAL */}
      {payoutModal && (() => {
        const { totalExpenses, mgmtFeeAmt, ownerPayout, propExpenses } = calcOwnerPayout(payoutModal, data.expenses, data.mgmtFeePercent)
        return (
          <div className="modal-overlay" onClick={() => setPayoutModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Owner Statement — {payoutModal.name}</span>
                <button className="ghost sm" onClick={() => setPayoutModal(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1rem' }}>
                  {payoutModal.owner} · {payoutModal.ownerEmail} · {data.currentMonth}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span>Rent collected</span><strong>{fmt(payoutModal.rent)}</strong>
                  </div>
                  {propExpenses.map((e, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <span className="text-muted">— {e.description}</span><span className="text-red">−{fmt(e.amount)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px solid var(--border)', fontSize: 13 }}>
                    <span className="text-muted">Management fee ({data.mgmtFeePercent}%)</span><span className="text-red">−{fmt(mgmtFeeAmt)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 16, fontWeight: 800 }}>
                    <span>Owner Payout</span><span className="text-green">{fmt(ownerPayout)}</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setPayoutModal(null)}>Close</button>
                <button className="primary" onClick={() => downloadPDF(payoutModal)}>⬇ Download PDF</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ADD EXPENSE MODAL */}
      {modal === 'expense' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Add Expense</span><button className="ghost sm" onClick={() => setModal(null)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Property</label>
                <select value={expenseForm.propertyId} onChange={e => setExpenseForm(f => ({ ...f, propertyId: e.target.value }))}>
                  <option value="">Select property...</option>
                  {data.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Contractor</label>
                <select value={expenseForm.contractorId} onChange={e => setExpenseForm(f => ({ ...f, contractorId: e.target.value }))}>
                  <option value="">Select contractor...</option>
                  {data.contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Description</label>
                <input type="text" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} placeholder="What was done?" />
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Amount ($)</label>
                  <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="form-group"><label className="form-label">Date</label>
                  <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div className="form-group"><label className="form-label">Category</label>
                <select value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}>
                  {['Plumbing', 'Cleaning', 'HVAC', 'Maintenance', 'Electrical', 'Landscaping', 'Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal(null)}>Cancel</button>
              <button className="primary" onClick={addExpense}>Add Expense</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PROPERTY MODAL */}
      {modal === 'property' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Add Property</span><button className="ghost sm" onClick={() => setModal(null)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Property Name</label>
                <input type="text" value={propertyForm.name} onChange={e => setPropertyForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 123 Main Street" />
              </div>
              <div className="form-group"><label className="form-label">Full Address</label>
                <input type="text" value={propertyForm.address} onChange={e => setPropertyForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, City, NC 28012" />
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Owner Name</label>
                  <input type="text" value={propertyForm.owner} onChange={e => setPropertyForm(f => ({ ...f, owner: e.target.value }))} placeholder="John Smith" />
                </div>
                <div className="form-group"><label className="form-label">Owner Email</label>
                  <input type="email" value={propertyForm.ownerEmail} onChange={e => setPropertyForm(f => ({ ...f, ownerEmail: e.target.value }))} placeholder="john@email.com" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Monthly Rent ($)</label>
                  <input type="number" value={propertyForm.rent} onChange={e => setPropertyForm(f => ({ ...f, rent: e.target.value }))} placeholder="1500" />
                </div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select value={propertyForm.status} onChange={e => setPropertyForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="occupied">Occupied</option>
                    <option value="vacant">Vacant</option>
                  </select>
                </div>
              </div>
              {propertyForm.status === 'occupied' && (
                <div className="form-group"><label className="form-label">Tenant Name</label>
                  <input type="text" value={propertyForm.tenant} onChange={e => setPropertyForm(f => ({ ...f, tenant: e.target.value }))} placeholder="Tenant name" />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal(null)}>Cancel</button>
              <button className="primary" onClick={addProperty}>Add Property</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TENANT MODAL */}
      {modal === 'tenant' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Add Tenant</span><button className="ghost sm" onClick={() => setModal(null)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Full Name</label>
                <input type="text" value={tenantForm.name} onChange={e => setTenantForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" />
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Email</label>
                  <input type="email" value={tenantForm.email} onChange={e => setTenantForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@email.com" />
                </div>
                <div className="form-group"><label className="form-label">Phone</label>
                  <input type="text" value={tenantForm.phone} onChange={e => setTenantForm(f => ({ ...f, phone: e.target.value }))} placeholder="704-555-0000" />
                </div>
              </div>
              <div className="form-group"><label className="form-label">Property</label>
                <select value={tenantForm.propertyId} onChange={e => setTenantForm(f => ({ ...f, propertyId: e.target.value }))}>
                  <option value="">Select property...</option>
                  {data.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Monthly Rent ($)</label>
                  <input type="number" value={tenantForm.rentAmount} onChange={e => setTenantForm(f => ({ ...f, rentAmount: e.target.value }))} placeholder="1500" />
                </div>
                <div className="form-group"><label className="form-label">Lease End Date</label>
                  <input type="date" value={tenantForm.leaseEnd} onChange={e => setTenantForm(f => ({ ...f, leaseEnd: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal(null)}>Cancel</button>
              <button className="primary" onClick={addTenant}>Add Tenant</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
