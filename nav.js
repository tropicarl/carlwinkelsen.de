/* ================================================================
   NAV.JS — carlwinkelsen Navigation Mechanic
   ----------------------------------------------------------------
   Zustand:   home | green | purple | red
   URLs:      /  |  /hell  |  /dunkel  |  /akzent

   History API: jede Seite hat eine eigene URL.
   Direktaufruf: Seite startet sofort im richtigen Zustand,
   Logo fliegt mit kurzem Delay aus der Mitte in Position.
   Browser-Back/Forward navigiert durch die Zustände.

   SPLIT-HÄLFTEN:
   style.left einmalig gesetzt, Bewegung nur via translateX.
   ================================================================ */

(function () {
  'use strict';

  /* ── DOM ── */
  const hGreen     = document.getElementById('hGreen');
  const hPurple    = document.getElementById('hPurple');
  const divider    = document.getElementById('divider');
  const pageGreen  = document.getElementById('pageGreen');
  const pagePurple = document.getElementById('pagePurple');
  const pageRed    = document.getElementById('pageRed');
  const logoWrap   = document.getElementById('logoWrap');
  const splitLeft  = document.getElementById('splitLeft');
  const splitRight = document.getElementById('splitRight');
  const logoTip    = document.getElementById('logoTip');

  /* ── Logo-Größe ── */
  function logoPx() {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--cw-nav-logo-size').trim();
    if (raw.endsWith('px'))  return parseFloat(raw);
    if (raw.endsWith('rem')) return parseFloat(raw) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (raw.endsWith('vw'))  return parseFloat(raw) / 100 * window.innerWidth;
    if (raw.endsWith('vh'))  return parseFloat(raw) / 100 * window.innerHeight;
    const size = parseFloat(getComputedStyle(logoWrap).width);
    return isNaN(size) ? 120 : size;
  }
  function logoVW()  { return logoPx() / window.innerWidth * 100; }
  function halfVW()  { return logoVW() / 2; }
  function thirdVW() { return logoVW() / 3; }

  /* ── State ── */
  let state     = 'home';
  let animating = false;

  /* ── Timing ── */
  const DUR        = 600;   // Seiten-Übergang ms
  const ROLL_DUR   = 480;   // Logo rollt etwas schneller/fliegender
  const ENTRY_WAIT = 180;   // Verzögerung beim Direktaufruf: Logo startet nach X ms

  /* ── URL → State Mapping ── */
  const URL_TO_STATE = {
    '/hell':    'green',
    '/dunkel':  'purple',
    '/akzent':  'red',
    '/':        'home',
    '':         'home',
  };
  const STATE_TO_URL = {
    home:   '/',
    green:  '/hell',
    purple: '/dunkel',
    red:    '/akzent',
  };

  /* ── Koordinaten ── */
  function centerOffset()    { return 0; }
  function edgeRight()       { return  50 - thirdVW(); }
  function edgeLeft()        { return -50 + thirdVW(); }
  function splitLeftEndPx() {
    /* style.left der linken Hälfte = centerOffset() - halfVW() (in vw, relativ zu Ankerpunkt).
       Ziel: linke Kante soll bei -50vw + ein Sliver stehen.
       Δ = Ziel - Start, alles in vw, dann → px */
    const startVW  = centerOffset() - halfVW();
    const targetVW = -50 - halfVW() / 6;
    return (targetVW - startVW) / 100 * window.innerWidth;
  }
  function splitRightEndPx() {
    /* style.left der rechten Hälfte = centerOffset() (in vw, relativ zu Ankerpunkt).
       Die rechte Hälfte ist halfVW() breit. Ihr rechter Rand sitzt bei centerOffset() + halfVW().
       Ziel: linke Kante soll bei 50vw - ein Sliver stehen, sodass nur der Sliver sichtbar bleibt.
       Δ = Ziel - Start */
    const startVW  = centerOffset() + halfVW();
    const targetVW = 50 - halfVW() / 6;
    return (targetVW - startVW) / 100 * window.innerWidth;
  }

  /* ── Positionen ── */
  function setLogoPos(vw)    { logoWrap.style.left = vw + 'vw'; }
  function currentOffsetVW() { return parseFloat(logoWrap.style.left) || 0; }
  function vwToPx(vw)        { return vw / 100 * window.innerWidth; }
  function getTX(el)         { return new DOMMatrix(getComputedStyle(el).transform).m41; }

  function initSplits() {
    splitLeft.style.left       = (centerOffset() - halfVW()) + 'vw';
    splitRight.style.left      = centerOffset() + 'vw';
    splitLeft.style.transform  = 'translateX(0)';
    splitRight.style.transform = 'translateX(0)';
  }

  /* ── Keyframe-Engine ── */
  const kfLogo  = document.createElement('style');
  const kfSplit = document.createElement('style');
  document.head.appendChild(kfLogo);
  document.head.appendChild(kfSplit);
  let ki = 0;

  function rollLogo(fromVW, toVW, ms, ease, onDone) {
    const name    = 'cwr' + ki++;
    const distPx  = vwToPx(toVW - fromVW);
    const circumf = logoPx() * Math.PI;
    const rot     = (Math.abs(distPx) / circumf) * 360 * Math.sign(distPx);
    kfLogo.textContent = `
      @keyframes ${name} {
        from { transform: translateX(0) rotate(0deg); }
        to   { transform: translateX(${distPx}px) rotate(${rot}deg); }
      }
    `;
    logoWrap.style.animation = `${name} ${ms}ms ${ease} forwards`;
    setTimeout(() => { logoWrap.style.animation = 'none'; onDone && onDone(); }, ms + 16);
  }

  /* ── History ── */
  function pushState(newState) {
    history.pushState({ state: newState }, '', STATE_TO_URL[newState]);
  }

  /* ================================================================
     DIREKTAUFRUF-LANDING
     Seite wird sofort ohne Animation in den richtigen Zustand versetzt.
     Logo startet in der Mitte und fliegt nach ENTRY_WAIT ms in Position —
     das simuliert einen Ladeübergang ohne echtes Overlay.
  ================================================================ */
  function landOnState(target, animate) {
    state = target;

    if (target === 'green') {
      hGreen.classList.add('exit-left');
      hPurple.classList.add('exit-right');
      divider.classList.add('hide');
      pageGreen.classList.add('enter');
      setLogoPos(centerOffset());

      if (animate) {
        logoWrap.classList.add('no-click');
        setTimeout(() => {
          rollLogo(centerOffset(), edgeRight(), ROLL_DUR, 'cubic-bezier(.22,1,.36,1)', () => {
            setLogoPos(edgeRight());
            logoWrap.classList.remove('no-click');
          });
        }, ENTRY_WAIT);
      } else {
        setLogoPos(edgeRight());
      }

    } else if (target === 'purple') {
      hGreen.classList.add('exit-left');
      hPurple.classList.add('exit-right');
      divider.classList.add('hide');
      pagePurple.classList.add('enter');
      setLogoPos(centerOffset());

      if (animate) {
        logoWrap.classList.add('no-click');
        setTimeout(() => {
          rollLogo(centerOffset(), edgeLeft(), ROLL_DUR, 'cubic-bezier(.22,1,.36,1)', () => {
            setLogoPos(edgeLeft());
            logoWrap.classList.remove('no-click');
          });
        }, ENTRY_WAIT);
      } else {
        setLogoPos(edgeLeft());
      }

    } else if (target === 'red') {
      hGreen.classList.add('exit-left');
      hPurple.classList.add('exit-right');
      divider.classList.add('hide');
      pageRed.style.transition = 'none';
      pageRed.classList.add('open');
      setTimeout(() => { pageRed.style.transition = ''; }, 50);

      splitLeft.style.transform  = `translateX(${splitLeftEndPx()}px)`;
      splitRight.style.transform = `translateX(${splitRightEndPx()}px)`;
      logoWrap.style.opacity     = '0';

      if (animate) {
        splitLeft.style.transform  = 'translateX(0)';
        splitRight.style.transform = 'translateX(0)';
        splitLeft.style.display    = 'block';
        splitRight.style.display   = 'block';

        setTimeout(() => {
          const lEndPx = splitLeftEndPx();
          const rEndPx = splitRightEndPx();
          const nL = 'spL' + ki++;
          const nR = 'spR' + ki++;
          kfSplit.textContent = `
            @keyframes ${nL} { from{transform:translateX(0)} to{transform:translateX(${lEndPx}px)} }
            @keyframes ${nR} { from{transform:translateX(0)} to{transform:translateX(${rEndPx}px)} }
          `;
          splitLeft.style.animation  = `${nL} ${ROLL_DUR}ms cubic-bezier(.22,1,.36,1) forwards`;
          splitRight.style.animation = `${nR} ${ROLL_DUR}ms cubic-bezier(.22,1,.36,1) forwards`;
          setTimeout(() => {
            splitLeft.style.animation  = 'none';
            splitRight.style.animation = 'none';
            requestAnimationFrame(() => {
              splitLeft.style.transform  = `translateX(${lEndPx}px)`;
              splitRight.style.transform = `translateX(${rEndPx}px)`;
              splitLeft.classList.add('clickable');
              splitRight.classList.add('clickable');
            });
          }, ROLL_DUR + 16);
        }, ENTRY_WAIT);
      } else {
        splitLeft.style.display    = 'block';
        splitRight.style.display   = 'block';
        splitLeft.style.transform  = `translateX(${splitLeftEndPx()}px)`;
        splitRight.style.transform = `translateX(${splitRightEndPx()}px)`;
        splitLeft.classList.add('clickable');
        splitRight.classList.add('clickable');
      }

    } else {
      /* home — Standardzustand, nichts zu tun */
      setLogoPos(centerOffset());
    }
  }

  /* ── Init: URL auslesen und Zustand setzen ── */
  setLogoPos(centerOffset());
  initSplits();

  const initialState = URL_TO_STATE[window.location.pathname] || 'home';
  if (initialState !== 'home') {
    /* Direktaufruf einer Unterseite: mit Einflug-Animation */
    landOnState(initialState, true);
    /* State im History-Eintrag vermerken */
    history.replaceState({ state: initialState }, '', window.location.pathname);
  } else {
    history.replaceState({ state: 'home' }, '', '/');
  }

  /* ── Browser Back/Forward ── */
  window.addEventListener('popstate', (e) => {
    if (animating) return;
    const target = (e.state && e.state.state) || 'home';
    if (target === state) return;

    /* Schneller Reset auf Home, dann weiter zur Zielseite */
    resetToHome(false);
    if (target !== 'home') landOnState(target, true);
    state = target;
  });

  /* Setzt alle Seiten-Klassen zurück ohne Animation */
  function resetToHome(full) {
    pageGreen.classList.remove('enter');
    pagePurple.classList.remove('enter');
    pageRed.classList.remove('open');
    hGreen.classList.remove('exit-left', 'exit-right');
    hPurple.classList.remove('exit-left', 'exit-right');
    divider.classList.remove('hide');
    splitLeft.style.display    = 'none';
    splitRight.style.display   = 'none';
    splitLeft.style.transform  = 'translateX(0)';
    splitRight.style.transform = 'translateX(0)';
    splitLeft.classList.remove('clickable');
    splitRight.classList.remove('clickable');
    logoWrap.style.opacity     = '1';
    logoWrap.classList.remove('no-click');
    setLogoPos(centerOffset());
    if (full) state = 'home';
  }

  /* ================================================================
     TOOLTIP
  ================================================================ */
  logoWrap.addEventListener('mouseenter', () => {
    if (state !== 'green' && state !== 'purple') return;
    const offsetVW = parseFloat(logoWrap.style.left);
    if (state === 'green') {
      logoTip.style.right = (50 - offsetVW + halfVW() + 1) + 'vw';
      logoTip.style.left  = 'auto';
    } else {
      logoTip.style.left  = (50 + offsetVW + halfVW() + 1) + 'vw';
      logoTip.style.right = 'auto';
    }
    logoTip.style.top = '50vh';
    logoTip.classList.add('show');
  });
  logoWrap.addEventListener('mouseleave', () => logoTip.classList.remove('show'));

  /* ================================================================
     LOGO CLICK
  ================================================================ */
  logoWrap.addEventListener('click', () => {
    if (animating) return;
    if      (state === 'home')   goToRed();
    else if (state === 'green')  goHomeFromGreen();
    else if (state === 'purple') goHomeFromPurple();
  });
  logoWrap.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') logoWrap.click();
  });

  /* ================================================================
     HOME → ROT
  ================================================================ */
  function goToRed() {
    animating = true;
    divider.classList.add('hide');
    logoWrap.classList.add('no-click');

    splitLeft.style.transform  = 'translateX(0)';
    splitRight.style.transform = 'translateX(0)';
    splitLeft.style.display    = 'block';
    splitRight.style.display   = 'block';
    logoWrap.style.opacity     = '0';

    const lEndPx = splitLeftEndPx();
    const rEndPx = splitRightEndPx();
    const nL = 'spL' + ki++;
    const nR = 'spR' + ki++;

    kfSplit.textContent = `
      @keyframes ${nL} { from{transform:translateX(0)} to{transform:translateX(${lEndPx}px)} }
      @keyframes ${nR} { from{transform:translateX(0)} to{transform:translateX(${rEndPx}px)} }
    `;
    splitLeft.style.animation  = `${nL} ${DUR}ms cubic-bezier(.76,0,.24,1) forwards`;
    splitRight.style.animation = `${nR} ${DUR}ms cubic-bezier(.76,0,.24,1) forwards`;

    hGreen.classList.add('exit-left');
    hPurple.classList.add('exit-right');
    setTimeout(() => pageRed.classList.add('open'), 80);

    setTimeout(() => {
      splitLeft.style.animation  = 'none';
      splitRight.style.animation = 'none';
      requestAnimationFrame(() => {
        splitLeft.style.transform  = `translateX(${lEndPx}px)`;
        splitRight.style.transform = `translateX(${rEndPx}px)`;
        splitLeft.classList.add('clickable');
        splitRight.classList.add('clickable');
        state     = 'red';
        animating = false;
        pushState('red');
      });
    }, DUR + 16);
  }

  /* ================================================================
     ROT → HOME
  ================================================================ */
  function mergeToHome() {
    if (animating || state !== 'red') return;
    animating = true;
    splitLeft.classList.remove('clickable');
    splitRight.classList.remove('clickable');

    const lCurPx = getTX(splitLeft);
    const rCurPx = getTX(splitRight);
    const nL = 'mL' + ki++;
    const nR = 'mR' + ki++;

    kfSplit.textContent = `
      @keyframes ${nL} { from{transform:translateX(${lCurPx}px)} to{transform:translateX(0)} }
      @keyframes ${nR} { from{transform:translateX(${rCurPx}px)} to{transform:translateX(0)} }
    `;
    splitLeft.style.animation  = `${nL} 520ms cubic-bezier(.22,1,.36,1) forwards`;
    splitRight.style.animation = `${nR} 520ms cubic-bezier(.22,1,.36,1) forwards`;

    setTimeout(() => pageRed.classList.remove('open'), 60);
    setTimeout(() => {
      hGreen.classList.remove('exit-left');
      hPurple.classList.remove('exit-right');
      divider.classList.remove('hide');
    }, 80);

    setTimeout(() => {
      splitLeft.style.animation  = 'none';
      splitRight.style.animation = 'none';
      splitLeft.style.transform  = 'translateX(0)';
      splitRight.style.transform = 'translateX(0)';
      splitLeft.style.display    = 'none';
      splitRight.style.display   = 'none';
      logoWrap.style.opacity     = '1';
      logoWrap.classList.remove('no-click');
      setLogoPos(centerOffset());
      state     = 'home';
      animating = false;
      pushState('home');
    }, 540);
  }
  splitLeft.addEventListener('click',  mergeToHome);
  splitRight.addEventListener('click', mergeToHome);

  /* ================================================================
     HOME → HELL
  ================================================================ */
  hGreen.addEventListener('click', () => {
    if (animating || state !== 'home') return;
    animating = true;
    divider.classList.add('hide');
    logoWrap.classList.add('no-click');

    const fromVW = currentOffsetVW();
    const dest   = edgeRight();
    rollLogo(fromVW, dest, ROLL_DUR, 'cubic-bezier(.2,0,.2,1)', () => {
      setLogoPos(dest);
      logoWrap.classList.remove('no-click');
      state     = 'green';
      animating = false;
      pushState('green');
    });

    hGreen.classList.add('exit-left');
    hPurple.classList.add('exit-right');
    pageGreen.classList.add('enter');
  });

  /* ================================================================
     HOME → DUNKEL
  ================================================================ */
  hPurple.addEventListener('click', () => {
    if (animating || state !== 'home') return;
    animating = true;
    divider.classList.add('hide');
    logoWrap.classList.add('no-click');

    const fromVW = currentOffsetVW();
    const dest   = edgeLeft();
    rollLogo(fromVW, dest, ROLL_DUR, 'cubic-bezier(.2,0,.2,1)', () => {
      setLogoPos(dest);
      logoWrap.classList.remove('no-click');
      state     = 'purple';
      animating = false;
      pushState('purple');
    });

    hPurple.classList.add('exit-right');
    hGreen.classList.add('exit-left');
    pagePurple.classList.add('enter');
  });

  /* ================================================================
     HELL → HOME
  ================================================================ */
  function goHomeFromGreen() {
    animating = true;
    logoTip.classList.remove('show');
    logoWrap.classList.add('no-click');

    rollLogo(currentOffsetVW(), centerOffset(), ROLL_DUR, 'cubic-bezier(.2,0,.2,1)', () => {
      setLogoPos(centerOffset());
      logoWrap.classList.remove('no-click');
      state     = 'home';
      animating = false;
      pushState('home');
    });

    pageGreen.classList.remove('enter');
    setTimeout(() => {
      hGreen.classList.remove('exit-left');
      hPurple.classList.remove('exit-right');
      divider.classList.remove('hide');
    }, 30);
  }

  /* ================================================================
     DUNKEL → HOME
  ================================================================ */
  function goHomeFromPurple() {
    animating = true;
    logoTip.classList.remove('show');
    logoWrap.classList.add('no-click');

    rollLogo(currentOffsetVW(), centerOffset(), ROLL_DUR, 'cubic-bezier(.2,0,.2,1)', () => {
      setLogoPos(centerOffset());
      logoWrap.classList.remove('no-click');
      state     = 'home';
      animating = false;
      pushState('home');
    });

    pagePurple.classList.remove('enter');
    setTimeout(() => {
      hGreen.classList.remove('exit-left');
      hPurple.classList.remove('exit-right');
      divider.classList.remove('hide');
    }, 30);
  }

  /* ================================================================
     RESIZE
  ================================================================ */
  window.addEventListener('resize', () => {
    if (animating) return;
    if (state === 'red') {
      splitLeft.style.transform  = `translateX(${splitLeftEndPx()}px)`;
      splitRight.style.transform = `translateX(${splitRightEndPx()}px)`;
    }
  });

})();