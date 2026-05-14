import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Skills from './components/sections/Skills'
import Experience from './components/sections/Experience'
import Integrations from './components/sections/Integrations'
import Projects from './components/sections/Projects'
import Apps from './components/sections/Apps'
import Contact from './components/sections/Contact'
import PrintButton from './components/PrintButton'
import Resume from './components/Resume'
import MedmartDemo from './components/MedmartDemo'
import MedmartProposal from './components/MedmartProposal'
import MedmartAIDemo from './components/MedmartAIDemo'
import MedmartTraining from './components/MedmartTraining'
import AIPage from './components/AIPage'
import ChatWidget from './components/ChatWidget'
import { navItems } from './data/content'
import { useActiveSection } from './hooks/useActiveSection'

export type NavPosition = 'left' | 'right'

function PortfolioLayout() {
  const [navPosition, setNavPosition] = useState<NavPosition>(() => {
    return (localStorage.getItem('navPosition') as NavPosition) || 'left'
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const sectionIds = navItems.map((n) => n.id)
  const activeSection = useActiveSection(sectionIds)

  useEffect(() => {
    localStorage.setItem('navPosition', navPosition)
  }, [navPosition])

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  const toggleNavPosition = () =>
    setNavPosition((p) => (p === 'left' ? 'right' : 'left'))

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {navPosition === 'left' && (
        <Nav
          position="left"
          activeSection={activeSection}
          onTogglePosition={toggleNavPosition}
          onScrollTo={scrollTo}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      )}

      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
      >
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-5 py-4 bg-bg/95 backdrop-blur border-b border-border-subtle">
          <span className="font-display font-semibold text-gold text-lg">RP</span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-muted hover:text-ink transition-colors p-2 -mr-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-bg/98 backdrop-blur flex flex-col"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
              <span className="font-display font-semibold text-gold text-lg">RP</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-muted p-2 -mr-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col px-6 py-8 gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`text-left text-lg font-medium py-3 transition-colors ${
                    activeSection === item.id ? 'text-gold' : 'text-muted hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        <Hero onScrollTo={scrollTo} />
        <About />
        <Skills />
        <Experience />
        <Integrations />
        <Projects />
        <Apps />
        <Contact />
      </main>

      {navPosition === 'right' && (
        <Nav
          position="right"
          activeSection={activeSection}
          onTogglePosition={toggleNavPosition}
          onScrollTo={scrollTo}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      )}

      <PrintButton />
    </div>
  )
}

function HashRedirect() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#resume') {
      navigate('/resume', { replace: true })
    }
  }, [location.hash, navigate])

  return <PortfolioLayout />
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/ai" element={<AIPage />} />
        <Route path="/medmart/demo" element={<MedmartDemo />} />
        <Route path="/medmart/proposal" element={<MedmartProposal />} />
        <Route path="/medmart/ai-demo" element={<MedmartAIDemo />} />
        <Route path="/medmart/training" element={<MedmartTraining />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="*" element={<HashRedirect />} />
      </Routes>
      <ChatWidget />
    </>
  )
}
