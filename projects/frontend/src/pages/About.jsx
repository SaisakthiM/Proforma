import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Droplets,
  Handshake,
  Leaf,
  MapPin,
  Ruler,
  ShieldCheck,
  Sprout,
  Store,
  Truck
} from 'lucide-react'
import { CATEGORIES } from '../lib/constants'

const STATS = [
  { value: '500+', label: 'farms trusted us', note: 'Registered growers across India' },
  { value: '36', label: 'districts served', note: 'From Thanjavur to Ludhiana' },
  { value: '1,240', label: 'verified lots listed', note: 'Seeds, machinery, tools, soils' },
  { value: '4.8 / 5', label: 'average lot rating', note: 'Across 3,100 verified reviews' }
]

const PRINCIPLES = [
  {
    icon: Ruler,
    title: 'Declare the lot, not the slogan',
    copy: 'Every listing carries a batch reference, unit, dispatch district and seller identity. No mystery lots.'
  },
  {
    icon: Sprout,
    title: 'Recommend from the ground up',
    copy: 'Crop, climate, soil and irrigation shape what you see first. A paddy grower and a grape grower should not see the same shelf.'
  },
  {
    icon: ShieldCheck,
    title: 'Verify before visibility',
    copy: 'Seller documents are reviewed before a single listing goes live. Standards are the product.'
  },
  {
    icon: Truck,
    title: 'Promise a window, not a wish',
    copy: 'Dispatch windows and district coverage are shown before checkout so a sowing date is never held hostage by logistics.'
  }
]

const STANDARDS = [
  {
    icon: BadgeCheck,
    title: 'Seller verification',
    copy: 'Identity, GST or Udyam registration, land or warehouse proof, and a declared returns contact.'
  },
  {
    icon: Leaf,
    title: 'Input integrity',
    copy: 'Seeds carry germination and purity declarations. Soils and nutrition carry composition and batch dates.'
  },
  {
    icon: Droplets,
    title: 'Honest availability',
    copy: 'Stock is live. If a lot sells out between basket and checkout, the order is stopped, not silently substituted.'
  },
  {
    icon: Handshake,
    title: 'A real return window',
    copy: 'Seven days on sealed lots. Disputes are routed to the seller and tracked in the buyer register.'
  }
]

const TIMELINE = [
  { year: '2023', title: 'A paper ledger in Thanjavur', copy: 'Four growers started recording seed lots, prices and germination results in one shared book.' },
  { year: '2024', title: 'The first district registry', copy: 'Twelve sellers joined. The ledger became a searchable catalogue with verified listings.' },
  { year: '2025', title: 'Recommendations from the field', copy: 'Crop, climate and co-view signals replaced generic bestseller lists.' },
  { year: '2026', title: 'Proforma opens', copy: 'A working marketplace with buyer and seller registries, analytics and district delivery.' }
]

