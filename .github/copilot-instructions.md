# Horizon Theme - Copilot Instructions

## Overview
Horizon is Shopify's flagship theme using modern web standards and the latest Liquid Storefronts features including [theme blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks). It prioritizes server-rendered HTML, progressive enhancement, and zero external JavaScript dependencies.

**Core principles:**
- **Web-native:** Leverage evergreen browsers, no polyfills - progressive enhancement only
- **Server-rendered:** HTML rendered by Shopify servers using Liquid, client JS is progressive enhancement
- **Lean and fast:** Every feature must justify its existence

## Architecture

### Directory Structure
- **`sections/`** - Page sections with `{% schema %}` definitions
- **`blocks/`** - Theme blocks (prefixed with `_` for internal blocks like `_product-card.liquid`)
- **`snippets/`** - Reusable Liquid components (e.g., `product-card.liquid`, `price.liquid`)
- **`assets/`** - JavaScript modules and CSS (imported via `@theme/` alias)
- **`config/`** - `settings_schema.json` (theme settings) and `settings_data.json`
- **`locales/`** - Translation files (`en.default.json` for content, `en.default.schema.json` for schema labels)
- **`schemas/`** - TypeScript schemas compiled to Liquid via `npm run build:schemas`

### Component Framework
JavaScript uses a custom Web Components framework in [assets/component.js](assets/component.js):

```javascript
import { Component } from '@theme/component';

/**
 * @typedef {Object} MyComponentRefs
 * @property {HTMLButtonElement} button - The main button
 * @property {HTMLElement} [optionalRef] - Optional element
 */

/** @extends {Component<MyComponentRefs>} */
class MyComponent extends Component {
  requiredRefs = ['button']; // Throws MissingRefError if not found
  
  /** @type {AbortController|null} */
  #abortController = null;
  
  connectedCallback() {
    super.connectedCallback();
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController?.abort();
  }
  
  // Called when Section Rendering API updates the section
  updatedCallback() {
    // Re-initialize after dynamic content update
  }
  
  handleClick(event) { /* ... */ }
}

customElements.define('my-component', MyComponent);
```

HTML binds with `ref` and `on:` attributes:
```liquid
<my-component>
  <button ref="button" on:click="/handleClick">Click</button>
  <div ref="items[]">Item 1</div>  {%- comment -%} Array ref with [] suffix {%- endcomment -%}
  <div ref="items[]">Item 2</div>
</my-component>
```

### Event System
Use [assets/events.js](assets/events.js) for cross-component communication:
- `ThemeEvents.variantUpdate` - Variant selection changes
- `ThemeEvents.variantSelected` - Variant picker interaction  
- `ThemeEvents.cartUpdate` - Cart modifications
- `ThemeEvents.cartError` - Cart operation failures
- `ThemeEvents.quantitySelectorUpdate` - Quantity changes
- `ThemeEvents.FilterUpdate` - Collection filter changes

---

## JavaScript Standards

### General Principles
- **Zero external dependencies** - Use native browser APIs only
- **Use `const`** over `let` unless reassignment needed
- **Use `for...of`** over `.forEach()`
- **Use `async/await`** over `.then()` chains
- **Early returns** over nested conditionals
- **Private methods**: Use `#methodName()` syntax
- **Module imports**: `import { utility } from '@theme/utilities'`

### Type Safety with JSDoc
Always annotate function parameters, return types, and complex objects:

```javascript
/**
 * @typedef {Object} ProductData
 * @property {string} id - Product identifier
 * @property {number} price - Product price
 * @property {boolean} [available] - Availability status
 */

/**
 * Updates product pricing display
 * @param {ProductData} product - The product to update
 * @param {HTMLElement} container - Target container
 * @returns {Promise<void>}
 */
const updateProductDisplay = async (product, container) => { /* ... */ };
```

### Error Handling & Cleanup
Always cancel pending requests and clean up:

```javascript
class DataLoader extends Component {
  /** @type {AbortController|null} */
  #abortController = null;

  async loadData(url) {
    this.#abortController?.abort();
    this.#abortController = new AbortController();

    try {
      const response = await fetch(url, { signal: this.#abortController.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (error.name !== 'AbortError') console.error(error);
      return null;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController?.abort();
  }
}
```

### URL Manipulation
Always use URL and URLSearchParams APIs:

```javascript
const updateFilters = (filters) => {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(filters)) {
    value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
  }
  history.pushState({ urlParameters: url.searchParams.toString() }, '', url.toString());
};
```

### JavaScript in Liquid Files
Use `{% javascript %}` tags for component-specific scripts:

```liquid
{% javascript %}
import { Component } from '@theme/component';
class FeaturedCollection extends Component { /* ... */ }
customElements.define('featured-collection', FeaturedCollection);
{% endjavascript %}
```

---

## CSS Standards

### Specificity Rules
- **Never use IDs** as selectors
- **Avoid element selectors** - use classes
- **Never use `!important`** - if you must, comment why
- **Target specificity**: `0 1 0` (single class) to `0 4 0` max
- **Limit `:has()` usage** - impacts performance during dynamic DOM updates

