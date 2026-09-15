# Search v1 — Index and Query-Plan Evidence

**Verified:** 2026-09-15

## Strategy

Published revisions persist Vietnamese text normalized to lowercase ASCII in
`normalized_title`, `normalized_excerpt`, and `normalized_body`. Recipe ingredients already persist
`normalized_name`; revision tags live in `post_tags` with `normalized_tag`. Migration
`20260915190000_content_search` enables `pg_trgm` and creates GIN trigram indexes for title, body,
tag, and recipe ingredient lookup, plus B-tree indexes for category, ingredient, cook-time, and
difficulty filters.

Search ranking v1 is deterministic:

1. exact/partial title: 400/300 points;
2. canonical or normalized recipe ingredient: 200 points;
3. category taxonomy/tag: 100/80 points;
4. excerpt/body: 60/40 points;
5. title trigram similarity as a small tie-break, then `published_at DESC`, then post UUID.

All profile hard constraints are SQL predicates applied before scoring. A constrained user also fails
closed on Recipe revisions containing `AMBIGUOUS` or `UNKNOWN` ingredients.

## Local evidence

A fresh temporary PostgreSQL 14 cluster applied all six migrations and seeded ten published discovery
records. The cluster was stopped after the check; no repository database was modified.

The normalized query `dau hu` returned, in order:

```text
Đậu hũ xào bông cải
Bát cơm rau xanh giàu đạm
Hướng dẫn cân bằng protein thực vật
```

Applying an active `SOY` allergy before ranking removed both Recipe results and retained only the Blog
body match. Related lookup returned unique published groups independently (`2 Recipe`, `4 Blog`,
`3 Video`) while excluding the source post. Related scoring uses category, canonical ingredient, and
normalized tag overlap with weights `5/4/3`.

Because ten rows are intentionally small enough for PostgreSQL to prefer a sequential scan, index
eligibility was checked with `enable_seqscan=off`. `EXPLAIN (COSTS OFF)` produced:

```text
Bitmap Heap Scan on post_revisions
  Recheck Cond: (normalized_title ~~* '%dau hu%')
  -> Bitmap Index Scan on post_revisions_normalized_title_trgm_idx
       Index Cond: (normalized_title ~~* '%dau hu%')
```

This confirms the leading-wildcard normalized title predicate can use the intended GIN trigram index
when table size and planner cost justify it. Production query values remain parameterized through
Prisma SQL templates.
