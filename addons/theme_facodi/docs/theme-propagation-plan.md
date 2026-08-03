# FACODI Theme Propagation Plan

Branch: `feat/facodi-theme-remaining-pages`
Target: `odoo` branch of `Open2Tech/facodi`
Goal: extend the FACODI visual identity across the remaining Odoo Website / eLearning / Auth surfaces while keeping standard templates and behavior intact.

## Current state

The theme already covers:
- Colour palette, typography and tokens in `static/src/scss/`
- Custom header, footer and homepage in `views/`
- Basic eLearning colour overrides (`o_wslides_body` cover)

## Pages still using mostly standard Odoo styling

### 1. Authentication
- `web.login_layout` / `website.login_layout`
- `web.login`
- `auth_signup.signup`
- `auth_signup.reset_password`
- `auth_signup.fields`

### 2. Course catalog
- `website_slides.courses_home`
- `website_slides.courses_search_bar`
- `website_slides.courses_search_results`
- `website_slides.course_card_information`

### 3. Course page
- `website_slides.course`
- `website_slides.course_sidebar`
- `website_slides.course_join`
- `website_slides.course_slides_list`
- `website_slides.course_slides_list_slide`

### 4. Lesson / video page
- `website_slides.slide_main`
- `website_slides.slide_content_detailed`
- `website_slides.slide_aside_training`
- `website_slides.slide_aside_training_category`
- `website_slides.slide_fullscreen`

### 5. Profile / user area
- `website_profile.user_profile_content`
- `website_slides.user_profile_content`
- `website_slides.display_course`

### 6. Search, empty, error and restricted states
- `website.website_search_box` / `website.list_hybrid` / `website.one_hybrid`
- `http_routing.403` / `http_routing.404` / `http_routing.4xx`
- `website.404_plausible`
- `website_slides.course_slides_list_placeholder`
- `website_profile.profile_access_denied`
- `website_slides.profile_access_denied`

## Implementation strategy

1. **Prefer inheritance** — use `inherit_id` and CSS hooks to avoid replacing whole templates.
2. **Add reusable utility classes** in `facodi_frontend.scss` for cards, buttons, forms, empty states and overlays.
3. **Create view files by functional area**:
   - `views/auth.xml`
   - `views/slides_catalog.xml`
   - `views/slides_course.xml`
   - `views/slides_lesson.xml`
   - `views/profile.xml`
   - `views/search_error.xml`
4. **Update `__manifest__.py`** to include the new data files.
5. **Validate** XML/SCSS and test on staging.

## Progress

- [x] Auth form/card/input SCSS utilities
- [x] `views/auth.xml` + manifest entry
- [x] `views/slides_catalog.xml`
- [x] `views/slides_course.xml`
- [x] `views/slides_lesson.xml`
- [x] `views/profile.xml`
- [x] `views/search_error.xml`
- [ ] Staging install/upgrade validation

## Tokens to reuse

- Ink: `#142846`
- Cyan: `#37BED2`
- Blue: `#3979C8`
- Mint: `#A7E8BE`
- Sun: `#EFFF00`
- Paper: `#F9FAFB`
- Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (labels)
- Shadow/border: 2px solid ink, 4px offset shadow
- Radius: 8px / 0.5rem
