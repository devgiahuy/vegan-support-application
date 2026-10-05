# Meal Plan UTF-8 Warning Cleanup

## Recovery status

The project seed/reference files restored in this change were classified as accidental encoding-only changes and returned to their known-good UTF-8 source text. A complete pre-recovery diff is retained in `pre-utf8-recovery-backup.patch` at the repository root.

## Existing seeded data repair

`seedComprehensiveData` now repairs only known recipe seed revisions whose stored title contains a mojibake signature. It uses the stable seed recipe definition and updates the revision title, excerpt, body, and their normalized fields. It does not select or modify arbitrary user-created posts.

## Remaining work

The Meal Plan primary summary already limits `userSummary` and `warningDetails` to meal-plan warning codes; `micronutrientSummary` remains a legacy-compatible field and is not used to construct those primary summary fields.

The full internal incomplete-data list is retained on the analysis record. UI-facing consumers should use the summary and distinct warning records rather than concatenate that list into a paragraph.
