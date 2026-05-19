'use strict';

// ============================================================
// BIRTOLL & CO — main.js
// ============================================================


// ── Element references ────────────────────────────────────────
const header         = document.getElementById('header');
const hamburger      = document.getElementById('hamburger');
const mobileMenu     = document.getElementById('mobileMenu');
const mobileBackdrop = document.getElementById('mobileMenuBackdrop');
const cartBtn        = document.getElementById('cartBtn');
const cartBadge      = document.getElementById('cartBadge');


// ── State ─────────────────────────────────────────────────────
const state = {
  cartCount: 0,
  menuOpen:  false,
};


// ============================================================
// 1. HEADER — Scroll Behavior
//    Adds `header--scrolled` class when page scrolled > 10px.
//    CSS handles background blur + shadow via that class.
// ============================================================

const SCROLL_THRESHOLD = 10;

function onScroll() {
  header.classList.toggle('header--scrolled', window.scrollY > SCROLL_THRESHOLD);
}

window.addEventListener('scroll', onScroll, { passive: true });

// Run immediately in case page loads mid-scroll
onScroll();


// ============================================================
// 2. MOBILE MENU — Toggle / Open / Close
// ============================================================

function openMenu() {
  state.menuOpen = true;

  // Double rAF ensures CSS transition fires after display change
  requestAnimationFrame(() => requestAnimationFrame(() => {
    mobileMenu.classList.add('mobile-menu--open');
    mobileBackdrop.classList.add('mobile-menu-backdrop--visible');
    hamburger.classList.add('hamburger--active');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    // Trap focus inside menu
    mobileMenu.querySelector('.mobile-menu__link')?.focus();
  }));
}

function closeMenu() {
  state.menuOpen = false;

  mobileMenu.classList.remove('mobile-menu--open');
  mobileBackdrop.classList.remove('mobile-menu-backdrop--visible');
  hamburger.classList.remove('hamburger--active');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';

  // Return focus to trigger
  hamburger.focus();
}

function toggleMenu() {
  state.menuOpen ? closeMenu() : openMenu();
}

// Triggers
hamburger.addEventListener('click', toggleMenu);
mobileBackdrop.addEventListener('click', closeMenu);

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.menuOpen) closeMenu();
});

// Close when resized to desktop breakpoint
window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
  if (e.matches && state.menuOpen) closeMenu();
});

// Close when a mobile menu link is clicked
mobileMenu.querySelectorAll('.mobile-menu__link').forEach(link => {
  link.addEventListener('click', closeMenu);
});


// ============================================================
// 3. CART BADGE
// ============================================================

function updateCartBadge(count) {
  state.cartCount = count;
  cartBadge.textContent = count;
  cartBadge.classList.toggle('header__cart-badge--visible', count > 0);
  cartBtn.setAttribute('aria-label', `Корзина, ${count} ${pluralRu(count, 'товар', 'товара', 'товаров')}`);
}