### BEM Naming Convention
```css
.product-card { }                    /* Block */
.product-card__title { }             /* Element */
.product-card__title--large { }      /* Modifier */
.product-card--featured { }          /* Block modifier */
```

Rules:
- Single element depth only (no `.block__element__subelement`)
- Modifiers require base class (`.button.button--secondary` not `.button--secondary` alone)
- Use dashes to separate words: `.product-card__info-text`

### CSS Variables
Namespace all variables to avoid collisions:

```css
/* ✅ Good - namespaced */
.component { --component-padding: var(--spacing-md); }

/* ❌ Bad - generic */
.component { --padding: 1rem; }
```

Scope settings inline rather than in Liquid CSS:
```html
<section style="--section-padding: {{ section.settings.padding }}px;">
```

Global variables go in `snippets/theme-styles-variables.liquid`.

### CSS Nesting Rules
- **No `&` operator** except for states (`:hover`, `:focus`) and parent modifiers
- **Never nest beyond first level** (except media queries)
- Media queries can be nested inside selectors

```css
.header {
  width: 100%;
  @media screen and (min-width: 750px) { width: 100px; }
}

.parent--full-width {
  .child { grid-column: 1; }  /* OK - parent modifier affecting child */
}
```

### Logical Properties
Use logical properties for RTL support:
```css
/* ✅ Good */
.element { padding-inline: 2rem; margin-block: 1rem; text-align: start; }

/* ❌ Avoid */
.element { padding-left: 2rem; margin-top: 1rem; text-align: left; }
```

### Modern CSS Features
- **Container queries** for responsive components
- **`clamp()`** for fluid spacing: `padding: clamp(1rem, 4vw, 3rem);`
- **`dvh`** instead of `vh` for mobile viewport issues
- **View transitions** for page navigation animations

### Performance
- Animate only `transform` and `opacity`
- Use `contain: content` on grid containers
- Use `will-change` sparingly, remove after animation

---

## HTML & Liquid Standards

### Native Elements Over JavaScript
**Always prefer native HTML:**
- `<details>/<summary>` - Expandable content, accordions
- `<dialog>` - Modals with built-in focus management
- `popover` attribute - Tooltips, menus, dropdowns
- `<search>` - Search form containers
- Native form validation - `required`, `pattern`, `minlength`

```html
<!-- Modal -->
<dialog id="ProductModal-{{ product.id }}">
  <form method="dialog"><button type="submit">Close</button></form>
</dialog>

<!-- Popover -->
<button popovertarget="CartMenu">Cart</button>
<div id="CartMenu" popover>{% render 'cart-drawer' %}</div>
```

### ID Naming Convention
Use CamelCase with section/block identifiers:
```html
<section id="FeaturedCollection-{{ section.id }}">
<dialog id="ProductModal-{{ product.id }}-{{ section.id }}">
```

### Translations
**Every user-facing text must use translation filters:**

```liquid
<!-- ✅ Good -->
<h2>{{ 'sections.featured_collection.title' | t }}</h2>
<p>{{ 'products.price_range' | t: min: product.price_min | money, max: product.price_max | money }}</p>

<!-- ❌ Bad -->
<h2>Featured Collection</h2>
```

Add keys to `locales/en.default.json` with hierarchical structure.
Schema labels go in `locales/en.default.schema.json`.

---

## Schema Standards

### Structure
Schemas are written in TypeScript in `schemas/` folder, compiled with `npm run build:schemas`.

```javascript
export default {
  name: 't:names.section_name',  // Must use translation key
  settings: [/* ... */],
  blocks: [{ type: '@theme' }],  // Accept theme blocks
  presets: [{ name: 't:names.section_name' }]
};
```

### Setting Organization
1. **Resource pickers first** (collection, product, blog, page)
2. **Layout settings** (columns, spacing)
3. **Typography settings** 
4. **Color settings**
5. **Padding/margin last**

Group with headers:
```json
{ "type": "header", "content": "t:labels.layout" }
```

### Labels
- Keep under 30 characters
- Use title case: "Show Vendor"
- No verb-based labels for checkboxes
- Setting type provides context: "Columns" not "Number of columns"

---

## Accessibility Standards

### Focus Management
- **Never remove focus styles** (`outline: none`)
- Use `:focus-visible` for keyboard-only focus indication
- **Never use positive tabindex** values - use DOM order
- Use `tabindex="-1"` for programmatic focus targets
- Minimum 3:1 contrast ratio for focus indicators

```css
.button:focus-visible {
  outline: 2px solid rgb(var(--color-focus));
  outline-offset: 2px;
}
```

### Motion & Animation
Always respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### Carousels
- `role="region"` + `aria-roledescription="carousel"` on container
- `role="group"` + `aria-roledescription="slide"` on each slide
- `aria-label` or `aria-labelledby` on both
- Auto-rotation: minimum 5 seconds, pause on focus/hover
- `aria-live="off"` during rotation, `"polite"` when paused
- `visibility: hidden` on inactive slides

