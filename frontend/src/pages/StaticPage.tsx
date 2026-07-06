'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getApiBaseUrl } from '../config/apiBase'
import { useMeta } from '../hooks/useMeta'

type PageData = {
  id: number
  title: string
  slug: string
  content: string
  updated_at?: string
}

type StaticPageProps = {
  slug: string
}

const privacyPolicyFallback: PageData = {
  id: 0,
  title: 'Privacy Policy',
  slug: 'privacy-policy',
  content:
    '<h2>1. Introduction</h2><p>At VakyaPro, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or interact with our services.</p><p>Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use our services.</p><p>This policy applies to information we collect through our website (vakyapro.com), mobile applications, and other online services (collectively, the "Services").</p><h2>2. Information We Collect</h2><h3>Personal Information</h3><ul><li>Name, email address, and contact information</li><li>Account credentials and profile information</li><li>Voice recordings and audio data (when using our services)</li><li>Payment information (processed by third-party providers)</li></ul><h3>Usage Data</h3><ul><li>IP address and device information</li><li>Browser type and operating system</li><li>Pages visited and time spent on our site</li><li>Interactions with product features</li></ul><h2>3. How We Use Your Information</h2><p>We use the information we collect for various purposes, including:</p><h3>Core Service Delivery</h3><ul><li>Process and analyze inputs</li><li>Provide personalized responses</li><li>Maintain your account and preferences</li></ul><h3>Improvements</h3><ul><li>Improve our product and algorithms</li><li>Analyze usage patterns</li><li>Develop new features</li></ul><p>We will never sell your personal data to third parties for marketing purposes.</p><h2>4. Cookies and Tracking Technologies</h2><p>We use cookies and similar tracking technologies to collect and use personal information about you. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p><h3>Types of cookies we use</h3><ul><li><strong>Essential Cookies</strong> — Required for the website to function properly</li><li><strong>Analytics Cookies</strong> — Help us understand how visitors use our services</li><li><strong>Preference Cookies</strong> — Remember your settings and preferences</li></ul><h2>5. Data Sharing and Third Parties</h2><p>We may share your information with:</p><ol><li>Service providers who assist us in operating our services (under strict confidentiality agreements)</li><li>Analytics providers to understand usage trends</li><li>Legal authorities when required by law</li></ol><h2>6. Data Security</h2><p>We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.</p><p>We use industry-standard encryption, secure servers, and conduct regular security reviews.</p><h2>7. Your Rights and Choices</h2><p>Depending on your location, you may have the following rights:</p><ul><li><strong>Access</strong> — Request a copy of your data</li><li><strong>Rectification</strong> — Correct inaccurate information</li><li><strong>Deletion</strong> — Request deletion of your data</li></ul><p>To exercise these rights, please contact us via <a href="/contact-us">/contact-us</a>. We will respond within 30 days.</p><h2>8. International Data Transfers</h2><p>Your information may be transferred to and processed in countries other than your country of residence. We ensure that appropriate safeguards are in place to protect your personal information in accordance with this Privacy Policy and applicable laws.</p><h2>9. Changes to This Privacy Policy</h2><p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this policy.</p><h2>10. Contact Us</h2><p>If you have questions about this Privacy Policy, please contact us at <a href="/contact-us">/contact-us</a>.</p>',
}

const aboutUsFallback: PageData = {
  id: 0,
  title: 'About Vakyapro',
  slug: 'about-us',
  content:
    '<section data-about="hero"><h2>About Vakyapro</h2><p>Vakyapro was born from a simple observation: content creators were spending too much time on repetitive tasks that could be automated, leaving less room for creativity and strategic thinking.</p></section><section data-about="why"><h2>Why we built Vakyapro</h2><p>We saw an opportunity to bridge the gap between human creativity and AI efficiency so creators can move faster without losing their voice.</p></section><section data-about="who"><h2>Who we are</h2><p>Founded by a team of content strategists, AI researchers, and creative professionals, Vakyapro emerged as a solution to streamline the content creation process.</p></section><section data-about="solve"><h2>What we solve</h2><p>Today, we\'re solving the biggest challenge in content marketing: producing high-quality, engaging content at scale without sacrificing authenticity or creativity.</p></section><section data-about="story-left"><h2>Our story</h2><h3>From repetition to creativity</h3><p>We built workflows that automate the repetitive parts so you can focus on strategy, storytelling, and distribution.</p></section><section data-about="story-right"><h2>Our story</h2><h3>Built for creators</h3><p>Whether you\'re a social media influencer, a marketing professional, or a business owner, Vakyapro helps you create meaningful connections with your audience.</p></section>',
}

function formatDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function extractParagraphs(html: string): string[] {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const paragraphs = Array.from(doc.querySelectorAll('p'))
      .map((p) => (p.textContent ?? '').trim())
      .filter((t) => t !== '')
    if (paragraphs.length > 0) return paragraphs
    const text = (doc.body.textContent ?? '').trim()
    if (text === '') return []
    return text.split(/\n+/).map((t) => t.trim()).filter(Boolean)
  } catch {
    return []
  }
}

type AboutUsSections = {
  heroIntro: string
  why: string
  who: string
  solve: string
  storyLeft: string
  storyRight: string
}

function extractAboutUsSections(html: string): Partial<AboutUsSections> {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')

    const pickText = (selectors: string[]) => {
      for (const selector of selectors) {
        const el = doc.querySelector(selector)
        const text = (el?.textContent ?? '').trim()
        if (text !== '') return text
      }
      return ''
    }

    return {
      heroIntro: pickText(['section[data-about="hero"] p', '[data-about="hero-intro"]', 'section[data-about="hero"]']),
      why: pickText(['section[data-about="why"] p', 'section[data-about="why"]']),
      who: pickText(['section[data-about="who"] p', 'section[data-about="who"]']),
      solve: pickText(['section[data-about="solve"] p', 'section[data-about="solve"]']),
      storyLeft: pickText(['section[data-about="story-left"] p', 'section[data-about="story-left"]']),
      storyRight: pickText(['section[data-about="story-right"] p', 'section[data-about="story-right"]']),
    }
  } catch {
    return {}
  }
}

type PolicySection = {
  id: string
  title: string
  bodyHtml: string
}

function slugifyHeading(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function extractPolicySections(html: string): PolicySection[] {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const headings = Array.from(doc.body.querySelectorAll('h2'))
    if (headings.length === 0) return []

    const sections: PolicySection[] = []
    for (const h2 of headings) {
      const title = (h2.textContent ?? '').trim()
      if (title === '') continue
      const id = slugifyHeading(title)

      const parts: string[] = []
      let n = h2.nextSibling
      while (n) {
        if (n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName.toLowerCase() === 'h2') break
        if (n.nodeType === Node.ELEMENT_NODE) {
          parts.push((n as Element).outerHTML)
        } else if (n.nodeType === Node.TEXT_NODE) {
          const t = (n.textContent ?? '').trim()
          if (t !== '') parts.push(`<p>${t}</p>`)
        }
        n = n.nextSibling
      }

      sections.push({
        id: id !== '' ? id : `section-${sections.length + 1}`,
        title,
        bodyHtml: parts.join(''),
      })
    }

    return sections
  } catch {
    return []
  }
}

