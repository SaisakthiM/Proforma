import { useEffect, useState } from 'react'
import { categoryByValue } from '../lib/constants'

const ACCENTS = {
  SEEDS: { ink: '#1F3D2B', wash: '#E7E0CB', accent: '#B08A3E' },
  MACHINERY: { ink: '#1E3A42', wash: '#DCE4DE', accent: '#B08A3E' },
  TOOLS: { ink: '#3A2E22', wash: '#E9E1D2', accent: '#9B7735' },
  SOILS: { ink: '#2C3325', wash: '#E4DFCC', accent: '#A47C36' }
}

function SeedsMotif({ accent }) {
  return (
    <g>
      <path
        d="M136 82h128v158l-15 22H151l-15-22Z"
        fill="#F6F2E6"
        stroke="#1F3D2B"
        strokeWidth="1.4"
      />
      <path d="M136 112h128" stroke="#1F3D2B" strokeWidth="1" />
      <path d="M158 136h84" stroke={accent} strokeWidth="7" />
      <path d="M158 150h52" stroke="#1F3D2B" strokeWidth="1.4" opacity=".55" />
      <path d="M200 238v-52" stroke="#1F3D2B" strokeWidth="1.6" />
      <path
        d="M200 194c-25-8-35-28-31-56 25 5 37 25 31 56Z"
        fill="#1F3D2B"
        opacity=".9"
      />
      <path
        d="M200 210c22-7 31-24 27-47-21 5-31 21-27 47Z"
        fill={accent}
        opacity=".78"
      />
      <path d="M200 238v18" stroke="#1F3D2B" strokeWidth="1.4" />
      <circle cx="160" cy="247" r="2.4" fill={accent} />
      <circle cx="176" cy="253" r="1.8" fill="#1F3D2B" />
      <circle cx="235" cy="250" r="2" fill="#1F3D2B" />
      <circle cx="248" cy="241" r="1.6" fill={accent} />
    </g>
  )
}

function MachineryMotif({ accent }) {
  return (
    <g>
      <g opacity=".35" stroke="#1F3D2B" strokeWidth=".6">
        {[40, 80, 120, 160, 200, 240, 280, 320, 360].map((x) => (
          <line key={`v${x}`} x1={x} y1="30" x2={x} y2="290" />
        ))}
        {[40, 80, 120, 160, 200, 240, 280].map((y) => (
          <line key={`h${y}`} x1="20" y1={y} x2="380" y2={y} />
        ))}
      </g>
      <g fill="none" stroke="#1F3D2B" strokeWidth="1.7" strokeLinejoin="miter">
        <circle cx="144" cy="226" r="31" />
        <circle cx="144" cy="226" r="13" />
        <circle cx="290" cy="226" r="39" />
        <circle cx="290" cy="226" r="16" />
        <path d="M110 212v-38h68v-44h54l34 46v44h-16" />
        <path d="M178 174h54l22 30v22" />
        <path d="M232 130v30h38" />
        <path d="M204 130v44" opacity=".55" />
        <path d="M110 196h52v30" opacity=".55" />
      </g>
      <path d="M110 174h52" stroke={accent} strokeWidth="6" />
      <path d="M290 226h48" stroke={accent} strokeWidth="1.4" strokeDasharray="4 5" />
      <circle cx="338" cy="226" r="3" fill={accent} />
      <text x="238" y="120" className="art-svg-label" fill="#1F3D2B">
        35 HP
      </text>
    </g>
  )
}

