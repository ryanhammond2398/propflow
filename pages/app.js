import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { INITIAL_DATA, fmt, calcOwnerPayout } from '../lib/data'

const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'properties', icon: '🏠', label: 'Properties' },
  { id: 'tenants', icon: '👥', label: 'Tenants' },
  { id: 'rent', icon: '💰', label: 'Rent Collection' },
  { id: 'expenses', icon: '🧾', label: 'Expenses' },
  { id: 'maintenance', icon: '🔧', label: 'Maintenance' },
  { id: 'payouts', icon: '💸', label: 'Owner Payouts' },
  { id: '1099s', icon: '📋', label: '1099 Reports' },
  { id: 'reports', icon: '📈', label: 'Reports' },
  { id: 'ai', icon: '✨', label: 'AI Assistant' },
]

const PRIORITY_COLORS = { high: 'red', medium: 'yellow', low: 'blue' }
const STATUS_COLORS = { open: 'red', 'in-progress': 'yellow', resolved: 'green' }
const CATEGORIES = ['Plumbing', 'Cleaning', 'HVAC', 'Maintenance', 'Electrical', 'Landscaping', 'Other']
const AI_SUGGESTIONS = [
  'Write a June owner report for Patricia Wells',
  'Which tenants are at risk of late payment?',
  "What's my net income this month?",
  'Summarize open maintenance issues',
  'Who needs a 1099 this year?',
]

