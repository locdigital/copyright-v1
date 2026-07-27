import { ArrowRight, BarChart3, CheckCircle2, ChevronDown, Database, Filter, Headphones, Lock, Settings, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryCard from '../components/CategoryCard'
import MasonryGallery from '../components/MasonryGallery'
import SearchBar from '../components/SearchBar'
import { categories } from '../data/mockData'
import { fetchPublicImages } from '../services/publicApi'

const suggestions = ['Business', 'Technology', 'Nature', 'Remote Work', 'Healthy Food', 'Travel']

const businessFeatures = [
  {
    title: 'Legal indemnification',
    description: 'Full legal protection for AI-generated content licensed for commercial use.',
    icon: ShieldCheck,
  },
  {
    title: 'Security and compliance',
    description: 'Privacy and security controls are built in from day one for your team.',
    icon: Lock,
  },
  {
    title: 'Admin controls',
    description: 'Manage team access, usage permissions, and AI adoption from one workspace.',
    icon: Settings,
  },
  {
    title: 'Designed to protect your work',
    description: 'We never sell your private data or use your private content to train AI models.',
    icon: Database,
  },
  {
    title: 'Dedicated support',
    description: 'A hands-on team supports you from onboarding through everyday operations.',
    icon: Headphones,
  },
  {
    title: 'Unlimited scaling',
    description: 'Flexible credit usage, parallel content creation, and no artificial user limits.',
    icon: BarChart3,
  },
]

const trustedLogos = [
  { name: 'Asus', src: 'https://images.ctfassets.net/hrltx12pl8hq/1781DBaiCRRvlLnthGWcHk/5712e35afe7656a8152ad72aa648b116/Image__13_.png' },
  { name: "BJ's Wholesale Club", src: 'https://images.ctfassets.net/hrltx12pl8hq/3CmrPgdfbq3sqoes1J2NPJ/24e62e73bc97767babaaf2de82ad0346/Image__14_.png' },
  { name: 'Kimberly-Clark', src: 'https://images.ctfassets.net/hrltx12pl8hq/5vnPSdQYJ6coLCRuWmcxol/dabad048e4d7f8179fd6e4ac43b8ede7/Image__21_.png' },
  { name: 'Lenovo', src: 'https://images.ctfassets.net/hrltx12pl8hq/4ph3RBLKlGxmt6j06Wgq2c/5831717f68b69668c7eca0b3f4c374a3/Image__16_.png' },
  { name: 'MGA', src: 'https://images.ctfassets.net/hrltx12pl8hq/4XHUVxFGVtGacZishu9uBr/ce6528adcfda4c146e9636fbc285533d/Image__17_.png' },
  { name: 'Prudential', src: 'https://images.ctfassets.net/hrltx12pl8hq/2tRzclO4Ka5bhX6Q2Ahs0G/f470d62b771fed77033c632ca4e9f2b2/Image__18_.png' },
  { name: 'Staples', src: 'https://images.ctfassets.net/hrltx12pl8hq/24LJwnsZikVPLN8VI8vhz6/0cc9e4384b1087ea345ab3a04ad0ba47/Image__20_.png' },
  { name: 'PT', src: 'https://images.ctfassets.net/hrltx12pl8hq/3manXAt8IvhSsnBphrfzKP/3e8e7643f7cfbfe9b7b5c05bdbff5709/Image__19_.png' },
]

const faqs = [
  {
    question: 'What is Image Copyright Hub and what does it offer?',
    answer: 'Image Copyright Hub is a premium image licensing marketplace for photos, vectors, and illustrations that teams can discover, preview, and license for creative projects.',
  },
  {
    question: 'What AI features does Image Copyright Hub include?',
    answer: 'The platform focuses on smart search, curated discovery, and workflow-friendly previews so teams can find the right assets faster.',
  },
  {
    question: 'How does Image Copyright Hub licensing work?',
    answer: 'Each asset includes clear license options for standard or extended usage, with pricing and permitted uses shown before checkout.',
  },
  {
    question: 'Is Image Copyright Hub free or paid?',
    answer: 'Browsing and previewing assets is free. High-resolution downloads require a single purchase or a paid plan.',
  },
  {
    question: 'What can I create with Image Copyright Hub assets?',
    answer: 'Use licensed assets for websites, ads, social posts, editorial layouts, packaging mockups, brand decks, and campaign concepts.',
  },
  {
    question: 'Do I need design experience to use Image Copyright Hub?',
    answer: 'No. Search filters, curated categories, and simple licensing make the platform approachable for marketers, founders, and creative teams.',
  },
  {
    question: 'What is the difference between image and video licensing?',
    answer: 'Image licensing covers still visuals such as photos, vectors, and illustrations, while video licensing covers motion footage and clips with separate usage terms.',
  },
  {
    question: 'Can I turn a photo into a video?',
    answer: 'You can use licensed images as source material in your own video projects when the selected license supports that use case.',
  },
]

export default function HomePage() {
  const [marketplaceImages, setMarketplaceImages] = useState([])
  const [loadingImages, setLoadingImages] = useState(true)

  useEffect(() => {
    let active = true
    fetchPublicImages({ limit: 24 })
      .then((data) => {
        if (active) setMarketplaceImages(data.images || [])
      })
      .catch(() => {
        if (active) setMarketplaceImages([])
      })
      .finally(() => {
        if (active) setLoadingImages(false)
      })
    return () => { active = false }
  }, [])

  return (
    <>
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-x-0 top-0 -z-0 h-[560px] bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.13),transparent_58%)]" />
        <div className="absolute inset-0 -z-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-24 lg:px-8 lg:pb-20 lg:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm shadow-blue-100/60"><Sparkles size={16} /> Curated commercial-ready assets</span>
          <h1 className="mx-auto mt-7 max-w-[850px] text-center text-[2.55rem] font-black leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-5xl md:text-[4rem] lg:text-[4.75rem]">Discover high-quality images for every creative idea.</h1>
          <p className="mx-auto mt-6 max-w-[650px] text-center text-lg leading-8 text-slate-600 sm:text-xl">Search premium photos, vectors, and illustrations with simple licensing built for modern teams and independent creators.</p>
          <div className="mt-8"><SearchBar /></div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
            <span>Popular:</span>
            {suggestions.map((suggestion) => <Link key={suggestion} to={`/search?q=${suggestion}`} className="rounded-full border border-slate-200 bg-white/85 px-3.5 py-1.5 font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">{suggestion}</Link>)}
          </div>
          <ProductPreviewBanner previewImages={marketplaceImages.slice(0, 6)} />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[['Simple licensing', ShieldCheck], ['Fast previews', Zap], ['Fresh collections', Sparkles]].map(([label, Icon]) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"><Icon className="text-blue-600" size={20} /><span className="font-semibold text-slate-800">{label}</span></div>
          ))}
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Featured Categories" title="Popular collections for every brief" action="Browse all" to="/search" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => <CategoryCard key={category.slug} category={category} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Trending Images" title="Fresh assets people are licensing now" action="Open search" to="/search" />
        <div className="mt-8">
          {loadingImages ? <p className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">Loading marketplace images…</p> : <MasonryGallery images={marketplaceImages} />}
        </div>
      </section>

      <BusinessFeaturesSection />
      <TrustedBySection />
      <FaqSection />
      <ContributorCtaSection />
    </>
  )
}

function BusinessFeaturesSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.78fr_2fr] lg:gap-16 lg:px-8 lg:py-20">
      <div>
        <h2 className="max-w-sm text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">Business-ready features built to help teams scale</h2>
        <p className="mt-6 max-w-sm text-lg leading-8 text-slate-600">Security, control, and governance for creative teams adopting AI-powered content workflows at scale.</p>
      </div>

      <div className="grid gap-x-12 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {businessFeatures.map(({ title, description, icon: Icon }) => (
          <div key={title}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-950">
              <Icon size={20} strokeWidth={2.2} />
            </div>
            <h3 className="mt-5 text-base font-black text-slate-950">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function TrustedBySection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-black tracking-tight text-slate-800">Trusted by</h2>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-10 gap-y-8">
        {trustedLogos.map((logo) => (
          <img key={logo.name} src={logo.src} alt={logo.name} title={logo.name} loading="lazy" className="h-auto max-h-10 w-[120px] shrink-0 object-contain grayscale opacity-70 sm:w-[150px]" />
        ))}
      </div>
    </section>
  )
}

function FaqSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.7fr_2fr] lg:gap-16 lg:px-8 lg:py-20">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Frequently asked questions</h2>
      </div>
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {faqs.map((faq) => (
          <details key={faq.question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-semibold text-slate-900 transition hover:text-blue-600">
              <span>{faq.question}</span>
              <ChevronDown className="shrink-0 transition group-open:rotate-180" size={20} />
            </summary>
            <p className="pb-5 pr-10 text-sm leading-6 text-slate-600">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function ContributorCtaSection() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
      <div>
        <h2 className="max-w-xl text-3xl font-black tracking-tight text-slate-950">Turn your creativity into income</h2>
        <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">Tap into market demand, licensing features, and creative opportunities on Image Copyright Hub to start earning from the content you already create.</p>
        <Link to="/contributor" className="mt-6 inline-flex items-center rounded-full border border-slate-950 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-slate-950 hover:text-white">Become a contributor</Link>
      </div>
      <div className="overflow-hidden rounded-lg bg-slate-100 shadow-xl shadow-slate-200/80">
        <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85" alt="Creator capturing golden hour landscape content" loading="lazy" className="h-[320px] w-full object-cover sm:h-[390px]" />
      </div>
    </section>
  )
}

function ProductPreviewBanner({ previewImages }) {
  return (
    <div className="relative mx-auto mt-16 max-w-[1220px] sm:mt-20">
      <div className="absolute -inset-x-8 bottom-0 top-20 -z-10 rounded-[3rem] bg-blue-200/30 blur-3xl" />
      <Link to="/search" className="absolute -left-3 top-24 z-10 hidden rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-left shadow-xl shadow-slate-200/80 backdrop-blur transition hover:-translate-y-1 hover:border-blue-200 lg:block">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Library</p>
        <p className="mt-1 text-lg font-black text-slate-950">10M+ premium assets</p>
      </Link>
      <Link to="/pricing" className="absolute -right-4 bottom-20 z-10 hidden rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 text-left shadow-xl shadow-blue-100/80 backdrop-blur transition hover:-translate-y-1 hover:border-blue-200 xl:block">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-700"><CheckCircle2 size={17} /> Commercial license included</div>
      </Link>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-300/70">
        <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-red-300" />
            <span className="h-3 w-3 rounded-full bg-amber-300" />
            <span className="h-3 w-3 rounded-full bg-green-300" />
          </div>
          <div />
          <div className="h-7 w-20 rounded-full bg-white" />
        </div>

        <div className="grid min-h-[420px] gap-0 bg-white text-left lg:grid-cols-[250px_1fr]">
          <aside className="hidden border-r border-slate-200 bg-slate-50/80 p-5 lg:block">
            <div className="rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Project</p>
              <p className="mt-2 font-bold">Summer campaign</p>
            </div>
            <div className="mt-5 space-y-4">
              <PreviewFilter title="Content" items={[
                { label: 'Photos', to: '/search?type=Photos' },
                { label: 'Vectors', to: '/search?type=Vectors' },
                { label: 'Illustrations', to: '/search?type=Illustrations' },
              ]} />
              <PreviewFilter title="Categories" items={[
                { label: 'Business', to: '/search?category=business' },
                { label: 'Nature', to: '/search?category=nature' },
                { label: 'Technology', to: '/search?category=technology' },
              ]} />
              <PreviewFilter title="License" items={[
                { label: 'Commercial', to: '/pricing' },
                { label: 'Editorial', to: '/search?type=Photos' },
              ]} />
            </div>
          </aside>

          <div className="p-4 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><Filter size={14} /> Smart asset discovery</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Curated image marketplace</h2>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {[
                  { label: 'All', to: '/search' },
                  { label: 'Business', to: '/search?category=business' },
                  { label: 'Lifestyle', to: '/search?category=lifestyle' },
                  { label: 'Travel', to: '/search?category=travel' },
                ].map((item, index) => <Link key={item.label} to={item.to} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${index === 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'}`}>{item.label}</Link>)}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {previewImages.length ? previewImages.map((image) => (
                <Link to={`/image/${image.id}`} key={image.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/80">
                  <img src={image.image || '/favicon.svg'} alt={image.altText || image.title} draggable="false" onError={(event) => { event.currentTarget.src = '/favicon.svg' }} onContextMenu={(event) => event.preventDefault()} className="h-36 w-full object-cover sm:h-40" />
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-bold text-slate-950">{image.title}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{image.type}</span>
                    </div>
                    <p className="mt-2 line-clamp-1 text-xs text-slate-500">{image.category} · {image.license} license</p>
                  </div>
                </Link>
              )) : <div className="col-span-full rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">No published images yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewFilter({ title, items }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="space-y-2">
        {items.map((item) => <Link to={item.to} key={item.label} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-600"><span>{item.label}</span><span className="h-2 w-2 rounded-full bg-blue-500" /></Link>)}
      </div>
    </div>
  )
}

function SectionHeading({ eyebrow, title, action, to }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
      </div>
      <Link to={to} className="inline-flex items-center gap-2 font-semibold text-blue-600 transition hover:text-blue-700">{action}<ArrowRight size={18} /></Link>
    </div>
  )
}
