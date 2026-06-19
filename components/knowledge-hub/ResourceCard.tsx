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
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`bg-midnight/50 p-6 rounded-[2rem] border border-navy flex flex-col h-full shadow-lg group relative overflow-hidden ${isComingSoon ? 'opacity-80' : 'hover:border-blue/50'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-midnight/80 pointer-events-none z-10"></div>
      
      <div className="relative z-20 mb-6 h-48 w-full rounded-xl overflow-hidden border border-white/10 bg-navy/30 flex items-center justify-center">
        {isComingSoon && (
          <div className="absolute top-4 right-4 z-30 bg-purple text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-lg">
            Coming Soon
          </div>
        )}
        
        {/* Mockup shadow & positioning */}
        {resource.coverImageUrl ? (
          <img src={resource.coverImageUrl} alt={resource.title} className={`w-full h-full object-cover transition-opacity ${isComingSoon ? 'opacity-50' : 'opacity-80 group-hover:opacity-100'}`} />
        ) : (
          <div className="flex flex-col items-center justify-center text-silver/50">
            <BookOpen className="w-12 h-12 mb-2" />
            <span className="text-xs uppercase tracking-widest font-mono">No Cover Available</span>
          </div>
        )}
      </div>

      <div className="relative z-20 flex-grow flex flex-col">
        <div className="mb-3">
          <span className="text-xs font-mono text-purple py-1 px-3 rounded-full bg-purple/10 border border-purple/20">
            {resource.category}
          </span>
        </div>
        <h3 className="text-xl font-serif text-white mb-2 line-clamp-2">{resource.title}</h3>
        <p className="text-silver text-sm mb-6 flex-grow line-clamp-3">{resource.shortDescription}</p>
        
        <div className="mt-auto relative z-40 pointer-events-auto">
          <Button 
            onClick={() => onReadMore(resource)} 
            variant="outline" 
            className="w-full justify-center md:group-hover:bg-white md:group-hover:text-midnight border-navy hover:border-white transition-all"
          >
            Read More
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResourceCard;
