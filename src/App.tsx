import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import ChatWidget from './components/ChatWidget'
import { track, describeClick } from './lib/analytics'

export type { NavPosition } from './components/PortfolioLayout'

/* Route-level code splitting — each page ships as its own chunk so a given
   route only downloads the code it needs (keeps per-page payload small). */
const PortfolioLayout = lazy(() => import('./components/PortfolioLayout'))
const Resume = lazy(() => import('./components/Resume'))
const MedmartHub = lazy(() => import('./components/MedmartHub'))
const MedmartDemo = lazy(() => import('./components/MedmartDemo'))
const MedmartAIDemo = lazy(() => import('./components/MedmartAIDemo'))
const MedmartTraining = lazy(() => import('./components/MedmartTraining'))
const MedmartGMCPage = lazy(() => import('./components/MedmartGMCPage'))
const MedmartCriteoPage = lazy(() => import('./components/MedmartCriteoPage'))
const MedmartCriteoCtmWalkthrough = lazy(() => import('./components/MedmartCriteoCtmWalkthrough'))
const MedmartConfigReview = lazy(() => import('./components/MedmartConfigReview'))
const MedmartCloudflareReview = lazy(() => import('./components/MedmartCloudflareReview'))
const MedmartMaxReview = lazy(() => import('./components/MedmartMaxReview'))
const MedmartFraudReview = lazy(() => import('./components/MedmartFraudReview'))
const MedmartTestBotsFollowup = lazy(() => import('./components/MedmartTestBotsFollowup'))
const MedmartAuthnetReview = lazy(() => import('./components/MedmartAuthnetReview'))
const MedmartMckessonLogicbroker = lazy(() => import('./components/MedmartMckessonLogicbroker'))
const MedmartPdpDemo = lazy(() => import('./components/MedmartPdpDemo'))
const MedmartDevOps = lazy(() => import('./components/MedmartDevOps'))
const MedmartRoadmap2026 = lazy(() => import('./components/MedmartRoadmap2026'))
const DemoStore = lazy(() => import('./components/demo/DemoStore'))
const EmailCampaigns = lazy(() => import('./components/demo/EmailCampaigns'))
const KloyHub = lazy(() => import('./components/KloyHub'))
const KloyProject = lazy(() => import('./components/KloyProject'))
const FxchPolc = lazy(() => import('./components/FxchPolc'))
const FxchModel = lazy(() => import('./components/FxchModel'))
const PrivacyAndTerms = lazy(() => import('./components/PrivacyAndTerms'))
const JtownLaunchPrep = lazy(() => import('./components/JtownLaunchPrep'))
const AIPage = lazy(() => import('./components/AIPage'))
const EmailsPage = lazy(() => import('./components/EmailsPage'))

function RouteTracker() {
  const location = useLocation()
  useEffect(() => {
    track('virtual_pageview', {
      page_path: location.pathname + location.search,
      page_title: document.title,
    })
  }, [location.pathname, location.search])
  return null
}

function ClickTracker() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const info = describeClick(e.target)
      if (!info) return
      track('ui_click', { ...info })
    }
    document.addEventListener('click', handler, { capture: true })
    return () => document.removeEventListener('click', handler, { capture: true })
  }, [])
  return null
}

export default function App() {
  return (
    <>
      <RouteTracker />
      <ClickTracker />
      <Suspense fallback={<div className="min-h-screen bg-bg" />}>
        <Routes>
          <Route path="/emails" element={<EmailsPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/medmart" element={<MedmartHub />} />
          <Route path="/medmart/demo" element={<MedmartDemo />} />
          <Route path="/medmart/ai-demo" element={<MedmartAIDemo />} />
          <Route path="/medmart/training" element={<MedmartTraining />} />
          <Route path="/medmart/convert-gmc" element={<MedmartGMCPage />} />
          <Route path="/medmart/criteo" element={<MedmartCriteoPage />} />
          <Route path="/medmart/criteo-ctm-walkthrough" element={<MedmartCriteoCtmWalkthrough />} />
          <Route path="/medmart/config-review" element={<MedmartConfigReview />} />
          <Route path="/medmart/cloudflare-review" element={<MedmartCloudflareReview />} />
          <Route path="/medmart/max-review" element={<MedmartMaxReview />} />
          <Route path="/medmart/fraud-review" element={<MedmartFraudReview />} />
          <Route path="/medmart/testbots-followup" element={<MedmartTestBotsFollowup />} />
          <Route path="/medmart/authnet-review" element={<MedmartAuthnetReview />} />
          <Route path="/medmart/mckesson-logicbroker" element={<MedmartMckessonLogicbroker />} />
          <Route path="/medmart/pdp-demo" element={<MedmartPdpDemo />} />
          <Route path="/medmart/roadmap2026" element={<MedmartRoadmap2026 />} />
          <Route path="/medmart/demo-store/*" element={<DemoStore />} />
          <Route path="/medmart/email-campaigns" element={<EmailCampaigns />} />
          <Route path="/medmart/devops" element={<MedmartDevOps />} />
          <Route path="/kloy/demo" element={<KloyHub />} />
          <Route path="/kloy/demo/:slug" element={<KloyProject />} />
          <Route path="/kloy/fxch" element={<FxchPolc />} />
          <Route path="/kloy/fxch/model" element={<FxchModel />} />
          <Route path="/jtowncafe/launch-prep" element={<JtownLaunchPrep />} />
          <Route path="/privacy-and-terms" element={<PrivacyAndTerms />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="*" element={<PortfolioLayout />} />
        </Routes>
      </Suspense>
      <ChatWidget />
    </>
  )
}