export default function App() {
  const router = useRouter()
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState(INITIAL_DATA)
  const [modal, setModal] = useState(null)
  const [payoutModal, setPayoutModal] = useState(null)
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your PropFlow AI assistant. I can help you understand your portfolio, write owner reports, flag risks, and answer any property management questions. Try a suggestion below or ask me anything." }
  ])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ propertyId: '', contractorId: '', description: '', amount: '', date: '', category: 'Maintenance' })
  const [propertyForm, setPropertyForm] = useState({ name: '', address: '', owner: '', ownerEmail: '', rent: '', status: 'occupied', tenant: '' })
  const [tenantForm, setTenantForm] = useState({ name: '', email: '', phone: '', propertyId: '', rentAmount: '', leaseStart: '', leaseEnd: '', depositHeld: '' })
  const [maintenanceForm, setMaintenanceForm] = useState({ propertyId: '', tenantName: '', issue: '', priority: 'medium', contractorId: '', notes: '' })
  const [rentForm, setRentForm] = useState({ tenantId: '', amount: '', datePaid: '', method: 'ACH', month: data.currentMonth })
  const messagesEndRef = useRef(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [aiMessages])

  const totalRent = data.properties.filter(p => p.status === 'occupied').reduce((s, p) => s + p.rent, 0)
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0)
  const totalMgmt = data.properties.filter(p => p.status === 'occupied').reduce((s, p) => s + p.rent * (data.mgmtFeePercent / 100), 0)
  const totalPayouts = data.properties.filter(p => p.status === 'occupied').reduce((s, p) => s + calcOwnerPayout(p, data.expenses, data.mgmtFeePercent).ownerPayout, 0)
  const lateCount = data.tenants.filter(t => t.paymentStatus === 'late').length
  const vacantCount = data.properties.filter(p => p.status === 'vacant').length
  const openMaintenance = data.maintenance.filter(m => m.status !== 'resolved').length
  const rentCollected = data.rentPayments.reduce((s, p) => s + p.amount, 0)
  const netIncome = totalRent - totalExpenses

  const getProperty = (id) => data.properties.find(p => p.id === parseInt(id))
  const getContractor = (id) => data.contractors.find(c => c.id === parseInt(id))
  const getTenant = (id) => data.tenants.find(t => t.id === parseInt(id))

  const callAI = async (userMsg) => {
    const ctx = `Portfolio: ${data.properties.length} properties, ${data.tenants.length} tenants. Monthly rent: ${fmt(totalRent)}. Expenses: ${fmt(totalExpenses)}. Owner payouts: ${fmt(totalPayouts)}. Late tenants: ${lateCount}. Vacant: ${vacantCount}. Open maintenance: ${openMaintenance}. Mgmt fee: ${data.mgmtFeePercent}%. Net income: ${fmt(netIncome)}.`
    setAiMessages(m => [...m, { role: 'user', text: userMsg }])
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg,
          systemPrompt: `You are PropFlow AI, a smart property management assistant. Be concise and practical. Write in plain conversational text only — no markdown, no asterisks, no bullet dashes, no tables, no pound signs. Just clear natural paragraphs. Portfolio context: ${ctx}`
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

  const downloadPDF = async (property) => {
    const { totalExpenses: te, mgmtFeeAmt, ownerPayout, propExpenses } = calcOwnerPayout(property, data.expenses, data.mgmtFeePercent)
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    doc.setFillColor(99, 102, 241); doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont('helvetica', 'bold')
    doc.text('PropFlow', 20, 18)
    doc.setFontSize(12); doc.setFont('helvetica', 'normal')
    doc.text('Owner Payout Statement', 20, 28)
    doc.setTextColor(0, 0, 0); doc.setFontSize(11)
    doc.text(`Property: ${property.name}`, 20, 52)
    doc.text(`Owner: ${property.owner}  |  ${property.ownerEmail}`, 20, 60)
    doc.text(`Period: ${data.currentMonth}`, 20, 68)
    doc.setDrawColor(200, 200, 200); doc.line(20, 74, 190, 74)
    let y = 84
    doc.setFont('helvetica', 'bold'); doc.text('Rent Collected', 20, y); doc.text(fmt(property.rent), 160, y, { align: 'right' }); y += 10
    doc.setFont('helvetica', 'normal')
    propExpenses.forEach(e => {
      doc.setTextColor(100, 100, 100); doc.text(`  ${e.description}`, 20, y); doc.text(`-${fmt(e.amount)}`, 160, y, { align: 'right' }); doc.setTextColor(0, 0, 0); y += 8
    })
    doc.text(`Management Fee (${data.mgmtFeePercent}%)`, 20, y); doc.setTextColor(150, 50, 50); doc.text(`-${fmt(mgmtFeeAmt)}`, 160, y, { align: 'right' }); doc.setTextColor(0, 0, 0); y += 10
    doc.setDrawColor(200, 200, 200); doc.line(20, y, 190, y); y += 10
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
    doc.text('Owner Payout', 20, y); doc.setTextColor(22, 163, 74); doc.text(fmt(ownerPayout), 160, y, { align: 'right' })
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150)
    doc.text('PropFlow is not a licensed accounting service. Consult a CPA for tax filing and financial advice.', 20, 280)
    doc.save(`${property.name.replace(/\s+/g, '-')}-${data.currentMonth.replace(/\s+/g, '-')}.pdf`)
  }

  const contractor1099s = data.contractors.map(c => ({
    ...c, ytdPaid: data.expenses.filter(e => e.contractorId === c.id).reduce((s, e) => s + e.amount, 0)
  }))

  const expenseByCategory = CATEGORIES.map(cat => ({
    cat, total: data.expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
  })).filter(c => c.total > 0)

  const addItem = (key, item) => setData(d => ({ ...d, [key]: [...d[key], { ...item, id: Date.now() }] }))

  return (
    <>
      <Head>
        <title>PropFlow — Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="app-layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">
              <div className="logo-icon" style={{ width: 28, height: 28, fontSize: 14 }}>🏠</div>
              Prop<span>Flow</span>
            </div>
            <div className="logo-sub">Property Management</div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="nav-section-label">Menu</div>
              {NAV.map(n => (
                <button key={n.id} className={`nav-item${page === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)}>
                  <span className="nav-icon">{n.icon}</span>{n.label}
                  {n.id === 'tenants' && lateCount > 0 && <span className="badge red" style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px' }}>{lateCount}</span>}
                  {n.id === 'maintenance' && openMaintenance > 0 && <span className="badge yellow" style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px' }}>{openMaintenance}</span>}
                  {n.id === 'properties' && vacantCount > 0 && <span className="badge yellow" style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px' }}>{vacantCount}</span>}
                </button>
              ))}
            </div>
          </nav>
          <div className="sidebar-footer">
            <div className="user-pill">
              <div className="user-avatar">RH</div>
              <div>
                <div className="user-name">Ryan Hammond</div>
                <div className="user-plan">✦ Pro Plan</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="main-content">
          <div className="topbar">
            <div className="topbar-title">{NAV.find(n => n.id === page)?.icon} {NAV.find(n => n.id === page)?.label}</div>
            <div className="topbar-actions">
              <span className="topbar-month">{data.currentMonth}</span>
              {page === 'expenses' && <button className="primary sm" onClick={() => setModal('expense')}>+ Add Expense</button>}
              {page === 'properties' && <button className="primary sm" onClick={() => setModal('property')}>+ Add Property</button>}
              {page === 'tenants' && <button className="primary sm" onClick={() => setModal('tenant')}>+ Add Tenant</button>}
              {page === 'maintenance' && <button className="primary sm" onClick={() => setModal('maintenance')}>+ Log Issue</button>}
              {page === 'rent' && <button className="primary sm" onClick={() => setModal('rent')}>+ Record Payment</button>}
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
                <div className="stat-card"><div className="stat-label">💰 Rent Collected</div><div className="stat-value">{fmt(rentCollected)}</div><div className="stat-change up">of {fmt(totalRent)} expected</div></div>
                <div className="stat-card"><div className="stat-label">🧾 Total Expenses</div><div className="stat-value">{fmt(totalExpenses)}</div><div className="stat-change">{data.expenses.length} transactions</div></div>
                <div className="stat-card"><div className="stat-label">📈 Net Income</div><div className="stat-value text-green">{fmt(netIncome)}</div><div className="stat-change up">after all expenses</div></div>
                <div className="stat-card"><div className="stat-label">💸 Owner Payouts</div><div className="stat-value">{fmt(totalPayouts)}</div><div className="stat-change">due this month</div></div>
              </div>
              {(lateCount > 0 || vacantCount > 0 || openMaintenance > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem' }}>
                  {lateCount > 0 && <div className="alert red"><span>⚠️ {lateCount} tenant{lateCount > 1 ? 's' : ''} with late payment</span><button className="sm danger" onClick={() => setPage('tenants')}>View →</button></div>}
                  {openMaintenance > 0 && <div className="alert yellow"><span>🔧 {openMaintenance} open maintenance request{openMaintenance > 1 ? 's' : ''}</span><button className="sm" onClick={() => setPage('maintenance')}>View →</button></div>}
                  {vacantCount > 0 && <div className="alert yellow"><span>🏠 {vacantCount} vacant unit{vacantCount > 1 ? 's' : ''} — losing {fmt(data.properties.filter(p => p.status === 'vacant').reduce((s, p) => s + p.rent, 0))}/mo</span><button className="sm" onClick={() => setPage('properties')}>View →</button></div>}
                </div>
              )}
              <div className="grid-2">
                <div className="card">
                  <div className="card-header"><span className="card-title">Properties</span><button className="ghost sm" onClick={() => setPage('properties')}>View all →</button></div>
                  <div className="table-wrap"><table><thead><tr><th>Property</th><th>Owner</th><th>Rent</th><th>Status</th></tr></thead><tbody>
                    {data.properties.map(p => <tr key={p.id}><td><strong>{p.name}</strong></td><td className="text-muted">{p.owner}</td><td>{fmt(p.rent)}</td><td><span className={`badge ${p.status === 'occupied' ? 'green' : 'yellow'}`}>{p.status}</span></td></tr>)}
                  </tbody></table></div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">Recent Expenses</span><button className="ghost sm" onClick={() => setPage('expenses')}>View all →</button></div>
                  <div className="table-wrap"><table><thead><tr><th>Description</th><th>Property</th><th>Amount</th></tr></thead><tbody>
                    {data.expenses.slice(0, 5).map(e => <tr key={e.id}><td>{e.description}</td><td className="text-muted">{getProperty(e.propertyId)?.name}</td><td className="text-red">−{fmt(e.amount)}</td></tr>)}
                  </tbody></table></div>
                </div>
              </div>
              {expenseByCategory.length > 0 && (
                <div className="card" style={{ marginTop: '1rem' }}>
                  <div className="card-header"><span className="card-title">Expense Breakdown by Category</span></div>
                  <div className="card-body">
                    {expenseByCategory.map(c => (
                      <div key={c.cat} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}><span>{c.cat}</span><span className="text-muted">{fmt(c.total)}</span></div>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.round((c.total / totalExpenses) * 100)}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROPERTIES */}
          {page === 'properties' && (
            <div className="page">
              <div className="page-header"><div className="page-title">Properties</div><div className="page-sub">{data.properties.length} total · {data.properties.filter(p => p.status === 'occupied').length} occupied · {vacantCount} vacant</div></div>
              <div className="card"><div className="table-wrap"><table>
                <thead><tr><th>Property</th><th>Address</th><th>Owner</th><th>Tenant</th><th>Rent</th><th>Status</th></tr></thead>
                <tbody>{data.properties.map(p => <tr key={p.id}><td><strong>{p.name}</strong></td><td className="text-muted" style={{ fontSize: 12 }}>{p.address}</td><td>{p.owner}</td><td>{p.tenant || <span className="text-muted">Vacant</span>}</td><td>{fmt(p.rent)}</td><td><span className={`badge ${p.status === 'occupied' ? 'green' : 'yellow'}`}>{p.status}</span></td></tr>)}</tbody>
              </table></div></div>
            </div>
          )}

          {/* TENANTS */}
          {page === 'tenants' && (
            <div className="page">
              <div className="page-header"><div className="page-title">Tenants</div><div className="page-sub">{data.tenants.length} tenants · {lateCount} late</div></div>
              <div className="card"><div className="table-wrap"><table>
                <thead><tr><th>Tenant</th><th>Property</th><th>Rent</th><th>Lease</th><th>Deposit</th><th>Payment</th><th></th></tr></thead>
                <tbody>{data.tenants.map(t => <tr key={t.id}>
                  <td><strong>{t.name}</strong><div style={{ fontSize: 11, color: 'var(--text2)' }}>{t.email} · {t.phone}</div></td>
                  <td>{getProperty(t.propertyId)?.name}</td>
                  <td>{fmt(t.rentAmount)}</td>
                  <td style={{ fontSize: 12 }}>{t.leaseStart} → {t.leaseEnd}</td>
                  <td>{fmt(t.depositHeld)}</td>
                  <td>{t.paymentStatus === 'paid' ? <span className="badge green">✓ Paid</span> : <span className="badge red">⚠ {t.daysLate}d late</span>}</td>
                  <td>{t.paymentStatus === 'late' && <button className="sm success" onClick={() => setData(d => ({ ...d, tenants: d.tenants.map(x => x.id === t.id ? { ...x, paymentStatus: 'paid', daysLate: 0 } : x) }))}>Mark Paid</button>}</td>
                </tr>)}</tbody>
              </table></div></div>
            </div>
          )}

          {/* RENT */}
          {page === 'rent' && (
            <div className="page">
              <div className="page-header"><div className="page-title">Rent Collection</div><div className="page-sub">{data.currentMonth} · {fmt(rentCollected)} collected of {fmt(totalRent)} expected</div></div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="progress-bar" style={{ height: 10, borderRadius: 5, marginBottom: 8 }}><div className="progress-fill" style={{ width: `${Math.min((rentCollected / totalRent) * 100, 100)}%` }} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}><span>{fmt(rentCollected)} collected</span><span>{fmt(totalRent - rentCollected)} outstanding</span></div>
              </div>
              <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card"><div className="stat-label">Collected</div><div className="stat-value text-green">{fmt(rentCollected)}</div></div>
                <div className="stat-card"><div className="stat-label">Outstanding</div><div className="stat-value text-red">{fmt(totalRent - rentCollected)}</div></div>
              </div>
              <div className="card"><div className="table-wrap"><table>
                <thead><tr><th>Tenant</th><th>Property</th><th>Expected</th><th>Date Paid</th><th>Method</th><th>Status</th></tr></thead>
                <tbody>{data.tenants.map(t => {
                  const payment = data.rentPayments.find(p => p.tenantId === t.id && p.month === data.currentMonth)
                  return <tr key={t.id}><td><strong>{t.name}</strong></td><td>{getProperty(t.propertyId)?.name}</td><td>{fmt(t.rentAmount)}</td><td>{payment ? payment.datePaid : <span className="text-muted">—</span>}</td><td>{payment ? payment.method : <span className="text-muted">—</span>}</td><td>{payment ? <span className="badge green">✓ Paid</span> : t.paymentStatus === 'late' ? <span className="badge red">Late</span> : <span className="badge yellow">Pending</span>}</td></tr>
                })}</tbody>
              </table></div></div>
            </div>
          )}

          {/* EXPENSES */}
          {page === 'expenses' && (
            <div className="page">
              <div className="page-header"><div className="page-title">Expenses</div><div className="page-sub">Total: {fmt(totalExpenses)} · {data.expenses.length} transactions</div></div>
              <div className="card"><div className="table-wrap"><table>
                <thead><tr><th>Date</th><th>Description</th><th>Property</th><th>Contractor</th><th>Category</th><th>Amount</th></tr></thead>
                <tbody>{[...data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => <tr key={e.id}>
                  <td style={{ fontSize: 12 }}>{e.date}</td><td>{e.description}</td>
                  <td className="text-muted">{getProperty(e.propertyId)?.name}</td>
                  <td className="text-muted">{getContractor(e.contractorId)?.name}</td>
                  <td><span className="badge gray">{e.category}</span></td>
                  <td className="text-red font-mono">−{fmt(e.amount)}</td>
                </tr>)}</tbody>
              </table></div></div>
            </div>
          )}

          {/* MAINTENANCE */}
          {page === 'maintenance' && (
            <div className="page">
              <div className="page-header"><div className="page-title">Maintenance</div><div className="page-sub">{openMaintenance} open · {data.maintenance.filter(m => m.status === 'resolved').length} resolved</div></div>
              <div className="card"><div className="table-wrap"><table>
                <thead><tr><th>Issue</th><th>Property</th><th>Tenant</th><th>Priority</th><th>Status</th><th>Reported</th><th>Contractor</th><th></th></tr></thead>
                <tbody>{data.maintenance.map(m => <tr key={m.id}>
                  <td><strong>{m.issue}</strong>{m.notes && <div style={{ fontSize: 11, color: 'var(--text2)' }}>{m.notes}</div>}</td>
                  <td>{getProperty(m.propertyId)?.name}</td>
                  <td>{m.tenantName}</td>
                  <td><span className={`badge ${PRIORITY_COLORS[m.priority]}`}>{m.priority}</span></td>
                  <td><span className={`badge ${STATUS_COLORS[m.status]}`}>{m.status}</span></td>
                  <td style={{ fontSize: 12 }}>{m.dateReported}</td>
                  <td className="text-muted">{getContractor(m.contractorId)?.name || '—'}</td>
                  <td>{m.status !== 'resolved' && <button className="sm success" onClick={() => setData(d => ({ ...d, maintenance: d.maintenance.map(x => x.id === m.id ? { ...x, status: 'resolved', dateResolved: new Date().toISOString().split('T')[0] } : x) }))}>Resolve</button>}</td>
                </tr>)}</tbody>
              </table></div></div>
            </div>
          )}

          {/* PAYOUTS */}
          {page === 'payouts' && (
            <div className="page">
              <div className="page-header"><div className="page-title">Owner Payouts</div><div className="page-sub">Total due: {fmt(totalPayouts)}</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.properties.filter(p => p.status === 'occupied').map(p => {
                  const { totalExpenses: te, mgmtFeeAmt, ownerPayout } = calcOwnerPayout(p, data.expenses, data.mgmtFeePercent)
                  return <div key={p.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{p.owner} · {p.ownerEmail}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Rent {fmt(p.rent)} − Expenses {fmt(te)} − Fee {fmt(mgmtFeeAmt)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, color: 'var(--text2)' }}>Owner payout</div><div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{fmt(ownerPayout)}</div></div>
                      <span className="badge green">Ready</span>
                      <button className="primary sm" onClick={() => setPayoutModal(p)}>Statement</button>
                      <button className="sm" onClick={() => downloadPDF(p)}>⬇ PDF</button>
                    </div>
                  </div>
                })}
              </div>
            </div>
          )}

          {/* 1099s */}
          {page === '1099s' && (
            <div className="page">
              <div className="page-header"><div className="page-title">1099 Reports</div><div className="page-sub">Tax year 2026 · {contractor1099s.filter(c => c.ytdPaid >= 600).length} contractors require 1099-NEC</div></div>
              <div className="card">
                <div className="card-header"><span className="card-title">Contractor Payments YTD</span>
                  <button className="primary sm" onClick={() => {
                    const csv = ['Contractor,Type,Phone,Email,YTD Paid,1099 Required', ...contractor1099s.map(c => `${c.name},${c.type},${c.phone},${c.email},${c.ytdPaid},${c.ytdPaid >= 600 ? 'Yes' : 'No'}`)].join('\n')
                    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = '1099-2026.csv'; a.click()
                  }}>⬇ Export CSV</button>
                </div>
                <div className="table-wrap"><table>
                  <thead><tr><th>Contractor</th><th>Type</th><th>Phone</th><th>Email</th><th>YTD Paid</th><th>1099 Required</th></tr></thead>
                  <tbody>{contractor1099s.map(c => <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.type}</td><td className="text-muted">{c.phone}</td><td className="text-muted">{c.email}</td><td className="font-mono">{fmt(c.ytdPaid)}</td><td><span className={`badge ${c.ytdPaid >= 600 ? 'red' : 'gray'}`}>{c.ytdPaid >= 600 ? 'Yes — file 1099-NEC' : 'No (under $600)'}</span></td></tr>)}</tbody>
                </table></div>
                <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)' }}>⚠️ 1099-NEC required for contractors paid $600+ per year. Consult your CPA for filing deadlines.</div>
              </div>
            </div>
          )}

          {/* REPORTS */}
          {page === 'reports' && (
            <div className="page">
              <div className="page-header"><div className="page-title">Reports</div><div className="page-sub">{data.currentMonth} financial summary</div></div>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-label">Gross Rent</div><div className="stat-value">{fmt(totalRent)}</div></div>
                <div className="stat-card"><div className="stat-label">Total Expenses</div><div className="stat-value text-red">{fmt(totalExpenses)}</div></div>
                <div className="stat-card"><div className="stat-label">Mgmt Fees Earned</div><div className="stat-value text-green">{fmt(totalMgmt)}</div></div>
                <div className="stat-card"><div className="stat-label">Net to Owners</div><div className="stat-value">{fmt(totalPayouts)}</div></div>
              </div>
              <div className="grid-2">
                <div className="card">
                  <div className="card-header"><span className="card-title">Profit & Loss</span></div>
                  <div className="card-body">
                    {[
                      { label: 'Gross Rent Collected', val: totalRent, color: 'var(--green)', bold: false },
                      { label: 'Total Expenses', val: -totalExpenses, color: 'var(--red)', bold: false },
                      { label: 'Net Operating Income', val: netIncome, color: netIncome > 0 ? 'var(--green)' : 'var(--red)', bold: true },
                      { label: 'Management Fees (your income)', val: totalMgmt, color: 'var(--green)', bold: true },
                      { label: 'Owner Payouts', val: -totalPayouts, color: 'var(--red)', bold: false },
                    ].map((r, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: r.bold ? 14 : 13, fontWeight: r.bold ? 700 : 400 }}>
                      <span>{r.label}</span>
                      <span style={{ color: r.color }}>{r.val < 0 ? `−${fmt(Math.abs(r.val))}` : fmt(r.val)}</span>
                    </div>)}
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">Portfolio Summary</span></div>
                  <div className="card-body">
                    {[
                      { label: 'Total Properties', val: data.properties.length },
                      { label: 'Occupied', val: data.properties.filter(p => p.status === 'occupied').length },
                      { label: 'Vacant', val: vacantCount },
                      { label: 'Total Tenants', val: data.tenants.length },
                      { label: 'Late Payments', val: lateCount },
                      { label: 'Open Maintenance', val: openMaintenance },
                      { label: 'Deposits Held', val: null, formatted: fmt(data.tenants.reduce((s, t) => s + (t.depositHeld || 0), 0)) },
                    ].map((r, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <span className="text-muted">{r.label}</span>
                      <strong>{r.formatted || r.val}</strong>
                    </div>)}
                  </div>
                </div>
              </div>
              <div className="card" style={{ marginTop: '1rem' }}>
                <div className="card-header">
                  <span className="card-title">Owner Payout Summary</span>
                  <button className="primary sm" onClick={() => {
                    const csv = ['Property,Owner,Rent,Expenses,Mgmt Fee,Owner Payout', ...data.properties.filter(p => p.status === 'occupied').map(p => { const { totalExpenses: te, mgmtFeeAmt, ownerPayout } = calcOwnerPayout(p, data.expenses, data.mgmtFeePercent); return `${p.name},${p.owner},${p.rent},${te},${mgmtFeeAmt.toFixed(2)},${ownerPayout.toFixed(2)}` })].join('\n')
                    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `payouts-${data.currentMonth.replace(/\s+/g, '-')}.csv`; a.click()
                  }}>⬇ Export CSV</button>
                </div>
                <div className="table-wrap"><table>
                  <thead><tr><th>Property</th><th>Owner</th><th>Rent</th><th>Expenses</th><th>Mgmt Fee</th><th>Owner Payout</th></tr></thead>
                  <tbody>{data.properties.filter(p => p.status === 'occupied').map(p => {
                    const { totalExpenses: te, mgmtFeeAmt, ownerPayout } = calcOwnerPayout(p, data.expenses, data.mgmtFeePercent)
                    return <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.owner}</td><td>{fmt(p.rent)}</td><td className="text-red">−{fmt(te)}</td><td className="text-red">−{fmt(mgmtFeeAmt)}</td><td className="text-green"><strong>{fmt(ownerPayout)}</strong></td></tr>
                  })}</tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* AI */}
          {page === 'ai' && (
            <div className="ai-panel">
              <div className="ai-suggestions">
                {AI_SUGGESTIONS.map((s, i) => <button key={i} className="ai-suggestion" onClick={() => callAI(s)}>{s}</button>)}
              </div>
              <div className="ai-messages">
                {aiMessages.map((m, i) => <div key={i} className={`ai-msg ${m.role}`}><div className="ai-avatar">{m.role === 'assistant' ? '✨' : '👤'}</div><div className="ai-bubble">{m.text}</div></div>)}
                {aiLoading && <div className="ai-msg assistant"><div className="ai-avatar">✨</div><div className="ai-bubble" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="spinner dark" /> Thinking...</div></div>}
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
        const { totalExpenses: te, mgmtFeeAmt, ownerPayout, propExpenses } = calcOwnerPayout(payoutModal, data.expenses, data.mgmtFeePercent)
        return <div className="modal-overlay" onClick={() => setPayoutModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><span className="modal-title">Owner Statement — {payoutModal.name}</span><button className="ghost sm" onClick={() => setPayoutModal(null)}>✕</button></div>
          <div className="modal-body">
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1.25rem' }}>{payoutModal.owner} · {payoutModal.ownerEmail} · {data.currentMonth}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}><span>Rent collected</span><strong>{fmt(payoutModal.rent)}</strong></div>
            {propExpenses.map((e, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}><span className="text-muted">— {e.description}</span><span className="text-red">−{fmt(e.amount)}</span></div>)}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '2px solid var(--border2)', fontSize: 13 }}><span className="text-muted">Management fee ({data.mgmtFeePercent}%)</span><span className="text-red">−{fmt(mgmtFeeAmt)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', fontSize: 17, fontWeight: 800 }}><span>Owner Payout</span><span className="text-green">{fmt(ownerPayout)}</span></div>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>PropFlow is not a licensed accounting service. Consult a CPA for tax filing.</p>
          </div>
          <div className="modal-footer"><button onClick={() => setPayoutModal(null)}>Close</button><button className="primary" onClick={() => downloadPDF(payoutModal)}>⬇ Download PDF</button></div>
        </div></div>
      })()}

      {/* EXPENSE MODAL */}
      {modal === 'expense' && <div className="modal-overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Add Expense</span><button className="ghost sm" onClick={() => setModal(null)}>✕</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Property</label><select value={expenseForm.propertyId} onChange={e => setExpenseForm(f => ({ ...f, propertyId: e.target.value }))}><option value="">Select...</option>{data.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Contractor</label><select value={expenseForm.contractorId} onChange={e => setExpenseForm(f => ({ ...f, contractorId: e.target.value }))}><option value="">Select...</option>{data.contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Description</label><input type="text" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} placeholder="What was done?" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Amount ($)</label><input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
            <div className="form-group"><label className="form-label">Date</label><input type="date" value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Category</label><select value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="modal-footer">
          <button onClick={() => setModal(null)}>Cancel</button>
          <button className="primary" onClick={() => { addItem('expenses', { ...expenseForm, propertyId: parseInt(expenseForm.propertyId), contractorId: parseInt(expenseForm.contractorId), amount: parseFloat(expenseForm.amount) || 0 }); setModal(null); setExpenseForm({ propertyId: '', contractorId: '', description: '', amount: '', date: '', category: 'Maintenance' }) }}>Add Expense</button>
        </div>
      </div></div>}

      {/* PROPERTY MODAL */}
      {modal === 'property' && <div className="modal-overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Add Property</span><button className="ghost sm" onClick={() => setModal(null)}>✕</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Property Name</label><input type="text" value={propertyForm.name} onChange={e => setPropertyForm(f => ({ ...f, name: e.target.value }))} placeholder="123 Main Street" /></div>
          <div className="form-group"><label className="form-label">Full Address</label><input type="text" value={propertyForm.address} onChange={e => setPropertyForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, City, NC" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Owner Name</label><input type="text" value={propertyForm.owner} onChange={e => setPropertyForm(f => ({ ...f, owner: e.target.value }))} placeholder="John Smith" /></div>
            <div className="form-group"><label className="form-label">Owner Email</label><input type="email" value={propertyForm.ownerEmail} onChange={e => setPropertyForm(f => ({ ...f, ownerEmail: e.target.value }))} placeholder="john@email.com" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Monthly Rent ($)</label><input type="number" value={propertyForm.rent} onChange={e => setPropertyForm(f => ({ ...f, rent: e.target.value }))} placeholder="1500" /></div>
            <div className="form-group"><label className="form-label">Status</label><select value={propertyForm.status} onChange={e => setPropertyForm(f => ({ ...f, status: e.target.value }))}><option value="occupied">Occupied</option><option value="vacant">Vacant</option></select></div>
          </div>
          {propertyForm.status === 'occupied' && <div className="form-group"><label className="form-label">Tenant Name</label><input type="text" value={propertyForm.tenant} onChange={e => setPropertyForm(f => ({ ...f, tenant: e.target.value }))} placeholder="Tenant name" /></div>}
        </div>
        <div className="modal-footer">
          <button onClick={() => setModal(null)}>Cancel</button>
          <button className="primary" onClick={() => { addItem('properties', { ...propertyForm, rent: parseFloat(propertyForm.rent) || 0 }); setModal(null); setPropertyForm({ name: '', address: '', owner: '', ownerEmail: '', rent: '', status: 'occupied', tenant: '' }) }}>Add Property</button>
        </div>
      </div></div>}

      {/* TENANT MODAL */}
      {modal === 'tenant' && <div className="modal-overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Add Tenant</span><button className="ghost sm" onClick={() => setModal(null)}>✕</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Full Name</label><input type="text" value={tenantForm.name} onChange={e => setTenantForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email</label><input type="email" value={tenantForm.email} onChange={e => setTenantForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@email.com" /></div>
            <div className="form-group"><label className="form-label">Phone</label><input type="text" value={tenantForm.phone} onChange={e => setTenantForm(f => ({ ...f, phone: e.target.value }))} placeholder="704-555-0000" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Property</label><select value={tenantForm.propertyId} onChange={e => setTenantForm(f => ({ ...f, propertyId: e.target.value }))}><option value="">Select...</option>{data.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Monthly Rent ($)</label><input type="number" value={tenantForm.rentAmount} onChange={e => setTenantForm(f => ({ ...f, rentAmount: e.target.value }))} placeholder="1500" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Lease Start</label><input type="date" value={tenantForm.leaseStart} onChange={e => setTenantForm(f => ({ ...f, leaseStart: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Lease End</label><input type="date" value={tenantForm.leaseEnd} onChange={e => setTenantForm(f => ({ ...f, leaseEnd: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Security Deposit Held ($)</label><input type="number" value={tenantForm.depositHeld} onChange={e => setTenantForm(f => ({ ...f, depositHeld: e.target.value }))} placeholder="1500" /></div>
        </div>
        <div className="modal-footer">
          <button onClick={() => setModal(null)}>Cancel</button>
          <button className="primary" onClick={() => { addItem('tenants', { ...tenantForm, propertyId: parseInt(tenantForm.propertyId), rentAmount: parseFloat(tenantForm.rentAmount) || 0, depositHeld: parseFloat(tenantForm.depositHeld) || 0, paymentStatus: 'paid', daysLate: 0 }); setModal(null); setTenantForm({ name: '', email: '', phone: '', propertyId: '', rentAmount: '', leaseStart: '', leaseEnd: '', depositHeld: '' }) }}>Add Tenant</button>
        </div>
      </div></div>}

      {/* MAINTENANCE MODAL */}
      {modal === 'maintenance' && <div className="modal-overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Log Maintenance Request</span><button className="ghost sm" onClick={() => setModal(null)}>✕</button></div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Property</label><select value={maintenanceForm.propertyId} onChange={e => setMaintenanceForm(f => ({ ...f, propertyId: e.target.value }))}><option value="">Select...</option>{data.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Tenant Name</label><input type="text" value={maintenanceForm.tenantName} onChange={e => setMaintenanceForm(f => ({ ...f, tenantName: e.target.value }))} placeholder="Tenant name" /></div>
          </div>
          <div className="form-group"><label className="form-label">Issue Description</label><input type="text" value={maintenanceForm.issue} onChange={e => setMaintenanceForm(f => ({ ...f, issue: e.target.value }))} placeholder="e.g. Leaking faucet in bathroom" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Priority</label><select value={maintenanceForm.priority} onChange={e => setMaintenanceForm(f => ({ ...f, priority: e.target.value }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            <div className="form-group"><label className="form-label">Assign Contractor</label><select value={maintenanceForm.contractorId} onChange={e => setMaintenanceForm(f => ({ ...f, contractorId: e.target.value }))}><option value="">Unassigned</option>{data.contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div className="form-group"><label className="form-label">Notes</label><input type="text" value={maintenanceForm.notes} onChange={e => setMaintenanceForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes..." /></div>
        </div>
        <div className="modal-footer">
          <button onClick={() => setModal(null)}>Cancel</button>
          <button className="primary" onClick={() => { addItem('maintenance', { ...maintenanceForm, propertyId: parseInt(maintenanceForm.propertyId), contractorId: maintenanceForm.contractorId ? parseInt(maintenanceForm.contractorId) : null, status: 'open', dateReported: new Date().toISOString().split('T')[0], dateResolved: null }); setModal(null); setMaintenanceForm({ propertyId: '', tenantName: '', issue: '', priority: 'medium', contractorId: '', notes: '' }) }}>Log Issue</button>
        </div>
      </div></div>}

      {/* RENT MODAL */}
      {modal === 'rent' && <div className="modal-overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Record Rent Payment</span><button className="ghost sm" onClick={() => setModal(null)}>✕</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Tenant</label><select value={rentForm.tenantId} onChange={e => setRentForm(f => ({ ...f, tenantId: e.target.value }))}><option value="">Select...</option>{data.tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Amount ($)</label><input type="number" value={rentForm.amount} onChange={e => setRentForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
            <div className="form-group"><label className="form-label">Date Paid</label><input type="date" value={rentForm.datePaid} onChange={e => setRentForm(f => ({ ...f, datePaid: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Method</label><select value={rentForm.method} onChange={e => setRentForm(f => ({ ...f, method: e.target.value }))}><option>ACH</option><option>Check</option><option>Cash</option><option>Zelle</option><option>Venmo</option></select></div>
            <div className="form-group"><label className="form-label">Month</label><input type="text" value={rentForm.month} onChange={e => setRentForm(f => ({ ...f, month: e.target.value }))} placeholder="June 2026" /></div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={() => setModal(null)}>Cancel</button>
          <button className="primary" onClick={() => {
            const tenant = getTenant(rentForm.tenantId)
            if (!tenant) return
            setData(d => ({ ...d, rentPayments: [...d.rentPayments, { ...rentForm, id: Date.now(), tenantId: parseInt(rentForm.tenantId), propertyId: tenant.propertyId, amount: parseFloat(rentForm.amount) || 0, status: 'paid' }], tenants: d.tenants.map(t => t.id === parseInt(rentForm.tenantId) ? { ...t, paymentStatus: 'paid', daysLate: 0 } : t) }))
            setModal(null); setRentForm({ tenantId: '', amount: '', datePaid: '', method: 'ACH', month: data.currentMonth })
          }}>Record Payment</button>
        </div>
      </div></div>}
    </>
  )
}
