import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, Mountain, Waves, Shield, Play,
  ArrowRight, Brain, TrendingDown, Layers,
  Globe, Target, Zap, CheckCircle, ChevronRight,
} from 'lucide-react'
import './morphological.css'

/* ── Component descriptions ── */
const COMPONENTS = [
  {
    id: 'erosion',
    title: 'Erosion Analysis',
    subtitle: 'HMM Regime Detection',
    href: '/morphological/erosion',
    icon: Activity,
    gradient: 'linear-gradient(135deg,#ef4444,#f97316)',
    glow: 'rgba(239,68,68,0.14)',
    badgeColor: '#b91c1c',
    badgeBg: '#fef2f2',
    badge: 'Machine Learning',
    description:
      'Employ Hidden Markov Models to identify distinct coastal erosion regimes from historical data. Detect probabilistic state transitions and forecast next-month erosion likelihood with high accuracy.',
    features: [
      'Multi-state HMM training on environmental variables',
      'Erosion transition probability matrices',
      'Viterbi-decoded historical regime sequences',
      'Real-time regime state classification',
    ],
  },
  {
    id: 'vulnerability',
    title: 'Vulnerability Assessment',
    subtitle: 'CVI / BMSI Indices',
    href: '/morphological/vulnerability',
    icon: Mountain,
    gradient: 'linear-gradient(135deg,#f59e0b,#eab308)',
    glow: 'rgba(245,158,11,0.14)',
    badgeColor: '#92400e',
    badgeBg: '#fef3c7',
    badge: 'Index Modelling',
    description:
      'Quantify coastal exposure through the Coastal Vulnerability Index and Beach Morphological Stability Index. Track temporal changes and forecast future vulnerability trajectories.',
    features: [
      'Multi-variable CVI composite scoring',
      'BMSI morphodynamic stability classification',
      'Normalised vulnerability percentile ranking',
      'Historical trend & forecast projections',
    ],
  },
  {
    id: 'shoreline',
    title: 'Shoreline Change',
    subtitle: 'Lateral Shift & Rate Estimation',
    href: '/morphological/shoreline',
    icon: Waves,
    gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
    glow: 'rgba(59,130,246,0.14)',
    badgeColor: '#1d4ed8',
    badgeBg: '#eff6ff',
    badge: 'Time Series',
    description:
      'Predict annual shoreline displacement using VECM and linear trend models. Auto-selects the best-fit model and provides metre-level shift estimates for any target year.',
    features: [
      'VECM vs linear trend model comparison',
      'Auto-selection via RMSE minimisation',
      'Year-specific shift forecasts in metres',
      'Net Shoreline Movement (NSM) integration',
    ],
  },
  {
    id: 'risk',
    title: 'Risk Assessment',
    subtitle: 'Setback Zone & Safety Classification',
    href: '/morphological/risk',
    icon: Shield,
    gradient: 'linear-gradient(135deg,#10b981,#14b8a6)',
    glow: 'rgba(16,185,129,0.14)',
    badgeColor: '#065f46',
    badgeBg: '#ecfdf5',
    badge: 'Risk Modelling',
    description:
      'Classify coastal development safety using predicted shoreline shifts and hazard thresholds. Assigns setback zones and development restrictions based on computed risk scores.',
    features: [
      'Dynamic setback zone calculation',
      'Safe / Caution / Danger classification',
      'Development zone boundary mapping',
      'Soft vs restricted vs prohibited zones',
    ],
  },
  {
    id: 'run',
    title: 'Run Analysis',
    subtitle: 'Full Pipeline Execution',
    href: '/morphological/run',
    icon: Play,
    gradient: 'linear-gradient(135deg,#8b5cf6,#a855f7)',
    glow: 'rgba(139,92,246,0.14)',
    badgeColor: '#5b21b6',
    badgeBg: '#f5f3ff',
    badge: 'Pipeline',
    description:
      'Execute the complete morphological analysis pipeline end-to-end. Triggers HMM training, index computation, shoreline modelling, and risk classification in a single automated run.',
    features: [
      'One-click full pipeline execution',
      'Real-time execution status tracking',
      'Step-by-step progress reporting',
      'Automatic result persistence',
    ],
  },
]

const STATS = [
  { value: '5', label: 'Analysis Modules', icon: Layers },
  { value: 'HMM', label: 'Regime Detection', icon: Brain },
  { value: 'VECM', label: 'Forecast Model', icon: TrendingDown },
  { value: '2026', label: 'Forecast Horizon', icon: Target },
]

const STEPS = [
  {
    step: '01',
    title: 'Data Ingestion',
    desc: 'Environmental and morphological datasets are loaded, validated, and pre-processed ready for analysis.',
  },
  {
    step: '02',
    title: 'Model Training',
    desc: 'HMM, VECM, CVI and BMSI models are trained and calibrated against historical observations.',
  },
  {
    step: '03',
    title: 'Risk Output',
    desc: 'Forecasts, vulnerability scores, and setback classifications are computed and exported across all modules.',
  },
]

