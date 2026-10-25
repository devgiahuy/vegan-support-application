# Contracts

- GET `/api/v1/allergens`: public active named catalog, descriptions and approved search terms.
- PUT `/api/v1/admin/ingredients/{id}/composition`: ADMIN only; expectedVersion, status, kind, componentIds and source evidence. Responds with current ingredient composition; records server reviewer/time and version. GET admin ingredient detail/history supports maintenance.
- Existing diet-preference save rejects inactive/unknown allergy codes with `INVALID_ALLERGEN_SELECTION` and canonicalizes labels.
- Existing discovery/planning APIs apply transitive constraints. Unknown composition rejects constrained candidates. Manual additions keep `MEAL_PLAN_HARD_CONSTRAINT_VIOLATION` and add explanatory reasons.
- Analysis summary reports real hard violations and fingerprints the graph. Program confirmation rejects hard-incompatible selected plans.

OpenAPI and `frontend/docs/BACKEND_INTEGRATION.md` define exact request/response/error shapes; endpoints remain IN_PROGRESS/CHANGING until required gates pass.
