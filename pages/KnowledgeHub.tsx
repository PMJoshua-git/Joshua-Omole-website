import React, { useState } from 'react';
import Layout from '../components/Layout';
import FadeIn from '../components/FadeIn';
import Button from '../components/Button';
import ResourceGrid from '../components/knowledge-hub/ResourceGrid';
import ResourceModal from '../components/knowledge-hub/ResourceModal';
import LeadCaptureModal from '../components/knowledge-hub/LeadCaptureModal';
import SuccessModal from '../components/knowledge-hub/SuccessModal';
import { Resource } from '../types';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { useResources } from '../hooks/useResources';

const KnowledgeHub: React.FC = () => {
  const { resources, loading, error } = useResources();
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const handleReadMore = (resource: Resource) => {
    setSelectedResource(resource);
  };

  const handleAccessResource = (resource: Resource) => {
    setIsLeadModalOpen(true);
  };

  const handleLeadSuccess = () => {
    setIsLeadModalOpen(false);
    setSelectedResource(null);
    setIsSuccessModalOpen(true);
  };

  const handleBrowseMore = () => {
    setIsSuccessModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Group resources based on category constraints dynamically
  const featuredResources = resources.filter(r => r.featured);
  
  // Get unique categories excluding "Featured" if it was incorrectly used as a category
  // Wait, the API only returns Published or Coming Soon, so we filter out Drafts/Archived
  const categories = Array.from(new Set(resources.map(r => r.category))).filter(c => c && c !== 'Featured');

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-32 pb-20 max-w-7xl mx-auto overflow-hidden text-center min-h-[50vh] flex flex-col items-center justify-center">
        {/* Glow Backgrounds */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
        
        <FadeIn direction="up" className="relative z-10 w-full max-w-4xl mx-auto">
          <div className="font-mono text-purple mb-6 tracking-wider text-sm border border-purple/30 inline-block px-4 py-1.5 rounded-full bg-purple/10">
            Resource Library
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-tight mb-8">
            Practical Resources for <br/> <span className="text-transparent bg-clip-text bg-neon-gradient">Smarter Business Operations</span>
          </h1>
          <p className="text-lg md:text-xl text-silver leading-relaxed mb-12 max-w-2xl mx-auto">
            Explore practical guides, frameworks, and implementation resources designed to help leaders understand AI, design better systems, and build operations that actually scale.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button onClick={() => {
                const element = document.getElementById('resources');
                element?.scrollIntoView({ behavior: 'smooth' });
              }} variant="primary" size="large" className="w-full sm:w-auto">
              Browse Resources <Search className="ml-2 w-5 h-5" />
            </Button>
            <Button to="/newsletter" variant="outline" size="large" className="w-full sm:w-auto">
              Join Newsletter
            </Button>
          </div>
        </FadeIn>
      </section>

      {/* Main Content Area */}
      <section id="resources" className="px-4 sm:px-6 lg:px-8 pb-32 max-w-7xl mx-auto relative z-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-silver">
            <Loader2 className="w-8 h-8 animate-spin text-blue mb-4" />
            <p className="animate-pulse">Loading resources...</p>
          </div>
        )}

        {error && !loading && (
           <div className="flex flex-col items-center justify-center py-20 text-silver/70 border border-navy/50 rounded-[2rem] bg-midnight/30">
             <AlertCircle className="w-8 h-8 text-red-500/80 mb-4" />
             <p>Unable to load resources at this time. Please check back later.</p>
           </div>
        )}

        {!loading && !error && resources.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 text-silver/70 border border-navy/50 rounded-[2rem] bg-midnight/30">
             <p>No resources available just yet. Check back soon!</p>
           </div>
        )}

        {!loading && !error && resources.length > 0 && (
          <>
            {featuredResources.length > 0 && (
              <ResourceGrid 
                title="Featured Resources" 
                resources={featuredResources} 
                onReadMore={handleReadMore} 
              />
            )}
            
            {categories.map((category) => {
               const categoryResources = resources.filter(r => r.category === category);
               if (categoryResources.length === 0) return null;
               
               return (
                 <ResourceGrid 
                   key={category}
                   title={category} 
                   resources={categoryResources} 
                   onReadMore={handleReadMore} 
                 />
               );
            })}
          </>
        )}
      </section>

      {/* Modals */}
      <ResourceModal 
        resource={selectedResource} 
        onClose={() => setSelectedResource(null)} 
        onAccess={handleAccessResource}
      />

      <LeadCaptureModal 
        resource={selectedResource}
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSuccess={handleLeadSuccess}
      />

      <SuccessModal 
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onBrowseMore={handleBrowseMore}
      />

    </Layout>
  );
};

export default KnowledgeHub;
