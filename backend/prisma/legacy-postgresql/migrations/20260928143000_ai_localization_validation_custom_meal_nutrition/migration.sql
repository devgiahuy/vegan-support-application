ALTER TABLE "custom_meals"
  ADD COLUMN "nutrition_metadata" JSONB,
  ADD COLUMN "nutrition_analyzed_at" TIMESTAMPTZ(3),
  ALTER COLUMN "source_note" TYPE VARCHAR(2000);

ALTER TABLE "pantry_items"
  ALTER COLUMN "freshness_note" TYPE VARCHAR(5000);

ALTER TABLE "pantry_adjustments"
  ALTER COLUMN "reason" TYPE VARCHAR(5000);

ALTER TABLE "recognition_candidates"
  ALTER COLUMN "freshness_observation" TYPE VARCHAR(2000),
  ALTER COLUMN "uncertainty_note" TYPE VARCHAR(2000);

ALTER TABLE "recognition_candidate_evidence"
  ALTER COLUMN "observation" TYPE VARCHAR(2000);

ALTER TABLE "receipt_candidates"
  ALTER COLUMN "line_text" TYPE VARCHAR(1000),
  ALTER COLUMN "uncertainty_note" TYPE VARCHAR(2000);

ALTER TABLE "ai_artifacts"
  ALTER COLUMN "summary" TYPE VARCHAR(5000);

ALTER TABLE "ai_verifications"
  ALTER COLUMN "scope" TYPE VARCHAR(2000),
  ALTER COLUMN "evidence_note" TYPE VARCHAR(10000),
  ALTER COLUMN "correction" TYPE VARCHAR(10000);

ALTER TABLE "ai_verification_admin_actions"
  ALTER COLUMN "reason" TYPE VARCHAR(10000);

ALTER TABLE "recipe_steps"
  ALTER COLUMN "instruction" TYPE VARCHAR(5000);

ALTER TABLE "storage_adjustments"
  ALTER COLUMN "reason" TYPE VARCHAR(5000);

ALTER TABLE "food_data_sources"
  ALTER COLUMN "attribution" TYPE VARCHAR(5000);

ALTER TABLE "nutrients"
  ALTER COLUMN "description" TYPE VARCHAR(5000);

ALTER TABLE "ingredient_intake_guidelines"
  ALTER COLUMN "explanation" TYPE VARCHAR(5000);

ALTER TABLE "cooking_methods"
  ALTER COLUMN "description" TYPE VARCHAR(5000);

ALTER TABLE "ingredient_interaction_rules"
  ALTER COLUMN "explanation" TYPE VARCHAR(5000),
  ALTER COLUMN "suggested_action" TYPE VARCHAR(5000);

ALTER TABLE "food_data_suggestions"
  ALTER COLUMN "rationale" TYPE VARCHAR(5000);

ALTER TABLE "contributor_applications"
  ALTER COLUMN "invitation_reason" TYPE VARCHAR(5000),
  ALTER COLUMN "review_note" TYPE VARCHAR(5000);

ALTER TABLE "contributor_profiles"
  ALTER COLUMN "revocation_reason" TYPE VARCHAR(5000);

ALTER TABLE "contributor_decisions"
  ALTER COLUMN "reason" TYPE VARCHAR(5000);
