import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { PLACE_CATEGORIES } from './data/place-categories';

const EVENT_ARTIFACT_KINDS = ['poster', 'map', 'flyer', 'photo', 'other'] as const;

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number().default(0),
    section: z.enum(['home', 'about']),
  }),
});

const events = defineCollection({
  loader: glob({ base: './src/content/events', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    time: z.string().optional(),
    location: z.string(),
    summary: z.string(),
    featured: z.boolean().default(false),
    // Files live in public/events/<event id>/ and are referenced as /events/<event id>/<file>.
    artifacts: z
      .array(
        z.object({
          kind: z.enum(EVENT_ARTIFACT_KINDS),
          title: z.string(),
          file: z.string().startsWith('/events/'),
          credit: z.string().optional(),
        }),
      )
      .default([]),
  }),
});

const places = defineCollection({
  loader: glob({ base: './src/content/places', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    categories: z.array(z.enum(PLACE_CATEGORIES)).min(1),
    address: z.string(),
    website: z.url().optional(),
    phone: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
  }),
});

export const collections = { pages, events, places };
