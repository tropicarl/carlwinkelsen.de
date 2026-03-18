let cumulativeTranslateX = 0;
let cumulativeTranslateY = 0;
 
/* ── Hilfsfunktion: wie viele Spalten-Tracks belegt ein Item? ── */
function getColSpan(item) {
    if (item.classList.contains('wide')) return 4;
    if (item.classList.contains('tall')) return 2;
    return 2; // standard (quadratisch)
}
 
/* ── Zoom-Faktor anhand der Item-Breite im 10-Track-Grid ── */
function getScaleFactor(item) {
    // 10 Tracks insgesamt; Item nimmt colSpan Tracks ein
    const colSpan = getColSpan(item);
    return 10 / colSpan;
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
 
        // Reset grid transform when selecting a new item
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
 
    const itemCenterX   = itemRect.left   + itemRect.width  / 2;
    const itemCenterY   = itemRect.top    + itemRect.height / 2;
    const playerCenterX = playerRect.left + playerRect.width  / 2;
    const playerCenterY = playerRect.top  + playerRect.height / 2;
 
    cumulativeTranslateX = playerCenterX - itemCenterX;
    cumulativeTranslateY = playerCenterY - itemCenterY;
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
        /*
         * Für up/down: räumliche Nachbarschaft über getBoundingClientRect ermitteln.
         * Das ist robuster als ein fester gridColumns-Wert, weil Items
         * unterschiedliche Größen haben können.
         */
        const curRect = currentItem.getBoundingClientRect();
        const curCenterX = curRect.left + curRect.width / 2;
        const curCenterY = curRect.top  + curRect.height / 2;
 
        // Alle Items außer dem aktuellen nach Richtung filtern und das nächste finden
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
 
            // Gewichtete Distanz: Vorrang für Items in Hauptrichtung
            const dist = Math.abs(dy) + Math.abs(dx) * 0.4;
            if (dist < bestDist) { bestDist = dist; best = idx; }
        });
 
        nextIndex = best !== null ? best : currentIndex;
    }
 
    const nextItem = items[nextIndex];
    nextItem.click(); // select
    nextItem.click(); // enter viewing mode
}
 
document.querySelector('.left-arrow').addEventListener('click', () => {
    let currentItem = document.querySelector('.item.viewing');
    if (currentItem) navigateToItem(currentItem, 'prev');
});
 
document.querySelector('.right-arrow').addEventListener('click', () => {
    let currentItem = document.querySelector('.item.viewing');
    if (currentItem) navigateToItem(currentItem, 'next');
});
 
document.querySelector('.up-arrow').addEventListener('click', () => {
    let currentItem = document.querySelector('.item.viewing');
    if (currentItem) navigateToItem(currentItem, 'up');
});
 
document.querySelector('.down-arrow').addEventListener('click', () => {
    let currentItem = document.querySelector('.item.viewing');
    if (currentItem) navigateToItem(currentItem, 'down');
});
 
document.addEventListener('keydown', (event) => {
    let currentItem = document.querySelector('.item.viewing');
    if (!currentItem) return;
    switch (event.key.toLowerCase()) {
        case 'w': navigateToItem(currentItem, 'up');   break;
        case 'a': navigateToItem(currentItem, 'prev'); break;
        case 's': navigateToItem(currentItem, 'down'); break;
        case 'd': navigateToItem(currentItem, 'next'); break;
    }
});
 
document.querySelector('.theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});
 
let isScrolling = false;
document.addEventListener('wheel', (event) => {
    let currentItem = document.querySelector('.item.viewing');
    if (!currentItem || isScrolling) return;
    event.preventDefault();
    isScrolling = true;
    if (event.deltaY < 0) {
        navigateToItem(currentItem, 'prev');
    } else if (event.deltaY > 0) {
        navigateToItem(currentItem, 'next');
    }
    setTimeout(() => { isScrolling = false; }, 500);
});
 
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
        const page = btn.dataset.page;
        document.getElementById('overlay-' + page).classList.add('open');
        cwDropdown.classList.remove('open');
    });
});
 
document.querySelectorAll('.cw-overlay-close').forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.close;
        document.getElementById('overlay-' + page).classList.remove('open');
    });
});