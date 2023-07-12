const Hues = {
  PINK: 320,
  BLUE: 200
};

export function generateSwatches(hue) {
  return [
    `oklch(5% .1 ${hue})`,
    `oklch(13% .2 ${hue})`,
    `oklch(25% .2 ${hue})`,
    `oklch(35% .25 ${hue})`,
    `oklch(50% .27 ${hue})`,
    `oklch(67% .31 ${hue})`,
    `oklch(72% .25 ${hue})`,
    `oklch(80% .2 ${hue})`,
    `oklch(90% .1 ${hue})`,
    `oklch(99% .05 ${hue})`,
    '#ccc'
  ];
}

export const DEFAULT = [
  '#9e0142',
  '#d53e4f',
  '#f46d43',
  '#fdae61',
  '#fee08b',
  '#e6f598',
  '#abdda4',
  '#66c2a5',
  '#3288bd',
  '#5e4fa2',
  '#cccccc'
];

export const PINK = generateSwatches(Hues.PINK);
export const BLUE = generateSwatches(Hues.BLUE);

export const Palettes = {
  DEFAULT: DEFAULT,
  PINK: PINK,
  BLUE: BLUE
};

export function getInvalidBackgroundColor(elementColor) {
  let invalidColor = '#cccccc';
  if (elementColor == invalidColor) {
    invalidColor = 'red';
  }
  return `repeating-linear-gradient(45deg, ${elementColor}, ${elementColor} 3px, ${invalidColor} 3px, ${invalidColor} 6px)`;
}
