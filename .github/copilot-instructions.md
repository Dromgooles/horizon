# Copilot Instructions for Horizon Theme

This is Shopify's Horizon theme - a next-generation framework that incorporates the latest Liquid Storefronts features, including [theme blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks/quick-start?framework=liquid).

## Core Philosophy

Horizon follows the **"evergreen web"** approach:
- Server-rendered HTML via Liquid templates (no client-side rendering frameworks)
- No external dependencies, frameworks, or polyfills
- Progressive enhancement for browser compatibility
- Zero Cumulative Layout Shift (CLS) and no render-blocking JavaScript
- **Theme blocks** for maximum composability and reusability

## Architecture Overview

```
layout/theme.liquid     → Main HTML shell, loads global CSS/JS
sections/*.liquid       → Modular page sections with {% schema %} configs
blocks/*.liquid         → Reusable theme blocks (new in Horizon!)
snippets/*.liquid       → Reusable Liquid partials (render with {% render %})
templates/*.json        → JSON templates referencing sections
config/settings_*.json  → Theme-wide settings schema
assets/                 → CSS, JS, and static assets
locales/                → Translation files (t:key syntax)
```

## Theme Blocks - The Horizon Way

**Theme blocks are the key differentiator** from Dawn. They provide composable, reusable UI elements that can be used across multiple sections.

**Block Structure** - Blocks are split into two files:
```
blocks/button.liquid     → Contains {% schema %} with settings
snippets/button.liquid   → Contains the rendering logic
```

**Block File Pattern:**
```liquid
{% comment %} blocks/button.liquid {% endcomment %}
{% render 'button', link: block.settings.link %}

{% schema %}
{
  "name": "t:names.button",
  "tag": null,
  "settings": [...]
}
{% endschema %}
```

**Snippet File Pattern:**
```liquid
{% comment %} snippets/button.liquid {% endcomment %}
{%- doc -%}
  Intended for use in a block similar to the button block.
  @param {string} link - link to render
  @param {object} [block] - The block
{%- enddoc -%}

{% assign block_settings = block.settings %}
<a href="{{ link }}" class="size-style {{ block_settings.style_class }}">
  {{ block_settings.label }}
</a>

{% stylesheet %}
  .link {
    text-decoration: none;
    &:hover { color: var(--color-primary-hover); }
  }
{% endstylesheet %}
```

**Universal Blocks** - Blocks can be used anywhere with `"type": "@theme"`:
```liquid
{% schema %}
{
  "name": "t:names.section",
  "blocks": [
    {
      "type": "@theme"  // Allows ANY theme block to be added
    }
  ]
}
{% endschema %}
```

## JavaScript Patterns

**Web Components Architecture** - All interactive elements use native Custom Elements:
```javascript
// Pattern: Guard against re-registration, extend HTMLElement
if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement { ... });
}
```

**No Pub/Sub System** - Unlike Dawn, Horizon uses standard DOM events and native browser APIs for component communication.

## Liquid Conventions

**Section Schema with Theme Blocks** - Sections accept theme blocks for composition:
```liquid
{% schema %}
{
  "name": "t:names.hero",
  "blocks": [
    {
      "type": "@theme"  // Accept any theme block
    },
    {
      "type": "@app"    // Accept app blocks
    }
  ],
  "settings": [...]
}
{% endschema %}
```

**Rendering Blocks with {% content_for %}:**
```liquid
{% capture children %}
  {% content_for 'blocks' %}
{% endcapture %}

{% render 'section', section: section, children: children %}
```

**Block Parameters** - Document accepted parameters in comment blocks:
```liquid
{% comment %}
  Renders a button block
  Accepts:
  - link: {String} URL for the button
  - block: {Object} Block object with settings
  Usage:
  {% render 'button', link: section.settings.cta_url, block: block %}
{% endcomment %}
```

**Translation Keys** - Use `t:` prefix for translatable strings in schemas, reference `locales/en.default.json`.

## CSS Conventions

**Inline Stylesheets in Snippets** - Horizon uses `{% stylesheet %}` tags directly in snippets:
```liquid
{% stylesheet %}
  .image-block {
    display: flex;
    justify-content: var(--horizontal-alignment, 'inline-start');
  }
{% endstylesheet %}
```

**Size and Spacing Utilities** - Use provided utility snippets:
```liquid
{% render 'size-style', settings: block_settings %}
{% render 'spacing-style', settings: block_settings %}
{% render 'border-override', settings: block_settings %}
```