// Russian pluralization helper
function pluralRu(n, one, few, many) {
  const abs = Math.abs(n);
  const mod10  = abs % 10;
  const mod100 = abs % 100;

  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

// Public Cart API — use from any page/component
window.BirtollCart = {
  add(qty = 1)     { updateCartBadge(state.cartCount + qty); },
  remove(qty = 1)  { updateCartBadge(Math.max(0, state.cartCount - qty)); },
  set(count)       { updateCartBadge(Math.max(0, count)); },
  clear()          { updateCartBadge(0); },
  getCount()       { return state.cartCount; },
};



// ============================================================
// 4. SMOOTH ANCHOR SCROLL
// ============================================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const id = anchor.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (state.menuOpen) closeMenu();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});


// ============================================================
// 5. CATEGORIES CAROUSEL
// ============================================================

(function initCategoryCarousel() {
  const track    = document.getElementById('catTrack');
  const btnPrev  = document.getElementById('catPrev');
  const btnNext  = document.getElementById('catNext');
  if (!track || !btnPrev || !btnNext) return;

  const GAP = 12; // px — mirrors --sp-3
  let currentIndex = 0;

  function getVisibleCount() {
    const w = window.innerWidth;
    if (w >= 1024) return 6;
    if (w >= 768)  return 4;
    if (w >= 576)  return 3;
    return 2;
  }

  function refresh() {
    const visible    = getVisibleCount();
    const wrapWidth  = track.parentElement.offsetWidth - 20; // 10px padding each side
    const total      = track.children.length;
    const maxIndex   = Math.max(0, total - visible);

    currentIndex = Math.min(Math.max(currentIndex, 0), maxIndex);

    // Cards are 15% narrower; remaining space becomes gap
    const slotWidth   = (wrapWidth - (visible - 1) * GAP) / visible;
    const cardWidth   = Math.floor(slotWidth * 0.85);
    const adjustedGap = visible > 1
      ? Math.floor((wrapWidth - visible * cardWidth) / (visible - 1))
      : 0;

    [...track.children].forEach(card => {
      card.style.flex = `0 0 ${cardWidth}px`;
    });

    track.style.gap       = `${adjustedGap}px`;
    track.style.transform = `translateX(-${currentIndex * (cardWidth + adjustedGap)}px)`;
    btnPrev.disabled = currentIndex === 0;
    btnNext.disabled = currentIndex >= maxIndex;
  }

  btnPrev.addEventListener('click', () => { currentIndex--; refresh(); });
  btnNext.addEventListener('click', () => { currentIndex++; refresh(); });
  window.addEventListener('resize', refresh);
  refresh();
}());


// ============================================================
// 6. REVIEWS CAROUSEL
// ============================================================

(function initReviewsCarousel() {
  const track   = document.getElementById('revTrack');
  const btnPrev = document.getElementById('revPrev');
  const btnNext = document.getElementById('revNext');
  if (!track || !btnPrev || !btnNext) return;

  const GAP = 16;
  let currentIndex = 0;

  function getVisibleCount() {
    const w = window.innerWidth;
    if (w >= 1024) return 3;
    if (w >= 768)  return 2;
    return 1;
  }

  function refresh() {
    const visible   = getVisibleCount();
    const wrapWidth = track.parentElement.offsetWidth;
    const total     = track.children.length;
    const maxIndex  = Math.max(0, total - visible);

    currentIndex = Math.min(Math.max(currentIndex, 0), maxIndex);

    const cardWidth = Math.floor((wrapWidth - (visible - 1) * GAP) / visible);

    [...track.children].forEach(card => {
      card.style.flex = `0 0 ${cardWidth}px`;
    });

    track.style.gap       = `${GAP}px`;
    track.style.transform = `translateX(-${currentIndex * (cardWidth + GAP)}px)`;
    btnPrev.disabled = currentIndex === 0;
    btnNext.disabled = currentIndex >= maxIndex;
  }

  btnPrev.addEventListener('click', () => { currentIndex--; refresh(); });
  btnNext.addEventListener('click', () => { currentIndex++; refresh(); });
  window.addEventListener('resize', refresh);
  refresh();
}());


// ============================================================
// 7. PRODUCT WISHLIST → CART
// ============================================================

(function initProductWishlist() {
  const STAR_DEFAULT = 'images/icons-svg/star.svg';
  const STAR_ACTIVE  = 'images/icons-svg/star-active.svg';

  document.querySelectorAll('.product-card__wishlist').forEach(btn => {
    let inCart = false;
    const img  = btn.querySelector('img');

    btn.addEventListener('click', () => {
      inCart = !inCart;
      btn.classList.toggle('product-card__wishlist--active', inCart);
      btn.setAttribute('aria-label', inCart ? 'Убрать из корзины' : 'В корзину');
      if (img) img.src = inCart ? STAR_ACTIVE : STAR_DEFAULT;

      if (inCart) {
        window.BirtollCart.add(1);
      } else {
        window.BirtollCart.remove(1);
      }
    });
  });
}());


// ============================================================
// 8. SEARCH MODAL
// ============================================================

(function initSearchModal() {
  const searchBtn         = document.getElementById('searchBtn');
  const searchModal       = document.getElementById('searchModal');
  const searchInput       = document.getElementById('searchInput');
  const searchSubmit      = document.getElementById('searchSubmit');
  const searchClearAll    = document.getElementById('searchClearAll');
  const searchHistoryEl   = document.getElementById('searchHistory');
  const searchHistoryList = document.getElementById('searchHistoryList');

  if (!searchBtn || !searchModal) return;

  const STORAGE_KEY = 'birtoll_search_history';
  const MAX_HISTORY = 8;

  // ── State ──────────────────────────────────────────────────
  let isOpen = false;

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveHistory(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function addToHistory(query) {
    const q = query.trim();
    if (!q) return;
    let arr = loadHistory().filter(item => item.toLowerCase() !== q.toLowerCase());
    arr.unshift(q);
    if (arr.length > MAX_HISTORY) arr = arr.slice(0, MAX_HISTORY);
    saveHistory(arr);
  }

  function removeFromHistory(query) {
    const arr = loadHistory().filter(item => item !== query);
    saveHistory(arr);
  }

  function clearHistory() {
    saveHistory([]);
  }

  // ── Render history list ─────────────────────────────────────
  function renderHistory() {
    const arr = loadHistory();
    if (arr.length === 0) {
      searchHistoryEl.classList.remove('search-modal__history--visible');
      return;
    }
    searchHistoryEl.classList.add('search-modal__history--visible');
    searchHistoryList.innerHTML = arr.map(q => `
      <li class="search-modal__history-item" data-query="${escHtml(q)}">
        <svg class="search-modal__history-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span class="search-modal__history-text">${escHtml(q)}</span>
        <button class="search-modal__history-remove" data-remove="${escHtml(q)}" aria-label="Удалить ${escHtml(q)}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </li>
    `).join('');
  }

  function escHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Open / Close ────────────────────────────────────────────
  function openSearch() {
    isOpen = true;
    renderHistory();
    searchModal.classList.add('search-modal--open');
    searchModal.setAttribute('aria-hidden', 'false');
    searchBtn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => searchInput.focus());
  }

  function closeSearch() {
    isOpen = false;
    searchModal.classList.remove('search-modal--open');
    searchModal.setAttribute('aria-hidden', 'true');
    searchBtn.setAttribute('aria-expanded', 'false');
  }

  // ── Submit search ───────────────────────────────────────────
  function doSearch() {
    const q = searchInput.value.trim();
    if (!q) return;
    addToHistory(q);
    renderHistory();
    searchInput.value = '';
  }

  // ── Events ──────────────────────────────────────────────────
  searchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen ? closeSearch() : openSearch();
  });

  searchModal.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.addEventListener('click', () => {
    if (isOpen) closeSearch();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeSearch();
      searchBtn.focus();
    }
  });

  searchSubmit.addEventListener('click', doSearch);

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  searchClearAll.addEventListener('click', () => {
    clearHistory();
    renderHistory();
  });

  searchHistoryList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) {
      e.stopPropagation();
      removeFromHistory(removeBtn.dataset.remove);
      renderHistory();
      return;
    }
    const item = e.target.closest('[data-query]');
    if (item) {
      searchInput.value = item.dataset.query;
      searchInput.focus();
    }
  });
}());


