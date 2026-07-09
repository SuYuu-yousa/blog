import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  'blog-zh': blog,
};
