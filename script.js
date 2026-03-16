let cumulativeTranslateX = 0;
let cumulativeTranslateY = 0;

function scaleUpItem(item) {
    let image = item.querySelector('img');
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
            const scaleFactor = 5; // Corresponds to the 5x5 grid
            document.querySelector('.grid').style.transform = `scale(${scaleFactor}) translate(${cumulativeTranslateX}px, ${cumulativeTranslateY}px)`;
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
            if (img) {
                img.style.zIndex = '0';
            }
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
    const itemRect = item.getBoundingClientRect();
    const playerRect = document.querySelector('.player').getBoundingClientRect();

    const itemCenterX = itemRect.left + itemRect.width / 2;
    const itemCenterY = itemRect.top + itemRect.height / 2;
    const playerCenterX = playerRect.left + playerRect.width / 2;
    const playerCenterY = playerRect.top + playerRect.height / 2;

    cumulativeTranslateX = playerCenterX - itemCenterX;
    cumulativeTranslateY = playerCenterY - itemCenterY;
}

function navigateToItem(currentItem, direction) {
    let items = document.querySelectorAll('.item');
    let currentIndex = Array.from(items).indexOf(currentItem);
    let nextIndex, gridColumns;

    // Assuming your grid always has 5 columns as per your CSS
    gridColumns = 5;

    if (direction === 'next') {
        nextIndex = (currentIndex + 1) % items.length;
    } else if (direction === 'prev') {
        nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (direction === 'up') {
        nextIndex = (currentIndex - gridColumns + items.length) % items.length;
    } else if (direction === 'down') {
        nextIndex = (currentIndex + gridColumns) % items.length;
    }

    let nextItem = items[nextIndex];
    // Simulate a click to select the next item
    nextItem.click(); // This will call scaleUpItem
    nextItem.click(); // This will call it again to enter 'viewing' mode
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
    if (!currentItem) {
        return; // Exit if no item is in viewing mode
    }

    switch (event.key.toLowerCase()) {
        case 'w': navigateToItem(currentItem, 'up'); break;
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
    if (!currentItem || isScrolling) {
        return; // Exit if no item is in viewing mode or if already scrolling
    }

    event.preventDefault(); // Prevent the page from scrolling

    isScrolling = true;

    if (event.deltaY < 0) {
        // Scrolling up
        navigateToItem(currentItem, 'prev');
    } else if (event.deltaY > 0) {
        // Scrolling down
        navigateToItem(currentItem, 'next');
    }

    // Reset the flag after a short delay to prevent rapid navigation
    setTimeout(() => { isScrolling = false; }, 500); // 500ms delay
});

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
    const delta = (ts - last) / 16.67;;
    last = ts;

    const speed = BASE_SPEED + scrollDelta * SCROLL_MULTIPLIER * delta;
    rotY = (rotY + speed) % 360;
    scrollDelta *= 0.85;

    logo.style.transform = `rotateY(${rotY.toFixed(1)}deg)`;

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);