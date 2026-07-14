import './index.css';

// Select all slideshow slides
const slides = document.querySelectorAll('.slide');
let currentSlide = 0;
let slideInterval = null;

// Media query to check system reduced-motion preferences
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

// Determine slide display duration based on motion preferences
function getIntervalDuration() {
  return motionQuery.matches ? 8000 : 5500; // 8s for reduced-motion hard cut, 5.5s for normal crossfade
}

// Start/restart the slideshow loop
function startSlideshow() {
  if (slideInterval) clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, getIntervalDuration());
}

// Transition to the next slide
function nextSlide() {
  const prevSlideIndex = currentSlide;
  currentSlide = (currentSlide + 1) % slides.length;

  const incoming = slides[currentSlide];
  const outgoing = slides[prevSlideIndex];

  if (motionQuery.matches) {
    // PREFERS-REDUCED-MOTION: Hard-cut immediately with no transitions or zoom
    outgoing.classList.replace('opacity-100', 'opacity-0');
    outgoing.classList.replace('z-10', 'z-0');
    outgoing.classList.remove('ken-burns');

    incoming.classList.replace('opacity-0', 'opacity-100');
    incoming.classList.replace('z-0', 'z-10');
  } else {
    // NORMAL MOTION: Smooth crossfade overlay + ambient Ken Burns zoom
    // 1. Start zoom and fade-in for incoming slide on top (z-10)
    incoming.classList.add('ken-burns');
    incoming.classList.replace('opacity-0', 'opacity-100');
    incoming.classList.replace('z-0', 'z-10');

    // 2. Put outgoing slide underneath (z-0) and fade it out
    outgoing.classList.replace('z-10', 'z-0');
    outgoing.classList.replace('opacity-100', 'opacity-0');

    // 3. Keep zoom active on the outgoing slide during transition, reset it after fade finishes (1.5s delay)
    setTimeout(() => {
      // Safety check: ensure it has not become active again in the meantime
      if (currentSlide !== prevSlideIndex) {
        outgoing.classList.remove('ken-burns');
      }
    }, 1500);
  }
}

// React dynamically to OS level prefers-reduced-motion preference changes
if (motionQuery.addEventListener) {
  motionQuery.addEventListener('change', () => {
    startSlideshow();

    if (motionQuery.matches) {
      // Immediately clear all Ken Burns zooms
      slides.forEach((slide) => slide.classList.remove('ken-burns'));
    } else {
      // Re-enable Ken Burns on active slide
      slides[currentSlide].classList.add('ken-burns');
    }
  });
}

