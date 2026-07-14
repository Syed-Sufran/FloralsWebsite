import '../../src/index.css';

// Saved scroll position to restore when overlay is closed
let savedScrollY = 0;

// Setup function for each product overlay (index 0, 1, 2, 3)
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

  // Open Handler
  window[`openOverlay-${index}`] = function() {
    savedScrollY = window.scrollY;

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
  };

  // Close Handler
  function closeOverlay() {
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0');

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
  // Initialize dynamic controls for indices 0, 1, 2, and 3
  [0, 1, 2, 3].forEach(setupOverlay);

  // Wire up card clicks in gallery grid
  const card0 = document.getElementById('prod-card-0');
  const card1 = document.getElementById('prod-card-1');
  const card2 = document.getElementById('prod-card-2');
  const card3 = document.getElementById('prod-card-3');

  if (card0) card0.addEventListener('click', () => window['openOverlay-0']());
  if (card1) card1.addEventListener('click', () => window['openOverlay-1']());
  if (card2) card2.addEventListener('click', () => window['openOverlay-2']());
  if (card3) card3.addEventListener('click', () => window['openOverlay-3']());

  initHoverPreviews();
}

// Start controllers
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
