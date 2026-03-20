let cumulativeTranslateX = 0;
let cumulativeTranslateY = 0;
 
/* ── Breakpoint-abhängige Track-Anzahl ── */
function getTotalTracks() {
    if (window.innerWidth >= 1024) return 10;
    if (window.innerWidth >= 600)  return 6;
    return 4;
}
 
/* ── Wie viele Tracks belegt ein Item? ── */
function getColSpan(item) {
    if (item.classList.contains('wide')) return 4;
    if (item.classList.contains('tall')) return 2;
    return 2;
}
 
/* ── Zoom-Faktor: Grid füllt genau den Player ── */
function getScaleFactor(item) {
    return getTotalTracks() / getColSpan(item);
}
 
function scaleUpItem(item) {
    if (item.classList.contains('clicked')) {
        if (item.classList.contains('viewing')) {
            // Zoom out
            item.classList.remove('clicked');
            item.classList.remove('viewing');
            document.querySelector('.grid').style.transform = 'scale(1) translate(0px, 0px)';
            cumulativeTranslateX = 0;
            cumulativeTranslateY = 0;
            document.querySelector('.player').classList.remove('is-viewing');
        } else {
            // Zoom in to viewing mode
            item.classList.add('viewing');
            document.querySelector('.player').classList.add('is-viewing');
            const scaleFactor = getScaleFactor(item);
            document.querySelector('.grid').style.transform =
                `scale(${scaleFactor}) translate(${cumulativeTranslateX}px, ${cumulativeTranslateY}px)`;
        }
    } else {
        document.querySelectorAll('.item.clicked').forEach(clickedItem => {
            let img = clickedItem.querySelector('img');
            clickedItem.classList.remove('clicked');
            clickedItem.classList.remove('viewing');
            clickedItem.style.transform = 'scale(1)';
            clickedItem.style.zIndex = '0';
            clickedItem.style.borderColor = 'initial';
            clickedItem.style.borderWidth = 'initial';
            clickedItem.style.borderStyle = 'initial';
            if (img) img.style.zIndex = '0';
        });
        document.querySelector('.player').classList.remove('is-viewing');
 
        document.querySelector('.grid').style.transform = 'scale(1) translate(0px, 0px)';
        cumulativeTranslateX = 0;
        cumulativeTranslateY = 0;
 
        item.classList.add('clicked');
        item.style.borderColor = 'red';
        item.style.borderWidth = '0px';
        item.style.borderStyle = 'solid';
 
        centerOnItem(item);
    }
}
 
document.querySelectorAll('.item').forEach(item => {
    item.addEventListener('click', () => {
        scaleUpItem(item);
        if (!item.classList.contains('clicked')) {
            centerOnItem(item);
        }
    });
});
 
function centerOnItem(item) {
    const itemRect   = item.getBoundingClientRect();
    const playerRect = document.querySelector('.player').getBoundingClientRect();
 
    cumulativeTranslateX = (playerRect.left + playerRect.width  / 2) - (itemRect.left + itemRect.width  / 2);
    cumulativeTranslateY = (playerRect.top  + playerRect.height / 2) - (itemRect.top  + itemRect.height / 2);
}
 
