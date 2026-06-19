import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

interface DownloadCounterProps {
  value: number;
}

const DownloadCounter: React.FC<DownloadCounterProps> = ({ value }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="flex items-center gap-2 mt-4 text-sm text-silver">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      <span>
        Viewed by <motion.span className="font-bold text-white">{count}</motion.span> professionals recently
      </span>
    </div>
  );
};

export default DownloadCounter;
