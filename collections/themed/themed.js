import '../../src/index.css';

// Saved scroll position to restore when overlay is closed
let savedScrollY = 0;

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
}

// Start controllers
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