// Initialize scroll-triggered animations for mobile card deck stack
function initScrollAnimations() {
  const mediaQuery = window.matchMedia('(max-width: 767px)');
  let scrollListenerActive = false;

  const section = document.getElementById('card-stack-section');
  if (!section) return;

  const floralDivider = document.getElementById('floral-divider-container');

  const cards = [
    document.getElementById('card-1'),
    document.getElementById('card-2'),
    document.getElementById('card-3'),
    document.getElementById('card-4'),
    document.getElementById('card-5')
  ];

  if (cards.some(card => !card)) return;

  const restingValues = [
    { y: 0, scale: 1 },
    { y: 12, scale: 0.97 },
    { y: 24, scale: 0.94 },
    { y: 36, scale: 0.91 },
    { y: 48, scale: 0.88 }
  ];

  let isTicking = false;

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function updateTransforms() {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;

    // The sticky pinning container pins for a height of (sectionHeight - viewportHeight) = 500vh
    const totalScrollDist = 5 * vh;
    const currentScroll = -rect.top;

    let progress = currentScroll / totalScrollDist;
    progress = Math.max(0, Math.min(1, progress));

    const segmentProgress = progress * 6; // 6 segments total (0 to 6)
    const activeSegment = Math.floor(segmentProgress); // 0 to 5

    // Unpin floral divider once Card 4 (Product Gift Boxes) is completely out of frame (segment 5)
    if (floralDivider) {
      floralDivider.classList.toggle('divider-unpinned', activeSegment >= 5);
    }

    function setCardTransform(card, translateY, scale) {
      const newTransform = `translateY(${translateY}) scale(${scale})`;
      if (card.style.transform !== newTransform) {
        card.style.transform = newTransform;
      }
    }

    if (activeSegment === 0) {
      // Segment 0: Buffer zone. Cards static at resting offsets.
      for (let idx = 0; idx < 5; idx++) {
        setCardTransform(cards[idx], `${restingValues[idx].y}px`, restingValues[idx].scale);
      }
    } else if (activeSegment >= 5) {
      // Segment 5: Hold zone. Card 5 static at top: 0, scale: 1. Cards 1-4 fully exited.
      for (let idx = 0; idx < 4; idx++) {
        setCardTransform(cards[idx], '-120%', 1);
      }
      setCardTransform(cards[4], '0px', 1);
    } else {
      // Transition segments 1 to 4: Only update the current active segment cards
      const activeIdx = activeSegment; // activeSegment: 1 -> Card 1 exits/Card 2 enters, etc.
      const exitingCardIdx = activeIdx - 1;
      const enteringCardIdx = activeIdx;

      const t = segmentProgress - activeSegment; // segment progress (0 to 1)
      const ease = easeInOutQuad(t);

      // Exiting Card
      const exitingY = -120 * ease;
      setCardTransform(cards[exitingCardIdx], `${exitingY}%`, 1);

      // Entering Card
      const restingY = restingValues[enteringCardIdx].y;
      const restingScale = restingValues[enteringCardIdx].scale;
      const enteringY = restingY * (1 - ease);
      const enteringScale = restingScale + (1 - restingScale) * ease;
      setCardTransform(cards[enteringCardIdx], `${enteringY}px`, enteringScale);

      // Ensure other card states are set correctly when jumping scroll
      for (let idx = 0; idx < exitingCardIdx; idx++) {
        setCardTransform(cards[idx], '-120%', 1);
      }
      for (let idx = enteringCardIdx + 1; idx < 5; idx++) {
        setCardTransform(cards[idx], `${restingValues[idx].y}px`, restingValues[idx].scale);
      }
    }

    isTicking = false;
  }

  function onScroll() {
    if (!isTicking) {
      requestAnimationFrame(updateTransforms);
      isTicking = true;
    }
  }

  function setupScrollListener() {
    if (mediaQuery.matches) {
      if (!scrollListenerActive) {
        window.addEventListener('scroll', onScroll, { passive: true });
        scrollListenerActive = true;
      }
      updateTransforms();
    } else {
      if (scrollListenerActive) {
        window.removeEventListener('scroll', onScroll);
        scrollListenerActive = false;
      }
      // Clean up desktop transforms
      cards.forEach(card => card.style.transform = '');
    }
  }

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', setupScrollListener);
  }
  setupScrollListener();
}

// Initialize Mobile Footer Accordion & Breathing Animation
function initMobileFooter() {
  const triggers = document.querySelectorAll('.footer-accordion-trigger');
  const bgPhoto = document.getElementById('footer-bg-photo');

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      const content = trigger.nextElementSibling;

      // Toggle current accordion
      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        if (content) {
          content.style.maxHeight = null;
        }
        // Zoom out transition for every "x" clicked
        if (bgPhoto) {
          bgPhoto.classList.remove('is-zoomed');
        }
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        if (content) {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
        // Zoom in transition for every "+" clicked (forces restart of transition)
        if (bgPhoto) {
          bgPhoto.classList.remove('is-zoomed');
          void bgPhoto.offsetWidth;
          bgPhoto.classList.add('is-zoomed');
        }
      }
    });
  });
}