**CSS Custom Properties** - Define in inline styles:
```liquid
<div style="--ratio: {{ ratio }}; {% render 'size-style', settings: block_settings %}">
```

## Performance Requirements

- All scripts use `defer="defer"` - never block rendering
- No DOM manipulation before user input
- Conditional asset loading based on feature usage
- Images: responsive `srcset` with appropriate `sizes` attribute

## Migration & Customization Guidelines

**Preserve upstream compatibility** - Do NOT modify base Horizon files. This ensures clean updates from Shopify.

**Customization strategies (in order of preference):**
1. **New custom blocks** - Create `blocks/dromgooles-*.liquid` and `snippets/dromgooles-*.liquid` for new UI elements
2. **New sections** - Create `sections/dromgooles-*.liquid` for store-specific sections
3. **CSS overrides** - Add `assets/dromgooles.css` loaded via custom snippet
4. **JS extensions** - Create `assets/dromgooles.js` that extends existing web components or adds new ones

**Use modern Horizon constructs:**
- Leverage theme blocks for reusable UI components
- Use the `{% content_for 'blocks' %}` pattern for flexible sections
- Reference existing CSS custom properties rather than hardcoding colors
- Use `{% render %}` for snippets (do not use the deprecated `{% include %}` construct)

**Stylesheet migration principles:**
- Use inline `{% stylesheet %}` tags in snippets when possible
- For global overrides, use a single `assets/dromgooles.css` file
- Map old styles to Horizon's CSS custom properties where possible
- Avoid `!important` overrides; prefer specificity or CSS custom property redefinition

## File Identification & Naming

**Custom file naming** - Prefix ALL custom files with `dromgooles-`:
- `blocks/dromgooles-hero-banner.liquid` + `snippets/dromgooles-hero-banner.liquid`
- `sections/dromgooles-featured-products.liquid`
- `assets/dromgooles-styles.css`, `assets/dromgooles-scripts.js`

**Files safe to customize directly** (store-specific, not in upstream):
- `config/settings_data.json` - Store settings values
- `templates/*.json` - Page template configurations
- `locales/en.default.json` - Only for adding new keys

**Files to NEVER modify** (will cause merge conflicts):
- Core Horizon files in `blocks/`, `sections/`, `snippets/`, `assets/`
- `layout/theme.liquid` - Add custom CSS/JS via custom sections/blocks instead
- `config/settings_schema.json`

## Horizon-Specific Patterns

**Responsive Sizing Pattern:**
```liquid
{% schema %}
{
  "settings": [
    {
      "type": "select",
      "id": "width",
      "label": "t:settings.width_desktop",
      "options": [
        { "value": "fit-content", "label": "t:options.fit_content" },
        { "value": "custom", "label": "t:options.custom" }
      ]
    },
    {
      "type": "select",
      "id": "width_mobile",
      "label": "t:settings.width_mobile",
      "options": [...]
    }
  ]
}
{% endschema %}
```

**Conditional Block Visibility:**
```liquid
{
  "type": "range",
  "id": "custom_width",
  "label": "t:settings.custom_width",
  "visible_if": "{{ block.settings.width == \"custom\" }}"
}
```

**Typography Presets:**
```liquid
{
  "type": "select",
  "id": "type_preset",
  "options": [
    { "value": "paragraph", "label": "t:options.paragraph" },
    { "value": "h1", "label": "t:options.h1" },
    { "value": "h2", "label": "t:options.h2" }
  ]
}
```

## Custom Dromgoole's Guidelines

When creating Dromgoole's customizations for Horizon:

1. **Create custom blocks** for reusable UI elements (color swatches, promo banners, etc.)
2. **Create custom sections** that compose Horizon's theme blocks and custom blocks
3. **Maintain CSS overlay** approach with `dromgooles.css` for global overrides
4. **Document all customizations** in `DROMGOOLES-CUSTOMIZATIONS.md`
5. **Use Dromgoole's brand colors** as CSS custom properties
6. **Test theme block composition** across different sections

## Common Gotchas

1. **Block vs Snippet separation** - Schema goes in `blocks/`, rendering in `snippets/`
2. **{% content_for 'blocks' %}** - Required to render child blocks in sections
3. **Theme block availability** - Use `"type": "@theme"` to accept all theme blocks
4. **Inline stylesheets** - Use `{% stylesheet %}` for component-specific CSS
5. **Size utilities** - Use `{% render 'size-style' %}` instead of custom width/height logic
6. **Shopify attributes** - Always add `{{ block.shopify_attributes }}` to block root elements