### Disclosures
- `aria-expanded` on control button
- Content must be sibling to control in DOM
- Handle Enter and Space key events

### Forms
- Labels must be programmatically associated (`for`/`id`, `aria-label`, `aria-labelledby`)
- Use `aria-required="true"` + visual indicator for required fields
- Group radio/checkbox inputs in `<fieldset>` with `<legend>`
- Associate errors via `aria-describedby` when `aria-invalid="true"`

### Product Cards
- Wrap in `<article>` with `aria-labelledby` pointing to heading ID
- Single tab-stop per card (overlay link pattern)
- Descriptive `alt` text on product images

### Color Swatches
- Radio buttons: never `display: none` (use `appearance: none` or visually-hidden)
- Include text alternatives (tooltips/labels) - color alone can't convey info
- Support arrow key navigation between variants

### Sliders
- `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- `aria-valuetext` for user-friendly value representation
- Arrow keys, Home, End, Page Up/Down keyboard support

---

## Development Workflow

### Commands
```bash
shopify theme dev              # Start local development server
shopify theme check            # Lint with Theme Check
npm run build:schemas          # Compile TypeScript schemas to Liquid
```

### Key Reference Files
- [assets/component.js](assets/component.js) - Component framework
- [assets/events.js](assets/events.js) - Event system
- [assets/utilities.js](assets/utilities.js) - Helper functions
- [snippets/product-card.liquid](snippets/product-card.liquid) - Product card pattern
- [snippets/theme-styles-variables.liquid](snippets/theme-styles-variables.liquid) - Global CSS variables

### Section Rendering API
Components support dynamic updates via `updatedCallback()`:
```javascript
updatedCallback() {
  // Called after Section Rendering API updates the DOM
  this.#reinitialize();
}
```

---

## Migrating from Dawn/Older Themes

When porting code from Dawn or older Shopify themes, replace these legacy patterns:

### JavaScript Patterns to Replace

| Legacy Pattern | Horizon Pattern |
|---------------|-----------------|
| `class MyElement extends HTMLElement` | `class MyElement extends Component` (from `@theme/component`) |
| Manual `querySelector` for refs | Use `ref` attributes and `this.refs` |
| `element.addEventListener(...)` | Use `on:click="/handleMethod"` in HTML |
| `.then()` chains | `async/await` |
| `items.forEach((item) => ...)` | `for (const item of items) { ... }` |
| External libraries (jQuery, etc.) | Native browser APIs only |
| Custom event dispatching | Use `ThemeEvents` from `@theme/events` |

### HTML Patterns to Replace

| Legacy Pattern | Horizon Pattern |
|---------------|-----------------|
| Custom JS accordions | `<details>` / `<summary>` |
| Custom modal overlays | `<dialog>` element |
| Custom tooltips/dropdowns | `popover` attribute |
| Custom form validation JS | Native HTML5 validation |
| Hardcoded strings | Translation filters: `{{ 'key' | t }}` |
| `id="my-element"` | `id="MyElement-{{ section.id }}"` |

### CSS Patterns to Replace

| Legacy Pattern | Horizon Pattern |
|---------------|-----------------|
| `#id` selectors | `.class` selectors only |
| `!important` | Proper specificity management |
| `.block__element__subelement` | Single element depth: `.block__element` |
| `left`, `right`, `top`, `bottom` | Logical properties: `inline-start`, `block-start` |
| `padding-left: 1rem` | `padding-inline-start: 1rem` |
| `vh` units | `dvh` units (mobile viewport) |
| Inline `{% style %}` with block.id | Inline `style` attribute with CSS variables |

### Schema Patterns to Replace

| Legacy Pattern | Horizon Pattern |
|---------------|-----------------|
| Hardcoded schema names | Translation keys: `"name": "t:names.section"` |
| JSON schemas in `.liquid` | TypeScript schemas in `schemas/` folder |

### Example: Converting a Dawn Component

**Dawn pattern (avoid):**
```javascript
class ProductForm extends HTMLElement {
  constructor() {
    super();
    this.form = this.querySelector('form');
    this.submitButton = this.querySelector('[type="submit"]');
  }
  
  connectedCallback() {
    this.form.addEventListener('submit', this.onSubmit.bind(this));
  }
  
  onSubmit(event) {
    // ...
  }
}
```

**Horizon pattern (use):**
```javascript
import { Component } from '@theme/component';

/**
 * @typedef {Object} ProductFormRefs
 * @property {HTMLFormElement} form
 * @property {HTMLButtonElement} submitButton
 */

/** @extends {Component<ProductFormRefs>} */
class ProductForm extends Component {
  requiredRefs = ['form', 'submitButton'];
  
  handleSubmit(event) {
    // ...
  }
}

customElements.define('product-form', ProductForm);
```

```liquid
<product-form>
  <form ref="form" on:submit="/handleSubmit">
    <button ref="submitButton" type="submit">Add to cart</button>
  </form>
</product-form>
```

