import { memo } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'

export interface FooterLinkGroup {
  title: string
  links: { label: string; href: string; external?: boolean }[]
}

export interface SocialLink {
  label: string
  href: string
  icon?: ReactNode
}

export interface SiteFooterProps {
  brandName?: string
  columns?: FooterLinkGroup[]
  socials?: SocialLink[]
  copyright?: string
}

function SiteFooterComponent({
  brandName = 'Vakyapro',
  columns,
  socials,
  copyright,
}: SiteFooterProps) {
  const fallbackColumns: FooterLinkGroup[] = columns ?? [
    {
      title: 'Product',
      links: [
        { label: 'Overview', href: '/#product' },
        { label: 'How it works', href: '/#how-it-works' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
  ]

  const fallbackSocials: SocialLink[] =
    socials ??
    [
      { label: 'Twitter', href: 'https://x.com' },
      { label: 'Github', href: 'https://github.com' },
    ]

  const copyrightText =
    copyright ?? `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`

  return (
    <footer className="border-t border-slate-800/70 bg-gradient-to-b from-slate-950 via-slate-950 to-black text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="text-sm font-semibold text-slate-100">{brandName}</div>
          <p className="text-xs text-slate-400">
            Interactive prompt mentor helping teams design safer, higher-quality AI prompts.
          </p>
        </div>

        {fallbackColumns.map((group) => (
          <div key={group.title} className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {group.title}
            </div>
            <ul className="space-y-2 text-xs">
              {group.links.map((link) =>
                link.external ? (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="hover:text-slate-50"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-slate-50">
                      {link.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <div>{copyrightText}</div>
          <div className="flex flex-wrap items-center gap-3">
            {fallbackSocials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-100"
              >
                {social.icon}
                <span>{social.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export const SiteFooter = memo(SiteFooterComponent)
