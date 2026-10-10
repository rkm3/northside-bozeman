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
  schema: ({ image }) => z.object({
    name: z.string(),
    // live: on the map and directory. draft: only in astro dev (or when
    // PUBLIC_INCLUDE_DRAFTS=1). archived: place page kept for history, hidden
    // from the map; use successor for “became …” links.
    status: z.enum(['live', 'draft', 'archived']).default('live'),
    // Place id of the business this one became (archived only), e.g. a-show-of-hands.
    successor: z.string().optional(),
    categories: z.array(z.enum(PLACE_CATEGORIES)).min(1),
    address: z.string(),
    website: z.url().optional(),
    phone: z.string().optional(),
    email: z.email().optional(),
    // Member-only contacts. Never rendered on public pages; encrypted into
    // public/member/contacts.enc.json for /member/contacts. Fields prefixed
    // private_ must not be serialized to the client.
    private_contacts: z
      .array(
        z.object({
          name: z.string(),
          email: z.email().optional(),
          phone: z.string().optional(),
        }),
      )
      .default([]),
    // Bare handles, without the leading @ or a URL. One handle or a list.
    // Cap at Instagram (primary), Threads, and Pinterest — not a full social matrix.
    instagram_handle: z
      .union([
        z.string().regex(/^[\w.]+$/),
        z.array(z.string().regex(/^[\w.]+$/)).min(1),
      ])
      .transform((value): string[] => (typeof value === 'string' ? [value] : value))
      .optional(),
    threads_handle: z.string().regex(/^[\w.]+$/).optional(),
    pinterest_handle: z.string().regex(/^[\w.]+$/).optional(),
    lat: z.number(),
    lng: z.number(),
    // Lives in the place's folder, e.g. ./grotto-meats/cover.jpg.
    cover: image().optional(),
  }),
});

export const collections = { pages, events, places };
