# FACODI Theme Propagation Plan

Branch: `feat/facodi-theme-remaining-pages`
Target: `odoo` branch of `Open2Tech/facodi`
Goal: extend the FACODI visual identity across the remaining Odoo Website / eLearning / Auth surfaces while keeping standard templates and behavior intact.

## Current state

The theme now covers:
- Colour palette, typography and tokens in `static/src/scss/`
- Custom header, footer and homepage in `views/`
- Bootstrap component overrides (buttons, forms, cards, navs, breadcrumbs, pagination, dropdowns, modals, accordions, alerts, badges, progress)
- Website Builder snippet token styling
- eLearning full-page overrides (catalog, course, lesson, fullscreen, quiz, comments, share, profile)
- Portal overrides (dashboard, details, security, addresses, breadcrumbs, pagination, dropdown)
- Auth form/card/input styling
- Search results / empty states / 4xx/403/404/500 error pages
- Cookie / GDPR banner styling
- Defensive CSS for optional apps: blog, events, forum

## Inherited templates

### Authentication
- `web.login_layout` / `web.login`
- `auth_signup.signup` / `auth_signup.reset_password` / `auth_signup.login`

### Course catalog
- `website_slides.courses_home`
- `website_slides.courses_search_bar`
- `website_slides.courses_search_results`
- `website_slides.course_card`
- `website_slides.course_card_information`

### Course page
- `website_slides.course_main`
- `website_slides.course_sidebar`
- `website_slides.course_nav`
- `website_slides.course_join`
- `website_slides.course_slides_list`
- `website_slides.course_slides_list_slide`
- `website_slides.course_slides_cards`

### Lesson / video page
- `website_slides.slide_main`
- `website_slides.slide_content_detailed`
- `website_slides.slide_aside_training`
- `website_slides.slide_aside_training_category`
- `website_slides.slide_aside_documentation`
- `website_slides.slide_fullscreen`
- `website_slides.lesson_content_quiz`
- `website_slides.lesson_content_quiz_question`
- `#discuss` dentro de `website_slides.slide_content_detailed`
- `website_slides.slide_share_modal`

### Profile / user area
- `website_profile.user_profile_content`
- `website_profile.profile_access_denied`
- `website_slides.user_profile_content`
- `website_slides.display_course`
- `website_slides.profile_access_denied`

### Portal
- `portal.frontend_layout`
- `portal.portal_my_home`
- `portal.portal_layout`
- `portal.portal_docs_entry`
- `portal.side_content`
- `portal.portal_my_details`
- `portal.portal_my_security`
- `portal.portal_searchbar`
- `portal.portal_breadcrumbs`
- `portal.pager`
- `portal.user_dropdown`
- `portal.user_sign_in`
- `portal.address_management`
- `portal.my_addresses`
- `portal.address_card`
- `portal.address_form_fields`

### Search / errors
- `website.website_search_box`
- `website.website_search_box_input`
- `website.list_hybrid`
- `website.one_hybrid`
- `http_routing.4xx` / `http_routing.403` / `http_routing.404` / `http_routing.500`
- `website.page_404`
- `website.protected_403`

### Cookies
- `website.cookie_banner`
- `website.cookies_bar`

## Implementation strategy

1. **Prefer inheritance** — use `inherit_id` and CSS hooks to avoid replacing whole templates.
2. **Add reusable utility classes** in `facodi_frontend.scss` for cards, buttons, forms, empty states and overlays.
3. **Create view files by functional area**:
   - `views/auth.xml`
   - `views/slides_catalog.xml`
   - `views/slides_course.xml`
   - `views/slides_lesson.xml`
   - `views/slides_profile.xml`
   - `views/profile.xml`
   - `views/search_results.xml`
   - `views/search_error.xml`
   - `views/cookies.xml`
4. **Update `__manifest__.py`** to include the new data files.
5. **Validate** XML/SCSS and test on staging.

## Progress

- [x] Global Bootstrap/Foundation overrides (`primary_variables.scss`, `bootstrap_overridden.scss`, `facodi_frontend.scss`)
- [x] Website Builder snippet token styling
- [x] Auth form/card/input SCSS utilities + `views/auth.xml`
- [x] `views/slides_catalog.xml`
- [x] `views/slides_course.xml`
- [x] `views/slides_lesson.xml`
- [x] `views/slides_profile.xml`
- [x] `views/profile.xml`
- [x] `views/search_results.xml`
- [x] `views/search_error.xml`
- [x] `views/cookies.xml`
- [x] `__manifest__.py` updated
- [ ] Staging install/upgrade validation

## Tokens to reuse

Palette recovered from the legacy React SPA on branch `prod`:

- Primary: `#EFFF00`
- Black: `#000000`
- White: `#FFFFFF`
- Muted: `#F2F2F2`
- Gray: `#666666`
- Dark mode background: `#0b0b0b`
- Dark mode surface: `#1a1a1a`
- Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (labels)
- Shadow/border: 2px solid black, 4px offset shadow
- Radius: 8px / 0.5rem

## Limitations / known gaps

- Blog, Event and Forum pages are styled only via defensive CSS classes (`o_wblog_*`, `o_wevent_*`, `o_wforum_*`). No QWeb template inheritance is done for these apps because they are not installed by default.
- eCommerce snippets receive token-level styling but no full shop/cart/checkout template overrides.
- Website Builder snippet markup is not replaced; only colors, borders, shadows and typography are themed.
- Backend / Website Builder editor chrome is not customized beyond the color palette and fonts.
