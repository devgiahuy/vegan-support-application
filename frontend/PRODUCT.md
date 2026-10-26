# VeggieConnect frontend context

## Register

product

## Users

Vietnamese-speaking guests and members use the web application on phones and desktop browsers to discover vegetarian content, plan meals and find nearby restaurants. Administrators and approved Contributors have the roles defined in `../docs/SRS.md`.

## Product Purpose

Support practical vegetarian discovery and planning with clear source attribution and understandable limits. The restaurant directory helps people choose a place using an explicit location and search filters; it does not automatically apply the personal eating profile (approved 2026-10-25).

## Brand Personality

Friendly, clear and practical. Preserve the existing VeggieConnect wordmark, Vietnamese interface, green primary color and Be Vietnam Pro typography from `src/app/globals.css` and `src/app/layout.tsx`.

## Anti-references

Repository design rules reject generic AI-looking layouts, decorative glass effects, invented statistics, unverified claims presented as facts, and UI controls without real behavior. Do not use illustrative restaurant photographs as actual restaurant data.

## Design Principles

- Make the next useful action easy to find.
- Build on the existing shadcn/Radix components and semantic design tokens.
- Show actual backend data through UI Models, with loading, error, empty and success states.
- Keep provider attribution and the distinction between reviewed and unreviewed information visible.
- Preserve the public routes and navigation entry points while improving each screen's task flow.

## Accessibility & Inclusion

The canonical SRS requires keyboard and screen-reader access. Use labelled controls, visible focus, readable contrast, responsive layouts and reduced-motion support. Vietnamese is the default language. The repository does not claim a completed formal WCAG audit.

## Sources

Existing approved context: `../docs/SRS.md` 1.5, `../docs/IMPLEMENTATION_PLAN.md` 4.8, `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/BACKEND_INTEGRATION.md` 4.47 and the current global styles. Recorded 2026-10-25 for reuse by frontend design tools.
