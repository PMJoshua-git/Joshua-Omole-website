import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, FileText, Download } from 'lucide-react';
import { Resource } from '../../types';
import Button from '../Button';
import DownloadCounter from './DownloadCounter';

interface ResourceModalProps {
  resource: Resource | null;
  onClose: () => void;
  onAccess: (resource: Resource) => void;
}

const ResourceModal: React.FC<ResourceModalProps> = ({ resource, onClose, onAccess }) => {
  if (!resource) return null;

  const isComingSoon = resource.status === 'Coming Soon';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 p-safe-area">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-4xl bg-midnight border border-navy shadow-2xl rounded-[2.5rem] overflow-hidden overscroll-contain max-h-[90vh] flex flex-col md:flex-row pointer-events-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 text-silver md:hover:text-white bg-midnight/50 md:hover:bg-navy rounded-full transition-colors backdrop-blur-md"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Column - Image/Mockup */}
          <div className="md:w-5/12 bg-navy/20 relative flex items-center justify-center p-8 border-r border-navy/50 h-64 md:h-auto shrink-0">
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue/10 to-purple/10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue/20 blur-[60px] rounded-full"></div>
            
            <div className="relative z-10 w-full h-full max-h-[300px] border border-white/10 rounded-2xl overflow-hidden bg-obsidian/50 shadow-2xl flex flex-col items-center justify-center">
               {resource.coverImageUrl ? (
                  <img src={resource.coverImageUrl} alt={resource.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <FileText className="w-16 h-16 text-blue/50 mb-4" />
                    <span className="text-white font-serif font-medium leading-snug">{resource.title}</span>
                  </div>
                )}
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="md:w-7/12 p-8 md:p-12 overflow-y-auto">
            <div className="mb-4">
              <span className="text-xs font-mono text-purple py-1 px-3 rounded-full bg-purple/10 border border-purple/20">
                {resource.category}
              </span>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-serif text-white mb-6 leading-tight">
              {resource.title}
            </h2>

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 text-silver text-sm bg-obsidian/50 px-3 py-1.5 rounded-full border border-navy/50">
                <Clock className="w-4 h-4 text-blue" />
                <span>{resource.estimatedReadingTime}</span>
              </div>
              <div className="flex items-center gap-2 text-silver text-sm bg-obsidian/50 px-3 py-1.5 rounded-full border border-navy/50">
                <FileText className="w-4 h-4 text-purple" />
                <span>{resource.format}</span>
              </div>
            </div>

            <p className="text-silver leading-relaxed mb-10 whitespace-pre-wrap">
              {resource.longDescription || resource.shortDescription}
            </p>

            <div className="flex flex-col items-center mt-12 bg-navy/20 p-6 rounded-2xl border border-navy/50">
              <Button 
                onClick={() => !isComingSoon && onAccess(resource)}
                variant={isComingSoon ? "outline" : "primary"}
                size="large" 
                className={`w-full sm:w-auto ${isComingSoon ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''}`}
                disabled={isComingSoon}
              >
                {isComingSoon ? 'Coming Soon' : 'Access Resource'} 
                {!isComingSoon && <Download className="ml-2 w-5 h-5" />}
              </Button>
              {resource.socialProofCount > 0 && !isComingSoon && (
                <DownloadCounter value={resource.socialProofCount} />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ResourceModal;
