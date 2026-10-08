-- Phase 18 manual-add must support both Phase 10 recipe slots and Phase 17 custom meals.
ALTER TABLE "meal_plan_items" DROP CONSTRAINT "meal_plan_items_filled_shape";

ALTER TABLE "meal_plan_items"
  ADD CONSTRAINT "meal_plan_items_servings_valid" CHECK ("servings" > 0 AND "servings" <= 20),
  ADD CONSTRAINT "meal_plan_items_filled_shape" CHECK (
    (
      "status" = 'FILLED'
      AND "calories" IS NOT NULL AND "calories" > 0
      AND "tolerance_percent" IS NOT NULL
      AND (
        (
          "source_type" = 'RECIPE'
          AND "recipe_id" IS NOT NULL
          AND "recipe_revision_id" IS NOT NULL
          AND "custom_meal_id" IS NULL
          AND "custom_meal_snapshot" IS NULL
        )
        OR
        (
          "source_type" = 'CUSTOM_MEAL'
          AND "recipe_id" IS NULL
          AND "recipe_revision_id" IS NULL
          AND "custom_meal_id" IS NOT NULL
          AND "custom_meal_snapshot" IS NOT NULL
        )
      )
    )
    OR
    (
      "status" = 'UNFILLED'
      AND "recipe_id" IS NULL
      AND "recipe_revision_id" IS NULL
      AND "custom_meal_id" IS NULL
      AND "custom_meal_snapshot" IS NULL
      AND "calories" IS NULL
      AND "tolerance_percent" IS NULL
    )
  );