export default function About() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-copy">
          <span className="eyebrow">About Proforma · Let’s break the stereotype, let’s farmline</span>
          <h1>The farm-supply register, kept honestly.</h1>
          <p>
            Proforma is a verified marketplace for the inputs that decide a season: seed,
            machinery, tools and soil. We built it as a register — declared lots, named sellers,
            district delivery — rather than an endless shelf of lookalike listings.
          </p>
          <div className="about-hero-actions">
            <Link className="btn btn--forest" to="/search">
              Browse the registry <ArrowRight size={16} />
            </Link>
            <Link className="btn btn--ghost" to="/register?role=SELLER">
              Sell with Proforma <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="about-hero-meta">
            <span>
              <MapPin size={14} /> Built for Indian growers
            </span>
            <span>
              <ShieldCheck size={14} /> Verified sellers only
            </span>
          </div>
        </div>
        <figure className="about-hero-media">
          <img src="/media/hero-harvest.png" alt="Seed, soil and tools arranged on a paper registry" />
          <figcaption>
            <span className="eyebrow eyebrow--muted">Est. 2026</span>
            <strong>One ledger. Four departments. Every district.</strong>
          </figcaption>
        </figure>
      </section>

      <section className="stat-band">
        {STATS.map((stat) => (
          <div className="stat-cell" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <small>{stat.note}</small>
          </div>
        ))}
      </section>

      <section className="about-story">
        <figure className="about-story-media">
          <img src="/media/field-story.png" alt="Hands holding grain over dark soil" />
        </figure>
        <div className="about-story-copy">
          <span className="eyebrow">Why we started</span>
          <h2>A season can turn on one input bought blind.</h2>
          <p>
            Most growers do not lack choice. They lack a way to tell one lot from another before
            the money leaves their hands. When a seed packet has no batch, a soil bag has no
            composition and a seller has no return address, the risk lands entirely on the farm.
          </p>
          <p>
            Proforma flips that. Sellers declare their lot, buyers see the declaration, and the
            register remembers what was bought, from whom and where it was dispatched. The
            question stops being "is it cheap?" and becomes "does it fit my ground?"
          </p>
          <div className="about-pull">
            <span>“Let’s break the stereotype, let’s farmline” is the first line in the register:
            farming is not a fallback. It is a business of decisions, and every decision deserves
            a declared lot.</span>
          </div>
        </div>
      </section>

      <section className="about-principles">
        <div className="section-head">
          <div>
            <span className="eyebrow">What we hold to</span>
            <h2>Four principles, kept in public.</h2>
          </div>
          <div className="section-head-side">
            <p>These rules shape what gets listed, what gets recommended and what gets removed.</p>
          </div>
        </div>
        <div className="principle-grid">
          {PRINCIPLES.map((principle, index) => {
            const Icon = principle.icon
            return (
              <article className="principle-card" key={principle.title}>
                <span className="principle-index">{String(index + 1).padStart(2, '0')}</span>
                <Icon size={22} />
                <h3>{principle.title}</h3>
                <p>{principle.copy}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="about-standards" id="standards">
        <div className="about-standards-copy">
          <span className="eyebrow eyebrow--gold">Seller standards</span>
          <h2>What “verified” actually means here.</h2>
          <p>
            Verification is a document trail, not a badge. Sellers agree to four declarations and
            accept that listings can be paused when a declaration fails an audit.
          </p>
          <Link className="text-link" to="/register?role=SELLER">
            Apply as a seller <ArrowRight size={15} />
          </Link>
        </div>
        <div className="standards-list">
          {STANDARDS.map((standard, index) => {
            const Icon = standard.icon
            return (
              <article key={standard.title}>
                <span className="standard-index">{String(index + 1).padStart(2, '0')}</span>
                <Icon size={19} />
                <div>
                  <h3>{standard.title}</h3>
                  <p>{standard.copy}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="about-timeline">
        <div className="section-head">
          <div>
            <span className="eyebrow">The register, so far</span>
            <h2>From a shared ledger to a district marketplace.</h2>
          </div>
        </div>
        <div className="timeline-track">
          {TIMELINE.map((entry) => (
            <div className="timeline-entry" key={entry.year}>
              <span className="timeline-year">{entry.year}</span>
              <h3>{entry.title}</h3>
              <p>{entry.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-departments">
        <div className="section-head">
          <div>
            <span className="eyebrow">Four departments</span>
            <h2>One season, covered end to end.</h2>
          </div>
        </div>
        <div className="department-grid">
          {CATEGORIES.map((category) => (
            <Link key={category.value} to={`/search?category=${category.value}`} className="department-card">
              <span className="eyebrow eyebrow--muted">{category.code}</span>
              <strong>{category.short}</strong>
              <p>{category.copy}</p>
              <span className="text-link">
                Shop {category.short.toLowerCase()} <ArrowUpRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <div>
          <span className="eyebrow eyebrow--gold">Join the register</span>
          <h2>Know what you are buying before the season decides for you.</h2>
        </div>
        <div className="about-cta-actions">
          <Link className="btn btn--gold" to="/register">
            Create a buyer account <ArrowRight size={16} />
          </Link>
          <Link className="btn btn--outline-light" to="/register?role=SELLER">
            <Store size={16} /> Open a seller studio
          </Link>
        </div>
      </section>
    </div>
  )
}