function ToolsMotif({ accent }) {
  return (
    <g>
      <g stroke="#1F3D2B" strokeWidth="1.6" fill="none">
        <path d="M126 264 262 78" strokeWidth="4" strokeLinecap="square" />
        <path d="M246 92 l40-24 18 29-44 21z" fill={accent} stroke="#1F3D2B" />
        <path d="M258 147 178 275" strokeWidth="3.4" />
        <path
          d="M178 275c-31-6-45-25-38-52 30 4 46 21 38 52Z"
          fill="#F6F2E6"
          stroke="#1F3D2B"
        />
        <path d="M148 231c16 2 26 10 30 23" opacity=".65" />
      </g>
      <circle cx="300" cy="112" r="4" fill={accent} />
      <path d="M112 92h58" stroke="#1F3D2B" strokeWidth="1" opacity=".5" />
      <path d="M112 84h34" stroke={accent} strokeWidth="4" />
      <text x="286" y="266" className="art-svg-label" fill="#1F3D2B">
        FORGED
      </text>
    </g>
  )
}

function SoilsMotif({ accent }) {
  return (
    <g>
      <path
        d="M150 116h100l-11 158h-78Z"
        fill="#F6F2E6"
        stroke="#1F3D2B"
        strokeWidth="1.6"
      />
      <path
        d="M150 116c8-24 75-24 100 0"
        fill="none"
        stroke="#1F3D2B"
        strokeWidth="1.6"
      />
      <path d="M161 110c6 13 72 13 78 0" fill="none" stroke={accent} strokeWidth="5" />
      <path d="M200 170v-30" stroke="#1F3D2B" strokeWidth="1.5" />
      <path
        d="M200 150c-18-6-24-19-20-36 17 4 25 17 20 36Z"
        fill="#1F3D2B"
      />
      <path
        d="M200 160c15-5 21-16 18-31-15 3-22 15-18 31Z"
        fill={accent}
      />
      {[
        [174, 208], [190, 220], [211, 205], [226, 226], [183, 245], [218, 249], [202, 233]
      ].map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r={2 + (index % 3)} fill={index % 2 ? accent : '#1F3D2B'} opacity=".7" />
      ))}
      <text x="164" y="268" className="art-svg-label" fill="#1F3D2B">
        ORGANIC
      </text>
    </g>
  )
}

export function ProductArt({ product, variant = 'card' }) {
  const category = categoryByValue[product?.category] || categoryByValue.SEEDS
  const tone = ACCENTS[product?.category] || ACCENTS.SEEDS
  const motifs = {
    SEEDS: SeedsMotif,
    MACHINERY: MachineryMotif,
    TOOLS: ToolsMotif,
    SOILS: SoilsMotif
  }
  const Motif = motifs[product?.category] || SeedsMotif

  return (
    <div
      className={`product-art product-art--${category.slug} product-art--${variant}`}
      style={{ '--art-wash': tone.wash, '--art-accent': tone.accent }}
    >
      <svg viewBox="0 0 400 320" aria-hidden="true" className="product-art-svg">
        <rect width="400" height="320" fill="var(--art-wash)" />
        <path d="M0 0h400v4H0z" fill="var(--art-accent)" opacity=".7" />
        <Motif accent={tone.accent} />
        <g stroke="#1F3D2B" strokeWidth="1" opacity=".55" fill="none">
          <path d="M18 18h26M18 18v26" />
          <path d="M382 18h-26M382 18v26" />
          <path d="M18 302h26M18 302v-26" />
          <path d="M382 302h-26M382 302v-26" />
        </g>
        <text x="22" y="62" className="art-svg-code" fill="#1F3D2B">
          {category.code}
        </text>
      </svg>
      <div className="product-art-caption">
        <span>
          {category.short} · {product?.subcategory || 'Verified lot'}
        </span>
        <strong>{product?.name || category.label}</strong>
      </div>
      <span className="product-art-seal" aria-hidden="true">
        PF
      </span>
    </div>
  )
}

export default function ProductVisual({ product, variant = 'card' }) {
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [product?.imageUrl])

  if (product?.imageUrl && !broken) {
    return (
      <div className={`product-photo product-photo--${variant}`}>
        <img src={product.imageUrl} alt={product.name} loading="lazy" onError={() => setBroken(true)} />
      </div>
    )
  }
  return <ProductArt product={product} variant={variant} />
}