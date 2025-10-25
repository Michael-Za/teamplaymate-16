import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';

export const TestPage: React.FC = () => {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Platform Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">The frontend is running successfully!</p>
          <Button onClick={() => window.location.href = '/'}>
            Go to Main Platform
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};