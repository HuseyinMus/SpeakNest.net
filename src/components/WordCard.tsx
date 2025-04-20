import React, { useState } from 'react';
import { Word } from '@/types/word';
import { motion } from 'framer-motion';

interface WordCardProps {
  word: Word;
  onNext: () => void;
  onPrevious: () => void;
}

const WordCard: React.FC<WordCardProps> = ({ word, onNext, onPrevious }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div
        className={`relative h-64 cursor-pointer perspective-1000`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className={`absolute w-full h-full backface-hidden ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col justify-center items-center">
            <h2 className="text-2xl font-bold mb-4">{word.english}</h2>
            <p className="text-gray-600">{word.example}</p>
          </div>
        </motion.div>

        <motion.div
          className={`absolute w-full h-full backface-hidden ${
            isFlipped ? '' : 'rotate-y-180'
          }`}
          animate={{ rotateY: isFlipped ? 0 : 180 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col justify-center items-center">
            <h2 className="text-2xl font-bold mb-4">{word.turkish}</h2>
            <p className="text-gray-600">{word.example}</p>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={onPrevious}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Önceki
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Sonraki
        </button>
      </div>
    </motion.div>
  );
};

export default WordCard; 