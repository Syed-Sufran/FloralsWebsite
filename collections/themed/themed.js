import '../../src/index.css';

// Saved scroll position to restore when overlay is closed
let savedScrollY = 0;

// Active overlay index tracking for keyboard navigation
let activeOverlayIndex = null;

// Setup function for each product overlay (index 0, 1, 2, etc.)
function setupOverlay(index) {
  const overlay = document.getElementById(`detail-overlay-${index}`);
  const closeBtn = document.getElementById(`close-overlay-${index}`);
  const carouselTrack = document.getElementById(`carousel-track-${index}`);
  const dots = document.querySelectorAll(`.carousel-dot-${index}`);

  if (!overlay) return;

  // Find all video slide blocks inside this specific overlay
  const videoBlocks = overlay.querySelectorAll('.video-slide-block');
  const videos = [];

  videoBlocks.forEach((block) => {
    const videoEl = block.querySelector('video');
    const muteBtnEl = block.querySelector('.video-mute-btn');
    
    // Find the slide wrapper's position relative to the track to determine its index
    let slideIndex = 0;
    let sibling = block;
    while ((sibling = sibling.previousElementSibling) != null) {
      slideIndex++;
    }

    if (videoEl) {
      videos.push({
        el: videoEl,
        slideIndex: slideIndex,
        muteBtn: muteBtnEl
      });

      // Wire up mute toggle button if present
      if (muteBtnEl) {
        const muteIcon = muteBtnEl.querySelector('.mute-icon');
        const muteText = muteBtnEl.querySelector('.mute-text');

        function updateMuteUI() {
          if (videoEl.muted) {
            if (muteIcon) muteIcon.textContent = '🔇';
            if (muteText) muteText.textContent = 'Muted';
          } else {
            if (muteIcon) muteIcon.textContent = '🔊';
            if (muteText) muteText.textContent = 'Unmuted';
          }
        }

        muteBtnEl.addEventListener('click', (e) => {
          e.stopPropagation();
          videoEl.muted = !videoEl.muted;
          updateMuteUI();

          if (!videoEl.muted && videoEl.paused) {
            videoEl.play().catch(err => console.log(err));
          }
        });

        // Set initial muted state
        videoEl.muted = true;
        updateMuteUI();
      }
    }
  });

  // Create and insert navigation buttons dynamically
  let prevBtn = null;
  let nextBtn = null;
  if (carouselTrack) {
    const trackParent = carouselTrack.parentElement;
    if (trackParent) {
      trackParent.classList.add('relative');
      
      prevBtn = document.createElement('button');
      prevBtn.className = `absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 flex items-center justify-center text-[#F2EAE4] hover:text-white transition-opacity duration-200 opacity-0 pointer-events-none hidden lg:flex select-none`;
      prevBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      `;

      nextBtn = document.createElement('button');
      nextBtn.className = `absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 flex items-center justify-center text-[#F2EAE4] hover:text-white transition-opacity duration-200 opacity-0 pointer-events-none hidden lg:flex select-none`;
      nextBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      `;

      trackParent.insertBefore(prevBtn, carouselTrack);
      trackParent.insertBefore(nextBtn, carouselTrack);

      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const width = carouselTrack.clientWidth;
        const scrollLeft = carouselTrack.scrollLeft;
        const activeIdx = Math.round(scrollLeft / width);
        if (activeIdx > 0) {
          carouselTrack.scrollTo({
            left: (activeIdx - 1) * width,
            behavior: 'smooth'
          });
        }
      });

      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const width = carouselTrack.clientWidth;
        const scrollLeft = carouselTrack.scrollLeft;
        const activeIdx = Math.round(scrollLeft / width);
        const totalSlides = carouselTrack.children.length;
        if (activeIdx < totalSlides - 1) {
          carouselTrack.scrollTo({
            left: (activeIdx + 1) * width,
            behavior: 'smooth'
          });
        }
      });
    }
  }

  function updateArrowVisibility() {
    if (!prevBtn || !nextBtn || !carouselTrack) return;
    const width = carouselTrack.clientWidth;
    if (!width) return;
    const scrollLeft = carouselTrack.scrollLeft;
    const activeIdx = Math.round(scrollLeft / width);
    const totalSlides = carouselTrack.children.length;

    if (activeIdx === 0) {
      prevBtn.classList.remove('opacity-100', 'pointer-events-auto');
      prevBtn.classList.add('opacity-0', 'pointer-events-none');
    } else {
      prevBtn.classList.remove('opacity-0', 'pointer-events-none');
      prevBtn.classList.add('opacity-100', 'pointer-events-auto');
    }

    if (activeIdx === totalSlides - 1) {
      nextBtn.classList.remove('opacity-100', 'pointer-events-auto');
      nextBtn.classList.add('opacity-0', 'pointer-events-none');
    } else {
      nextBtn.classList.remove('opacity-0', 'pointer-events-none');
      nextBtn.classList.add('opacity-100', 'pointer-events-auto');
    }
  }

  // Open Handler
  window[`openOverlay-${index}`] = function() {
    savedScrollY = window.scrollY;
    activeOverlayIndex = index;

    // Display overlay
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      overlay.classList.remove('opacity-0');
      overlay.classList.add('opacity-100');
    });

    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';

    // Reset carousel scroll
    if (carouselTrack) {
      carouselTrack.scrollLeft = 0;
    }

    // Play video if starting on Slide 0, pause all others
    videos.forEach(v => {
      v.el.muted = true;
      if (v.slideIndex === 0) {
        v.el.play().catch(err => console.log('Autoplay blocked:', err));
      } else {
        v.el.pause();
      }
    });

    setTimeout(updateArrowVisibility, 100);
  };

  // Close Handler
  function closeOverlay() {
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0');

    if (activeOverlayIndex === index) {
      activeOverlayIndex = null;
    }

    setTimeout(() => {
      overlay.classList.add('hidden');
      
      // Pause all videos
      videos.forEach(v => {
        v.el.pause();
      });

      document.body.style.overflow = '';
      document.body.style.height = '';
      window.scrollTo(0, savedScrollY);
    }, 300);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeOverlay);
  }

  // Carousel dot selection & video autoplay on scroll
  if (carouselTrack) {
    carouselTrack.addEventListener('scroll', () => {
      const width = carouselTrack.clientWidth;
      const scrollLeft = carouselTrack.scrollLeft;
      const activeIndex = Math.round(scrollLeft / width);

      // Highlight dots
      dots.forEach((dot, idx) => {
        if (idx === activeIndex) {
          dot.classList.remove('text-[#F2EAE4]/30');
          dot.classList.add('text-[#F2EAE4]');
        } else {
          dot.classList.remove('text-[#F2EAE4]');
          dot.classList.add('text-[#F2EAE4]/30');
        }
      });

      // Autoplay the video corresponding to the active index, pause all others
      videos.forEach(v => {
        if (v.slideIndex === activeIndex) {
          v.el.play().catch(err => console.log('Autoplay blocked:', err));
        } else {
          v.el.pause();
        }
      });

      updateArrowVisibility();
    });
  }
}

// Gated hover preview initialization for desktop mouse users
function initHoverPreviews() {
  const isDesktopMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isDesktopMouse) return;

  const cards = document.querySelectorAll('.break-inside-avoid');
  cards.forEach(card => {
    const videoUrl = card.getAttribute('data-video');
    const imagesAttr = card.getAttribute('data-images');
    const hoverMedia = card.querySelector('.hover-media-wrap');
    if (!hoverMedia) return;

    let hoverTimeout = null;
    let fallbackTimeout = null;
    let fadeTimeout = null;
    let cycleInterval = null;
    let activeVideo = null;
    let cycleImages = [];
    let cycleIndex = 0;

    if (imagesAttr) {
      cycleImages = imagesAttr.split(',').filter(src => src.trim() !== '');
    }

    function cleanup() {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      if (fadeTimeout) clearTimeout(fadeTimeout);
      if (cycleInterval) clearInterval(cycleInterval);

      hoverMedia.classList.remove('is-visible');
      hoverMedia.style.opacity = '0';

      if (activeVideo) {
        activeVideo.pause();
        activeVideo.removeAttribute('src');
        activeVideo.load();
        activeVideo.remove();
        activeVideo = null;
      }
      hoverMedia.innerHTML = '';
    }

    function startStaticCycling() {
      if (cycleInterval) clearInterval(cycleInterval);
      if (cycleImages.length <= 1) return;

      hoverMedia.innerHTML = '';
      const imgElements = cycleImages.map((src, idx) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = `absolute inset-0 w-full h-full object-cover transition-opacity duration-[250ms] ease-in-out`;
        img.style.opacity = idx === 0 ? '1' : '0';
        hoverMedia.appendChild(img);
        return img;
      });

      hoverMedia.classList.add('is-visible');

      cycleIndex = 0;
      cycleInterval = setInterval(() => {
        const prevIdx = cycleIndex;
        cycleIndex = (cycleIndex + 1) % imgElements.length;
        imgElements[prevIdx].style.opacity = '0';
        imgElements[cycleIndex].style.opacity = '1';
      }, 1450);
    }

    card.addEventListener('mouseenter', () => {
      cleanup();

      if (videoUrl) {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.className = 'w-full h-full object-cover block';
        hoverMedia.appendChild(video);
        activeVideo = video;

        let canPlayFired = false;

        video.addEventListener('canplay', () => {
          if (canPlayFired) return;
          canPlayFired = true;
          if (fallbackTimeout) clearTimeout(fallbackTimeout);

          video.play().then(() => {
            hoverMedia.classList.add('is-visible');
          }).catch(err => {
            console.log('Video play failed:', err);
            startStaticCycling();
          });
        });

        video.load();

        fallbackTimeout = setTimeout(() => {
          if (!canPlayFired) {
            console.log('Video load timed out, falling back to images');
            if (activeVideo) {
              activeVideo.pause();
              activeVideo.removeAttribute('src');
              activeVideo.load();
              activeVideo.remove();
              activeVideo = null;
            }
            hoverMedia.innerHTML = '';
            startStaticCycling();
          }
        }, 800);

      } else {
        startStaticCycling();
      }
    });

    card.addEventListener('mouseleave', () => {
      cleanup();
    });
  });
}

// Bind clicks on grid items to launch correct overlay
function init() {
  // Initialize dynamic controls for indices 0, 1, 2, 3, 4, 5, and 6
  [0, 1, 2, 3, 4, 5, 6].forEach(setupOverlay);

  // Wire up programmatic card clicks in gallery grid
  const card0 = document.getElementById('prod-card-0');
  const card1 = document.getElementById('prod-card-1');
  const card2 = document.getElementById('prod-card-2');
  const card3 = document.getElementById('prod-card-3');
  const card4 = document.getElementById('prod-card-4');
  const card5 = document.getElementById('prod-card-5');
  const card6 = document.getElementById('prod-card-6');

  if (card0) card0.addEventListener('click', () => window['openOverlay-0']());
  if (card1) card1.addEventListener('click', () => window['openOverlay-1']());
  if (card2) card2.addEventListener('click', () => window['openOverlay-2']());
  if (card3) card3.addEventListener('click', () => window['openOverlay-3']());
  if (card4) card4.addEventListener('click', () => window['openOverlay-4']());
  if (card5) card5.addEventListener('click', () => window['openOverlay-5']());
  if (card6) card6.addEventListener('click', () => window['openOverlay-6']());

  initHoverPreviews();
}

// Start controllers
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Keyboard Navigation (ESC to go back/close, arrows to slide)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (activeOverlayIndex !== null) {
      const closeBtn = document.getElementById(`close-overlay-${activeOverlayIndex}`);
      if (closeBtn) closeBtn.click();
    } else {
      window.location.href = '/';
    }
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    if (activeOverlayIndex !== null) {
      const carouselTrack = document.getElementById(`carousel-track-${activeOverlayIndex}`);
      if (carouselTrack) {
        const width = carouselTrack.clientWidth;
        if (!width) return;
        const scrollLeft = carouselTrack.scrollLeft;
        const activeIdx = Math.round(scrollLeft / width);
        const totalSlides = carouselTrack.children.length;

        if (e.key === 'ArrowRight') {
          if (activeIdx < totalSlides - 1) {
            carouselTrack.scrollTo({
              left: (activeIdx + 1) * width,
              behavior: 'smooth'
            });
          }
        } else if (e.key === 'ArrowLeft') {
          if (activeIdx > 0) {
            carouselTrack.scrollTo({
              left: (activeIdx - 1) * width,
              behavior: 'smooth'
            });
          }
        }
      }
    }
  }
});

