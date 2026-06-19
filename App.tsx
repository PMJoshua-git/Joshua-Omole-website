import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
      </Routes>
    </Router>
  );
};

export default App;