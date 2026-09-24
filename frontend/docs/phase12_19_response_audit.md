# Phase 12–19 Client-Facing API Response Audit

> **Read-only.** No files modified. All field names taken verbatim from Zod response schemas and service mapper code.

---

## Phase 12 — Food Data

### Pattern note
`foodDataRecordResponseSchema` and `foodDataListResponseSchema` both use `z.record(z.string(), z.unknown())` as the data type — they are opaque pass-throughs validated only for envelope shape. Actual field content is controlled entirely by what `serialize()` receives from the repository's `select` clause.

---

#### `GET /api/v1/food-data/ingredients/{ingredientId}/nutrients`
- **Schema:** `foodDataRecordResponseSchema` (opaque `Record<string, unknown>`)
- **Mapper:** `serialize()` applied to the result of `repository.listIngredientNutrients()` — which now uses explicit `select`
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "canonicalName": "...",
    "foodGroup": "...",
    "status": "ACTIVE",
    "aliases": [
      { "id": "...", "alias": "...", "locale": "...", "reviewStatus": "APPROVED" }
    ],
    "foodProfiles": [
      {
        "id": "...",
        "sourceRecordId": "...",
        "sourceVersion": "...",
        "locale": "...",
        "preparation": "raw",
        "ediblePortionPercent": "...",
        "servingGrams": "...",
        "quality": "...",
        "reviewStatus": "APPROVED",
        "effectiveFrom": "...",
        "effectiveTo": null,
        "source": {
          "id": "...", "code": "...", "name": "...", "provider": "...",
          "sourceUrl": "...", "licenseName": "...", "licenseUrl": "...",
          "attribution": "...", "defaultLocale": "..."
        },
        "householdConversions": [
          { "id": "...", "unitName": "...", "unitSymbol": "...", "quantity": "...",
            "unitDimension": "...", "grams": "...", "quality": "...", "reviewStatus": "APPROVED" }
        ],
        "nutrientValues": [
          {
            "id": "...", "valuePer100g": "...", "unit": "...",
            "minValue": "...", "maxValue": "...", "quality": "...",
            "reviewStatus": "APPROVED", "effectiveFrom": "...", "effectiveTo": null,
            "nutrient": { "id": "...", "code": "...", "name": "...",
              "defaultUnit": "...", "unitDimension": "...", "description": "..." }
          }
        ]
      }
    ]
  },
  "meta": null
}
```
- **Internal fields exposed:** None. `normalizedName`, `normalizedAlias`, `ingredientId`/`sourceId`/`profileId`/`nutrientId`/`importBatchId` FKs, `reviewedById`, `reviewedAt`, `createdAt`/`updatedAt` on sub-records are all excluded by the repository `select`.
- **Cleanup recommended:** ✅ Already cleaned in Phase 12 cleanup pass.

---

#### `GET /api/v1/food-data/reference-intakes`
- **Schema:** `foodDataListResponseSchema`
- **Mapper:** `serialize()` + `toPaged()` over repository `select`
- **Top-level shape:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...", "referenceType": "...", "populationCode": "...",
      "applicability": {}, "value": "...", "unit": "...",
      "warningEligible": true, "reviewStatus": "APPROVED",
      "effectiveFrom": "...", "effectiveTo": null,
      "locale": "...", "sourceRecordId": "...", "sourceVersion": "...",
      "nutrient": { "id": "...", "code": "...", "name": "...",
        "defaultUnit": "...", "unitDimension": "...", "description": "..." },
      "source": { "id": "...", "code": "...", "name": "...", "provider": "...",
        "sourceUrl": "...", "licenseName": "...", "licenseUrl": "...",
        "attribution": "...", "defaultLocale": "..." }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```
- **Internal fields exposed:** None. `nutrientId` FK, `sourceId` FK, `reviewedById`, `reviewedAt` excluded.
- **Cleanup recommended:** ✅ Already cleaned.

---

