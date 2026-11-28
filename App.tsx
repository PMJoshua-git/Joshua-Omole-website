import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Training from './pages/Training';
import Audit from './pages/Audit';
import Contact from './pages/Contact';
import Connect from './pages/Connect';
import Newsletter from './pages/Newsletter';
import KnowledgeHub from './pages/KnowledgeHub';
import ResourceDetail from './pages/ResourceDetail';
import BusinessWorkflowFixes from './pages/BusinessWorkflowFixes';
import ClarityMap from './pages/ClarityMap';
import NotFound from './pages/NotFound';
import FloatingAssistant from './components/FloatingAssistant';
import ClarityMapPopup from './components/ClarityMapPopup';
import { captureAttributionData } from './utils/attribution';

const TITLE_MAP: Record<string, string> = {
  "/": "Joshua Omole | Business Operations & AI Systems Strategist",
  "/about": "About | Joshua Omole | Business Operations & AI Systems Strategist",
  "/services": "Services | Joshua Omole | Business Operations & AI Systems Strategist",
  "/training": "Training | Joshua Omole | Business Operations & AI Systems Strategist",
  "/audit": "Free Systems Clarity Audit | Joshua Omole",
  "/contact": "Book a session | Joshua Omole",
  "/connect": "Connect & Resources | Joshua Omole",
  "/newsletter": "Newsletter | Joshua Omole",
  "/resources": "Resources | Joshua Omole",
  "/knowledge-hub": "Resources | Joshua Omole",
  "/knowledge": "Resources | Joshua Omole",
  "/business-workflow-fixes": "Business Workflow Fixes | Joshua Omole",
  "/clarity-map": "Clarity Map | Interactive Business Workflow Diagnostic | Joshua Omole",
};

const PageTitleUpdater = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const cleanPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    const title = TITLE_MAP[cleanPath];
    if (title) {
      document.title = title;
    }
  }, [pathname]);

  return null;
};

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AttributionTracker = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    captureAttributionData(search);
  }, [pathname, search]);
  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <PageTitleUpdater />
      <AttributionTracker />
      <FloatingAssistant />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/training" element={<Training />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/contact" element={<Navigate to="/audit" replace />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/newsletter" element={<Newsletter />} />
        <Route path="/resources" element={<KnowledgeHub />} />
        <Route path="/resources/:slug" element={<ResourceDetail />} />
        <Route path="/knowledge-hub" element={<Navigate to="/resources" replace />} />
        <Route path="/knowledge" element={<Navigate to="/resources" replace />} />
        <Route path="/business-workflow-fixes" element={<BusinessWorkflowFixes />} />
        <Route path="/clarity-map" element={<ClarityMap />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ClarityMapPopup />
    </Router>
  );
};

export default App;