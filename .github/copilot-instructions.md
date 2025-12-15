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
