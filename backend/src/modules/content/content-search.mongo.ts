import type { Prisma, PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { ContentSearchCriteria, SearchConstraints } from './content.repository.js';

type Expression = Prisma.InputJsonObject;
const contains = (field: string, query: string): Expression => ({
  $gte: [{ $indexOfCP: [{ $ifNull: [field, ''] }, query] }, 0],
});
const anyContains = (field: string, query: string): Expression => ({
  $anyElementTrue: [{ $map: { input: field, as: 'value', in: contains('$$value', query) } }],
});
const overlap = (field: string, values: string[]): Expression => ({
  $gt: [{ $size: { $setIntersection: [{ $ifNull: [field, []] }, values] } }, 0],
});
const weighted = (condition: Expression, weight: number): Expression => ({
  $cond: [condition, weight, 0],
});
// pg_trgm-style word padding, expressed with native aggregation operators.
const trigrams = (input: string | Expression): Expression => ({
  $reduce: {
    input: { $regexFindAll: { input: { $ifNull: [input, ''] }, regex: '[a-z0-9]+' } },
    initialValue: [],
    in: {
      $setUnion: [
        '$$value',
        {
          $let: {
            vars: { word: { $concat: ['  ', '$$this.match', ' '] } },
            in: {
              $map: {
                input: { $range: [0, { $subtract: [{ $strLenCP: '$$word' }, 2] }] },
                as: 'index',
                in: { $substrCP: ['$$word', '$$index', 3] },
              },
            },
          },
        },
      ],
    },
  },
});
const titleSimilarity = (query: string): Expression => ({
  $let: {
    vars: {
      titleGrams: trigrams('$revision.normalized_title'),
      queryGrams: trigrams({ $literal: query }),
    },
    in: {
      $cond: [
        { $gt: [{ $size: { $setUnion: ['$$titleGrams', '$$queryGrams'] } }, 0] },
        {
          $multiply: [
            10,
            {
              $divide: [
                { $size: { $setIntersection: ['$$titleGrams', '$$queryGrams'] } },
                { $size: { $setUnion: ['$$titleGrams', '$$queryGrams'] } },
              ],
            },
          ],
        },
        0,
      ],
    },
  },
});
const resultSchema = z.array(
  z.object({ id: z.string(), type: z.enum(['RECIPE', 'BLOG', 'VIDEO']) }),
);

/** Joins and safety predicates run before ranking and pagination. No candidate cap can
 * accidentally reintroduce an excluded recipe or change the total count.
 */
export async function searchMongoPublished(
  prisma: PrismaClient,
  filters: Partial<ContentSearchCriteria>,
  constraints: SearchConstraints,
  options: {
    excludeId?: string;
    limit?: number;
    offset?: number;
    planner?: boolean;
    related?: { categoryIds: string[]; ingredientIds: string[]; normalizedTags: string[] };
    count?: boolean;
  } = {},
): Promise<{ ids: string[]; total: number }> {
  const pipeline: Expression[] = [
    {
      $match: {
        status: 'PUBLISHED',
        deleted_at: null,
        published_revision_id: { $ne: null },
        ...(filters.type ? { type: filters.type } : {}),
        ...(options.excludeId ? { _id: { $ne: options.excludeId } } : {}),
      },
    },
  ];
  const join = (from: string, localField: string, foreignField: string, as: string) => {
    pipeline.push({ $lookup: { from, localField, foreignField, as } });
  };
  join('post_revisions', 'published_revision_id', '_id', 'revision');
  pipeline.push({ $unwind: '$revision' }, { $match: { 'revision.status': 'PUBLISHED' } });
  join('recipe_details', 'published_revision_id', '_id', 'details');
  join('recipe_ingredients', 'published_revision_id', 'revision_id', 'ingredients');
  join('ingredients', 'ingredients.ingredient_id', '_id', 'canonicalIngredients');
  join('ingredient_aliases', 'ingredients.ingredient_id', 'ingredient_id', 'aliases');
  join('post_categories', 'published_revision_id', 'revision_id', 'categoryRefs');
  join('categories', 'categoryRefs.category_id', '_id', 'categories');
  join('post_tags', 'published_revision_id', 'revision_id', 'tags');
  join('recipe_diet_compatibilities', 'published_revision_id', 'revision_id', 'compatibilities');
  pipeline.push({ $set: { detail: { $arrayElemAt: ['$details', 0] } } });
  const recipeChecks: Expression[] = [{ $gt: [{ $size: '$details' }, 0] }];
  if (constraints.dietPattern)
    recipeChecks.push({
      $anyElementTrue: [
        {
          $map: {
            input: '$compatibilities',
            as: 'item',
            in: {
              $and: [
                { $eq: ['$$item.diet_pattern', constraints.dietPattern] },
                { $eq: ['$$item.compatible', true] },
              ],
            },
          },
        },
      ],
    });
  if (constraints.allergenCodes.length)
    recipeChecks.push({ $not: [overlap('$detail.allergen_codes', constraints.allergenCodes)] });
  if (constraints.excludedIngredientIds.length)
    recipeChecks.push({
      $not: [overlap('$ingredients.ingredient_id', constraints.excludedIngredientIds)],
    });
  if (constraints.excludedNormalizedNames.length) {
    for (const field of [
      '$ingredients.normalized_name',
      '$canonicalIngredients.normalized_name',
      '$aliases.normalized_alias',
    ])
      recipeChecks.push({ $not: [overlap(field, constraints.excludedNormalizedNames)] });
  }
  if (constraints.traditions.length)
    recipeChecks.push({
      $not: [overlap('$detail.tradition_warnings.tradition', constraints.traditions)],
    });
  if (constraints.requireResolvedIngredients || options.planner)
    recipeChecks.push({
      $not: [
        {
          $anyElementTrue: [
            {
              $map: {
                input: '$ingredients',
                as: 'item',
                in: {
                  $or: [
                    { $eq: [{ $ifNull: ['$$item.ingredient_id', null] }, null] },
                    { $ne: ['$$item.resolution_status', 'EXACT'] },
                  ],
                },
              },
            },
          ],
        },
      ],
    });
  pipeline.push({
    $match: { $expr: { $or: [{ $ne: ['$type', 'RECIPE'] }, { $and: recipeChecks }] } },
  });
  if (filters.category)
    pipeline.push({
      $match: {
        categories: {
          $elemMatch: {
            status: 'ACTIVE',
            ...(/^[0-9a-f-]{36}$/i.test(filters.category)
              ? { _id: filters.category }
              : { slug: filters.category }),
          },
        },
      },
    });
  if (filters.maxCookTimeMinutes !== undefined)
    pipeline.push({
      $match: { type: 'RECIPE', 'detail.cook_time_minutes': { $lte: filters.maxCookTimeMinutes } },
    });
  if (filters.difficulty)
    pipeline.push({ $match: { type: 'RECIPE', 'detail.difficulty': filters.difficulty } });
  if (filters.ingredientIds?.length)
    pipeline.push({
      $match: { type: 'RECIPE', 'ingredients.ingredient_id': { $all: filters.ingredientIds } },
    });
  if (options.planner)
    pipeline.push({
      $match: {
        type: 'RECIPE',
        'detail.meal_planner_eligible': true,
        'detail.calories': { $gt: 0 },
        ingredients: { $not: { $elemMatch: { ingredient_id: null } } },
      },
    });
  const query = filters.normalizedQuery;
  let score: Expression = { $literal: 0 };
  if (query) {
    const title = contains('$revision.normalized_title', query);
    const ingredients = {
      $or: [
        anyContains('$ingredients.normalized_name', query),
        anyContains('$canonicalIngredients.normalized_name', query),
      ],
    };
    const category = anyContains('$categories.slug', query.replace(/\s+/g, '-'));
    const tags = anyContains('$tags.normalized_tag', query);
    const excerpt = contains('$revision.normalized_excerpt', query);
    const body = contains('$revision.normalized_body', query);
    pipeline.push({
      $match: { $expr: { $or: [title, ingredients, category, tags, excerpt, body] } },
    });
    score = {
      $add: [
        { $cond: [{ $eq: ['$revision.normalized_title', query] }, 400, weighted(title, 300)] },
        weighted(ingredients, 200),
        weighted(category, 100),
        weighted(tags, 80),
        { $cond: [excerpt, 60, weighted(body, 40)] },
        titleSimilarity(query),
      ],
    };
  }
  if (options.related)
    score = {
      $add: [
        {
          $multiply: [
            {
              $size: {
                $setIntersection: ['$categoryRefs.category_id', options.related.categoryIds],
              },
            },
            5,
          ],
        },
        {
          $multiply: [
            {
              $size: {
                $setIntersection: ['$ingredients.ingredient_id', options.related.ingredientIds],
              },
            },
            4,
          ],
        },
        {
          $multiply: [
            {
              $size: { $setIntersection: ['$tags.normalized_tag', options.related.normalizedTags] },
            },
            3,
          ],
        },
      ],
    };
  pipeline.push({ $set: { score } });
  const page: Expression[] = [{ $sort: { score: -1, published_at: -1, _id: 1 } }];
  if (options.offset) page.push({ $skip: options.offset });
  if (options.limit !== undefined) page.push({ $limit: options.limit });
  page.push({ $project: { _id: 0, id: '$_id', type: 1 } });
  if (options.count) {
    pipeline.push({ $facet: { records: page, total: [{ $count: 'count' }] } });
    const result = z
      .array(z.object({ records: resultSchema, total: z.array(z.object({ count: z.number() })) }))
      .parse(await prisma.post.aggregateRaw({ pipeline }))[0];
    return { ids: result?.records.map((row) => row.id) ?? [], total: result?.total[0]?.count ?? 0 };
  }
  const results = resultSchema.parse(
    await prisma.post.aggregateRaw({ pipeline: [...pipeline, ...page] }),
  );
  return { ids: results.map((row) => row.id), total: results.length };
}