#### `GET /api/v1/food-data/ingredient-guidelines`
- **Schema:** `foodDataListResponseSchema`
- **Top-level shape:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...", "populationCode": "...", "applicability": {},
      "amount": "...", "unit": "...", "frequency": "...", "period": "...",
      "advisoryOnly": false, "evidenceGrade": "...", "severity": "...",
      "explanation": "...", "reviewStatus": "APPROVED",
      "effectiveFrom": "...", "effectiveTo": null,
      "locale": "...", "sourceRecordId": "...", "sourceVersion": "...",
      "ingredient": { "id": "...", "canonicalName": "...", "foodGroup": "..." },
      "source": { "id": "...", "code": "...", "name": "...", "provider": "...",
        "sourceUrl": "...", "licenseName": "...", "licenseUrl": "...",
        "attribution": "...", "defaultLocale": "..." }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
}
```
- **Internal fields exposed:** None. `ingredientId` FK, `sourceId` FK, `reviewedById`, `reviewedAt`, `normalizedName` on ingredient excluded.
- **Cleanup recommended:** ✅ Already cleaned.

---

#### `GET /api/v1/food-data/cooking-methods`
- **Schema:** `foodDataListResponseSchema`
- **Top-level shape:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...", "code": "...", "name": "...", "description": "...", "active": true,
      "retentions": [
        {
          "id": "...", "factor": "...", "applicability": {},
          "quality": "...", "reviewStatus": "APPROVED",
          "effectiveFrom": "...", "effectiveTo": null,
          "sourceRecordId": "...", "sourceVersion": "...",
          "nutrient": { "id": "...", "code": "...", "name": "...",
            "defaultUnit": "...", "unitDimension": "..." },
          "source": { "id": "...", "code": "...", "name": "...", "provider": "...",
            "sourceUrl": "...", "licenseName": "...", "licenseUrl": "...",
            "attribution": "...", "defaultLocale": "..." }
        }
      ],
      "yields": [
        {
          "id": "...", "factor": "...", "applicability": {},
          "quality": "...", "reviewStatus": "APPROVED",
          "effectiveFrom": "...", "effectiveTo": null,
          "sourceRecordId": "...", "sourceVersion": "...",
          "ingredient": { "id": "...", "canonicalName": "...", "foodGroup": "..." },
          "source": { "id": "...", "code": "...", "name": "...", "provider": "...",
            "sourceUrl": "...", "licenseName": "...", "licenseUrl": "...",
            "attribution": "...", "defaultLocale": "..." }
        }
      ]
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 30, "totalPages": 2 }
}
```
- **Internal fields exposed:** None. `cookingMethodId`/`nutrientId`/`ingredientId`/`sourceId` FKs, `reviewedById`, `reviewedAt`, `createdAt`/`updatedAt` excluded.
- **Cleanup recommended:** ✅ Already cleaned.

---

