import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Home, Search } from 'lucide-react';
import Button from '../Button';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrowseMore: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, onBrowseMore }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 p-safe-area">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-sage-bg/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative z-10 w-full max-w-md bg-sage-surface border border-sage-border shadow-sm rounded-2xl overflow-hidden text-center pointer-events-auto"
        >
          <div className="p-10 md:p-12">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-sage-primary/10 flex items-center justify-center mx-auto mb-6 border border-sage-primary/20"
            >
              <CheckCircle2 className="w-10 h-10 text-sage-primary" />
            </motion.div>
            
            <h3 className="text-2xl md:text-3xl font-serif text-sage-text mb-4">Your Resource Is On Its Way</h3>
            <p className="text-sage-muted mb-8 leading-relaxed">
              Check your inbox. We've sent your requested resource and access instructions. It might take a minute or two to arrive.
            </p>

            <div className="space-y-4">
              <Button 
                onClick={onBrowseMore} 
                variant="primary" 
                className="w-full justify-center"
              >
                Browse More Resources <Search className="ml-2 w-4 h-4" />
              </Button>
              <Button 
                to="/" 
                variant="outline" 
                className="w-full justify-center"
              >
                Return Home <Home className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="h-2 w-full bg-sage-primary"></div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SuccessModal;
