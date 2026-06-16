import Head from 'next/head'
import { useRouter } from 'next/router'

const FEATURES = [
  { icon: '💸', name: 'Owner Payout Statements', desc: 'Auto-calculate what every owner gets paid after expenses and management fees. Generate PDF statements in one click.' },
  { icon: '🧾', name: 'Expense Tracking', desc: 'Log contractor payments by property. Know exactly where every dollar goes and which property is eating your margin.' },
  { icon: '📋', name: '1099 Automation', desc: 'Automatically track contractor payments and flag who needs a 1099-NEC at year end. Export to CSV for your CPA.' },
  { icon: '🔧', name: 'Maintenance Requests', desc: 'Log, assign, and track every maintenance request. Assign contractors and resolve issues with one click.' },
  { icon: '👥', name: 'Tenant Management', desc: 'Track leases, rent payments, deposits, and late payments across all your units in one place.' },
  { icon: '✨', name: 'AI Assistant', desc: 'Ask anything about your portfolio. Get owner reports written in seconds. Identify risks before they become problems.' },
]

const FAQS = [
  { q: 'Is PropFlow legal accounting software?', a: 'PropFlow is a property management tool that helps you organize and calculate payouts and expenses. It is not a licensed accounting or tax service. Always consult a CPA for tax filing and financial advice.' },
  { q: 'What states does it work in?', a: 'PropFlow works for property managers and landlords in all 50 US states. Enter your state when relevant for best results.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel your Pro subscription anytime with no questions asked. You keep access until the end of your billing period.' },
  { q: 'Is my data secure?', a: 'We do not store the data you enter into PropFlow. Your information stays in your browser session. We take privacy seriously.' },
  { q: 'How many properties can I manage?', a: 'Free plan includes up to 3 properties. Pro is unlimited — whether you have 5 or 500 properties.' },
]

export default function Landing() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>PropFlow — Property Management Accounting Made Simple</title>
        <meta name="description" content="Automate owner payouts, expense tracking, and 1099s. The AI-powered property management tool built for independent property managers." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="PropFlow — Property Management Accounting" />
        <meta property="og:description" content="Stop paying your accountant to do math. PropFlow automates owner payouts, expense tracking, and 1099s." />
      </Head>

      <div className="landing">
        {/* NAV */}
        <nav className="landing-nav">
          <div className="landing-logo">
            <div className="logo-icon">🏠</div>
            {"Prop"}<span>{"Flow"}</span>
          </div>
          <div className="landing-nav-links">
            <button className="ghost" onClick={() => router.push('/pricing')}>Pricing</button>
            <button className="primary" onClick={() => router.push('/app')}>Try free →</button>
          </div>
        </nav>

        {/* HERO */}
        <div className="hero">
          <div className="hero-eyebrow">✦ Powered by Claude AI</div>
          <h1>Property management<br />accounting <span className="gradient">without the headache</span></h1>
          <p>Automate owner payouts, track expenses, generate 1099 reports, and manage maintenance — all in one place. Built for independent property managers.</p>
          <div className="hero-btns">
            <button className="primary lg" onClick={() => router.push('/app')}>Try free — no signup →</button>
            <button className="lg" onClick={() => router.push('/pricing')}>See pricing</button>
          </div>
          <div className="hero-trust">
            <div className="trust-item"><span className="trust-check">✓</span> Owner payout PDF statements</div>
            <div className="trust-item"><span className="trust-check">✓</span> 1099 tracking & export</div>
            <div className="trust-item"><span className="trust-check">✓</span> AI-powered portfolio insights</div>
            <div className="trust-item"><span className="trust-check">✓</span> Cancel anytime</div>
          </div>
        </div>

        {/* FEATURES */}
        <div className="features">
          <div className="section-eyebrow">Features</div>
          <div className="section-title">Everything a property manager needs</div>
          <div className="section-sub">Stop juggling spreadsheets and accountants. PropFlow handles the math so you can focus on managing properties.</div>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.name} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-name">{f.name}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="how">
          <div className="section-eyebrow">How it works</div>
          <div className="section-title">Up and running in minutes</div>
          <div className="steps">
            <div className="how-step">
              <div className="step-num">1</div>
              <h3>Add your properties</h3>
              <p>Enter your properties, owners, tenants, and management fee. Takes under 5 minutes.</p>
            </div>
            <div className="how-step">
              <div className="step-num">2</div>
              <h3>Log rent & expenses</h3>
              <p>Record rent payments and contractor expenses as they happen throughout the month.</p>
            </div>
            <div className="how-step">
              <div className="step-num">3</div>
              <h3>Generate statements</h3>
              <p>One click to generate owner payout statements as PDFs. Ready to send every month.</p>
            </div>
          </div>
        </div>

        {/* PRICING */}
        <div className="pricing-section">
          <div className="section-eyebrow">Pricing</div>
          <div className="section-title">Simple, honest pricing</div>
          <div className="section-sub">Start free. Upgrade when you're ready.</div>
          <div className="pricing-grid">
            <div className="plan">
              <div className="plan-name">Free</div>
              <div className="plan-price"><sup>$</sup>0<sub>/mo</sub></div>
              <div className="plan-desc">Try it with no commitment</div>
              <ul className="plan-features">
                <li><span className="check">✓</span> Up to 3 properties</li>
                <li><span className="check">✓</span> All 10 tools</li>
                <li><span className="check">✓</span> Owner statements</li>
                <li><span className="cross">✗</span> PDF downloads</li>
                <li><span className="cross">✗</span> Unlimited properties</li>
                <li><span className="cross">✗</span> AI Assistant</li>
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
                <li><span className="check">✓</span> Priority support</li>
              </ul>
              <button className="primary" style={{ width: '100%' }} onClick={() => alert('Stripe coming soon! Email propflow@propflowapp.com to get early Pro access.')}>
                Upgrade to Pro →
              </button>
            </div>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, marginTop: '1.5rem' }}>
            No contracts · Cancel anytime · 7-day money back guarantee
          </p>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
          <div className="section-title" style={{ marginBottom: '2rem' }}>Frequently asked questions</div>
          {FAQS.map((f, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border)', padding: '1.25rem 0' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{f.q}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{f.a}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="cta-section">
          <div className="cta-box">
            <h2>Ready to simplify your<br />property accounting?</h2>
            <p>Join property managers who use PropFlow to save hours every month and eliminate spreadsheet errors.</p>
            <button className="primary lg" onClick={() => router.push('/app')}>Try PropFlow free →</button>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="landing-footer">
          <div className="footer-inner">
            <div className="footer-logo">{"Prop"}<span>{"Flow"}</span></div>
            <div className="footer-links">
              <span className="footer-link" onClick={() => router.push('/pricing')}>Pricing</span>
              <span className="footer-link" onClick={() => router.push('/terms')}>Terms</span>
              <span className="footer-link" onClick={() => router.push('/privacy')}>Privacy</span>
            </div>
            <div className="footer-copy">© 2026 PropFlow · Not a licensed accounting service</div>
          </div>
        </footer>
      </div>
    </>
  )
}