/* ── Animation helpers ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, delay },
})

export default function MorphLandingPage() {
  const navigate = useNavigate()

  return (
    <div className="mt-forecast-wrapper">
      <div className="ml-page">

        {/* ══════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════ */}
        <div className="ml-hero">
          {/* Background layers scoped to hero */}
          <div className="ml-hero-bg" style={{ backgroundImage: 'url(/Coastal_thima.png)' }} />
          <div className="ml-hero-overlay" />
          <div className="ml-hero-grid" />
          <div className="ml-hero-body">
            {/* eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="ml-hero-badge"
            >
              <Globe size={12} />
              Coastal Morphological Analysis System
            </motion.div>

            {/* title */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="ml-hero-title"
            >
              Morphological<br />
              <span className="ml-hero-accent">Threshold Analysis</span>
            </motion.h1>

            {/* subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="ml-hero-desc"
            >
              AI-powered coastal erosion regime detection, vulnerability assessment,
              shoreline forecasting and risk classification — all in one unified pipeline.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3 }}
              className="ml-hero-actions"
            >
              <button
                className="ml-btn-primary"
                onClick={() => navigate('/morphological/overview')}
              >
                View Dashboard <ArrowRight size={16} />
              </button>
              <button
                className="ml-btn-ghost"
                onClick={() => navigate('/morphological/run')}
              >
                <Play size={16} /> Run Analysis
              </button>
            </motion.div>

            {/* stats chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="ml-stats-row"
            >
              {STATS.map((s) => (
                <div key={s.label} className="ml-stat-chip">
                  <s.icon size={13} />
                  <span className="ml-stat-val">{s.value}</span>
                  <span className="ml-stat-lbl">{s.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* scroll cue */}
          <motion.div
            className="ml-scroll-cue"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <ChevronRight size={22} style={{ transform: 'rotate(90deg)' }} />
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════
            SECTION HEADER
        ══════════════════════════════════════════════ */}
        <div className="ml-intro-section">
          <motion.div {...fadeUp()} className="ml-intro-inner">
            <div className="ml-eyebrow">What's Inside</div>
            <h2 className="ml-section-title">Five Integrated Analysis Modules</h2>
            <p className="ml-section-desc">
              Each module targets a distinct dimension of coastal morphodynamics — from
              probabilistic regime detection to development zone risk classification.
            </p>
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════
            COMPONENT CARDS
        ══════════════════════════════════════════════ */}
        <div className="ml-cards-section">
          <div className="ml-cards-grid">
            {COMPONENTS.map((comp, idx) => (
              <motion.div
                key={comp.id}
                {...fadeUp(idx * 0.07)}
                className="ml-card"
                style={{ '--card-glow': comp.glow }}
                onClick={() => navigate(comp.href)}
              >
                {/* top colour stripe */}
                <div className="ml-card-stripe" style={{ background: comp.gradient }} />

                {/* icon */}
                <div
                  className="ml-card-icon"
                  style={{ background: comp.gradient }}
                >
                  <comp.icon size={22} color="white" strokeWidth={2} />
                </div>

                {/* badge */}
                <span
                  className="ml-card-badge"
                  style={{ color: comp.badgeColor, background: comp.badgeBg }}
                >
                  {comp.badge}
                </span>

                <h3 className="ml-card-title">{comp.title}</h3>
                <p className="ml-card-subtitle">{comp.subtitle}</p>
                <p className="ml-card-desc">{comp.description}</p>

                <ul className="ml-card-features">
                  {comp.features.map((f) => (
                    <li key={f} className="ml-card-feat">
                      <CheckCircle
                        size={13}
                        style={{ color: comp.badgeColor, flexShrink: 0, marginTop: 1 }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="ml-card-footer">
                  <span className="ml-card-cta" style={{ color: comp.badgeColor }}>
                    Explore module <ArrowRight size={13} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            PIPELINE / HOW IT WORKS
        ══════════════════════════════════════════════ */}
        <div className="ml-pipeline-section">
          <motion.div {...fadeUp()} className="ml-intro-inner" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
            <div className="ml-eyebrow">Methodology</div>
            <h2 className="ml-section-title">How the Pipeline Works</h2>
          </motion.div>

          <div className="ml-steps-row">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                {...fadeUp(i * 0.12)}
                className="ml-step"
              >
                <div className="ml-step-num">{s.step}</div>
                <div>
                  <div className="ml-step-title">{s.title}</div>
                  <div className="ml-step-desc">{s.desc}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="ml-step-arrow">
                    <ArrowRight size={18} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            CTA BANNER
        ══════════════════════════════════════════════ */}
        <motion.div {...fadeUp()} className="ml-cta-banner">
          <div
            className="ml-cta-bg"
            style={{ backgroundImage: 'url(/Coastal_thima.png)' }}
          />
          <div className="ml-cta-overlay" />
          <div className="ml-cta-body">
            <div className="ml-cta-icon">
              <Zap size={28} color="white" />
            </div>
            <h2 className="ml-cta-title">Ready to Analyse Your Coastline?</h2>
            <p className="ml-cta-desc">
              Run the complete morphological pipeline in one click. Results are
              available across all modules instantly after execution.
            </p>
            <div className="ml-cta-actions">
              <button
                className="ml-btn-primary"
                onClick={() => navigate('/morphological/run')}
              >
                <Play size={16} /> Run Full Analysis
              </button>
              <button
                className="ml-btn-ghost"
                onClick={() => navigate('/morphological/overview')}
              >
                View Latest Results <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
