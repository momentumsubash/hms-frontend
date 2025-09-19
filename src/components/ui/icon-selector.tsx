import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import * as LucideIcons from 'lucide-react';

interface IconSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

// Import specific icons we want to use
import {
  Wifi, WifiOff, Tv, Phone, Mail,
  Bed, Bath, Fan, Snowflake, Thermometer,
  Coffee, UtensilsCrossed, Wine, Beer, 
  Car, MapPin, Clock, Bell,
  Shield, Lock, Key, Camera, 
  Trash2, Wrench, Hammer, 
  Dumbbell, Heart, 
  Briefcase, Printer, Laptop, Monitor,
  Music, Radio, Gamepad,
  Leaf, Sun, Cloud, Umbrella,
  Sparkles, Star, BookOpen
} from 'lucide-react';

// Map of available icons with their components
const ICON_MAP = {
  'Wifi': Wifi,
  'WifiOff': WifiOff,
  'Tv': Tv,
  'Phone': Phone,
  'Mail': Mail,
  'Bed': Bed,
  'Bath': Bath,
  'Fan': Fan,
  'Snowflake': Snowflake,
  'Thermometer': Thermometer,
  'Coffee': Coffee,
  'Utensils': UtensilsCrossed,
  'Wine': Wine,
  'Beer': Beer,
  'Car': Car,
  'MapPin': MapPin,
  'Clock': Clock,
  'Bell': Bell,
  'Shield': Shield,
  'Lock': Lock,
  'Key': Key,
  'Camera': Camera,
  'Trash2': Trash2,
  'Wrench': Wrench,
  'Hammer': Hammer,
  'Dumbbell': Dumbbell,
  'Heart': Heart,
  'Briefcase': Briefcase,
  'Printer': Printer,
  'Laptop': Laptop,
  'Monitor': Monitor,
  'Music': Music,
  'Radio': Radio,
  'Gamepad': Gamepad,
  'Leaf': Leaf,
  'Sun': Sun,
  'Cloud': Cloud,
  'Umbrella': Umbrella,
  'Sparkles': Sparkles,
  'Star': Star,
  'Book': BookOpen
} as const;

// Available icon names
const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export const IconSelector: React.FC<IconSelectorProps> = ({
  value = 'Star',  // Default to Star if no value provided
  onValueChange
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Start with all available icons
  const [filteredIcons, setFilteredIcons] = React.useState<string[]>(AVAILABLE_ICONS);

  React.useEffect(() => {
    // Filter icons based on search term
    const filtered = AVAILABLE_ICONS.filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIcons(filtered);
  }, [searchTerm]);

  // Get the icon component
  const IconComponent = React.useMemo(() => {
    return ICON_MAP[value as keyof typeof ICON_MAP] || ICON_MAP.Star;
  }, [value]);

  return (
    <>
      <Button 
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
      >
        <IconComponent className="w-4 h-4" />
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Icon</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[calc(80vh-8rem)]">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 p-4">
              {filteredIcons.map(iconName => {
                const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP];
                if (!IconComponent) return null;
                
                return (
                  <Button
                    key={iconName}
                    variant={value === iconName ? "default" : "outline"}
                    className="p-4 h-auto aspect-square flex flex-col gap-2"
                    onClick={() => {
                      onValueChange(iconName);
                      setIsOpen(false);
                    }}
                  >
                    <IconComponent className="w-6 h-6" />
                    <span className="text-xs">{iconName}</span>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};