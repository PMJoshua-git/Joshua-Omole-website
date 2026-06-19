import React from 'react';
import { motion } from 'framer-motion';
import { Resource } from '../../types';
import ResourceCard from './ResourceCard';

interface ResourceGridProps {
  title: string;
  description?: string;
  resources: Resource[];
  onReadMore: (resource: Resource) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const ResourceGrid: React.FC<ResourceGridProps> = ({ title, description, resources, onReadMore }) => {
  if (resources.length === 0) return null;

  return (
    <div className="mb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-white mb-2">{title}</h2>
        {description && <p className="text-silver">{description}</p>}
        <div className="w-20 h-1 bg-neon-gradient rounded-full mt-4"></div>
      </div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {resources.map((resource) => (
          <motion.div key={resource.id} variants={item} className="h-full">
            <ResourceCard resource={resource} onReadMore={onReadMore} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ResourceGrid;