/* ── Navigation ── */
function navigateToItem(currentItem, direction) {
    const items = Array.from(document.querySelectorAll('.item'));
    const currentIndex = items.indexOf(currentItem);
    let nextIndex;
 
    if (direction === 'next') {
        nextIndex = (currentIndex + 1) % items.length;
    } else if (direction === 'prev') {
        nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else {
        const curRect = currentItem.getBoundingClientRect();
        const curCenterX = curRect.left + curRect.width  / 2;
        const curCenterY = curRect.top  + curRect.height / 2;
 
        let best = null;
        let bestDist = Infinity;
 
        items.forEach((item, idx) => {
            if (idx === currentIndex) return;
            const r = item.getBoundingClientRect();
            const cx = r.left + r.width  / 2;
            const cy = r.top  + r.height / 2;
            const dx = cx - curCenterX;
            const dy = cy - curCenterY;
 
            const inDirection =
                (direction === 'up'   && dy < -10) ||
                (direction === 'down' && dy >  10);
 
            if (!inDirection) return;
 
            const dist = Math.abs(dy) + Math.abs(dx) * 0.4;
            if (dist < bestDist) { bestDist = dist; best = idx; }
        });
 
        nextIndex = best !== null ? best : currentIndex;
    }
 
    const nextItem = items[nextIndex];
    nextItem.click();
    nextItem.click();
}
 
document.querySelector('.left-arrow').addEventListener('click', () => {
    let c = document.querySelector('.item.viewing');
    if (c) navigateToItem(c, 'prev');
});
 
document.querySelector('.right-arrow').addEventListener('click', () => {
    let c = document.querySelector('.item.viewing');
    if (c) navigateToItem(c, 'next');
});
 
document.querySelector('.up-arrow').addEventListener('click', () => {
    let c = document.querySelector('.item.viewing');
    if (c) navigateToItem(c, 'up');
});
 
document.querySelector('.down-arrow').addEventListener('click', () => {
    let c = document.querySelector('.item.viewing');
    if (c) navigateToItem(c, 'down');
});
 
document.addEventListener('keydown', (event) => {
    let c = document.querySelector('.item.viewing');
    if (!c) return;
    switch (event.key.toLowerCase()) {
        case 'w': navigateToItem(c, 'up');   break;
        case 'a': navigateToItem(c, 'prev'); break;
        case 's': navigateToItem(c, 'down'); break;
        case 'd': navigateToItem(c, 'next'); break;
    }
});
 
document.querySelector('.theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});
 
let isScrolling = false;
document.addEventListener('wheel', (event) => {
    let c = document.querySelector('.item.viewing');
    if (!c || isScrolling) return;
    event.preventDefault();
    isScrolling = true;
    navigateToItem(c, event.deltaY < 0 ? 'prev' : 'next');
    setTimeout(() => { isScrolling = false; }, 500);
});
 
/* ── Touch-Swipe für Mobile ── */
let touchStartX = 0;
let touchStartY = 0;
 
document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });
 
document.addEventListener('touchend', (e) => {
    const c = document.querySelector('.item.viewing');
    if (!c) return;
 
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const minSwipe = 40;
 
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
        navigateToItem(c, dx < 0 ? 'next' : 'prev');
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > minSwipe) {
        navigateToItem(c, dy < 0 ? 'down' : 'up');
    }
}, { passive: true });
 
/* ── Logo-Rotation ── */
const logo = document.getElementById('logo-wrapper');
const BASE_SPEED = 0.33;
const SCROLL_MULTIPLIER = 0.25;
 
let rotY = 0, lastScroll = 0, scrollDelta = 0, last = null;
 
window.addEventListener('scroll', () => {
    scrollDelta = Math.abs(window.scrollY - lastScroll);
    lastScroll = window.scrollY;
});
 
function animate(ts) {
    if (!last) last = ts;
    const delta = (ts - last) / 16.67;
    last = ts;
    const speed = BASE_SPEED + scrollDelta * SCROLL_MULTIPLIER * delta;
    rotY = (rotY + speed) % 360;
    scrollDelta *= 0.85;
    logo.style.transform = `rotateY(${rotY.toFixed(1)}deg)`;
    requestAnimationFrame(animate);
}
 
requestAnimationFrame(animate);
 
/* ── carlwinkelsen menu ── */
const cwToggle   = document.getElementById('cw-toggle');
const cwDropdown = document.getElementById('cw-dropdown');
 
cwToggle.addEventListener('click', () => {
    cwDropdown.classList.toggle('open');
});
 
document.querySelectorAll('.cw-dropdown-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('overlay-' + btn.dataset.page).classList.add('open');
        cwDropdown.classList.remove('open');
    });
});
 
document.querySelectorAll('.cw-overlay-close').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('overlay-' + btn.dataset.close).classList.remove('open');
    });
});