#### `GET /api/v1/food-data/interaction-rules`
- **Schema:** `foodDataListResponseSchema`
- **Top-level shape:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...", "scope": "...", "direction": "...", "severity": "...",
      "evidenceGrade": "...", "applicability": {}, "explanation": "...",
      "suggestedAction": "...", "hardRule": false, "reviewStatus": "APPROVED",
      "effectiveFrom": "...", "effectiveTo": null,
      "locale": "...", "sourceRecordId": "...", "sourceVersion": "...",
      "ingredientA": { "id": "...", "canonicalName": "...", "foodGroup": "..." },
      "ingredientB": { "id": "...", "canonicalName": "...", "foodGroup": "..." },
      "source": { "id": "...", "code": "...", "name": "...", "provider": "...",
        "sourceUrl": "...", "licenseName": "...", "licenseUrl": "...",
        "attribution": "...", "defaultLocale": "..." }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 20, "totalPages": 1 }
}
```
- **Internal fields exposed:** None. `ingredientAId`/`ingredientBId`/`sourceId` FKs, `reviewedById`, `reviewedAt` excluded.
- **Cleanup recommended:** ✅ Already cleaned.

---

#### `GET /api/v1/admin/food-data/records` (Admin)
- **Schema:** `foodDataListResponseSchema` (opaque record)
- **Mapper:** `serialize()` on raw `findMany()` result — **no select filter**
- **Top-level shape:** All raw Prisma model fields serialized as `Record<string, unknown>`
- **Internal fields exposed:** ⚠️ Yes — all model fields including `reviewedById`, `importBatchId`, `normalizedName`, FKs, `createdAt`/`updatedAt`. This is an **admin-only** endpoint (Bearer + ADMIN role required). Internal field exposure is intentional for admin audit purposes.
- **Cleanup recommended:** No — admin endpoint, full visibility is by design.

---

#### `POST /api/v1/admin/food-data/records` · `PUT /api/v1/admin/food-data/records/{id}` · `DELETE /api/v1/admin/food-data/records/{id}` (Admin)
- **Schema:** `foodDataRecordResponseSchema` (opaque record)
- **Mapper:** `serialize()` on the full Prisma entity returned by create/replace/archive
- **Internal fields exposed:** ⚠️ Yes — same as admin list above. Admin-only endpoint. Intentional.
- **Cleanup recommended:** No — admin only.

---

#### `POST /api/v1/admin/food-data/imports/preview` · `POST /api/v1/admin/food-data/imports` (Admin)
- **Schema:** `foodDataImportResponseSchema`
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "importId": "...",
    "status": "PREVIEWED",
    "idempotentReplay": false,
    "summary": { "...": "..." }
  },
  "meta": null
}
```
- **Internal fields exposed:** None beyond `summary` which is an opaque `Record<string, unknown>` of import batch statistics (count of records processed, errors, etc.). Admin-only.
- **Cleanup recommended:** No.

---

## Phase 13 — Recipe Nutrition

#### `GET /api/v1/posts/{id}/nutrition` · `POST /api/v1/posts/{id}/nutrition`
- **Schema:** `nutritionEstimateResponseSchema` → `estimateSchema`
- **Mapper:** Explicit `BuiltEstimate` interface; `fromRecord()` mapper reads each field by name
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "id": null,
    "revisionId": "...",
    "postId": "...",
    "postVersion": 1,
    "estimateVersion": null,
    "status": null,
    "stale": false,
    "calculationVersion": "recipe-nutrition-v1",
    "recipeFingerprint": "...",
    "servings": 2,
    "totalRawGrams": 450.5,
    "totalCookedGrams": 380.0,
    "totalNutrients": [
      { "nutrientCode": "PROTEIN", "nutrientName": "Protein", "unit": "g",
        "amount": 12.5, "origin": "CANONICAL_CALCULATED",
        "confidence": 0.95, "min": null, "max": null }
    ],
    "perServingNutrients": [ "..." ],
    "lines": [
      {
        "id": null,
        "recipeIngredientId": "...",
        "ingredientId": "...",
        "position": 0,
        "displayName": "Tofu",
        "origin": "CANONICAL_CALCULATED",
        "normalizedRawGrams": 200.0,
        "edibleRawGrams": 200.0,
        "yieldFactor": 0.9,
        "cookedGrams": 180.0,
        "nutrients": [ "..." ],
        "sourceVersions": [
          { "sourceCode": "USDA", "sourceVersion": "2024", "sourceRecordId": "...", "kind": "NUTRIENT_VALUE:PROTEIN" }
        ],
        "assumptions": [
          { "code": "...", "message": "...", "origin": "CANONICAL_CALCULATED" }
        ],
        "confidence": 0.95,
        "uncertainty": { "method": "boil" },
        "uncoveredReason": null
      }
    ],
    "uncoveredIngredients": [],
    "sourceVersions": [ "..." ],
    "assumptions": [],
    "confidence": 0.9,
    "uncertainty": { "partial": false, "lineCount": 3 },
    "ai": {
      "used": false,
      "provider": null,
      "modelId": null,
      "status": null,
      "providerDown": false
    },
    "disclaimer": "Nutrition estimates are educational guidance only...",
    "createdAt": null
  },
  "meta": null
}
```
- **Internal fields exposed:** None.
- **Cleanup recommended:** No.

---

#### `GET /api/v1/posts/{id}/nutrition/status`
- **Schema:** `statusResponseSchema` → `statusSchema`
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "postId": "...",
    "revisionId": "...",
    "currentEstimateId": "...",
    "currentStatus": "CURRENT",
    "stale": false,
    "latestAiJob": {
      "id": "...", "provider": "GEMINI", "modelId": "...",
      "status": "COMPLETED", "errorCode": null,
      "startedAt": "...", "completedAt": "..."
    }
  },
  "meta": null
}
```
- **Internal fields exposed:** None.
- **Cleanup recommended:** No.

