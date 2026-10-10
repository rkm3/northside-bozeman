import type { ImageMetadata } from 'astro';
import whoWeAre from '../assets/about/who-we-are.jpg';
import whatWeDo from '../assets/about/what-we-do.jpg';
import whyWeDoIt from '../assets/about/why-we-do-it.png';
import historicNpDepot from '../assets/about/historic-np-depot.png';
import galleryOpening from '../assets/about/gallery-opening.jpg';
import historicAerial from '../assets/about/historic-aerial.jpg';
import historicDepotWinter from '../assets/about/historic-depot-winter.jpg';

export const aboutSectionImages: Record<string, { src: ImageMetadata; alt: string }> = {
  'who-we-are': {
    src: whoWeAre,
    alt: 'A maker at work in a Northside studio workshop, with a cat watching from the bench.',
  },
  'what-we-do': {
    src: whatWeDo,
    alt: 'Art installation in the courtyard of the Historic Brewery District, with the grain elevator behind.',
  },
  'why-we-do-it': {
    src: whyWeDoIt,
    alt: 'Neighbors gathered outside House Beringia on East Peach Street during a Northside event.',
  },
};

export const aboutHeroImage = {
  src: historicNpDepot,
  alt: 'Historic Northern Pacific depot in Bozeman, with railroad tracks and the Bridgers beyond.',
  caption: 'N.P. Depot, Bozeman — the rail and brewery district that still shapes the Northside.',
} as const;

export const aboutArchiveImages: { src: ImageMetadata; alt: string; credit?: string }[] = [
  {
    src: galleryOpening,
    alt: 'Crowds at a Northside gallery opening.',
  },
  {
    src: historicAerial,
    alt: 'Historic aerial view of Bozeman’s Northside industrial and rail district.',
    credit: 'Photo courtesy of the Pioneer Museum',
  },
  {
    src: historicDepotWinter,
    alt: 'Northern Pacific depot in Bozeman in winter, with passengers on the platform.',
  },
];
