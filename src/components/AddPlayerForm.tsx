
import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface Player {
  id: string;
  number: number;
  name: string;
  nickname?: string;
  position: string;
  age: number;
  nationality: string;
  height?: number | undefined;
  weight?: number | undefined;
  secondaryPositions?: string[];
  dominantFoot: string;
  birthDate: Date;
  goals: number;
  assists: number;
  games: number;
  yellowCards: number;
  redCards: number;
  minutes: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  foulsCommitted: number;
  foulsReceived: number;
  ballsLost: number;
  ballsRecovered: number;
  duelsWon: number;
  duelsLost: number;
  crosses: number;
  saves?: number;
  photo?: string;
  shotMap?: { [key: string]: number };
}

interface AddPlayerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: Omit<Player, 'id'>) => void;
}

const AddPlayerForm: React.FC<AddPlayerFormProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    birthDate: undefined as Date | undefined,
    nationality: '',
    height: '',
    weight: '',
    position: '',
    secondaryPositions: [] as string[],
    dominantFoot: '',
    number: '',
    photo: ''
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const positions = [
    { value: 'POR', label: 'Portero' },
    { value: 'DEF', label: 'Defensa' },
    { value: 'CEN', label: 'Centrocampista' },
    { value: 'DEL', label: 'Delantero' }
  ];

  const countries = [
    'España', 'Francia', 'Alemania', 'Italia', 'Portugal', 'Brasil', 'Argentina', 
    'Inglaterra', 'Holanda', 'Bélgica', 'Croatia', 'México', 'Colombia', 'Uruguay'
  ];

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
        setFormData(prev => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.position || !formData.number || !formData.birthDate) {
      alert('Por favor, completa los campos obligatorios: nombre, posición, número y fecha de nacimiento.');
      return;
    }

    const age = calculateAge(formData.birthDate);
    
    const newPlayer: Omit<Player, 'id'> = {
      number: parseInt(formData.number),
      name: formData.name,
      nickname: formData.nickname || '',
      position: formData.position,
      age,
      nationality: formData.nationality,
      height: formData.height ? parseInt(formData.height) : undefined,
      weight: formData.weight ? parseInt(formData.weight) : undefined,
      secondaryPositions: formData.secondaryPositions,
      dominantFoot: formData.dominantFoot,
      birthDate: formData.birthDate,
      goals: 0,
      assists: 0,
      games: 0,
      yellowCards: 0,
      redCards: 0,
      minutes: 0,
      shots: 0,
      shotsOnTarget: 0,
      passes: 0,
      passAccuracy: 0,
      foulsCommitted: 0,
      foulsReceived: 0,
      ballsLost: 0,
      ballsRecovered: 0,
      duelsWon: 0,
      duelsLost: 0,
      crosses: 0,
      saves: 0,
      photo: formData.photo || '',
      shotMap: { 'top-left': 0, 'top-center': 0, 'top-right': 0, 'middle-left': 0, 'middle-center': 0, 'middle-right': 0, 'bottom-left': 0, 'bottom-center': 0, 'bottom-right': 0 }
    };

    onSave(newPlayer);
    handleCancel();
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      nickname: '',
      birthDate: undefined,
      nationality: '',
      height: '',
      weight: '',
      position: '',
      secondaryPositions: [],
      dominantFoot: '',
      number: '',
      photo: ''
    });
    setPhotoPreview(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Añadir Nuevo Jugador</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* BLOQUE 1 - DATOS PERSONALES */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-blue-600 mb-4">Datos Personales</h3>
            
            {/* Foto del jugador */}
            <div className="mb-4 text-center">
              <div className="relative inline-block">
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Vista previa"
                    className="w-24 h-24 rounded-xl object-cover border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center border-2 border-gray-300">
                    <Upload className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">Subir foto (opcional)</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Fernando Torres"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apodo o nombre deportivo
                </label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  placeholder="Ej: El Niño"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de nacimiento *
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.birthDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.birthDate ? format(formData.birthDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.birthDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, birthDate: date }))}
                      disabled={(date) => date > new Date() || date < new Date("1960-01-01")}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {formData.birthDate && (
                  <p className="text-xs text-gray-600 mt-1">
                    Edad: {calculateAge(formData.birthDate)} años
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nacionalidad
                </label>
                <Select value={formData.nationality} onValueChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Altura (cm)
                  </label>
                  <Input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="180"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso (kg)
                  </label>
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="75"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* BLOQUE 2 - DATOS DEPORTIVOS */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-blue-600 mb-4">Datos Deportivos</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posición principal *
                </label>
                <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar posición" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.value} value={pos.value}>
                        {pos.label} ({pos.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pierna dominante
                </label>
                <Select value={formData.dominantFoot} onValueChange={(value) => setFormData(prev => ({ ...prev, dominantFoot: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar pierna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="izquierda">Izquierda</SelectItem>
                    <SelectItem value="derecha">Derecha</SelectItem>
                    <SelectItem value="ambidiestro">Ambidiestro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de dorsal *
                </label>
                <Input
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="9"
                  min="1"
                  max="99"
                  className="w-full"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 p-6 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            Guardar jugador
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerForm;
