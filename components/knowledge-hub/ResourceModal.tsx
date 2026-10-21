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
          className="absolute inset-0 bg-sage-text/80"
        />
        
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-4xl bg-sage-surface border border-sage-border shadow-2xl rounded-xl overflow-hidden overscroll-contain max-h-[90vh] flex flex-col md:flex-row pointer-events-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 text-sage-muted hover:text-sage-primary bg-sage-surface-2 hover:bg-sage-bg rounded-full transition-colors shadow-sm"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Column - Image/Mockup */}
          <div className="md:w-5/12 bg-sage-surface-2 relative flex items-center justify-center p-8 border-r border-sage-border h-64 md:h-auto shrink-0">
            
            <div className="relative z-10 w-full h-full max-h-[300px] border border-sage-border rounded-xl overflow-hidden bg-sage-surface shadow-md flex flex-col items-center justify-center">
               {resource.coverImageUrl ? (
                   <img src={resource.coverImageUrl} alt={resource.title} className="w-full h-full object-cover" />
                 ) : (
                   <div className="flex flex-col items-center justify-center p-6 text-center">
                     <FileText className="w-16 h-16 text-sage-primary/50 mb-4" />
                     <span className="text-sage-text font-serif font-medium leading-snug">{resource.title}</span>
                   </div>
                 )}
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="md:w-7/12 p-8 md:p-12 overflow-y-auto">
            <div className="mb-4">
              <span className="text-xs font-mono text-sage-primary py-1 px-3 rounded-full bg-sage-surface-2 border border-sage-border">
                {resource.category}
              </span>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-serif text-sage-text mb-6 leading-tight">
              {resource.title}
            </h2>

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 text-sage-muted text-sm bg-sage-surface px-3 py-1.5 rounded-full border border-sage-border">
                <Clock className="w-4 h-4 text-sage-primary" />
                <span>{resource.estimatedReadingTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sage-muted text-sm bg-sage-surface px-3 py-1.5 rounded-full border border-sage-border">
                <FileText className="w-4 h-4 text-sage-primary" />
                <span>{resource.format}</span>
              </div>
            </div>

            <p className="text-sage-muted leading-relaxed mb-10 whitespace-pre-wrap">
              {resource.longDescription || resource.shortDescription}
            </p>

            <div className="flex flex-col items-center mt-12 bg-sage-surface-2 p-6 rounded-xl border border-sage-border">
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
