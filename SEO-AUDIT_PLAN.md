# SEO Implementation Master Plan - Licious Clone

## Project Structure

### Backend

`~/Herd/laravel_project`

### Frontend

`~/Herd/Licious-clone/licious-clone-nextjs`

---

# Overall Goal

Implement production-grade SEO architecture safely and incrementally for:

* Homepage
* Categories
* Products
* Future CMS/blog pages
* Technical SEO

The strategy intentionally avoided large rewrites and focused on:

* SSR metadata
* normalized SEO contracts
* canonical stability
* incremental rollout
* backward compatibility

---

# SEO Implementation Phases

---

# Phase 1 - Backend SEO Normalization [COMPLETED]

## Goal

Stabilize backend SEO contracts and normalize SEO payloads before frontend integration.

## Completed Work

### Backend SEO Contract Stabilization

Implemented:

* normalized `seo` payloads
* additive API changes only
* no breaking payload removals

### Fixed / Improved

* `meta_tags.show_live` mismatch handling
* `MetaTag` fillable/casts normalization
* category meta relation handling
* canonical strategy groundwork
* slug consistency groundwork

### SEO Serialization

Standardized:

* `MetaTag::toSeoArray()`

This became the central SEO serializer.

### API Safety

* Existing frontend payloads preserved
* New SEO payload added alongside old structure
* No migrations added

## Important Architectural Decisions

* SEO responses remain additive
* Existing APIs remain backward compatible
* Canonical strategy prepared but not enforced globally yet
* Slug strategy deferred for product audit

## Risks Identified

* Product numeric routes still exist
* Production canonical base unresolved initially
* Some visibility/status logic depended on old assumptions

---

# Phase 2 - Root + Homepage SEO [COMPLETED]

## Goal

Implement foundational site-wide metadata and homepage metadata.

## Files Changed

* `app/layout.js`
* `app/page.js`
* `utils/seo.js`

## Completed Work

### Root Metadata

Implemented:

* `metadataBase`
* default title
* title template
* default description
* default OG metadata
* default Twitter metadata
* favicon/icons
* robots defaults

### Homepage Metadata

Implemented:

* `generateMetadata()`
* homepage canonical
* homepage OG
* homepage Twitter
* homepage JSON-LD

### Metadata Architecture

Created centralized SEO helper layer:

* `utils/seo.js`

### JSON-LD

* server-rendered only
* no hydration dependency

## Metadata Flow

`getSiteData()`
-> normalized SEO
-> `utils/seo.js`
-> `generateMetadata()`
-> server HTML output

## Important Fix Required

### Production Canonical Base

Added:

