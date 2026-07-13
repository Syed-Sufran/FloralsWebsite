import '../../src/index.css';

// Saved scroll position to restore when overlay is closed
let savedScrollY = 0;

// Setup function for each product overlay (index 0, 1, 2)
function setupOverlay(index) {
  const overlay = document.getElementById(`detail-overlay-${index}`);
  const closeBtn = document.getElementById(`close-overlay-${index}`);
  const carouselTrack = document.getElementById(`carousel-track-${index}`);
  const dots = document.querySelectorAll(`.carousel-dot-${index}`);
  const video = document.getElementById(`carousel-video-${index}`);
  const muteBtn = document.getElementById(`video-mute-btn-${index}`);

  if (!overlay) return;

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

    // Play video if starting on it (though slide 0 is an image)
    if (video) {
      video.muted = true;
      video.pause();
      updateMuteUI();
    }
  };

  // Close Handler
  function closeOverlay() {
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0');

    setTimeout(() => {
      overlay.classList.add('hidden');
      
      if (video) {
        video.pause();
      }

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

      // Handle video autoplay on slide 2 (index 1)
      if (video) {
        if (activeIndex === 1) {
          video.play().catch(err => console.log('Autoplay blocked:', err));
        } else {
          video.pause();
        }
      }
    });
  }

  // Video mute control toggle
  function updateMuteUI() {
    if (!video || !muteBtn) return;
    const muteIcon = muteBtn.querySelector('.mute-icon');
    const muteText = muteBtn.querySelector('.mute-text');
    if (video.muted) {
      if (muteIcon) muteIcon.textContent = '🔇';
      if (muteText) muteText.textContent = 'Muted';
    } else {
      if (muteIcon) muteIcon.textContent = '🔊';
      if (muteText) muteText.textContent = 'Unmuted';
    }
  }

  if (muteBtn && video) {
    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      updateMuteUI();

      if (!video.muted && video.paused) {
        video.play().catch(err => console.log(err));
      }
    });
  }
}

// Bind clicks on grid items to launch correct overlay
function init() {
  // Initialize dynamic controls for indices 0, 1, 2, and 3
  [0, 1, 2, 3].forEach(setupOverlay);

  // Wire up programmatic card clicks in gallery grid
  const card0 = document.getElementById('prod-card-0');
  const card1 = document.getElementById('prod-card-1');
  const card2 = document.getElementById('prod-card-2');
  const card3 = document.getElementById('prod-card-3');

  if (card0) card0.addEventListener('click', () => window['openOverlay-0']());
  if (card1) card1.addEventListener('click', () => window['openOverlay-1']());
  if (card2) card2.addEventListener('click', () => window['openOverlay-2']());
  if (card3) card3.addEventListener('click', () => window['openOverlay-3']());
}

// Start controllers
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
