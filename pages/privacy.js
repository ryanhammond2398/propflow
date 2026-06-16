import Head from 'next/head'
import { useRouter } from 'next/router'

export default function Privacy() {
  const router = useRouter()
  return (
    <>
      <Head><title>Privacy Policy — PropFlow</title></Head>
      <nav className="landing-nav">
        <div className="landing-logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
        </div>
      </nav>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: '2rem' }}>Last updated: June 2026</p>
        {[
          ['1. What We Collect', 'We collect your email address if you sign up for updates. We collect usage analytics to improve the product. We do not collect or permanently store property data you enter into the app.'],
          ['2. How We Use It', 'Email is used only to send product updates. You can unsubscribe at any time. Analytics help us understand which features are most useful.'],
          ['3. AI Processing', 'Text you enter into the AI Assistant is sent to Anthropic\'s Claude AI to generate responses. Please do not enter sensitive personal data such as Social Security numbers or bank account details.'],
          ['4. Data Sharing', 'We do not sell your data. We share data only with service providers necessary to operate PropFlow (AI processing, hosting, analytics).'],
          ['5. Your Rights', 'You may request deletion of your email from our list at any time by emailing propflow@propflowapp.com.'],
          ['6. Contact', 'Questions about privacy? Email propflow@propflowapp.com'],
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