// Initialize Collections Section Hover Animation (Desktop/Tablet)
function initCollectionsHover() {
  const images = document.querySelectorAll('.collection-img');
  const bgOverlay = document.getElementById('collections-bg-overlay');

  if (images.length === 0 || !bgOverlay) return;

  let activeIndex = -1;
  let exitTimeout = null;

  function resetAll() {
    activeIndex = -1;

    // Restore default background
    bgOverlay.classList.remove('bg-black/[0.18]');
    bgOverlay.classList.add('bg-black/0');

    // Hide all panels
    document.querySelectorAll('.collection-panel').forEach(p => p.classList.remove('is-active'));

    // Reset all bouquet states
    images.forEach((otherImg) => {
      const parent = otherImg.parentElement;
      const otherShadow = parent.querySelector('.collection-shadow');
      otherImg.classList.remove('is-active', 'is-receded');
      if (otherShadow) {
        otherShadow.classList.remove('is-active', 'is-receded');
      }
    });
  }

  images.forEach((img, index) => {
    const parent = img.parentElement;
    const panel = parent.querySelector('.collection-panel');

    img.addEventListener('mouseenter', () => {
      // Clear exit timeout if transitioning directly between bouquets
      if (exitTimeout) {
        clearTimeout(exitTimeout);
        exitTimeout = null;
      }

      activeIndex = index;

      // Darken background overlay (restrained: bg-black/[0.18])
      bgOverlay.classList.remove('bg-black/0');
      bgOverlay.classList.add('bg-black/[0.18]');

      // Update bouquet images, shadows, and panel states
      images.forEach((otherImg, otherIdx) => {
        const otherParent = otherImg.parentElement;
        const otherShadow = otherParent.querySelector('.collection-shadow');
        const otherPanel = otherParent.querySelector('.collection-panel');
        
        if (otherIdx === index) {
          otherImg.classList.add('is-active');
          otherImg.classList.remove('is-receded');
          if (otherShadow) {
            otherShadow.classList.add('is-active');
            otherShadow.classList.remove('is-receded');
          }
          if (otherPanel) {
            otherPanel.classList.add('is-active');
          }
        } else {
          otherImg.classList.remove('is-active');
          otherImg.classList.add('is-receded');
          if (otherShadow) {
            otherShadow.classList.remove('is-active');
            otherShadow.classList.add('is-receded');
          }
          if (otherPanel) {
            otherPanel.classList.remove('is-active');
          }
        }
      });
    });

    img.addEventListener('mouseleave', () => {
      // Set a comfortable debounce delay to support smooth handoff to the panel or transition to other bouquets
      exitTimeout = setTimeout(resetAll, 150);
    });

    if (panel) {
      panel.addEventListener('mouseenter', () => {
        // Keep active when entering the panel card
        if (exitTimeout) {
          clearTimeout(exitTimeout);
          exitTimeout = null;
        }
      });

      panel.addEventListener('mouseleave', () => {
        // Set same comfortable delay before hiding
        exitTimeout = setTimeout(resetAll, 150);
      });
    }
  });
}

// Initialize Mobile Navigation Panel (Mobile Only)
function initMobileNav() {
  const hamburger = document.getElementById('mobile-hamburger');
  const overlay = document.getElementById('mobile-nav-overlay');
  const panel = document.getElementById('mobile-nav-panel');
  const closeBtn = document.getElementById('mobile-nav-close');
  const navLinks = document.querySelectorAll('.mobile-nav-item a');

  if (!hamburger || !overlay || !panel) return;

  function openNav() {
    overlay.classList.remove('hidden');
    panel.classList.remove('hidden');
    
    // Trigger layout reflow
    void overlay.offsetWidth;
    void panel.offsetWidth;

    overlay.classList.remove('opacity-0');
    overlay.classList.add('opacity-100');

    panel.classList.remove('translate-x-full');
    panel.classList.add('translate-x-0');

    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
  }

  function closeNav() {
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0');

    panel.classList.remove('translate-x-0');
    panel.classList.add('translate-x-full');

    document.body.style.overflow = '';
    document.body.style.height = '';

    // Hide display after transition completes (400ms)
    setTimeout(() => {
      if (panel.classList.contains('translate-x-full')) {
        overlay.classList.add('hidden');
        panel.classList.add('hidden');
      }
    }, 400);
  }

  hamburger.addEventListener('click', openNav);
  if (closeBtn) closeBtn.addEventListener('click', closeNav);
  overlay.addEventListener('click', closeNav);
  navLinks.forEach(link => link.addEventListener('click', closeNav));

  // ESC key to close navigation menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.classList.contains('translate-x-full')) {
      closeNav();
    }
  });
}