// ============================================================
// 9. AUTH (PROFILE) MODAL
// ============================================================

(function initAuthModal() {
  const profileBtn   = document.getElementById('profileBtn');
  const authOverlay  = document.getElementById('authOverlay');
  const authClose    = document.getElementById('authClose');
  const tabLogin     = document.getElementById('tabLogin');
  const tabRegister  = document.getElementById('tabRegister');
  const panelLogin   = document.getElementById('panelLogin');
  const panelRegister = document.getElementById('panelRegister');

  if (!profileBtn || !authOverlay) return;

  function openAuth() {
    authOverlay.classList.add('auth-overlay--open');
    authOverlay.setAttribute('aria-hidden', 'false');
    profileBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      authOverlay.querySelector('.auth-modal__input')?.focus();
    });
  }

  function closeAuth() {
    authOverlay.classList.remove('auth-overlay--open');
    authOverlay.setAttribute('aria-hidden', 'true');
    profileBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    profileBtn.focus();
  }

  function switchTab(tab) {
    const isLogin = tab === 'login';
    tabLogin.classList.toggle('auth-modal__tab--active', isLogin);
    tabRegister.classList.toggle('auth-modal__tab--active', !isLogin);
    panelLogin.classList.toggle('auth-modal__panel--active', isLogin);
    panelRegister.classList.toggle('auth-modal__panel--active', !isLogin);
  }

  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = authOverlay.classList.contains('auth-overlay--open');
    isOpen ? closeAuth() : openAuth();
  });

  authClose.addEventListener('click', closeAuth);

  authOverlay.addEventListener('click', (e) => {
    if (e.target === authOverlay) closeAuth();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authOverlay.classList.contains('auth-overlay--open')) {
      closeAuth();
    }
  });

  tabLogin.addEventListener('click', () => switchTab('login'));
  tabRegister.addEventListener('click', () => switchTab('register'));
}());


// ============================================================
// 10. INIT
// ============================================================

(function init() {
  updateCartBadge(0);
  onScroll();


  console.log(
    '%c🌿 BIRTOLL & CO — loaded',
    'color:#4A5D4E; font-family:Georgia,serif; font-size:13px; font-weight:bold;'
  );
}());
