import Head from 'next/head'
import { useRouter } from 'next/router'

export default function Terms() {
  const router = useRouter()
  return (
    <>
      <Head><title>Terms of Service — PropFlow</title></Head>
      <nav className="landing-nav">
        <div className="landing-logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">🏠</div>Prop<span>Flow</span>
        </div>
      </nav>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: '2rem' }}>Last updated: June 2026</p>
        {[
          ['1. Acceptance', 'By using PropFlow, you agree to these terms. If you do not agree, please do not use our service.'],
          ['2. Not Legal or Accounting Advice', 'PropFlow is a software tool for organizing property management data. It does not constitute legal, accounting, or financial advice. Always consult a licensed CPA or attorney before making financial or legal decisions. Laws and regulations vary by state and locality.'],
          ['3. User Responsibilities', 'You are responsible for the accuracy of data you enter. You must comply with all applicable laws including fair housing regulations. You may not use PropFlow for illegal purposes.'],
          ['4. Limitation of Liability', 'PropFlow is provided as-is. We are not liable for any financial losses, errors in calculations, or legal disputes arising from use of our service.'],
          ['5. Data', 'PropFlow does not permanently store the data you enter. Your data lives in your browser session. We collect email addresses only if you sign up for updates.'],
          ['6. Changes', 'We may update these terms at any time. Continued use of PropFlow constitutes acceptance of updated terms.'],
          ['7. Contact', 'Questions? Email propflow@propflowapp.com'],
        ].map(([title, body]) => (
          <div key={title} style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.8 }}>{body}</p>
          </div>
        ))}
      </div>
    </>
  )
}
