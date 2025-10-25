import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Player {
  id?: string;
  name: string;
  position: string;
  jersey_number?: number;
  age?: number;
  nationality?: string;
}

const mockPlayers: Player[] = [
  { id: '1', name: 'Torres', position: 'ST', jersey_number: 9, age: 24, nationality: 'Spain' },
  { id: '2', name: 'Silva', position: 'CM', jersey_number: 8, age: 26, nationality: 'Brazil' },
  { id: '3', name: 'Rodriguez', position: 'CB', jersey_number: 4, age: 28, nationality: 'Argentina' },
  { id: '4', name: 'Martinez', position: 'GK', jersey_number: 1, age: 29, nationality: 'Uruguay' }
];

export const TestDataDisplay: React.FC = () => {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Data Display</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Players</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockPlayers.map((player) => (
              <Card key={player.id} className="p-4">
                <h4 className="font-bold">{player.name}</h4>
                <p>Position: {player.position}</p>
                <p>Jersey: #{player.jersey_number}</p>
                <p>Age: {player.age}</p>
                <p>Nationality: {player.nationality}</p>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};