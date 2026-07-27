import { Link, useParams } from 'react-router-dom'
import { footerLinks, staticPages } from '../data/staticPages'

export default function StaticContentPage() {
  const { pageSlug } = useParams()
  const page = staticPages[pageSlug]

  if (!page) {
    return <MissingPage />
  }

  return (
    <main className="bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">{page.badge}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{page.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{page.description}</p>
            <p className="mt-5 text-sm font-semibold text-slate-500">Last updated: {page.updated}</p>

            <div className="mt-10 space-y-10">
              {page.sections.map((section) => (
                <section key={section.heading} className="border-t border-slate-200 pt-8">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">{section.heading}</h2>
                  {section.body?.map((paragraph) => (
                    <p key={paragraph} className="mt-4 text-base leading-8 text-slate-600">{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul className="mt-5 grid gap-3 text-base leading-7 text-slate-600">
                      {section.bullets.map((item) => (
                        <li key={item} className="rounded-2xl bg-slate-50 px-4 py-3">{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </article>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Company pages</h2>
            <nav className="mt-4 grid gap-2">
              {footerLinks.map((link) => (
                <Link key={link.to} to={link.to} className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${link.to === `/${pageSlug}` ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'}`}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      </section>
    </main>
  )
}

function MissingPage() {
  return (
    <main className="bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Page not found</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">This Image Copyright Hub page is not available.</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-600">Return home or choose one of the policy and support pages from the footer.</p>
        <Link to="/" className="mt-8 inline-flex rounded-full bg-slate-950 px-6 py-3 font-bold text-white transition hover:bg-blue-600">Back to home</Link>
      </section>
    </main>
  )
}
