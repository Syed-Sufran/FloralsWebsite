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
  const glassPanel = document.getElementById('collections-glass-panel');
  const panelTitle = document.getElementById('panel-title');
  const panelBody = document.getElementById('panel-body');

  if (images.length === 0 || !bgOverlay || !glassPanel || !panelTitle || !panelBody) return;

  let activeIndex = -1;
  let exitTimeout = null;

  function updatePanel(title, body) {
    panelTitle.textContent = title;
    panelBody.textContent = body;
  }

  images.forEach((img, index) => {
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

      // Setup dynamic panel content
      const title = img.getAttribute('data-title') || 'Theme Bouquets';
      const body = img.getAttribute('data-body') || '';
      updatePanel(title, body);

      // Fade-in and slide-up the glass panel
      glassPanel.classList.remove('opacity-0', 'translate-y-8');
      glassPanel.classList.add('opacity-100', 'translate-y-0');

      // Update bouquet images and shadow styles
      images.forEach((otherImg, otherIdx) => {
        const otherShadow = otherImg.nextElementSibling;
        if (otherIdx === index) {
          otherImg.classList.add('is-active');
          otherImg.classList.remove('is-receded');
          if (otherShadow) {
            otherShadow.classList.add('is-active');
            otherShadow.classList.remove('is-receded');
          }
        } else {
          otherImg.classList.remove('is-active');
          otherImg.classList.add('is-receded');
          if (otherShadow) {
            otherShadow.classList.remove('is-active');
            otherShadow.classList.add('is-receded');
          }
        }
      });
    });

    img.addEventListener('mouseleave', () => {
      // Set a tiny debounce delay to support smooth immediate transition between items without flash/flicker
      exitTimeout = setTimeout(() => {
        activeIndex = -1;

        // Restore default background
        bgOverlay.classList.remove('bg-black/[0.18]');
        bgOverlay.classList.add('bg-black/0');

        // Hide frosted glass panel
        glassPanel.classList.remove('opacity-100', 'translate-y-0');
        glassPanel.classList.add('opacity-0', 'translate-y-8');

        // Reset all bouquet states
        images.forEach((otherImg) => {
          const otherShadow = otherImg.nextElementSibling;
          otherImg.classList.remove('is-active', 'is-receded');
          if (otherShadow) {
            otherShadow.classList.remove('is-active', 'is-receded');
          }
        });
      }, 50); // 50ms transition debounce
    });
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
}

// Start once DOM is fully evaluated
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
