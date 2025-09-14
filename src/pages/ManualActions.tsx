import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Minus, Download, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';

const ManualActions = () => {
  const { t } = useLanguage();
  
  // Mock players data
  const players = [
    { id: 1, name: 'Carlos Rodríguez', number: 7, position: t('position.forward') },
    { id: 2, name: 'Miguel Ángel Torres', number: 10, position: t('position.midfielder') },
    { id: 3, name: 'David López', number: 4, position: t('position.defender') },
    { id: 4, name: 'Juan Martínez', number: 9, position: t('position.forward') },
    { id: 5, name: 'Roberto García', number: 6, position: t('position.midfielder') },
    { id: 6, name: 'Luis Sánchez', number: 3, position: t('position.defender') },
    { id: 7, name: 'Antonio Pérez', number: 2, position: t('position.defender') },
    { id: 8, name: 'Fernando Ruiz', number: 11, position: t('position.forward') },
    { id: 9, name: 'Pablo Díaz', number: 8, position: t('position.midfielder') },
    { id: 10, name: 'Javier Moreno', number: 1, position: t('position.goalkeeper') },
  ];

  // State para las estadísticas de cada jugador
  const [playerStats, setPlayerStats] = useState(() => {
    const initialStats: any = {};
    players.forEach(player => {
      initialStats[player.id] = {
        goles: 0,
        asistencias: 0,
        balonesPerdidos: 0,
        balonesRecuperados: 0,
        duelosGanados: 0,
        duelosPerdidos: 0,
        tirosPorteria: 0,
        tirosFuera: 0,
        faltasCometidas: 0,
        faltasRecibidas: 0,
        paradas: 0,
      };
    });
    return initialStats;
  });

  const updateStat = (playerId: number, stat: string, increment: boolean) => {
    setPlayerStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [stat]: Math.max(0, prev[playerId][stat] + (increment ? 1 : -1))
      }
    }));
  };

  // Save data to localStorage
  const saveData = () => {
    try {
      localStorage.setItem('statsor_manual_actions', JSON.stringify(playerStats));
      toast.success(t('manual.actions.save') + ' ' + t('general.success'));
    } catch (error) {
      toast.error(t('general.error') + ': ' + t('manual.actions.save').toLowerCase());
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Headers
      csvContent += [
        t('manual.actions.player'),
        t('manual.actions.goals'),
        t('manual.actions.assists'),
        t('manual.actions.balls.lost'),
        t('manual.actions.balls.recovered'),
        t('manual.actions.duels.won'),
        t('manual.actions.duels.lost'),
        t('manual.actions.shots.target'),
        t('manual.actions.shots.off'),
        t('manual.actions.fouls.committed'),
        t('manual.actions.fouls.received'),
        t('manual.actions.saves')
      ].join(",") + "\n";
      
      // Data rows
      players.forEach(player => {
        const stats = playerStats[player.id] || {};
        csvContent += [
          `"${player.name}"`,
          stats.goles || 0,
          stats.asistencias || 0,
          stats.balonesPerdidos || 0,
          stats.balonesRecuperados || 0,
          stats.duelosGanados || 0,
          stats.duelosPerdidos || 0,
          stats.tirosPorteria || 0,
          stats.tirosFuera || 0,
          stats.faltasCometidas || 0,
          stats.faltasRecibidas || 0,
          player.position === t('position.goalkeeper') ? (stats.paradas || 0) : 'N/A'
        ].join(",") + "\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "manual_actions_stats.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(t('manual.actions.export') + ' CSV ' + t('general.success'));
    } catch (error) {
      toast.error(t('general.error') + ': ' + t('manual.actions.export').toLowerCase() + ' CSV');
    }
  };

  // Export to JSON
  const exportToJSON = () => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        players: players.map(player => {
          const stats = playerStats[player.id] || {};
          return {
            id: player.id,
            name: player.name,
            number: player.number,
            position: player.position,
            stats: stats
          };
        })
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'manual_actions_stats.json';
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success(t('manual.actions.export') + ' JSON ' + t('general.success'));
    } catch (error) {
      toast.error(t('general.error') + ': ' + t('manual.actions.export').toLowerCase() + ' JSON');
    }
  };

  // Export to PDF (simplified version)
  const exportToPDF = () => {
    try {
      // In a real implementation, you would use a library like jsPDF
      // For now, we'll just show a toast message
      toast.info('PDF export functionality would be implemented with a PDF library');
    } catch (error) {
      toast.error(t('general.error') + ': ' + t('manual.actions.export').toLowerCase() + ' PDF');
    }
  };

  const StatCounter = ({ value, onIncrement, onDecrement }: { value: number, onIncrement: () => void, onDecrement: () => void }) => (
    <div className="flex items-center justify-center space-x-1">
      <Button
        size="sm"
        variant="outline"
        className="h-6 w-6 p-0 hover:bg-red-50 hover:border-red-300"
        onClick={onDecrement}
      >
        <Minus className="h-3 w-3 text-red-600" />
      </Button>
      <span className="w-8 text-center text-sm font-medium">{value}</span>
      <Button
        size="sm"
        variant="outline"
        className="h-6 w-6 p-0 hover:bg-green-50 hover:border-green-300"
        onClick={onIncrement}
      >
        <Plus className="h-3 w-3 text-green-600" />
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{t('manual.actions.title')}</h1>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={saveData}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {t('manual.actions.save')}
            </Button>
            <div className="relative">
              <Button 
                variant="outline"
                onClick={() => {
                  const menu = document.getElementById('export-menu');
                  if (menu) {
                    menu.classList.toggle('hidden');
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                {t('manual.actions.export')}
              </Button>
              <div 
                id="export-menu" 
                className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 border hidden"
              >
                <button
                  onClick={() => {
                    exportToCSV();
                    document.getElementById('export-menu')?.classList.add('hidden');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t('manual.actions.export.csv')}
                </button>
                <button
                  onClick={() => {
                    exportToJSON();
                    document.getElementById('export-menu')?.classList.add('hidden');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t('manual.actions.export.json')}
                </button>
                <button
                  onClick={() => {
                    exportToPDF();
                    document.getElementById('export-menu')?.classList.add('hidden');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t('manual.actions.export.pdf')}
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500 self-center">{t('manual.actions.realtime')}</div>
          </div>
        </div>

        {/* Tabla de Registro de Acciones */}
        <Card>
          <CardHeader>
            <CardTitle>{t('manual.actions.subtitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium">{t('manual.actions.player')}</th>
                    <th className="text-center p-3 font-medium">{t('manual.actions.goals')}</th>
                    <th className="text-center p-3 font-medium">{t('manual.actions.assists')}</th>
                    <th className="text-center p-3 font-medium">{t('manual.actions.balls.lost')}</th>
                    <th className="text-center p-3 font-medium">{t('manual.actions.balls.recovered')}</th>
                    <th className="text-center p-3 font-medium">{t('manual.actions.duels.won')}</th>
                    <th className="text-center p-3 font-medium">{t('manual.actions.duels.lost')}</th>
                    <th className="text-center p-3 font-medium">{t('manual.actions.shots.target')}</th>
                    <th className="text-center p-3 font-medium">{t('manual.actions.shots.off')}</th>
                    <th className="text-center p-3 font-medium">{t('manual.actions.fouls.committed')}</th>
                    <th className="text-center p-3 font-medium">{t('manual.actions.fouls.received')}</th>
                    <th className="text-center p-3 font-medium">{t('manual.actions.saves')}</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-sm">
                            {player.number}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{player.name}</p>
                            <p className="text-xs text-gray-500">{player.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <StatCounter
                          value={playerStats[player.id]?.goles || 0}
                          onIncrement={() => updateStat(player.id, 'goles', true)}
                          onDecrement={() => updateStat(player.id, 'goles', false)}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <StatCounter
                          value={playerStats[player.id]?.asistencias || 0}
                          onIncrement={() => updateStat(player.id, 'asistencias', true)}
                          onDecrement={() => updateStat(player.id, 'asistencias', false)}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <StatCounter
                          value={playerStats[player.id]?.balonesPerdidos || 0}
                          onIncrement={() => updateStat(player.id, 'balonesPerdidos', true)}
                          onDecrement={() => updateStat(player.id, 'balonesPerdidos', false)}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <StatCounter
                          value={playerStats[player.id]?.balonesRecuperados || 0}
                          onIncrement={() => updateStat(player.id, 'balonesRecuperados', true)}
                          onDecrement={() => updateStat(player.id, 'balonesRecuperados', false)}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <StatCounter
                          value={playerStats[player.id]?.duelosGanados || 0}
                          onIncrement={() => updateStat(player.id, 'duelosGanados', true)}
                          onDecrement={() => updateStat(player.id, 'duelosGanados', false)}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <StatCounter
                          value={playerStats[player.id]?.duelosPerdidos || 0}
                          onIncrement={() => updateStat(player.id, 'duelosPerdidos', true)}
                          onDecrement={() => updateStat(player.id, 'duelosPerdidos', false)}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <StatCounter
                          value={playerStats[player.id]?.tirosPorteria || 0}
                          onIncrement={() => updateStat(player.id, 'tirosPorteria', true)}
                          onDecrement={() => updateStat(player.id, 'tirosPorteria', false)}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <StatCounter
                          value={playerStats[player.id]?.tirosFuera || 0}
                          onIncrement={() => updateStat(player.id, 'tirosFuera', true)}
                          onDecrement={() => updateStat(player.id, 'tirosFuera', false)}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <StatCounter
                          value={playerStats[player.id]?.faltasCometidas || 0}
                          onIncrement={() => updateStat(player.id, 'faltasCometidas', true)}
                          onDecrement={() => updateStat(player.id, 'faltasCometidas', false)}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <StatCounter
                          value={playerStats[player.id]?.faltasRecibidas || 0}
                          onIncrement={() => updateStat(player.id, 'faltasRecibidas', true)}
                          onDecrement={() => updateStat(player.id, 'faltasRecibidas', false)}
                        />
                      </td>
                      <td className="p-3 text-center">
                        {player.position === t('position.goalkeeper') ? (
                          <StatCounter
                            value={playerStats[player.id]?.paradas || 0}
                            onIncrement={() => updateStat(player.id, 'paradas', true)}
                            onDecrement={() => updateStat(player.id, 'paradas', false)}
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">{t('manual.actions.na')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default ManualActions;