---

#### `GET /api/v1/posts/{id}/nutrition/history`
- **Schema:** `nutritionHistoryResponseSchema`
- **Top-level shape:**
```json
{
  "success": true,
  "data": [ "...estimate objects..." ],
  "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```
- **Internal fields exposed:** None. Each item uses the same `estimateSchema`.
- **Cleanup recommended:** No.

---

## Phase 14 — Contributor Trust

#### `POST /api/v1/contributor-applications` · `GET /api/v1/contributor-applications` · `GET /api/v1/contributor-applications/{id}`
- **Schema:** `contributorApplicationResponseSchema` / `contributorApplicationListResponseSchema`
- **Mapper:** Explicit `applicationOutput()` mapper
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "user": {
      "id": "...", "email": "...", "displayName": "...", "role": "MEMBER",
      "contributorProfile": { "approvalBasis": null, "revokedAt": null }
    },
    "claimedApprovalBasis": "PLATFORM_TRACK_RECORD",
    "claimedApprovalBasisLabel": "...",
    "organizationClaim": null,
    "experience": "...",
    "referenceLinks": [],
    "source": "USER_SUBMITTED",
    "invitedBy": null,
    "invitationReason": null,
    "status": "PENDING",
    "approvalBasis": null,
    "approvalBasisLabel": null,
    "reviewEvidence": null,
    "reviewNote": null,
    "reviewedBy": null,
    "reviewedAt": null,
    "reapplyEligibleAt": null,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "meta": null
}
```
- **Internal fields exposed:** None.
- **Cleanup recommended:** No.

---

#### `POST /api/v1/admin/contributor-applications/{id}/invite` · `POST /api/v1/admin/contributor-applications/{id}/review`
- **Schema:** `contributorApplicationResponseSchema`
- Same shape as above. `reviewEvidence` is populated after review.
- **Internal fields exposed:** None.
- **Cleanup recommended:** No.

---

#### `DELETE /api/v1/admin/users/{userId}/contributor-profile`
- **Schema:** `contributorRevocationResponseSchema`
- **Mapper:** Repository returns explicit object `{ userId, role, revokedAt, revokedBy, reason }`
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "role": "MEMBER",
    "revokedAt": "...",
    "revokedBy": { "id": "...", "displayName": "..." },
    "reason": "..."
  },
  "meta": null
}
```
- **Internal fields exposed:** None.
- **Cleanup recommended:** No.

---

## Phase 15 — Storage Quota

