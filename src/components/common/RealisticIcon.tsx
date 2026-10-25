import React from 'react';
import {
  Coffee,
  CupSoda,
  Sparkles,
  Flame,
  Zap,
  Leaf,
  Activity,
  Dumbbell,
  Footprints,
  Trophy,
  Waves,
  Gamepad2,
  Compass,
  Sun,
  Moon,
  Car,
  Heart,
  Utensils,
  Pizza,
  Fish,
  Salad,
  Clock,
  GlassWater,
  Citrus,
  Shield,
  BatteryCharging,
  Navigation,
  Smile,
  TrendingUp,
  MessageCircle,
  Tv,
  Landmark,
  Mountain,
  Award,
  Plane,
  Music,
  BookOpen,
  Camera,
  Laptop,
  Cpu,
  Users,
  Ticket,
  Palette,
  Headphones,
  CircleOff,
  Globe,
  Film,
  Code2,
  Puzzle,
  Smartphone,
} from 'lucide-react';

export interface RealisticIconProps {
  iconKey?: string;
  name?: string;
  size?: number;
  className?: string;
}

export const RealisticIcon: React.FC<RealisticIconProps> = ({
  iconKey,
  name,
  size = 20,
  className = '',
}) => {
  const key = name || iconKey || '';

  const map: Record<string, React.ReactNode> = {
    coffee: <Coffee size={size} />,
    cup: <Coffee size={size} />,
    'cup-soda': <CupSoda size={size} />,
    sparkles: <Sparkles size={size} />,
    flame: <Flame size={size} />,
    zap: <Zap size={size} />,
    leaf: <Leaf size={size} />,
    activity: <Activity size={size} />,
    dumbbell: <Dumbbell size={size} />,
    footprints: <Footprints size={size} />,
    trophy: <Trophy size={size} />,
    waves: <Waves size={size} />,
    gamepad: <Gamepad2 size={size} />,
    compass: <Compass size={size} />,
    sun: <Sun size={size} />,
    moon: <Moon size={size} />,
    car: <Car size={size} />,
    heart: <Heart size={size} />,
    utensils: <Utensils size={size} />,
    pizza: <Pizza size={size} />,
    fish: <Fish size={size} />,
    salad: <Salad size={size} />,
    clock: <Clock size={size} />,
    'glass-water': <GlassWater size={size} />,
    citrus: <Citrus size={size} />,
    shield: <Shield size={size} />,
    'battery-charging': <BatteryCharging size={size} />,
    navigation: <Navigation size={size} />,
    smile: <Smile size={size} />,
    'trending-up': <TrendingUp size={size} />,
    'message-circle': <MessageCircle size={size} />,
    tv: <Tv size={size} />,
    landmark: <Landmark size={size} />,
    mountain: <Mountain size={size} />,
    award: <Award size={size} />,
    plane: <Plane size={size} />,
    music: <Music size={size} />,
    book: <BookOpen size={size} />,
    camera: <Camera size={size} />,
    laptop: <Laptop size={size} />,
    cpu: <Cpu size={size} />,
    users: <Users size={size} />,
    ticket: <Ticket size={size} />,
    palette: <Palette size={size} />,
    headphones: <Headphones size={size} />,
    ban: <CircleOff size={size} />,
    globe: <Globe size={size} />,
    film: <Film size={size} />,
    code: <Code2 size={size} />,
    puzzle: <Puzzle size={size} />,
    smartphone: <Smartphone size={size} />,
  };

  const renderedIcon = map[key] || <Sparkles size={size} />;

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      {renderedIcon}
    </span>
  );
};
