import React from 'react';
import { TestDataDisplay } from '../components/TestDataDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

export const TestPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Platform Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">The platform is running successfully with mock data!</p>
          <Button onClick={() => navigate('/')}>
            Go to Main Dashboard
          </Button>
        </CardContent>
      </Card>
      
      <TestDataDisplay />
    </div>
  );
};

export default TestPage;