## Development Workflow

```bash
# Start development server
shopify theme dev

# Lint theme code
shopify theme check

# Pull latest Horizon updates
git fetch upstream && git pull upstream main
```

## Key Differences from Dawn

| Feature | Dawn | Horizon |
|---------|------|---------|
| Component System | Sections only | Theme Blocks + Sections |
| CSS Loading | External files | Inline `{% stylesheet %}` |
| Block Composition | Section-specific | Universal `@theme` blocks |
| File Structure | Flat sections | `blocks/` + `snippets/` split |
| Reusability | Copy/paste snippets | Compose theme blocks |

## Resources

- [Theme Blocks Documentation](https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks)
- [Horizon GitHub Repository](https://github.com/Shopify/horizon)
- [Shopify CLI Documentation](https://shopify.dev/docs/themes/tools/cli)

---

## Dromgoole's Custom Files Reference

### Core Files

#### assets/dromgooles.css
Contains all CSS customizations organized into sections:
1. CSS Custom Property Extensions - Brand colors as CSS variables
2. Typography Utilities - Text alignment, font weight helpers
3. Color Background Utilities - Product color coding backgrounds (30+ color classes)
4. Border Radius Utilities - Rounded corner helpers
5. Layout & Spacing Utilities - Flexbox, display, gap helpers
6. Card & Product Grid Customizations - Product card styling
7. Header Enhancements - Non-invasive header improvements
8. Component-Specific Overrides - Modal, quick-add, price styling
9. Responsive Adjustments - Mobile/tablet specific styles
10. Print Styles - Optimized printing

#### snippets/dromgooles-styles.liquid
Loader snippet that includes the custom CSS.

### Custom Theme Blocks

#### dromgooles-collection-card
**Files:** `blocks/dromgooles-collection-card.liquid` + `snippets/dromgooles-collection-card.liquid`

**Features:**
- Custom images (override collection featured image)
- Background colors and gradients
- Circular swatches (for "Shop by Color" grids)
- Border radius control (0-50% for circles)
- Image fit options (cover/contain)
- Custom titles and hide title option
- Responsive sizing

**Settings:**
- Collection picker
- Custom image override
- Hide title checkbox
- Custom title text
- Background color/gradient
- Text color
- Image style (cover/contain)
- Border radius (0-50%)
- Responsive width/height controls

#### dromgooles-promo-banner
**Files:** `blocks/dromgooles-promo-banner.liquid` + `snippets/dromgooles-promo-banner.liquid`

**Features:**
- Background image with overlay opacity control
- Gradient backgrounds
- Solid color backgrounds
- Text and button
- Flexible text alignment
- Configurable button styles
- Minimum height control

**Settings:**
- Title and richtext content
- Background image with overlay opacity
- Background color/gradient
- Button label, link, and style
- Text alignment (left/center/right)
- Minimum height (200-800px)
- Responsive sizing

### Custom Sections

#### dromgooles-collection-grid
**File:** `sections/dromgooles-collection-grid.liquid`

**Features:**
- Accepts `@theme` and `@app` blocks
- Responsive column control (desktop/tablet/mobile)
- Configurable gap between items
- Section header with title and description
- Header alignment control
- Uses Horizon's spacing and color scheme system

**Settings:**
- Section title and description
- Title size (h1-h6)
- Header alignment
- Columns: 1-6 (desktop), 1-4 (tablet), 1-3 (mobile)
- Gap: 0-60px
- Section width (full-width/page-width)
- Color scheme
- Padding (top/bottom, desktop/mobile)

**Example composition:**
```json
{
  "type": "dromgooles-collection-grid",
  "settings": {
    "title": "Shop by Color",
    "columns_desktop": 6,
    "columns_mobile": 3
  },
  "blocks": [
    {
      "type": "dromgooles-collection-card",
      "settings": {
        "collection": "red-pens",
        "background_color": "#e53935",
        "border_radius": 50
      }
    }
  ]
}
```

## Brand Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Orange | #c06014 | 192, 96, 20 | Primary accent, buttons |
| Blue | #0b3c5d | 11, 60, 93 | Secondary accent |
| Gray | #d1d1d1 | 209, 209, 209 | Background variation |

## CSS Custom Properties

Use these in custom sections/snippets/blocks:

```css
/* Brand colors (RGB triplet for rgba() usage) */
var(--dromgooles-orange)    /* 192, 96, 20 */
var(--dromgooles-blue)      /* 11, 60, 93 */
var(--dromgooles-gray)      /* 209, 209, 209 */

/* Direct hex values */
var(--dromgooles-orange-hex)  /* #c06014 */
var(--dromgooles-blue-hex)    /* #0b3c5d */
var(--dromgooles-gray-hex)    /* #d1d1d1 */
```

## Utility Classes

### Color Backgrounds
Available color classes for product categorization:
`color-background-orange`, `color-background-blue`, `color-background-gold`, `color-background-red`, `color-background-burgundy`, `color-background-purple`, `color-background-pink`, `color-background-green`, `color-background-teal`, `color-background-yellow`, `color-background-bronze`, `color-background-copper`, `color-background-brown`, `color-background-silver`, `color-background-navy`, `color-background-coral`, and 15+ more.

### Border Radius
`border-radius-circle`, `border-radius-pill`, `border-radius-lg`

### Layout
`d-flex`, `justify-between`, `align-center`, `gap-1`, `gap-2`, `gap-3`

### Typography
`text-center`, `text-left`, `text-right`, `font-weight-bold`

## Collection Landing Page Templates

Create custom templates in `templates/collection.*.json` for featured collections.

**Template Structure Pattern:**
```json
{
  "sections": {
    "hero": {
      "type": "hero"
    },
    "shop_by_colors": {
      "type": "dromgooles-collection-grid",
      "settings": {
        "title": "Shop by Color",
        "columns_desktop": 6
      },
      "blocks": {
        "red": {
          "type": "dromgooles-collection-card",
          "settings": {
            "collection": "red-fountain-pens",
            "background_color": "#e53935",
            "border_radius": 50
          }
        }
      }
    }
  },
  "order": ["hero", "shop_by_colors"]
}
```

## Dawn to Horizon Migration Mapping

### ✅ Fully Migrated Custom Components

**dromgooles-collection-grid** - Migrated as custom section  
**dromgooles-collection-card** - Created as theme block  
**dromgooles-promo-banner** - Created as theme block

### ✅ Not Needed - Horizon Has It

**dromgooles-spacer** - Use Horizon's built-in `spacer` block

### 🔍 Review Before Migrating

Before creating custom versions, check if Horizon's built-in sections/blocks suffice:
- **slideshow** - Check Horizon's slideshow section
- **multicolumn** - Check Horizon's content sections  
- **footer** - Check Horizon's footer blocks
- **featured-collection** - Use Horizon's featured-collection block
- **color-swatches** - Use dromgooles-collection-grid + dromgooles-collection-card
- **main-product** - Check Horizon's product sections

## Horizon-Specific Best Practices

### Use Theme Blocks for Composition
✅ **Good:** Flexible composition with `"type": "@theme"`  
❌ **Avoid:** Hard-coded specific block types only

### Use Inline Stylesheets in Snippets
✅ **Good:** Scoped `{% stylesheet %}` in snippet  
❌ **Avoid:** External CSS files for component styles

### Leverage Horizon's Utility Snippets
✅ **Good:** `{% render 'size-style', settings: block_settings %}`  
❌ **Avoid:** Manual responsive sizing with inline styles

### Use CSS Custom Properties
✅ **Good:** `style="--custom-color: {{ block.settings.color }};"`  
❌ **Avoid:** Direct color values in style attributes

## Template JSON Validation Rules

**Critical:** Horizon has strict validation for text blocks:
1. All text content MUST be wrapped in HTML tags: `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<p>`, `<ul>`, `<ol>`
2. Use `"type": "text"` instead of `"type": "heading"` (heading block type doesn't exist)
3. Control text appearance with `"type_preset"`: `"h1"`, `"h2"`, `"h3"`, `"paragraph"`, etc.
4. Always include `{{ block.shopify_attributes }}` on block root elements

**Example valid text block:**
```json
{
  "type": "text",
  "settings": {
    "type_preset": "h1",
    "text": "<h1>My Heading Text</h1>"
  }
}
```

## Important: Output Guidelines

**DO NOT generate documentation or summary markdown files unless explicitly requested by the user.** Keep responses concise and focused on implementation. When completing work, confirm completion briefly without creating new documentation files.
