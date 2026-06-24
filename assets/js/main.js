// ── NAV scroll class ─────────────────────────────────────────
const nav = document.getElementById('mainNav');
const onScroll = () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ── Scroll reveal ────────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

// ── Horizontal scrolly services ──────────────────────────────
const driver   = document.querySelector('.services-scroll-driver');
const track    = document.getElementById('servicesTrack');
const isMobile = () => window.innerWidth < 768;

function updateServicesScroll() {
  if (isMobile()) { track.style.transform = ''; return; }

  const driverRect = driver.getBoundingClientRect();
  const driverH    = driver.offsetHeight;
  const viewH      = window.innerHeight;

  // progress: 0 when sticky section first hits top, 1 when bottom of driver hits bottom of view
  const scrolled   = -driverRect.top;
  const maxScroll  = driverH - viewH;
  const progress   = Math.max(0, Math.min(1, scrolled / maxScroll));

  // How far left can we scroll? track width minus visible width
  const trackW    = track.scrollWidth;
  const wrapW     = track.parentElement.offsetWidth;
  const maxTransX = Math.max(0, trackW - wrapW + 48); // 48px = right padding

  track.style.transform = `translateX(-${progress * maxTransX}px)`;
}

window.addEventListener('scroll', updateServicesScroll, { passive: true });
window.addEventListener('resize', updateServicesScroll);
updateServicesScroll();

// ── Smooth anchor scrolling for all internal links ───────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = nav.offsetHeight + 16;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    }
  });
});

// ── Live opening status ───────────────────────────────────────
(function () {
  // Opening hours (London time). Sunday = 0, Monday = 1 … Saturday = 6
  const hours = {
    1: { open: 8,  close: 19 }, // Mon
    2: { open: 8,  close: 19 }, // Tue
    3: { open: 8,  close: 19 }, // Wed
    4: { open: 8,  close: 19 }, // Thu
    5: { open: 8,  close: 19 }, // Fri
    6: { open: 9,  close: 16 }, // Sat
    0: null,                     // Sun — closed
  };

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  function getLondonTime() {
    // Use Intl to get London wall-clock time regardless of user's locale
    const now = new Date();
    const londonStr = now.toLocaleString('en-GB', { timeZone: 'Europe/London',
      hour: 'numeric', minute: 'numeric', hour12: false,
      weekday: 'short' });
    // Parse: "Mon, 14:32"
    const parts = now.toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    });
    // Get full date object in London tz
    const londonDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    return londonDate;
  }

  function checkStatus() {
    const now     = getLondonTime();
    const day     = now.getDay();   // 0–6
    const hour    = now.getHours();
    const minute  = now.getMinutes();
    const timeNow = hour + minute / 60;

    const todayHours = hours[day];
    const isOpen = todayHours && timeNow >= todayHours.open && timeNow < todayHours.close;

    const dot      = document.getElementById('liveStatusDot');
    const text     = document.getElementById('liveStatusText');
    const banner   = document.getElementById('emergencyBanner');
    const hoursEl  = document.getElementById('liveStatusHours');

    if (!dot) return;

    if (isOpen) {
      dot.className  = 'live-status-dot open';
      text.className = 'live-status-text open';
      // Minutes until close
      const minsLeft = Math.round((todayHours.close - timeNow) * 60);
      const closeStr = `${todayHours.close}:00`;
      if (minsLeft <= 60) {
        text.textContent = `Open now · Closes in ${minsLeft} min`;
      } else {
        text.textContent = `Open now · Closes at ${todayHours.close < 12 ? todayHours.close + 'am' : (todayHours.close === 12 ? '12pm' : (todayHours.close - 12) + 'pm')}`;
      }
      hoursEl.textContent = '';
      if (banner) banner.style.display = 'none';
    } else {
      dot.className  = 'live-status-dot closed';
      text.className = 'live-status-text closed';
      text.textContent = 'Closed right now';

      // Work out next opening time
      let nextDay = day;
      let daysAhead = 0;
      for (let i = 1; i <= 7; i++) {
        const d = (day + i) % 7;
        if (hours[d]) { nextDay = d; daysAhead = i; break; }
      }
      const nextHours = hours[nextDay];
      const nextDayName = daysAhead === 1 ? 'Tomorrow' : dayNames[nextDay];
      hoursEl.textContent = `Next open: ${nextDayName} at ${nextHours.open < 12 ? nextHours.open + ':00am' : (nextHours.open === 12 ? '12:00pm' : (nextHours.open - 12) + ':00pm')}`;

      if (banner) banner.style.display = 'block';
    }
  }

  checkStatus();
  // Re-check every minute
  setInterval(checkStatus, 60000);
})();