```env
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

This fixed:

* canonical origin issues
* metadataBase safety
* OG URL safety

## Risks Identified

* Homepage detection still heuristic-based
* Asset host handling partially environment-dependent
* Existing unrelated lint issues remain in repo

---

# Phase 3 - Category SEO [COMPLETED]

## Goal

Implement SSR category metadata without rewriting category UI.

## Files Changed

* `app/category/[slug]/page.js`
* `components/Category/CategoryPageClient.jsx`
* `utils/seo.js`
* `tests/seo.test.js`
* `package.json`

## Completed Work

### Category SSR Metadata

Implemented:

* title
* description
* canonical
* OG
* Twitter
* robots
* JSON-LD

### Server/Client Boundary

Architecture:

* server route wrapper
* existing UI preserved as client component

### Canonical Strategy

Implemented strict canonical normalization:

* category canonical must match live route
* invalid backend canonicals ignored

### OG/Twitter

Implemented:

* absolute image URL handling
* shared SEO helper reuse

### Validation

Verified:

* metadata exists in raw HTML source
* no hydration mismatch introduced
* JSON-LD server-rendered

## Important Findings

### Main Page Validation

Confirmed in raw HTML:

* `<title>`
* meta description
* canonical
* OG tags
* Twitter tags
* JSON-LD

### Remaining Issues Identified

1. Localhost canonical leakage
2. Local `.test` OG image URLs
3. Product routes still numeric:

```html
/product/15
```

This triggered the need for Product Route Audit BEFORE Product SEO.

---

# Phase 4 - Product Route Audit [COMPLETED]

## Goal

Audit current product routing before implementing Product SEO.

## Files Changed

* `SEO-AUDIT_PLAN.md`

## Files Audited

* `app/product/[id]/page.js`
* `components/LandingPage/HomePage.jsx`
* `components/Category/CategoryPageClient.jsx`
* `components/ProductData/Search.jsx`
* `utils/seo.js`

## Completed Work

### Route Architecture Audit

Confirmed:

* live product route is numeric: `/product/[id]`
* product detail page is client-rendered only
* product detail fetch uses numeric API endpoint: `/api/v1/{apiType}/products/{id}`

### Frontend URL Generation Audit

Confirmed numeric product URLs are generated from:

* homepage product cards
* category product cards
* search result navigation

No product slug-based routing is used anywhere in the current frontend.

### Slug Readiness Assessment

Findings:

* no frontend product slug helper exists
* no frontend route consumes product slug today
* no evidence in this repo that product slug uniqueness or immutability is guaranteed
* pure slug routing is not safe to adopt yet

### Canonical Risk Assessment

Identified:

* numeric product URLs currently leak across internal links
* product page cannot emit SSR metadata in its current client-only form
* product canonical strategy cannot be finalized safely until public route format is chosen

## Route Strategy Recommendation

Recommended canonical public route:

* `/product/{id}-{slug}`

Why:

* preserves backward compatibility with existing numeric URLs
* keeps routing resolvable even if slug quality is inconsistent initially
* allows frontend to continue fetching by numeric id with minimal risk
* supports redirect from legacy `/product/{id}` to the canonical hybrid URL later

## Recommended Follow-Up For Phase 5

Before Product SEO implementation:

* add a server route wrapper for product pages
* parse numeric id from the hybrid route
* keep numeric API fetch compatibility
* canonicalize all legacy `/product/{id}` links to the hybrid route
* only move to pure slug routes after backend slug stability is proven

## Changes Made In Phase 4

* completed frontend product route audit
* documented current product link-generation points
* finalized hybrid route recommendation for canonical product URLs
* confirmed Product SEO must follow route normalization, not precede it

---

# Phase 5 - Product SEO [COMPLETED]

## Goal

Implement product metadata safely AFTER route audit.

## Files Changed

* `app/product/[id]/page.js`
* `components/ProductPage/ProductDetailPageClient.jsx`
* `components/LandingPage/HomePage.jsx`
* `components/Category/CategoryPageClient.jsx`
* `components/ProductData/Search.jsx`
* `utils/seo.js`
* `utils/product.js`
* `tests/seo.test.js`
* `SEO-AUDIT_PLAN.md`

## Completed Work

### Product SSR Metadata

Implemented:

* `generateMetadata()` for product pages
* canonical product metadata
* OG metadata
* Twitter metadata
* robots handling
* product JSON-LD

### Route Strategy Implementation

Implemented:

* hybrid canonical product URLs: `/product/{id}-{slug}`
* legacy numeric URL support at the same route
* permanent redirect from `/product/{id}` to canonical hybrid URL
* shared frontend route helper for product links

### Server / Client Boundary

Architecture:

* server route wrapper at `app/product/[id]/page.js`
* existing interactive product UI moved to client component
* server-fetched product data passed into client UI

### SEO Data Strategy

Implemented:

* slug generation from backend slug or product name fallback
* canonical normalization against live hybrid route
* absolute product image URL handling
* SEO field fallback to product content when backend SEO fields are absent
* generated Product schema JSON-LD fallback when backend JSON-LD is absent

### Validation

Verified:

* hybrid product route helper output
* numeric route parameter parsing
* canonical metadata normalization
* OG/Twitter image resolution
* Product JSON-LD fallback generation

## Important Outcomes

* Product pages can now emit SSR metadata safely
* Internal product links no longer need to emit numeric-only URLs
* Backward compatibility is preserved for legacy numeric product URLs
* Product SEO is now aligned with the Phase 4 route audit recommendation

---

# Phase 5.5 - Product Slug Persistence (Backend) [COMPLETED]

## Goal

Persist stable product slugs in the backend so canonical product URLs do not depend on frontend fallback slug generation.

## Files Changed

* `../laravel-project/app/Models/Product.php`
* `../laravel-project/app/Support/ProductSlugSupport.php`
* `../laravel-project/app/Filament/Resources/Products/Schemas/ProductsForm.php`
* `../laravel-project/app/Filament/Resources/Products/Tables/ProductsTable.php`
* `../laravel-project/tests/Unit/Support/ProductSlugSupportTest.php`
* `SEO-AUDIT_PLAN.md`

## Completed Work

### Backend Slug Normalization

Implemented:

* centralized product slug helper
* automatic slug normalization on save
* collision-safe unique slug generation
* hybrid canonical URL generation from persisted slug

### Slug Quality Evaluation

Implemented:

* slug quality scoring helper
* explicit pass/fail result
* descriptive reasons for weak slugs

### Filament Admin Integration

Implemented:

* auto-generate slug from product name on create/edit
* normalize slug input before save
* show slug quality helper text in product form
* expose slug column in product listing table

### Canonical Consistency

Implemented:

* product canonical URL now uses `/product/{id}-{slug}`
* product meta canonical updates continue through model meta sync

### Validation

Verified:

* unique slug generation via Laravel test
* slug quality scoring via Laravel test
* hybrid canonical URL output via Laravel test

## Important Note

No new schema migration was required in this phase because the backend already had a unique `products.slug` column.

## Why This Phase Existed

Current Phase 5 supported hybrid canonical URLs on the frontend, but slug generation still fell back to product name data when a persisted backend slug was not being actively normalized.

A backend-owned slug is the stronger long-term SEO architecture because it makes:

* canonical URLs stable
* API payloads explicit
* redirects manageable
* slug collisions controllable

---

# Phase 6 - Technical SEO [COMPLETED]

## Files Changed

* `app/sitemap.js`
* `app/robots.js`
* `app/chicken/page.js`
* `app/chicken/[id]/page.js`
* `app/login/layout.tsx`
* `app/profile/layout.tsx`
* `app/checkout/layout.js`
* `app/checkout/otp/page.js`
* `app/new-checkout/layout.js`
* `app/orders/layout.js`
* `app/order/layout.js`
* `app/track-order/layout.js`
* `app/raise-query/layout.js`
* `next.config.js`
* `SEO-AUDIT_PLAN.md`

## Completed Work

### Sitemap

Implemented:

* sitemap.xml
* category URLs
* product URLs
* canonical-safe URLs only

Notes:

* excludes private/non-indexable routes
* skips localhost and `.test` site origins

### robots.ts

Implemented as metadata route:

* `app/robots.js`

Implemented:

* robots policy
* noindex handling
* environment safety

Notes:

* non-production or localhost-like environments disallow all crawling
* public environments expose sitemap reference
* private routes are disallowed explicitly

### Canonical Cleanup

Finalized:

* global canonical enforcement
* duplicate route prevention

Implemented:

* legacy `/chicken` category route permanently redirects to `/category/chicken`
* legacy `/chicken/{id}` product route permanently redirects to `/product/{id}`
* product route canonical enforcement from Phase 5 remains active

### Redirect Strategy

Implemented:

* legacy route redirects
* canonical redirect normalization

### Private Route Noindex

Implemented:

* noindex metadata on login, profile, checkout, orders, order detail, track-order, raise-query, and new-checkout sections

### Validation

Verified:

* `npm run test:seo` passes
* `npm run build` completes successfully
* legacy `/chicken` prerender failure removed

---

# Existing Technical Debt

## Repo-Wide Lint Issues

Still unresolved:

* `app/raise-query/page.js`
* `components/ProductData/Search.jsx`
* `components/Signin/login.jsx`

These blocked full clean production builds but are unrelated to SEO phases.

## Homepage Detection

Current homepage SEO detection is heuristic-based.

Should eventually become explicit.

## Asset Origin Handling

OG images still require final production-safe asset origin strategy.

---

# Important SEO Architecture Decisions

## Chosen Strategy

* incremental rollout
* SSR metadata
* minimal rewrites
* additive APIs
* centralized SEO helpers
* canonical normalization
* preserve existing UI behavior

## Avoided Intentionally

* massive App Router rewrites
* replacing client UI
* unnecessary libraries
* aggressive ISR rewrites
* breaking API changes

---

# Production Validation Checklist

## Verify In Raw HTML Source

Use:

```text
view-source:http://localhost:3000/...
```

NOT DevTools Elements tab.

Verify:

* title
* description
* canonical
* OG
* Twitter
* JSON-LD

## Verify Canonicals

Ensure:

* no localhost canonicals
* no `.test` domains
* no duplicate canonical paths

## Verify OG Images

Ensure:

* publicly accessible URLs
* absolute URLs only
* production-safe domains

---

# Current Status

## Completed

* Backend SEO normalization
* Root metadata
* Homepage SEO
* Category SEO
* Product route audit
* Product SEO
* Product slug persistence (backend)
* Technical SEO
* Final canonical hardening
* Shared SEO architecture
* SSR metadata flow
* JSON-LD SSR injection

## Pending

* None

---

# Recommended Next Steps After Quota Reset

1. Final production validation
2. Lighthouse + Search Console checks
