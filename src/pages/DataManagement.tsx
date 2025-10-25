import React from 'react';
import { motion } from 'framer-motion';
import { DataManagementSection } from '../components/DataManagementSection';
import { useTheme } from '../contexts/ThemeContext';
<<<<<<< HEAD
import { Database } from 'lucide-react';
=======
import { Database, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { analyticsExportService, testPDFGeneration } from '../services/analyticsExportService';
>>>>>>> 5b1c6eafdf9968ae53e6d141d90a040247079721

const DataManagement: React.FC = () => {
  const { theme, isHighContrast } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="mb-6">
<<<<<<< HEAD
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Management</h1>
          <p className={`${
            isHighContrast ? 'hc-text' :
            theme === 'midnight' ? 'text-gray-600' : 'text-gray-600'
          }`}>
            Manage your team data, player information, and club details
          </p>
=======
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Management</h1>
            <p className={`${
              isHighContrast ? 'hc-text' :
              theme === 'midnight' ? 'text-gray-600' : 'text-gray-600'
            }`}>
              Manage your team data, player information, and club details
            </p>
          </div>
          <Button 
            onClick={testPDFGeneration} 
            variant="outline" 
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Test PDF</span>
          </Button>
>>>>>>> 5b1c6eafdf9968ae53e6d141d90a040247079721
        </div>
      </div>
      
      <DataManagementSection />
    </motion.div>
  );
};

export default DataManagement;