export default function StaticPage({ slug }: StaticPageProps) {
  const apiBaseUrl = getApiBaseUrl()
  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isAboutUs = slug === 'about-us'
  const isPrivacyPolicy = slug === 'privacy-policy'
  const isContactUs = slug === 'contact-us'
  const isTerms = slug === 'terms'
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactStatus, setContactStatus] = useState<string | null>(null)

  useMeta({
    title: page ? `VakyaPro · ${page.title}` : 'VakyaPro',
    description: isAboutUs
      ? 'Learn about Vakyapro - the interactive prompt mentor that helps you turn raw ideas into pro-level prompts.'
      : isPrivacyPolicy
      ? 'Read VakyaPro\'s Privacy Policy to understand how we collect, use, and protect your information.'
      : isContactUs
      ? 'Get in touch with VakyaPro. We\'re here to help with any questions or feedback you may have.'
      : isTerms
      ? 'Read VakyaPro\'s Terms of Service to understand your rights and responsibilities when using our service.'
      : page?.title
      ? `Read about ${page.title} on VakyaPro.`
      : 'VakyaPro - Interactive Prompt Mentor',
    ogTitle: page?.title || 'VakyaPro',
    ogDescription: isAboutUs
      ? 'Learn about Vakyapro - the interactive prompt mentor that helps you turn raw ideas into pro-level prompts.'
      : isPrivacyPolicy
      ? 'Read VakyaPro\'s Privacy Policy to understand how we collect, use, and protect your information.'
      : isContactUs
      ? 'Get in touch with VakyaPro. We\'re here to help with any questions or feedback you may have.'
      : isTerms
      ? 'Read VakyaPro\'s Terms of Service to understand your rights and responsibilities when using our service.'
      : page?.title
      ? `Read about ${page.title} on VakyaPro.`
      : 'VakyaPro - Interactive Prompt Mentor',
    twitterTitle: page?.title || 'VakyaPro',
    twitterDescription: isAboutUs
      ? 'Learn about Vakyapro - the interactive prompt mentor that helps you turn raw ideas into pro-level prompts.'
      : isPrivacyPolicy
      ? 'Read VakyaPro\'s Privacy Policy to understand how we collect, use, and protect your information.'
      : isContactUs
      ? 'Get in touch with VakyaPro. We\'re here to help with any questions or feedback you may have.'
      : isTerms
      ? 'Read VakyaPro\'s Terms of Service to understand your rights and responsibilities when using our service.'
      : page?.title
      ? `Read about ${page.title} on VakyaPro.`
      : 'VakyaPro - Interactive Prompt Mentor',
  })

  useEffect(() => {
    setLoading(true)
    setError(null)
    setPage(null)

    let cancelled = false

    const load = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/pages/${encodeURIComponent(slug)}`, { headers: { Accept: 'application/json' } })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.message || 'Page not found')
        }
        const data = (await response.json()) as PageData
        if (cancelled) return
        setPage(data)
      } catch (err) {
        if (cancelled) return
        if (isContactUs) {
          setPage({
            id: 0,
            title: 'Contact Us',
            slug: 'contact-us',
            content:
              '<p>Have questions or need help? We\'d love to hear from you.</p><p>Fill out the form and we\'ll get back to you as soon as possible.</p><ul><li>Name</li><li>Email</li><li>Subject</li><li>Message</li></ul><p>Tip: include order details or screenshots for faster support.</p><p>By submitting, you agree to be contacted about your request. We never sell your data.</p>',
          })
          setError(null)
          return
        }
        if (isPrivacyPolicy) {
          setPage(privacyPolicyFallback)
          setError(null)
          return
        }
        if (isAboutUs) {
          setPage(aboutUsFallback)
          setError(null)
          return
        }
        const message = err instanceof Error ? err.message : 'Failed to load page'
        setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, isAboutUs, isContactUs, isPrivacyPolicy, slug])

  const aboutParagraphs = page && isAboutUs ? extractParagraphs(page.content) : []
  const aboutFromSections = page && isAboutUs ? extractAboutUsSections(page.content) : null
  const about = isAboutUs
    ? {
        heroIntro: aboutFromSections?.heroIntro || aboutParagraphs[0] || '',
        why: aboutFromSections?.why || aboutParagraphs[0] || '',
        who: aboutFromSections?.who || aboutParagraphs[1] || '',
        solve: aboutFromSections?.solve || aboutParagraphs[2] || '',
        storyLeft: aboutFromSections?.storyLeft || aboutParagraphs[0] || '',
        storyRight: aboutFromSections?.storyRight || aboutParagraphs[2] || '',
      }
    : null
  const policySections = page && isPrivacyPolicy ? extractPolicySections(page.content) : []
  const policyIntro = isPrivacyPolicy ? extractParagraphs(page?.content ?? '')[0] ?? '' : ''
  const termsSections = page && isTerms ? extractPolicySections(page.content) : []
  const termsIntro = isTerms ? extractParagraphs(page?.content ?? '')[0] ?? '' : ''

  return (
    <div className="pt-24 pb-16">
      <div className={isAboutUs || isPrivacyPolicy || isContactUs || isTerms ? 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'}>
        {loading && <p className="text-gray-400">Loading…</p>}
        {error && <div className="rounded-xl border border-rose-600/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">{error}</div>}

        {page && (
          <>
            {!isAboutUs && !isPrivacyPolicy && !isContactUs && !isTerms && (
              <>
                <header className="mb-6">
                  <h1 className="text-3xl sm:text-4xl font-bold">{page.title}</h1>
                  {page.updated_at && <p className="mt-2 text-xs text-gray-500">Last updated: {formatDate(page.updated_at)}</p>}
                </header>

                <div className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-5 sm:p-7">
                  <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
                </div>
              </>
            )}

            {isAboutUs && (
              <div className="space-y-10">
                <header className="rounded-3xl border border-gray-800 bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-black/40 backdrop-blur-xl px-6 py-8 sm:px-10 sm:py-10">
                  <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-xs font-semibold text-cyan-100">
                    About
                  </div>
                  <h1 className="mt-4 text-3xl sm:text-5xl font-bold leading-tight">{page.title}</h1>
                  <p className="mt-4 max-w-3xl text-base sm:text-lg text-gray-300 leading-relaxed">
                    {about?.heroIntro || 'We help creators move faster without losing their voice.'}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/#features"
                      className="inline-flex items-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Explore features
                    </Link>
                    <Link href="/#pricing" className="inline-flex items-center rounded-xl border border-gray-800 bg-gray-900/40 px-5 py-2.5 text-sm font-semibold text-gray-100">
                      View pricing
                    </Link>
                  </div>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-6">
                    <h2 className="text-lg font-semibold">Why we built Vakyapro</h2>
                    <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                      {about?.why ||
                        'Content creators were spending too much time on repetitive work, leaving less room for creativity and strategy.'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-6">
                    <h2 className="text-lg font-semibold">Who we are</h2>
                    <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                      {about?.who || 'A team of content strategists, AI researchers, and creative professionals building practical tools for creators.'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-6">
                    <h2 className="text-lg font-semibold">What we solve</h2>
                    <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                      {about?.solve || 'Producing high-quality content at scale without sacrificing authenticity, clarity, or your unique voice.'}
                    </p>
                  </div>
                </section>

                <section className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-6 sm:p-8">
                  <h2 className="text-xl font-semibold">Our story</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-800 bg-gray-950/40 p-5">
                      <h3 className="text-sm font-semibold text-gray-200">From repetition to creativity</h3>
                      <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                        {about?.storyLeft || 'We saw a gap between human creativity and AI efficiency—and built a workflow that supports both.'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-800 bg-gray-950/40 p-5">
                      <h3 className="text-sm font-semibold text-gray-200">Built for creators</h3>
                      <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                        {about?.storyRight ||
                          'Whether you are an influencer, marketer, or business owner, Vakyapro helps you focus on meaningful connections.'}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {isContactUs && (
              <div className="space-y-8">
                <header className="rounded-3xl border border-gray-800 bg-gradient-to-b from-cyan-500/10 via-indigo-500/5 to-black/40 backdrop-blur-xl px-6 py-8 sm:px-10 sm:py-10">
                  <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-xs font-semibold text-cyan-100">
                    Contact
                  </div>
                  <h1 className="mt-4 text-3xl sm:text-5xl font-bold leading-tight">{page.title}</h1>
                  <p className="mt-4 max-w-3xl text-base sm:text-lg text-gray-300 leading-relaxed">
                    {extractParagraphs(page.content)[0] ?? 'Have questions or need help? We\'d love to hear from you.'}
                  </p>
                </header>

                <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
                  <div className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-6 sm:p-8">
                    {contactStatus && (
                      <div className="mb-4 rounded-lg border border-emerald-600/60 bg-emerald-950/30 px-4 py-2 text-xs text-emerald-100">{contactStatus}</div>
                    )}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        setContactStatus(null)
                        ;(async () => {
                          try {
                            const response = await fetch(`${apiBaseUrl}/api/contact`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                              body: JSON.stringify({
                                name: contactName.trim(),
                                email: contactEmail.trim(),
                                subject: contactSubject.trim(),
                                message: contactMessage.trim(),
                              }),
                            })
                            if (!response.ok) {
                              const data = await response.json().catch(() => ({}))
                              throw new Error(data.message || 'Failed to send message')
                            }
                            setContactStatus('Thanks! We will get back to you soon.')
                            setContactName('')
                            setContactEmail('')
                            setContactSubject('')
                            setContactMessage('')
                          } catch (err) {
                            const message = err instanceof Error ? err.message : 'Failed to send message'
                            setContactStatus(message)
                          }
                        })()
                      }}
                      className="space-y-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-300">Name</label>
                          <input
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100"
                            placeholder="Your name"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-300">Email</label>
                          <input
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100"
                            type="email"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300">Subject</label>
                        <input
                          value={contactSubject}
                          onChange={(e) => setContactSubject(e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100"
                          placeholder="How can we help?"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300">Message</label>
                        <textarea
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          className="min-h-[160px] w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                          placeholder="Share details or screenshots for faster support"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-gray-400">
                          Tip: include order details or screenshots for faster support.
                        </p>
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-900/40 hover:from-cyan-400 hover:to-indigo-400"
                        >
                          Send message
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        By submitting, you agree to be contacted about your request. We never sell your data.
                      </p>
                    </form>
                  </div>

                  <div className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-6">
                    <h2 className="text-base font-semibold">Quick links</h2>
                    <div className="mt-3 grid gap-2">
                      <a href="/privacy-policy" className="text-sm text-gray-300 hover:text-cyan-200">
                        Privacy Policy
                      </a>
                      <a href="/terms" className="text-sm text-gray-300 hover:text-cyan-200">
                        Terms of Service
                      </a>
                      <a href="/#pricing" className="text-sm text-gray-300 hover:text-cyan-200">
                        Plans & Pricing
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isPrivacyPolicy && (
              <div className="space-y-8">
                <header className="rounded-3xl border border-gray-800 bg-gradient-to-b from-indigo-500/10 via-cyan-500/5 to-black/40 backdrop-blur-xl px-6 py-8 sm:px-10 sm:py-10">
                  <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1 text-xs font-semibold text-indigo-100">
                    Privacy Policy
                  </div>
                  <h1 className="mt-4 text-3xl sm:text-5xl font-bold leading-tight">{page.title}</h1>
                  <p className="mt-4 max-w-3xl text-base sm:text-lg text-gray-300 leading-relaxed">
                    {policyIntro !== '' ? policyIntro : 'This policy explains how we collect, use, and protect your information.'}
                  </p>
                  {page.updated_at && <p className="mt-4 text-xs text-gray-400">Last updated: {formatDate(page.updated_at)}</p>}
                </header>

                <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
                  <div className="lg:sticky lg:top-28 self-start">
                    <div className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-5">
                      <div className="text-xs font-semibold text-gray-200">On this page</div>
                      <div className="mt-3 space-y-2">
                        {(policySections.length > 0 ? policySections : [{ id: 'content', title: 'Policy', bodyHtml: '' }]).map((s) => (
                          <a key={s.id} href={`#${s.id}`} className="block text-sm text-gray-300 hover:text-cyan-200">
                            {s.title}
                          </a>
                        ))}
                      </div>
                      <div className="mt-4 h-px bg-gray-800" />
                      <div className="mt-4 text-xs text-gray-400">
                        Questions? <a className="text-cyan-300 hover:text-cyan-200" href="/contact-us">Contact us</a>.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {policySections.length > 0 ? (
                      policySections.map((s, idx) => (
                        <section key={s.id} id={s.id} className="scroll-mt-28 rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-5 sm:p-7">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-xl font-semibold">{s.title}</h2>
                            <div className="inline-flex items-center rounded-full border border-gray-800 bg-gray-900/40 px-3 py-1 text-[11px] font-semibold text-gray-300">
                              Section {idx + 1}
                            </div>
                          </div>
                          <div className="mt-4 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: s.bodyHtml }} />
                        </section>
                      ))
                    ) : (
                      <section id="content" className="scroll-mt-28 rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-5 sm:p-7">
                        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
                      </section>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isTerms && (
              <div className="space-y-8">
                <header className="rounded-3xl border border-gray-800 bg-gradient-to-b from-violet-500/10 via-blue-600/5 to-black/40 backdrop-blur-xl px-6 py-8 sm:px-10 sm:py-10">
                  <div className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1 text-xs font-semibold text-violet-100">
                    Terms of Service
                  </div>
                  <h1 className="mt-4 text-3xl sm:text-5xl font-bold leading-tight">{page.title}</h1>
                  <p className="mt-4 max-w-3xl text-base sm:text-lg text-gray-300 leading-relaxed">
                    {termsIntro !== '' ? termsIntro : 'These Terms govern your access to and use of our Service.'}
                  </p>
                  {page.updated_at && <p className="mt-4 text-xs text-gray-400">Last updated: {formatDate(page.updated_at)}</p>}
                </header>

                <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
                  <div className="lg:sticky lg:top-28 self-start">
                    <div className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-5">
                      <div className="text-xs font-semibold text-gray-200">On this page</div>
                      <div className="mt-3 space-y-2">
                        {(termsSections.length > 0 ? termsSections : [{ id: 'content', title: 'Terms', bodyHtml: '' }]).map((s) => (
                          <a key={s.id} href={`#${s.id}`} className="block text-sm text-gray-300 hover:text-cyan-200">
                            {s.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {termsSections.length > 0 ? (
                      termsSections.map((s, idx) => (
                        <section key={s.id} id={s.id} className="scroll-mt-28 rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-5 sm:p-7">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-xl font-semibold">{s.title}</h2>
                            <div className="inline-flex items-center rounded-full border border-gray-800 bg-gray-900/40 px-3 py-1 text-[11px] font-semibold text-gray-300">
                              Section {idx + 1}
                            </div>
                          </div>
                          <div className="mt-4 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: s.bodyHtml }} />
                        </section>
                      ))
                    ) : (
                      <section id="content" className="scroll-mt-28 rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-5 sm:p-7">
                        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
                      </section>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
                Home
              </Link>
              <Link href="/blog" className="text-sm text-gray-300 hover:text-cyan-200">
                Blog
              </Link>
              <Link href="/contact-us" className="text-sm text-gray-300 hover:text-cyan-200">
                Contact
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
