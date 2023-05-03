let board, score;
const size = 8;
const fruits = {
    1:  'apple',
    2:  'tangerine',
    3:  'lemon',
    4:  'kiwi',
    5:  'blueberries',
    6:  'grapes',
}

const initBoard = () => {

    score = 0;

    board = [[0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0]];
}

const setBoardSize = () => {

    let boardSize;

    if (screen.height > screen.width) {
        boardSize = Math.ceil(screen.width * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--board-size')) / size) * size;
    } else {
        boardSize = Math.ceil(window.innerHeight * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--board-size')) / size) * size;
    }

    document.documentElement.style.setProperty('--board-size', boardSize + 'px');
}

const fillBoard = () => {

    let images = document.querySelectorAll('img');

    console.log(images);

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            board[i][j] = Math.floor(Math.random() * 6) + 1;
            images[i * 8 + j].src = `images/fruits/${fruits[board[i][j]]}.svg`;

            console.log(`images/fruits/${fruits[board[i][j]]}.svg`)
        } 
    }
}

const disableTapZoom = () => {
    const preventDefault = (e) => e.preventDefault();
    document.body.addEventListener('touchstart', preventDefault, {passive: false});
    document.body.addEventListener('mousedown', preventDefault, {passive: false});
}

const init = () => {

    disableTapZoom();
    setBoardSize();
    initBoard();
    fillBoard();
}

window.onload = () => document.fonts.ready.then(() => init());