#### `GET /api/v1/storage/usage`
- **Schema:** `usageResponseSchema`
- **Mapper:** `usage()` + `policy()` private mappers
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "usage": {
      "usedBytes": 1048576, "reservedBytes": 0,
      "limitBytes": 104857600, "remainingBytes": 103809024,
      "overQuota": false, "warningPercent": 80
    },
    "policy": {
      "id": "...", "code": "DEFAULT", "name": "...",
      "quotaBytes": 104857600, "reservationTtlSeconds": 3600,
      "warningPercent": 80, "active": true, "isDefault": true,
      "version": 1, "updatedAt": "..."
    }
  },
  "meta": null
}
```
- **Internal fields exposed:** None.
- **Cleanup recommended:** No.

---

#### `POST /api/v1/storage/reservations`
- **Schema:** `createReservationResponseSchema`
- **Mapper:** `reservation()` + `usage()` + provider `createUploadConfiguration()`
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "reservation": {
      "id": "...", "status": "RESERVED", "resourceType": "IMAGE", "kind": "COVER_IMAGE",
      "declaredMimeType": "image/jpeg", "declaredExtension": ".jpg",
      "declaredBytes": 204800, "actualBytes": null,
      "expiresAt": "...", "committedAt": null, "releasedAt": null,
      "asset": null
    },
    "usage": { "usedBytes": 0, "reservedBytes": 204800, "limitBytes": 104857600,
      "remainingBytes": 104652800, "overQuota": false, "warningPercent": 80 },
    "upload": {
      "cloudName": "...", "apiKey": "...", "resourceType": "image",
      "uploadUrl": "...", "timestamp": 1234567890, "signature": "...",
      "folder": "...", "maxBytes": 10485760, "allowedMimeTypes": ["image/jpeg"],
      "expiresAt": "..."
    }
  },
  "meta": null
}
```
- **Internal fields exposed:** None. `requestHash`, `commitHash`, `idempotencyKey` are not in `reservation()` mapper output.
- **Cleanup recommended:** No.

---

#### `GET /api/v1/storage/reservations/{id}` · `POST /api/v1/storage/reservations/{id}/commit`
- **Schema:** `reservationResponseSchema`
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "reservation": { "...same reservation shape..." },
    "usage": { "...same usage shape..." }
  },
  "meta": null
}
```
- **Internal fields exposed:** None.
- **Cleanup recommended:** No.

---

#### `GET /api/v1/storage/assets/{id}` · `DELETE /api/v1/storage/assets/{id}`
- **Schema:** `assetResponseSchema`
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "id": "...", "provider": "CLOUDINARY", "resourceType": "IMAGE",
    "kind": "COVER_IMAGE", "publicId": "...", "secureUrl": "...",
    "mimeType": "image/jpeg", "extension": ".jpg", "bytes": 204800,
    "width": 1200, "height": 800, "durationSeconds": null,
    "status": "ACTIVE", "createdAt": "...", "deletedAt": null
  },
  "meta": null
}
```
- **Internal fields exposed:** None. `userId` FK, `reservationId` FK not in `asset()` mapper.
- **Cleanup recommended:** No.

---

#### Admin endpoints: `GET /api/v1/admin/storage/policies` · `PUT /api/v1/admin/storage/policies/{id}` · `GET /api/v1/admin/storage/accounts` · `POST /api/v1/admin/storage/accounts/{userId}/adjustments`
- **Mapper:** Explicit mappers: `policy()`, `account()`, `adjustment()`
- **Internal fields exposed:** `adjustment.actorId` is in the response — intentional for admin audit trail.
- **Cleanup recommended:** No — admin only, actorId is documented.

---

## Phase 16 — Video Review (Content additions)

