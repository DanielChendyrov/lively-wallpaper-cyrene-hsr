var use24HourClock = true;
var enableAudio = true;
var audioVolume = 0.9;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatTime(d) {
  var hours = use24HourClock ? d.getHours() : d.getHours() % 12 || 12;
  var minutes = d.getMinutes();
  // Keeping seconds off by default feels calmer for this wallpaper vibe.
  return pad2(hours) + ':' + pad2(minutes);
}

function formatDate(d) {
  // Example: Tue, Feb 3
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function updateClock() {
  var now = new Date();
  var timeEl = document.getElementById('clock-time');
  var dateEl = document.getElementById('clock-date');

  if (timeEl) timeEl.textContent = formatTime(now);
  if (dateEl) dateEl.textContent = formatDate(now);
}

// Create and setup video background
function initVideoBackground() {
  var video = document.getElementById('bg-video');

  if (!video) {
    console.warn('Video element not found');
    return;
  }

  // Ensure consistent playback behavior across WebView environments.
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;

  // Audio settings
  video.volume = Math.max(0, Math.min(1, audioVolume));
  video.muted = !enableAudio;

  video.onerror = function (e) {
    console.warn('Video failed to load:', e);
    document.body.style.backgroundColor = '#0b0b12';
  };

  function tryPlay(preferUnmuted) {
    if (typeof preferUnmuted === 'undefined') preferUnmuted = true;

    // Prefer unmuted playback when audio is enabled.
    if (enableAudio && preferUnmuted) {
      video.muted = false;
    }

    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function (error) {
        // If autoplay with audio is blocked, fall back to muted autoplay.
        console.warn('Video play failed:', error);

        if (enableAudio && !video.muted) {
          video.muted = true;
          video.play().then(function () {
            // Try to unmute after playback starts (often works in desktop WebViews).
            setTimeout(function () {
              video.muted = false;
            }, 1200);
          }).catch(function () {});
          return;
        }

        // Generic retry after a short delay.
        setTimeout(function () {
          video.play().catch(function () {});
        }, 500);
      });
    }
  }

  video.oncanplay = function () { tryPlay(true); };
  video.onloadeddata = function () { tryPlay(true); };

  video.load();
  tryPlay(true);
}

function init() {
  initVideoBackground();
  updateClock();

  // Sync updates to minute boundaries to keep CPU usage low.
  (function scheduleMinuteTicks() {
    var now = new Date();
    var msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    if (msUntilNextMinute < 0) msUntilNextMinute = 0;

    setTimeout(function () {
      updateClock();
      setInterval(updateClock, 60 * 1000);
    }, msUntilNextMinute + 20);
  })();
}

window.addEventListener('DOMContentLoaded', init);
