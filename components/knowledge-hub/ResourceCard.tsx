import React from 'react';
import { motion } from 'framer-motion';
import { Resource } from '../../types';
import Button from '../Button';
import { BookOpen } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onReadMore: (resource: Resource) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onReadMore }) => {
  const isComingSoon = resource.status === 'Coming Soon';

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`bg-sage-surface p-6 rounded-xl border border-sage-border flex flex-col h-full shadow-sm group relative overflow-hidden transition-shadow duration-250 ${isComingSoon ? 'opacity-80' : 'hover:border-sage-primary/40 hover:shadow-md hover:bg-sage-surface-2'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-sage-surface/10 pointer-events-none z-10"></div>
      
      <div className="relative z-20 mb-6 h-48 w-full rounded-xl overflow-hidden border border-sage-border bg-sage-surface-2 flex items-center justify-center">
        {isComingSoon && (
          <div className="absolute top-4 right-4 z-30 bg-sage-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-md">
            Coming Soon
          </div>
        )}
        
        {/* Mockup shadow & positioning */}
        {resource.coverImageUrl ? (
          <img src={resource.coverImageUrl} alt={resource.title} className={`w-full h-full object-cover transition-opacity ${isComingSoon ? 'opacity-50' : 'opacity-80 group-hover:opacity-100'}`} />
        ) : (
          <div className="flex flex-col items-center justify-center text-sage-muted">
            <BookOpen className="w-12 h-12 mb-2" />
            <span className="text-xs uppercase tracking-widest font-mono">No Cover Available</span>
          </div>
        )}
      </div>

      <div className="relative z-20 flex-grow flex flex-col">
        <div className="mb-3">
          <span className="text-xs font-mono text-sage-primary py-1 px-3 rounded-full bg-sage-surface-2 border border-sage-border">
            {resource.category}
          </span>
        </div>
        <h3 className="text-xl font-serif text-sage-text mb-2 line-clamp-2">{resource.title}</h3>
        <p className="text-sage-muted text-sm mb-6 flex-grow line-clamp-3">{resource.shortDescription}</p>
        
        <div className="mt-auto relative z-40 pointer-events-auto">
          <Button 
            onClick={() => onReadMore(resource)} 
            variant="outline" 
            className="w-full justify-center border-sage-border hover:border-sage-primary hover:bg-sage-primary hover:text-white transition-all"
          >
            Read More
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResourceCard;
