# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: students — university students and self-learners, Portuguese
(PT/BR) and other Lusophone speakers — who want to study a real curricular
unit with free videos, mostly on a phone or laptop, without creating an
account.

Secondary: editors (`app_metadata.role = editor`) who curate courses, units,
learning objects, study sequences, playlists, suggestions and community
requests. Administrators (`admin`) also see catalogue counts and states.
Signed-in users without a role keep private study notes, mark their own
study modules as completed where a learning journey offers it, and manage
their account, submissions and community requests.

## Product Purpose

FACODI is an open, free digital campus. It organises existing public videos
and resources around the curricula of real higher-education programmes, so a
learner can follow a unit from its official syllabus to concrete material.
Success means a visitor finds a unit, understands its context and starts
studying in a few steps, with every item traceable to its original author.

## Positioning

A free, open campus that organises existing public videos and resources
(mostly YouTube) around the real curricula of higher-education programmes
(UAlg, UFES and others), with human editorial curation, and no account
required to study. The open-campus concept of the original facodi.com is the
reference; its former Odoo implementation is not.

## Operating Context

- Learners read the public catalogue (`/courses`, `/units`, `/modules`,
  `/resources`, `/sequences`) in ordinary reading conditions, often on mobile.
  Videos play through YouTube embeds; external references open the source.
- Accounts use Supabase Auth with email and password (`/login`,
  `/auth/callback`, `/auth/reset-password`). The account area holds the
  dashboard, profile and owner-only study notes (`/notes`).
- Contributions go through authenticated forms: playlist submission,
  resource suggestions and community join requests. They are reviewed by
  editors before anything is published.
- Editorial work happens in `/editor` and its sub-tools: study paths, course
  quality, project credits, email template preview, community, playlists and
  suggestions. `/admin` is read-only for catalogue status.
- Institutional and legal pages: `/about`, `/how-it-works`, `/community`,
  `/privacy`, `/terms`, `/cookies`, `/copyright`, `/accessibility` and
  `/legal`.

## Capabilities and Constraints

- React + Vite static SPA, Bun, TanStack Query, Supabase. Data comes only from
  the `facodi` schema; no Odoo, no legacy Edge Functions, no `public` data.
- The frontend requires only `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Authorisation is enforced by RLS. Roles come only from
  `app_metadata.role`; the app never promotes accounts.
- Public visibility rules: courses `published` and `active`; units `active`
  inside a public course; learning objects `published` with status `active`
  or `published`.
- New editorial content starts as a draft with manual origin. There are no
  hard deletes; records are archived.
- Supabase Auth is shared with Tube O2. Its global authentication emails use
  FACODI templates, and its `site_url` is `https://facodi.com`.
- Out of scope: enrolment, official academic records or grades, uploads, AI
  pipelines, automatic sync and certification. Study-module completion is
  self-declared and private to its owner.
- Interface in four aligned languages: Portuguese, English, Spanish and French.

## Brand Commitments

- Name: FACODI, an Open 2 Technology (Open2 / O2T) project. Canonical
  domain `https://facodi.com`.
- No advertising, no tracking or analytics, no paywall.
- Original authors are always credited; third-party content keeps its own
  licence and is never relicensed.
- Legal and institutional facts that are not confirmed are shown as "to be
  confirmed", never invented.

## Evidence on Hand

- Public catalogue (Data API with the publishable key, 2026-11-15): 7 courses,
  266 active units and 1,718 published learning objects.
- Curated programmes are documented under `docs/` (for example UAlg
  Management, CTeSP STI, UFES English Letters, GACS Astronomy).
- Imagery: real YouTube thumbnails of published, approved videos, plus the
  brand assets in `public/brand/`.
- Absent: testimonials, user metrics, institutional partnerships,
  accreditation and press coverage. Do not fabricate them.

## Product Principles

- Real catalogue data and honest empty states; never invented content.
- Study first: public discovery needs no account, and account or editorial
  actions stay clearly separated.
- Human curation over automation: nothing reaches the public catalogue
  without editorial review.
- Explicit errors and status changes; no success-shaped fallbacks.
- Credit and traceability: every resource points back to its author and
  source.

## Accessibility & Inclusion

- Target: WCAG 2.2 AA as an objective. Do not claim conformance without an
  audit.
- Keyboard access, visible focus, responsive layouts and reduced-motion
  support.
- Mobile-first reading for students on phones.
- Four aligned languages, with no hard-coded user-facing strings.
