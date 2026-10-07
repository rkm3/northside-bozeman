/**
 * Northside Bozeman brand palette. Mirrors the `@theme` tokens in `src/styles/global.css`;
 * keep both in sync. Scripts that can't read CSS variables (Google Maps) import from here.
 */
export const brandColors = {
  rust: '#A62B1D',
  rustDeep: '#7E2015',
  ember: '#D96B07',
  emberDeep: '#A85205',
  olive: '#5C6F3B',
  oliveDeep: '#46552C',
  ochre: '#EBAF17',
  paper: '#F9F5EE',
  surface: '#FDFBFA',
  ink: '#2C351F',
  muted: '#5B5F4C',
  line: '#E4DACB',
} as const;

export type BrandColorKey = keyof typeof brandColors;

export type LogoVariant = 'primary' | 'badge' | 'icon';

export interface BrandSwatch {
  key: BrandColorKey;
  name: string;
  token: string;
  role: string;
  usage: string;
}

/** The five colours from the official palette sheet. */
export const coreSwatches: BrandSwatch[] = [
  {
    key: 'rust',
    name: 'Rust Red',
    token: 'rust',
    role: 'Primary accent',
    usage: 'Primary buttons, links, active navigation, the “Northside” wordmark.',
  },
  {
    key: 'ember',
    name: 'Ember Orange',
    token: 'ember',
    role: 'Secondary',
    usage: 'Secondary buttons and large display type. Use Ember Deep for small text.',
  },
  {
    key: 'olive',
    name: 'Forest Olive',
    token: 'olive',
    role: 'Nature accent',
    usage: 'Icons, tags, illustration, quiet supporting headings.',
  },
  {
    key: 'ochre',
    name: 'Golden Ochre',
    token: 'ochre',
    role: 'Highlight',
    usage: 'Small highlights, badges and rules. Never as text on light backgrounds.',
  },
  {
    key: 'paper',
    name: 'Warm Off-White',
    token: 'paper',
    role: 'Background',
    usage: 'Page background. The canvas everything else sits on.',
  },
];

/** Functional colours for type, surfaces, and states. */
export const functionalSwatches: BrandSwatch[] = [
  {
    key: 'ink',
    name: 'Trail Ink',
    token: 'ink',
    role: 'Text',
    usage: 'Body copy, headings, and dark bands like the footer.',
  },
  {
    key: 'surface',
    name: 'Card Surface',
    token: 'surface',
    role: 'Surface',
    usage: 'Cards, header, inputs — anything raised off the page.',
  },
  {
    key: 'muted',
    name: 'Muted Ink',
    token: 'muted',
    role: 'Secondary text',
    usage: 'Ledes, captions, metadata.',
  },
  {
    key: 'line',
    name: 'Hairline',
    token: 'line',
    role: 'Borders',
    usage: 'Dividers and card borders.',
  },
  {
    key: 'rustDeep',
    name: 'Rust Deep',
    token: 'rust-deep',
    role: 'Hover / pressed',
    usage: 'Hover and pressed state for rust buttons and links.',
  },
  {
    key: 'emberDeep',
    name: 'Ember Deep',
    token: 'ember-deep',
    role: 'Accessible orange',
    usage: 'Orange text at body sizes (passes WCAG AA on paper).',
  },
  {
    key: 'oliveDeep',
    name: 'Olive Deep',
    token: 'olive-deep',
    role: 'Hover / pressed',
    usage: 'Hover state for olive buttons and tags.',
  },
];