// Initialize Inline Custom Request Card (Mobile)
function initCustomRequest() {
  const toggleBtn = document.getElementById('custom-request-scroll-btn');
  const card      = document.getElementById('custom-request-card');
  const sendBtn   = document.getElementById('custom-request-send');
  const textarea  = document.getElementById('custom-request-textarea');
  const hint      = document.getElementById('custom-request-hint');

  if (!toggleBtn || !card) return;

  let isOpen = false;

  function openCard() {
    isOpen = true;
    card.style.maxHeight = card.scrollHeight + 64 + 'px'; // +padding buffer
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
    // Re-measure after content renders in case scrollHeight was 0 on first paint
    requestAnimationFrame(() => {
      card.style.maxHeight = card.scrollHeight + 64 + 'px';
    });
    if (textarea) setTimeout(() => textarea.focus(), 420);
  }

  function closeCard() {
    isOpen = false;
    card.style.maxHeight = '0';
    card.style.opacity = '0';
    card.style.transform = 'translateY(8px)';
    if (textarea) textarea.value = '';
    if (hint)     hint.style.opacity = '0';
  }

  toggleBtn.addEventListener('click', () => {
    if (isOpen) { closeCard(); } else { openCard(); }
  });

  // Send button — open WhatsApp with typed text only
  if (sendBtn && textarea) {
    let hintTimer = null;

    sendBtn.addEventListener('click', () => {
      const message = textarea.value.trim();

      if (!message) {
        if (hint) {
          hint.style.opacity = '1';
          clearTimeout(hintTimer);
          hintTimer = setTimeout(() => { hint.style.opacity = '0'; }, 3000);
        }
        textarea.focus();
        return;
      }

      if (hint) hint.style.opacity = '0';
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/918105956981?text=${encoded}`, '_blank');
    });

    textarea.addEventListener('input', () => {
      if (hint) hint.style.opacity = '0';
    });
  }
}

// Initialize Desktop Custom Request Modal
function initDesktopCustomRequest() {
  const trigger  = document.getElementById('desktop-custom-request-trigger');
  const overlay  = document.getElementById('desktop-req-modal-overlay');
  const card     = document.getElementById('desktop-req-modal-card');
  const closeBtn = document.getElementById('desktop-req-modal-close');
  const textarea = document.getElementById('desktop-req-textarea');
  const sendBtn  = document.getElementById('desktop-req-send');

  if (!trigger || !overlay || !card || !textarea || !sendBtn) return;

  function openModal() {
    overlay.classList.remove('hidden');
    void overlay.offsetWidth; // Reflow
    overlay.style.opacity = '1';
    overlay.classList.remove('pointer-events-none');
    
    card.style.opacity = '1';
    card.style.transform = 'scale(1)';
    
    setTimeout(() => textarea.focus(), 150);
  }

  function closeModal() {
    overlay.style.opacity = '0';
    overlay.classList.add('pointer-events-none');
    
    card.style.opacity = '0';
    card.style.transform = 'scale(0.96)';
    
    setTimeout(() => {
      if (overlay.style.opacity === '0') {
        overlay.classList.add('hidden');
        textarea.value = '';
        textarea.style.height = 'auto';
        sendBtn.disabled = true;
      }
    }, 200);
  }

  // Open & Close click hooks
  trigger.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Close on clicking overlay backdrop
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
      closeModal();
    }
  });

  // Auto-expand textarea & toggle button disabled status
  textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';

    const hasText = this.value.trim().length > 0;
    sendBtn.disabled = !hasText;
  });

  // Send WhatsApp request
  sendBtn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!text) return;

    const encoded = encodeURIComponent(text);
    const waUrl = `https://wa.me/918105956981?text=${encoded}`;

    window.open(waUrl, '_blank');
    closeModal();
  });
}

// Hook Custom Bouquets Nav Link to trigger Mobile Custom Request Card or Desktop Custom Request Modal
function initNavCustomRequest() {
  const link = document.getElementById('nav-custom-bouquets');
  if (!link) return;

  link.addEventListener('click', (e) => {
    e.preventDefault();

    // Check if desktop view
    const isDesktop = window.innerWidth >= 768;

    if (isDesktop) {
      const desktopTrigger = document.getElementById('desktop-custom-request-trigger');
      if (desktopTrigger) {
        desktopTrigger.click();
      }
    } else {
      const targetSec = document.getElementById('custom-request-section');
      if (targetSec) {
        targetSec.scrollIntoView({ behavior: 'smooth' });
      }

      // Check if mobile card is already open
      const card = document.getElementById('custom-request-card');
      const toggleBtn = document.getElementById('custom-request-scroll-btn');
      
      if (card && (card.style.maxHeight === '0px' || card.style.maxHeight === '0' || !card.style.maxHeight)) {
        if (toggleBtn) {
          toggleBtn.click();
        }
      } else {
        const textarea = document.getElementById('custom-request-textarea');
        if (textarea) {
          setTimeout(() => textarea.focus(), 150);
        }
      }
    }
  });
}

// Initialize slideshow logic and scroll listeners
function init() {
  if (slides.length > 0) {
    // Add Ken Burns to first slide if motion is allowed
    if (!motionQuery.matches) {
      slides[0].classList.add('ken-burns');
    }
    startSlideshow();
  }
  initScrollAnimations();
  initMobileFooter();
  initCollectionsHover();
  initMobileNav();
  initCustomRequest();
  initDesktopCustomRequest();
  initNavCustomRequest();
}

// Start once DOM is fully evaluated
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