#### `GET /api/v1/posts` · `GET /api/v1/posts/{idOrSlug}` · `POST /api/v1/posts` · `PATCH /api/v1/posts/{id}` · `DELETE /api/v1/posts/{id}` · `GET /api/v1/posts/related`
- **Schema:** `postResponseSchema` / `postListResponseSchema` / `relatedPostsResponseSchema`
- **Mapper:** Explicit `postOutput()` + `revisionOutput()` + `mediaOutput()` private mappers
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "author": { "id": "...", "displayName": "...", "avatarUrl": "..." },
    "slug": "...",
    "status": "PUBLISHED",
    "version": 3,
    "publishedRevisionVersion": 2,
    "publishedAt": "...",
    "createdAt": "...",
    "updatedAt": "...",
    "revision": {
      "id": "...", "version": 3, "status": "DRAFT",
      "title": "...", "excerpt": "...", "body": "...", "tags": [],
      "submittedAt": null, "reviewNote": null, "reviewedAt": null, "createdAt": "..."
    },
    "categories": [ { "id": "...", "name": "...", "slug": "..." } ],
    "media": [ { "id": "...", "kind": "COVER_IMAGE", "provider": "CLOUDINARY",
      "publicId": "...", "secureUrl": "...", "mimeType": "...",
      "bytes": 204800, "width": 1200, "height": 800, "durationSeconds": null } ],
    "type": "RECIPE",
    "recipe": {
      "servings": 2, "prepTimeMinutes": 15, "cookTimeMinutes": 30,
      "difficulty": "MEDIUM",
      "nutrition": { "calories": 350, "proteinGrams": 20, "carbsGrams": 40,
        "fatGrams": 10, "fiberGrams": 5, "vitaminB12Mcg": null },
      "mealPlannerEligible": true,
      "allergenCodes": [],
      "traditionWarnings": [],
      "dietCompatibilities": [ { "dietPattern": "VEGAN", "compatible": true, "reasonCodes": [] } ],
      "ingredients": [
        {
          "id": "...", "ingredientId": "...", "canonicalName": "Đậu phụ",
          "position": 0, "displayName": "Tofu", "normalizedName": "tofu",
          "amount": 200, "unit": "g", "optional": false,
          "resolutionStatus": "RESOLVED"
        }
      ],
      "steps": [
        {
          "id": "...", "position": 0, "instruction": "...",
          "cookingMethodId": "...", "cookingMethodCode": "BOIL",
          "cookingMethodName": "Luộc", "durationMinutes": 15,
          "temperatureCelsius": null, "affectedIngredientPositions": [0]
        }
      ]
    }
  },
  "meta": null
}
```
> `normalizedName` and `cookingMethodId` are **declared in `recipeIngredientSchema` and `recipeStepSchema`** — they are intentional contract fields, not leaks.

- **Internal fields exposed:** None. `authorId` FK, `publishedRevisionId` FK, `slugId` FK not in output.
- **Cleanup recommended:** No.

---

#### `GET /api/v1/admin/posts/{id}/review-history`
- **Schema:** `contentReviewHistoryResponseSchema`
- **Mapper:** Explicit mapper building `{ revision, reviewedBy, media, moderationSignals, isPublishedRevision }`
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "postId": "...", "type": "RECIPE", "postStatus": "PUBLISHED",
    "version": 3, "publishedRevisionId": "...",
    "revisions": [
      {
        "revision": { "id": "...", "version": 2, "status": "PUBLISHED", "title": "...",
          "excerpt": "...", "body": "...", "tags": [],
          "submittedAt": "...", "reviewNote": null, "reviewedAt": "...", "createdAt": "..." },
        "reviewedBy": { "id": "...", "displayName": "...", "avatarUrl": "..." },
        "media": [ "...media shape..." ],
        "moderationSignals": [
          { "id": "...", "provider": "...", "model": "...", "ruleVersion": "...",
            "reasonCodes": [], "riskScore": 0.1, "riskLevel": "LOW",
            "status": "REVIEWED", "createdAt": "..." }
        ],
        "isPublishedRevision": true
      }
    ]
  },
  "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```
- **Internal fields exposed:** None. No raw Prisma revision FK or internal reviewer-user ID leaked (only `{ id, displayName, avatarUrl }`).
- **Cleanup recommended:** No.

---

## Phase 17 — Custom Meals

