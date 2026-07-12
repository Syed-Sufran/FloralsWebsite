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

// Initialize slideshow logic
function init() {
  if (slides.length > 0) {
    // Add Ken Burns to first slide if motion is allowed
    if (!motionQuery.matches) {
      slides[0].classList.add('ken-burns');
    }
    startSlideshow();
  }
}

// Start once DOM is fully evaluated
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
