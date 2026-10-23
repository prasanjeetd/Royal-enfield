export interface BikeSpec {
  label: string;
  value: string;
}

export interface Bike {
  name: string;
  src: string;
  bg: string;
  panel: string;
  tagline?: string;
  engine?: string;
  power?: string;
  torque?: string;
  description?: string;
  categoryBadge?: string;
  specs?: BikeSpec[];
}

export type CarouselRole = 'center' | 'left' | 'right' | 'back';
export type NavigationDirection = 'next' | 'prev';