#### `GET /api/v1/custom-meals` (list)
- **Schema:** `customMealListResponseSchema`
- **Mapper:** `formatCustomMeal()` explicit mapper
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "...", "ownerId": "...", "name": "...", "notes": null,
        "servings": 1, "sourceNote": null,
        "userCalories": null, "userProteinGrams": null,
        "userCarbsGrams": null, "userFatGrams": null,
        "nutritionCoverage": "NONE",
        "deletePolicy": "BLOCK",
        "ingredients": [
          { "id": "...", "position": 0, "displayName": "Tofu",
            "amount": 200, "unit": "g", "resolutionStatus": "RESOLVED",
            "ingredientId": "...", "ingredient": { "id": "...", "canonicalName": "Đậu phụ" } }
        ],
        "photos": [
          { "id": "...", "assetId": "...", "position": 0, "secureUrl": "...",
            "mimeType": "image/jpeg", "width": 1200, "height": 800 }
        ],
        "tags": [ { "tag": "healthy", "normalizedTag": "healthy" } ],
        "createdAt": "...", "updatedAt": "..."
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
}
```
> `ownerId` is a documented schema field. `assetId` is needed by the client to construct the `DELETE /photos/:assetId` path. Both intentional.

- **Internal fields exposed:** None (beyond intentional contract fields).
- **Cleanup recommended:** No.

---

#### `GET /api/v1/custom-meals/{id}` · `POST /api/v1/custom-meals` · `PUT /api/v1/custom-meals/{id}` · `DELETE /api/v1/custom-meals/{id}`
- Same shape as above, single record: `{ success: true, data: { ...customMealResponseSchema... }, meta: null }`
- **Internal fields exposed:** None.
- **Cleanup recommended:** No.

---

#### `POST /api/v1/custom-meals/{id}/photos` · `DELETE /api/v1/custom-meals/{id}/photos/{assetId}` · `PUT /api/v1/custom-meals/{id}/photos/order`
- Returns the updated custom meal — same shape as above.
- **Internal fields exposed:** None.
- **Cleanup recommended:** No.

---

## Phase 18 — Meal Analysis

#### `POST /api/v1/meal-plans/{id}/analysis` · `GET /api/v1/meal-plans/{id}/analysis` · `POST /api/v1/meal-plans/{id}/analysis/default`
- **Schema:** `mealAnalysisResponseSchema` → `mealAnalysisDataSchema`
- **Mapper:** Explicit `output()` mapper reading each field by name with JSON narrowing
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "mealPlanId": "...",
    "version": 1,
    "status": "CURRENT",
    "algorithmVersion": "meal-analysis-v1",
    "planVersion": 3,
    "analyzedItemIds": ["...", "..."],
    "warnings": [
      {
        "code": "NUTRIENT_LIMIT_EXCEEDED",
        "severity": "HIGH",
        "scope": "DAILY",
        "evidenceGrade": "A",
        "source": { "code": "USDA", "name": "...", "version": "...",
          "recordId": "...", "url": "..." },
        "applicability": {},
        "affectedItems": [
          { "itemId": "...", "date": "2026-01-01", "mealType": "LUNCH",
            "sourceType": "RECIPE", "name": "...", "servings": 1 }
        ],
        "affectedIngredients": [ { "ingredientId": "...", "name": "..." } ],
        "measured": { "value": 4500, "unit": "mg" },
        "limit": { "value": 2300, "unit": "mg" },
        "explanation": "...",
        "suggestedAdjustment": "...",
        "confidence": 0.9,
        "advisory": false,
        "incompleteDataNotes": []
      }
    ],
    "summary": { "warningCount": 1, "highCount": 1, "cautionCount": 0,
      "infoCount": 0, "selectedItemCount": 7 },
    "confidence": 0.85,
    "incompleteData": [],
    "ruleVersions": ["..."],
    "disclaimer": "...",
    "createdAt": "..."
  },
  "meta": null
}
```
- **Internal fields exposed:** None. `mealPlanId` is a documented field needed by client.
- **Cleanup recommended:** No.

---

## Phase 19 — Meal Programs

