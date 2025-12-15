/**
 * Dromgoole's Brands Alphabetical Index - Horizon Version
 *
 * Adds iOS Contacts-style alphabetical grouping and quick letter
 * navigation to the Brands menu in the header drawer.
 *
 * Adapted from Dawn version for Horizon's drawer structure.
 * Uses Horizon's submenu ID pattern: "link-brands"
 *
 * @see dromgooles-brands-index.css
 */

(function () {
  "use strict";

  // Configuration - the ID of the Brands submenu container
  // Horizon uses "link-{handle}" pattern for submenus
  const BRANDS_SUBMENU_ID = "link-brands";

  let initialized = false;
  let brandsSubmenu = null;
  let letterBar = null;
  let letterIndicator = null;
  let listContainer = null;
  let letterHeaders = new Map();
  let availableLetters = new Set();
  let isDragging = false;
  let indicatorTimeout = null;

  /**
   * Check if our elements are still in the DOM
   */
  function elementsStillValid() {
    return (
      letterBar &&
      letterBar.isConnected &&
      listContainer &&
      listContainer.isConnected
    );
  }

  /**
   * Reset state for re-initialization
   */
  function reset() {
    initialized = false;
    brandsSubmenu = null;
    letterBar = null;
    letterIndicator = null;
    listContainer = null;
    letterHeaders = new Map();
    availableLetters = new Set();
    isDragging = false;
    if (indicatorTimeout) {
      clearTimeout(indicatorTimeout);
      indicatorTimeout = null;
    }
  }

  /**
   * Initialize the brands index when the submenu is found
   */
  function init() {
    // If we think we're initialized but elements are gone, reset
    if (initialized && !elementsStillValid()) {
      reset();
    }

    if (initialized) return;

    brandsSubmenu = document.getElementById(BRANDS_SUBMENU_ID);
    if (!brandsSubmenu) return;

    // In Horizon, the menu list is inside .menu-drawer__inner-submenu
    const innerSubmenu = brandsSubmenu.querySelector(
      ".menu-drawer__inner-submenu",
    );
    if (!innerSubmenu) return;

    // Find the menu list - could be .menu-drawer__menu or ul with role="list"
    const menuList = innerSubmenu.querySelector(
      '.menu-drawer__menu, ul[role="list"]',
    );
    if (!menuList) return;

    const brandItems = Array.from(menuList.querySelectorAll("li"));
    if (brandItems.length < 10) return; // Only apply for large lists

    // Mark as initialized
    initialized = true;

    // Add the indexed class to the submenu
    brandsSubmenu.classList.add("menu-drawer__submenu--brands-indexed");

    // Group brands by first letter
    const groupedBrands = groupBrandsByLetter(brandItems);

    // Create the indexed list structure
    createIndexedList(innerSubmenu, menuList, groupedBrands);

    // Create the letter navigation bar
    createLetterBar();

    // Create the letter indicator
    createLetterIndicator();

    // Set up scroll tracking
    setupScrollTracking();
  }

  /**
   * Group brand items by their first letter
   */
  function groupBrandsByLetter(items) {
    const groups = new Map();

    items.forEach((item) => {
      const link = item.querySelector("a");
      if (!link) return;

      // Horizon uses .menu-drawer__menu-item-text for the text
      const textSpan = link.querySelector(".menu-drawer__menu-item-text");
      const text = textSpan
        ? textSpan.textContent.trim()
        : link.textContent.trim();

      let firstChar = text.charAt(0).toUpperCase();

      // Group non-alphabetic characters under #
      if (!/[A-Z]/.test(firstChar)) {
        firstChar = "#";
      }

      if (!groups.has(firstChar)) {
        groups.set(firstChar, []);
      }
      groups.get(firstChar).push(item);
      availableLetters.add(firstChar);
    });

    // Sort alphabetically, with # at the end
    return new Map(
      [...groups.entries()].sort((a, b) => {
        if (a[0] === "#") return 1;
        if (b[0] === "#") return -1;
        return a[0].localeCompare(b[0]);
      }),
    );
  }

  /**
   * Create the indexed list with letter headers
   */
  function createIndexedList(innerSubmenu, menuList, groupedBrands) {
    listContainer = document.createElement("div");
    listContainer.className = "brands-indexed-list";

    const fragment = document.createDocumentFragment();

    groupedBrands.forEach((items, letter) => {
      // Create letter header
      const header = document.createElement("div");
      header.className = "brands-letter-header";
      header.id = `brands-letter-${letter === "#" ? "num" : letter}`;
      header.textContent = letter;
      header.dataset.letter = letter;
      fragment.appendChild(header);

      letterHeaders.set(letter, header);

      // Create group container
      const group = document.createElement("ul");
      group.className = "brands-letter-group menu-drawer__menu";
      group.setAttribute("role", "list");

      items.forEach((item) => {
        group.appendChild(item.cloneNode(true));
      });

      fragment.appendChild(group);
    });

    listContainer.appendChild(fragment);

    // Hide original menu and insert new list
    menuList.style.display = "none";
    innerSubmenu.appendChild(listContainer);
  }

  /**
   * Create the letter navigation bar
   */
  function createLetterBar() {
    letterBar = document.createElement("nav");
    letterBar.className = "brands-letter-bar";
    letterBar.setAttribute("aria-label", "Alphabetical index");

    const allLetters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];

    allLetters.forEach((letter) => {
      const button = document.createElement("button");
      button.className = "brands-letter-bar__letter";
      button.textContent = letter;
      button.dataset.letter = letter;
      button.setAttribute("type", "button");
      button.setAttribute(
        "aria-label",
        `Jump to ${letter === "#" ? "numbers and symbols" : letter}`,
      );

      if (!availableLetters.has(letter)) {
        button.classList.add("brands-letter-bar__letter--disabled");
        button.setAttribute("aria-disabled", "true");
      }

      letterBar.appendChild(button);
    });

    // Event listeners
    letterBar.addEventListener("click", handleLetterClick);
    letterBar.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    letterBar.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    letterBar.addEventListener("touchend", handleTouchEnd);

    brandsSubmenu.appendChild(letterBar);
  }

  /**
   * Create the letter indicator popup
   */
  function createLetterIndicator() {
    letterIndicator = document.createElement("div");
    letterIndicator.className = "brands-letter-indicator";
    letterIndicator.setAttribute("aria-hidden", "true");
    brandsSubmenu.appendChild(letterIndicator);
  }

  /**
   * Handle click on a letter
   */
  function handleLetterClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.target.closest(".brands-letter-bar__letter");
    if (
      !button ||
      button.classList.contains("brands-letter-bar__letter--disabled")
    )
      return;

    const letter = button.dataset.letter;
    scrollToLetter(letter);
    showIndicator(letter);
  }

  /**
   * Handle touch start on letter bar
   */
  function handleTouchStart(event) {
    isDragging = true;
    handleTouchMove(event);
  }

  /**
   * Handle touch move on letter bar
   */
  function handleTouchMove(event) {
    if (!isDragging) return;
    event.preventDefault();

    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (
      element &&
      element.classList.contains("brands-letter-bar__letter") &&
      !element.classList.contains("brands-letter-bar__letter--disabled")
    ) {
      const letter = element.dataset.letter;
      scrollToLetter(letter);
      showIndicator(letter);

      // Update active state
      letterBar
        .querySelectorAll(".brands-letter-bar__letter")
        .forEach((btn) => {
          btn.classList.remove("brands-letter-bar__letter--active");
        });
      element.classList.add("brands-letter-bar__letter--active");
    }
  }

  /**
   * Handle touch end on letter bar
   */
  function handleTouchEnd() {
    isDragging = false;
    hideIndicator();
  }

  /**
   * Scroll to a specific letter section
   */
  function scrollToLetter(letter) {
    const headerId = `brands-letter-${letter === "#" ? "num" : letter}`;
    const header = document.getElementById(headerId);

    if (!header) return;

    // Find the scrollable container
    const scrollContainer = header.closest(".brands-indexed-list");
    if (!scrollContainer) return;

    // Get the header's position relative to the scroll container's content
    let targetTop = 0;
    let sibling = header;
    while (sibling.previousElementSibling) {
      sibling = sibling.previousElementSibling;
      targetTop += sibling.offsetHeight;
    }

    // Scroll to that position with smooth animation
    scrollContainer.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  }

  /**
   * Show the letter indicator
   */
  function showIndicator(letter) {
    if (indicatorTimeout) {
      clearTimeout(indicatorTimeout);
    }

    letterIndicator.textContent = letter;
    letterIndicator.classList.add("brands-letter-indicator--visible");

    if (!isDragging) {
      indicatorTimeout = setTimeout(hideIndicator, 500);
    }
  }

  /**
   * Hide the letter indicator
   */
  function hideIndicator() {
    letterIndicator.classList.remove("brands-letter-indicator--visible");
  }

  /**
   * Set up intersection observer for scroll tracking
   */
  function setupScrollTracking() {
    if (!listContainer) return;

    const observerOptions = {
      root: listContainer,
      rootMargin: "-10% 0px -85% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const letter = entry.target.dataset.letter;
          updateActiveLetterInBar(letter);
        }
      });
    }, observerOptions);

    letterHeaders.forEach((header) => {
      observer.observe(header);
    });
  }

  /**
   * Update the active letter in the navigation bar
   */
  function updateActiveLetterInBar(letter) {
    if (!letterBar) return;

    letterBar.querySelectorAll(".brands-letter-bar__letter").forEach((btn) => {
      btn.classList.toggle(
        "brands-letter-bar__letter--active",
        btn.dataset.letter === letter,
      );
    });
  }

  /**
   * Watch for the brands submenu to appear in the DOM
   */
  function watchForBrandsSubmenu() {
    // Try to initialize immediately
    init();

    // Also watch for DOM changes (submenu might be added dynamically)
    const observer = new MutationObserver((mutations) => {
      if (!initialized) {
        init();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Start watching when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watchForBrandsSubmenu);
  } else {
    watchForBrandsSubmenu();
  }
})();
