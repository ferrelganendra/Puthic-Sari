import { HiArrowLeft, HiCheckCircle, HiExternalLink } from 'react-icons/hi'
import { infoPages } from '../data/infoPages'

function PageHero({ page, onHome }) {
 return (
  <section className="bg-white">
   <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
    <a
     href="/"
     onClick={(e) => { e.preventDefault(); onHome?.() }}
     className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 transition-colors hover:text-gray-950"
    >
     <HiArrowLeft className="text-base" />
     Kembali ke Beranda
    </a>

    <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_260px] md:items-end">
     <div data-reveal="fade-up">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700">{page.eyebrow}</p>
      <h1 className="mt-4 max-w-3xl  font-medium leading-tight text-gray-950 md:text-5xl">
       {page.title}
      </h1>
      <p className="mt-5 max-w-3xl text-base leading-8 text-gray-600">
       {page.intro}
      </p>
     </div>

     {page.heroImage && (
      <div className="hidden overflow-hidden border border-gray-200 bg-gray-100 md:block" data-reveal="fade-left" style={{ '--reveal-delay': '90ms' }}>
       <img src={page.heroImage} alt={page.heroAlt} loading="lazy" decoding="async" className="h-48 w-full object-cover" />
      </div>
     )}
    </div>

    {page.highlights && (
     <div className="mt-8 flex flex-wrap gap-2.5" data-reveal="fade-up" style={{ '--reveal-delay': '120ms' }}>
      {page.highlights.map(item => (
       <span key={item} className="inline-flex min-h-9 items-center gap-2 border border-gray-200 bg-[#f4f4f2] px-3.5 py-2 text-xs font-medium uppercase text-gray-700">
        <HiCheckCircle className="text-base text-primary-600" />
        {item}
       </span>
      ))}
     </div>
    )}
   </div>
  </section>
 )
}

function StorySections({ sections }) {
 if (!sections?.length) return null

 return (
  <section className="bg-white pb-14 md:pb-20">
   <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <div className="divide-y divide-gray-200 border-y border-gray-200">
     {sections.map((section, index) => (
      <div key={section.title} className="grid gap-4 py-7 md:grid-cols-[0.32fr_0.68fr]" data-reveal="fade-up" style={{ '--reveal-delay': `${index * 55}ms` }}>
       <h2 className="text-base font-semibold text-gray-950 md:text-lg">{section.title}</h2>
       <p className="text-sm leading-7 text-gray-600 md:text-base md:leading-8">{section.body}</p>
      </div>
     ))}
    </div>
   </div>
  </section>
 )
}

function Quote({ page }) {
 if (!page.quote) return null

 return (
  <section className="border-y border-gray-200 bg-[#f4f4f2] py-10">
   <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8" data-reveal="fade-up">
    <p className="font-medium leading-tight text-gray-950 md:text-3xl">"{page.quote}"</p>
    {page.quoteBy && <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{page.quoteBy}</p>}
   </div>
  </section>
 )
}

function FAQList({ faqs }) {
 if (!faqs?.length) return null

 return (
  <section className="bg-white pb-14 md:pb-20">
   <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
    <div className="divide-y divide-gray-200 border-y border-gray-200">
     {faqs.map((item, index) => (
      <div key={item.q} className="py-7" data-reveal="fade-up" style={{ '--reveal-delay': `${Math.min(index, 8) * 40}ms` }}>
       <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{String(index + 1).padStart(2, '0')}</p>
       <h2 className="mt-2 text-lg font-semibold text-gray-950">{item.q}</h2>
       <p className="mt-3 text-sm leading-7 text-gray-600 md:text-base md:leading-8">{item.a}</p>
      </div>
     ))}
    </div>
   </div>
  </section>
 )
}

function Steps({ steps, notice }) {
 if (!steps?.length) return null

 return (
  <section className="bg-white pb-14 md:pb-20">
   <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
     {steps.map((step, index) => (
      <div key={step} className="border border-gray-200 bg-[#f4f4f2] p-5" data-reveal="fade-up" style={{ '--reveal-delay': `${index * 55}ms` }}>
       <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Step {String(index + 1).padStart(2, '0')}</p>
       <p className="mt-4 text-sm leading-7 text-gray-700">{step}</p>
      </div>
     ))}
    </div>
    {notice && (
     <a href="https://wa.me/6285117606161" target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-11 items-center gap-2 bg-gray-950 px-5 py-3 text-xs font-semibold uppercase text-white transition-colors hover:bg-gray-800">
      {notice}
      <HiExternalLink className="text-base" />
     </a>
    )}
   </div>
  </section>
 )
}

export default function InfoPage({ slug, onHome }) {
 const page = infoPages[slug]
 if (!page) return null

 return (
  <main className="bg-white">
   <PageHero page={page} onHome={onHome} />
   <Quote page={page} />
   <StorySections sections={page.sections} />
   <FAQList faqs={page.faqs} />
   <Steps steps={page.steps} notice={page.notice} />
  </main>
 )
}
