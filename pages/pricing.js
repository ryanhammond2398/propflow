import Head from 'next/head'
import { useRouter } from 'next/router'

export default function Pricing() {
  const router = useRouter()
  return (
    <>
      <Head><title>Pricing — PropFlow</title></Head>
      <nav className="landing-nav">
        <div className="landing-logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">🏠</div>Prop<span>Flow</span>
        </div>
        <button className="primary" onClick={() => router.push('/app')}>Try free →</button>
      </nav>
      <div className="pricing-section" style={{ paddingTop: '4rem' }}>
        <div className="section-eyebrow">Pricing</div>
        <div className="section-title">Simple, honest pricing</div>
        <div className="section-sub">Start free. Upgrade when you're ready. No contracts, cancel anytime.</div>
        <div className="pricing-grid">
          <div className="plan">
            <div className="plan-name">Free</div>
            <div className="plan-price"><sup>$</sup>0<sub>/mo</sub></div>
            <div className="plan-desc">Try it with no commitment</div>
            <ul className="plan-features">
              <li><span className="check">✓</span> Up to 3 properties</li>
              <li><span className="check">✓</span> All 10 tools</li>
              <li><span className="check">✓</span> Owner statements</li>
              <li><span className="check">✓</span> Expense tracking</li>
              <li><span className="cross">✗</span> PDF downloads</li>
              <li><span className="cross">✗</span> Unlimited properties</li>
              <li><span className="cross">✗</span> AI Assistant</li>
              <li><span className="cross">✗</span> 1099 CSV export</li>
            </ul>
            <button style={{ width: '100%' }} onClick={() => router.push('/app')}>Get started free</button>
          </div>
          <div className="plan featured">
            <div className="plan-badge">Most popular</div>
            <div className="plan-name">Pro</div>
            <div className="plan-price"><sup>$</sup>29<sub>/mo</sub></div>
            <div className="plan-desc">For serious property managers</div>
            <ul className="plan-features">
              <li><span className="check">✓</span> Unlimited properties</li>
              <li><span className="check">✓</span> All 10 tools</li>
              <li><span className="check">✓</span> PDF downloads</li>
              <li><span className="check">✓</span> AI Assistant</li>
              <li><span className="check">✓</span> 1099 CSV export</li>
              <li><span className="check">✓</span> Rent collection tracking</li>
              <li><span className="check">✓</span> Maintenance tracker</li>
              <li><span className="check">✓</span> Priority support</li>
            </ul>
            <button className="primary" style={{ width: '100%' }} onClick={() => alert('Stripe coming soon! Email propflow@propflowapp.com to get early Pro access at $29/mo.')}>
              Upgrade to Pro →
            </button>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, marginTop: '1.5rem' }}>
          No contracts · Cancel anytime · 7-day money back guarantee · Not a licensed accounting service
        </p>
      </div>
    </>
  )
}
