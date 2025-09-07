import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useSport, Sport } from '../contexts/SportContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, Users, Clock, Target } from 'lucide-react';

interface SportSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SportSelectionModal: React.FC<SportSelectionModalProps> = ({ isOpen, onClose }) => {
  const { setSport, completeSportSelection } = useSport();
  const { t } = useLanguage();
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);

  const handleSportSelection = (sport: Sport) => {
    setSelectedSport(sport);
  };

  const handleConfirm = () => {
    if (selectedSport) {
      setSport(selectedSport);
      completeSportSelection();
      onClose();
    }
  };

  const sports = [
    {
      id: 'soccer' as Sport,
      name: t('sport.soccer'),
      description: t('sport.soccer.description'),
      features: [
        t('sport.soccer.feature1'),
        t('sport.soccer.feature2'),
        t('sport.soccer.feature3'),
        t('sport.soccer.feature4')
      ],
      icon: '⚽',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'futsal' as Sport,
      name: t('sport.futsal'),
      description: t('sport.futsal.description'),
      features: [
        t('sport.futsal.feature1'),
        t('sport.futsal.feature2'),
        t('sport.futsal.feature3'),
        t('sport.futsal.feature4')
      ],
      icon: '🏟️',
      color: 'from-blue-500 to-blue-600'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center mb-4">
            {t('sport.selection.title')}
          </DialogTitle>
          <p className="text-center text-gray-600 mb-8">
            {t('sport.selection.subtitle')}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {sports.map((sport) => (
            <motion.div
              key={sport.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: sport.id === 'soccer' ? 0.1 : 0.2 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                  selectedSport === sport.id
                    ? 'ring-4 ring-primary shadow-xl scale-105'
                    : 'hover:scale-102'
                }`}
                onClick={() => handleSportSelection(sport.id)}
              >
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${sport.color} flex items-center justify-center text-4xl shadow-lg`}>
                      {sport.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {sport.name}
                    </h3>
                    <p className="text-gray-600">
                      {sport.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {sport.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${sport.color} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {selectedSport === sport.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20"
                    >
                      <p className="text-sm text-primary font-medium text-center">
                        {t('sport.selection.selected')}
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center p-6">
          <Button
            onClick={handleConfirm}
            disabled={!selectedSport}
            className="px-8 py-3 text-lg font-semibold bg-primary hover:bg-primary/90"
          >
            {t('sport.selection.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};