#### `POST /api/v1/meal-programs` · `GET /api/v1/meal-programs/{id}` · `PATCH /api/v1/meal-programs/{id}`
- **Schema:** `mealProgramResponseSchema` → `mealProgramDetailSchema`
- **Mapper:** Explicit `detail()` private mapper
- **Top-level shape:**
```json
{
  "success": true,
  "data": {
    "id": "...", "title": "...", "goal": "BALANCED",
    "startDate": "2026-01-06", "endDate": "2026-03-31",
    "timezone": "Asia/Ho_Chi_Minh",
    "horizonWeeks": 12, "status": "GENERATING",
    "version": 1, "readyWeeks": 3, "failedWeeks": 0,
    "confirmedAt": null, "createdAt": "...", "updatedAt": "...",
    "generationParameters": {
      "algorithmVersion": "multi-week-program-v1",
      "alternativesPerWeek": 2,
      "seed": null,
      "limits": { "maxWeeks": 12, "maxAlternatives": 3 }
    },
    "failureSummary": null,
    "weeks": [
      {
        "id": "...", "weekIndex": 0, "weekStart": "2026-01-06",
        "status": "READY",
        "selectedAlternativeRank": 0,
        "projectionStatus": "CURRENT",
        "failure": null,
        "alternatives": [
          {
            "id": "...", "rank": 0, "mealPlanId": "...",
            "selected": true,
            "snapshot": { "...meal plan detail fields...": "..." },
            "createdAt": "..."
          }
        ]
      }
    ],
    "analysis": {
      "id": "...", "version": 1, "status": "CURRENT",
      "invalidatedFromWeekIndex": null,
      "warnings": [],
      "nutritionSummary": {
        "horizonWeeks": 12, "analyzedWeeks": 3,
        "totalCalories": 25200, "averageDailyCalories": 1200,
        "totalVitaminB12Mcg": 8.4, "averageWeeklyVitaminB12Mcg": 2.8,
        "incompleteWeekIndexes": []
      },
      "weeklyAnalyses": [],
      "createdAt": "..."
    }
  },
  "meta": null
}
```
> `generationParameters.limits` exposes server config values — intentional per schema (`z.record(z.string(), z.unknown())`). `alternative.snapshot` is a stored copy of a public meal plan detail response — not a DB leak.

- **Internal fields exposed:** None.
- **Cleanup recommended:** No.

---

#### `GET /api/v1/meal-programs`
- **Schema:** `mealProgramListResponseSchema` → `mealProgramSummarySchema` (lighter, no weeks/analysis)
- **Top-level shape:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...", "title": "...", "goal": "BALANCED",
      "startDate": "2026-01-06", "endDate": "2026-03-31",
      "timezone": "Asia/Ho_Chi_Minh",
      "horizonWeeks": 12, "status": "GENERATING",
      "version": 1, "readyWeeks": 3, "failedWeeks": 0,
      "confirmedAt": null, "createdAt": "...", "updatedAt": "..."
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 }
}
```
- **Internal fields exposed:** None.
- **Cleanup recommended:** No.

---

## Summary

### ✅ Endpoints with fully clean responses (no internal fields)

| Phase | Endpoints |
|---|---|
| 12 (public) | `GET /food-data/ingredients/{id}/nutrients`, `GET /food-data/reference-intakes`, `GET /food-data/ingredient-guidelines`, `GET /food-data/cooking-methods`, `GET /food-data/interaction-rules` |
| 13 | All 4 recipe-nutrition endpoints |
| 14 | All 5 contributor application endpoints + revoke |
| 15 | All 7 storage endpoints (user + admin) |
| 16 | All post CRUD + review-history endpoints |
| 17 | All 8 custom-meal endpoints |
| 18 | All 3 meal-analysis endpoints |
| 19 | All 4 meal-program endpoints |

### ⚠️ Endpoints exposing internal fields (intentional — admin only)

| Phase | Endpoints | Reason |
|---|---|---|
| 12 (admin) | `GET /admin/food-data/records`, `POST`, `PUT`, `DELETE /admin/food-data/records/{id}` | Full Prisma entity via `serialize()`. Admin-only, full visibility is by design for audit/management. |
| 12 (admin) | `POST /admin/food-data/imports/preview`, `POST /admin/food-data/imports` | Opaque `summary` object of batch statistics. Admin-only. |

### ✅ Cleanup verdict by phase

| Phase | Client endpoints cleaned | Admin endpoints | Action needed |
|---|---|---|---|
| 12 | ✅ Fully cleaned (5 public) | ⚠️ Intentionally exposes all fields | None |
| 13 | ✅ Clean | N/A | None |
| 14 | ✅ Clean | N/A | None |
| 15 | ✅ Clean | ✅ Clean | None |
| 16 | ✅ Clean | ✅ Clean | None |
| 17 | ✅ Clean | N/A | None |
| 18 | ✅ Clean | N/A | None |
| 19 | ✅ Clean | N/A | None |

**All client-facing endpoints are clean. No further action required.**
