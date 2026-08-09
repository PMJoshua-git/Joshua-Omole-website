import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Training from './pages/Training';
import Audit from './pages/Audit';
import Contact from './pages/Contact';
import Connect from './pages/Connect';
import Newsletter from './pages/Newsletter';
import KnowledgeHub from './pages/KnowledgeHub';
import FloatingAssistant from './components/FloatingAssistant';
import { captureAttributionData } from './utils/attribution';

const TITLE_MAP: Record<string, string> = {
  "/": "Joshua Omole | Business Operations & AI Systems Strategist",
  "/about": "About | Joshua Omole | Business Operations & AI Systems Strategist",
  "/services": "Services | Joshua Omole | Business Operations & AI Systems Strategist",
  "/training": "Training | Joshua Omole | Business Operations & AI Systems Strategist",
  "/audit": "Free Systems Clarity Audit | Joshua Omole",
  "/contact": "Book a Call | Joshua Omole",
  "/connect": "Connect & Resources | Joshua Omole",
  "/newsletter": "Newsletter | Joshua Omole",
  "/knowledge-hub": "Knowledge Hub | Joshua Omole",
  "/knowledge": "Knowledge Hub | Joshua Omole",
};

const PageTitleUpdater = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const cleanPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    const title = TITLE_MAP[cleanPath] || TITLE_MAP["/"];
    document.title = title;
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
        <Route path="/contact" element={<Contact />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/newsletter" element={<Newsletter />} />
        <Route path="/knowledge-hub" element={<KnowledgeHub />} />
        <Route path="/knowledge" element={<KnowledgeHub />} />
      </Routes>
    </Router>
  );
};

export default App;