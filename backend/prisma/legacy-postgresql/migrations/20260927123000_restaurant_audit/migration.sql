CREATE TABLE "restaurant_audit" (
  "id" UUID NOT NULL,
  "restaurant_id" UUID NOT NULL,
  "actor_id" UUID NOT NULL,
  "action" VARCHAR(30) NOT NULL,
  "reason" VARCHAR(1000),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "restaurant_audit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "restaurant_audit_restaurant_id_created_at_idx" ON "restaurant_audit"("restaurant_id", "created_at");
ALTER TABLE "restaurant_audit" ADD CONSTRAINT "restaurant_audit_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "restaurant_audit" ADD CONSTRAINT "restaurant_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
