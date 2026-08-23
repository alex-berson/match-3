let board, score;
let scoreCounting;

const N_ROWS = 7;
const N_COLS = 7;
const N_SHAPES = 6;

const shapes = {
    1: 'circle',
    2: 'triangle',
    3: 'square',
    4: 'pentagon',
    5: 'hexagon',
    6: 'octagon'
}

const showBoard = () => document.body.classList.add('visible');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const initBoard = () => {

    score = 0;

    board = [[0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0],
             [0,0,0,0,0,0,0]];
}

const createBoard = () => {

    let board = document.querySelector('.board');
    let template = document.querySelector('.cell-template');

    for (let i = 0; i < N_ROWS * N_COLS; i++) {

        let cell = template.content.firstElementChild.cloneNode(true);
        board.appendChild(cell);
    }
}

const setBoardSize = () => {

    let minSide = window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight;
    let cssBoardSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--board-size')) / 100;
    let boardSize = Math.ceil(minSide * cssBoardSize / N_COLS) * N_COLS;

    document.documentElement.style.setProperty('--board-size', `${boardSize}px`);
}

const fixHeader = () => {

    document.addEventListener('visibilitychange', async () => {

        // let shapes = document.querySelectorAll('.shape');

        let header = document.querySelector('header');

        header.classList.add('hidden');
        await sleep(0);
        header.offsetHeight;
        header.classList.remove('hidden');

        // shapes.forEach(shape => shape.remove());

        // createShapes();
        // fillBoard();

        // processMove();
    });
}

const generateBoard = () => {

    const notMatching = (i, j, val) => {

        if (i > 1 && board[i - 1][j] == val && board[i - 2][j] == val) return false;
        if (j > 1 && board[i][j - 1] == val && board[i][j - 2] == val) return false;

        return true;
    }

    if (localStorage.getItem('match3-board') != null) {

        let data = JSON.parse(localStorage.getItem('match3-board'));

        score = data.score;
        board = data.board;

        return;
    }

    do {

        for (let r = 0; r < N_ROWS; r++) {
            for (let c = 0; c < N_COLS; c++) {

                let val;

                do {
                    val = Math.floor(Math.random() * N_SHAPES) + 1;

                    // val = seqShapes.shift(); //
                } while (!notMatching(r, c, val));

                board[r][c] = val;
            } 
        }

    } while (gameOver(board));
}

const createShapes = () => {

    for (let i = 0; i < N_ROWS * N_COLS; i++) {

        createShape();
    }
}

const createShape = () => {

    let board = document.querySelector('.board');
    let template = document.querySelector('.shape-template');
    let shape = template.content.firstElementChild.cloneNode(true);

    board.appendChild(shape);

    return shape;
}

const fillBoard = async () => {

    let scoreEl = document.querySelector('.score');
    let cells = document.querySelectorAll('.cell');
    let shapesEl = document.querySelectorAll('.shape');

    scoreEl.innerText = score;

    for (let r = 0; r < N_ROWS; r++) {
        for (let c = 0; c < N_COLS; c++) {

            let val = board[r][c];
            let shape = shapesEl[r * N_COLS + c];

            shape.firstChild.src = `images/shapes/${shapes[val]}.svg`;

            shape.dataset.r = r;
            shape.dataset.c = c;

            let [offsetX, offsetY] = getOffsets(shape, cells[r * N_COLS + c]);
            let style = window.getComputedStyle(shape);
            let matrix = new DOMMatrix(style.transform);

            shape.style.transform = `translate(${matrix.m41 + offsetX}px, ${matrix.m42 + offsetY}px)`;
        } 
    }
}

const getOffsets = (shape, cell) => {

    let shapeRect = shape.getBoundingClientRect();
    let cellRect = cell.getBoundingClientRect();
    let offsetX = cellRect.left - shapeRect.left + (cellRect.width - shapeRect.width) / 2;
    let offsetY = cellRect.top - shapeRect.top + (cellRect.height - shapeRect.height) / 2;

    return [offsetX, offsetY];
}

const selectCell = async (e) => {

    let shape = e.currentTarget;
    let cells = document.querySelectorAll('.cell');
    let [r, c] = [Number(shape.dataset.r), Number(shape.dataset.c)];
    let cell = cells[r * N_COLS + c];

    if (cell.classList.contains('selected')) {
        cell.classList.remove('selected');
        return;
    }

    let selectedIdx = [...cells].findIndex(cell => cell.classList.contains('selected'));

    if (selectedIdx == -1) {
        cell.classList.add('selected');
        return;
    }

    let [r2, c2] = [Math.trunc(selectedIdx / N_COLS), selectedIdx % N_COLS];

    cells[selectedIdx].classList.remove('selected');

    if (Math.abs(r2 - r) + Math.abs(c2 - c) != 1) {
        cells[r * N_COLS + c].classList.add('selected');
        return;
    }

    processMove(r, c, r2, c2);
}

const startSwipe = (e) => {

    let shape = e.currentTarget;
    let board = document.querySelector('.board');
    let touch = e.touches[e.touches.length - 1];

    board.dataset.touchId = touch.identifier;
    board.dataset.startX = touch.clientX;
    board.dataset.startY = touch.clientY;
    board.dataset.r = shape.dataset.r;
    board.dataset.c = shape.dataset.c;

    board.addEventListener('touchmove', processSwipe);
}

const processSwipe = (e) => {

    let board = document.querySelector('.board');
    let touchId = Number(board.dataset.touchId);
    let touch = [...e.changedTouches].find(touch => touch.identifier == touchId);

    if (!touch) return;

    let currentX = touch.clientX;
    let currentY = touch.clientY;
    let dx = currentX - Number(board.dataset.startX);
    let dy = currentY - Number(board.dataset.startY);
    let absDx = Math.abs(dx);
    let absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 10) {

        let direction = absDx > absDy ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');

        board.removeEventListener('touchmove', processSwipe);

        endSwipe(direction);
    }
}

const endSwipe = async (direction) => {

    let board = document.querySelector('.board');
    let r1 = Number(board.dataset.r);
    let c1 = Number(board.dataset.c);
    let [r2, c2] = [r1, c1];

    switch (direction) {

        case 'up':
            r2 = r1 - 1;
            break;
        case 'right':
            c2 = c1 + 1;
            break;
        case 'down':
            r2 = r1 + 1;
            break;
        case 'left':
            c2 = c1 - 1;
            break;
    }

    if (r2 < 0 || r2 >= N_ROWS || c2 < 0 || c2 >= N_COLS) return;

    processMove(r1, c1, r2, c2);
}

const processMove = async (r1, c1, r2, c2) => {

    let tempBoard = board.map(arr => arr.slice());

    disableTouch();
    
    updateBoard(tempBoard, r1, c1, r2, c2);

    let matches = findMatches(tempBoard);

    await swapShapes(matches, r1, c1, r2, c2);

    while (matches.length > 0) {

        board = tempBoard;

        await sleep(0);
        updateScore(matches);
        removeMatches(matches);

        let [falling, empty] = compressColumns();
        fillEmptyCells(empty);

        await sleep(300);

        await Promise.all([
            slideDownShapes(falling),
            dropNewShapes(empty)
        ]);

        matches = findMatches(board);

        await sleep(100);
    }

    if (gameOver(board)) {
        await sleep(100);
        endGame();
        return;
    }

    saveBoard();
    enableTouch();
}

const updateBoard = async (board, r1, c1, r2, c2) => {

    [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
}

const findMatches = (board) => {

    let matches = [];

    for (let r = 0; r < N_ROWS; r++) {
        for (let c = 0; c < N_COLS; c++) {

            let col, match = [[r, c]];

            for (col = c + 1; col < N_COLS; col++) {
                if (board[r][col] != board[r][c]) break;
                match.push([r, col]);
            }

            if (match.length >= 3) {
                matches.push(match);
                c = col - 1;
            }
        }
    }

    for (let c = 0; c < N_COLS; c++) {
        for (let r = 0; r < N_ROWS; r++) {

            let row, match = [[r, c]];

            for (row = r + 1; row < N_ROWS; row++) {
                if (board[row][c] != board[r][c]) break;
                match.push([row, c]);
            }

            if (match.length >= 3) {
                matches.push(match);
                r = row - 1;
            }
        }
    }

    return matches;
}

const swapShapes = async (matches, r1, c1, r2, c2) => {

    let cells = document.querySelectorAll('.cell');
    let shape1 = document.querySelector(`.shape[data-r="${r1}"][data-c="${c1}"]`);
    let shape2 = document.querySelector(`.shape[data-r="${r2}"][data-c="${c2}"]`);
    let [offsetX1, offsetY1] = getOffsets(shape1, cells[r2 * N_COLS + c2]);
    let [offsetX2, offsetY2] = getOffsets(shape2, cells[r1 * N_COLS + c1]);
    let style1 = window.getComputedStyle(shape1);
    let style2 = window.getComputedStyle(shape2);
    let matrix1 = new DOMMatrix(style1.transform);
    let matrix2 = new DOMMatrix(style2.transform);

    shape1.classList.add('move', 'upper');
    shape2.classList.add('move');

    shape1.style.transform = `translate(${matrix1.m41 + offsetX1}px, ${matrix1.m42 + offsetY1}px)`;
    shape2.style.transform = `translate(${matrix2.m41 + offsetX2}px, ${matrix2.m42 + offsetY2}px)`;

    if (matches.length > 0) {

        shape1.dataset.r = r2;
        shape1.dataset.c = c2;
        shape2.dataset.r = r1;
        shape2.dataset.c = c1;

        await Promise.all([shape1, shape2].map(shape => new Promise(resolve => {

            shape.addEventListener('transitionend', () => {

                shape.classList.remove('move', 'upper');

                resolve();

            }, {once: true});
        })));

        return;
    }

    await Promise.all([shape1, shape2].map(shape => new Promise(resolve => {
        shape.addEventListener('transitionend', () => resolve(), {once: true});
    })));

    shape1.style.transform = `translate(${matrix1.m41}px, ${matrix1.m42}px)`;
    shape2.style.transform = `translate(${matrix2.m41}px, ${matrix2.m42}px)`;

    await Promise.all([shape1, shape2].map(shape => new Promise(resolve => {

        shape.addEventListener('transitionend', () => {

            shape.classList.remove('move', 'upper');

            resolve();

        }, {once: true});
    })));
}

// const updateScore = (matches) => {

//     let scoreEl = document.querySelector('.score');

//     score += new Set(matches.flat().map(([r, c]) => r * N_COLS + c)).size;

//     scoreEl.innerText = score;
// }

const updateScore = async (matches) => {

    let scoreEl = document.querySelector('.score');

    score += new Set(matches.flat().map(([r, c]) => r * N_COLS + c)).size;

    if (scoreCounting) return;

    scoreCounting = true;

    let displayed = Number(scoreEl.innerText);

    while (displayed < score) {

        await sleep(100);

        displayed++;
        scoreEl.innerText = displayed;

    }

    scoreCounting = false;
}

const removeMatches = (matches) => {

    for (let match of matches) {
        for (let item of match) {

            let [r, c] = item;
            let shape = document.querySelector(`.shape[data-r="${r}"][data-c="${c}"]`);

            board[r][c] = 0;

            shape.classList.add('disappear');
            shape.addEventListener('transitionend', shape.remove, {once: true});
        }
    }
}

const compressColumns = () => {

    let falling = [];
    let empty = [];

    for (let c = 0; c < N_COLS; c++) {
        for (let r = N_ROWS - 1; r >= 0; r--) {

            if (board[r][c] != 0) continue;

            for (let r2 = r - 1; r2 >= 0; r2--) {
    
                if (board[r2][c] != 0) {
                    [board[r][c], board[r2][c]] = [board[r2][c], board[r][c]];
                    falling.push([r2,c,r,c]);
                    break;
                }
            }
        }
    }

    for (let c = 0; c < N_COLS; c++) {

        let n = 0;

        for (let r = N_ROWS - 1; r >= 0; r--) {
            if (board[r][c] == 0) {
                empty.push([n++, r, c]);
            }
        }
    }

    empty.sort((a, b) => a[0] - b[0]);

    return [falling, empty];
}

const fillEmptyCells = (empty) => {
    
    for (let item of empty) {

        let [_, r, c] = item;
        let val = Math.floor(Math.random() * N_SHAPES) + 1;

        board[r][c] = val;

        // board[r][c] = seqShapes.shift(); //
    }
}

const slideDownShapes = async (falling) => {

    let cells = document.querySelectorAll('.cell');

    await Promise.all(falling.map(item => new Promise(resolve => {

        let [r1, c1, r2, c2] = item;
        let cell = cells[r2 * N_COLS + c2];
        let shape = document.querySelector(`.shape[data-r="${r1}"][data-c="${c1}"]`);
        let [offsetX, offsetY] = getOffsets(shape, cell);
        let style = window.getComputedStyle(shape);
        let matrix = new DOMMatrix(style.transform);

        shape.dataset.r = r2;
        shape.dataset.c = c2;

        shape.classList.add('fall');

        requestAnimationFrame(() => {
            shape.style.transform = `translate(${matrix.m41 + offsetX}px, ${matrix.m42 + offsetY}px)`;
        });

        shape.addEventListener('transitionend', () => {
            shape.classList.remove('fall');
            resolve();
        }, {once: true});
    })));
}

// const dropNewShapes = async (empty) => {

//     const DURATION = 200;
    
//     let cells = document.querySelectorAll('.cell');

//     await Promise.all(empty.map(item => new Promise(async resolve => {

//         let [n, r, c] = item;
//         let val= board[r][c];
//         let shape = createShape();
//         let height = cells[0].getBoundingClientRect().height;
//         let delay = n * DURATION / (n + r + 1);

//         let [offsetX, offsetY] = getOffsets(shape, cells[c]);
//         offsetY = offsetY - height;

//         shape.firstChild.src = `images/shapes/${shapes[val]}.svg`;
//         shape.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

//         if (delay > 0) await sleep(delay);

//         [offsetX, offsetY] = getOffsets(shape, cells[r * N_COLS + c]);

//         let style = window.getComputedStyle(shape);
//         let matrix = new DOMMatrix(style.transform);

//         shape.dataset.r = r;
//         shape.dataset.c = c;

//         shape.classList.add('fall', 'visible');
//         shape.style.transitionDuration = `${DURATION - delay}ms`;

//         requestAnimationFrame(() => {
//             shape.style.transform = `translate(${matrix.m41 + offsetX}px, ${matrix.m42 + offsetY}px)`;
//         });

//         shape.addEventListener('transitionend', () => {

//             shape.classList.remove('fall');
//             shape.style.removeProperty('transition-duration');

//             resolve();

//         }, { once: true });
//     })));
// }

const dropNewShapes = async (empty) => {

    let cells = document.querySelectorAll('.cell');
    let step = cells[N_COLS].getBoundingClientRect().top - cells[0].getBoundingClientRect().top;

    await Promise.all(empty.map(item => new Promise(resolve => {

        let [n, r, c] = item;
        let shape = createShape();
        let dist = (n + r + 1) * step;

        shape.firstChild.src = `images/shapes/${shapes[board[r][c]]}.svg`;

        shape.dataset.r = r;
        shape.dataset.c = c;

        let [offsetX, offsetY] = getOffsets(shape, cells[r * N_COLS + c]);

        shape.style.transform = `translate(${offsetX}px, ${offsetY - dist}px)`;

        let style = window.getComputedStyle(shape);
        let matrix = new DOMMatrix(style.transform);

        shape.classList.add('fall', 'visible');

        requestAnimationFrame(() => {
            shape.style.transform = `translate(${matrix.m41}px, ${matrix.m42 + dist}px)`;
        });

        shape.addEventListener('transitionend', () => {
            shape.classList.remove('fall');
            resolve();
        }, { once: true });
    })));
}

const gameOver = (board) => {

    const validCoord = (r, c) => r >= 0 && r < N_ROWS && c >= 0 && c < N_COLS;

    const checkMatch = (r, c) => {

        let val = board[r][c];
        let count = 1;
        let col = c - 1;

        while (col >= 0 && board[r][col] == val) {
            count++;
            col--;
        }

        col = c + 1;

        while (col < N_COLS && board[r][col] == val) {
            count++;
            col++;
        }

        if (count >= 3) return true;

        count = 1;
        let row = r - 1;

        while (row >= 0 && board[row][c] == val) {
            count++;
            row--;
        }

        row = r + 1;

        while (row < N_ROWS && board[row][c] == val) {
            count++;
            row++;
        }

        return count >= 3;
    }

    const trySwap = (r1, c1, r2, c2) => {

        if (r1 == r2 && c1 == c2 || board[r1][c1] == board[r2][c2]) return false;

        [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];

        let match = checkMatch(r1, c1) || checkMatch(r2, c2);

        [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];

        return match;
    }

    for (let r = 0; r < N_ROWS; r++) {
        for (let c = 0; c < N_COLS; c++) {
            if (validCoord(r, c + 1) && trySwap(r, c, r, c + 1)) return false;
            if (validCoord(r + 1, c) && trySwap(r, c, r + 1, c)) return false;
        }
    }

    return true;
}

const saveBoard = () => {

    let data = {score, board};

    localStorage.setItem('match3-board', JSON.stringify(data));
}


const endGame = async () => {

    // let event = new Event('touchstart'); //

    let board = document.querySelector('.board');
    let shapes = [...document.querySelectorAll('.shape:not(.invisible) img')];

    localStorage.removeItem('match3-board');

    await Promise.all(shapes.map(shape => new Promise(async resolve => {

        shape.classList.add('volley');

        shape.addEventListener('animationend', () => {

            shape.classList.remove('volley');

            resolve();

        }, { once: true });
    })));

    board.addEventListener('touchstart', resetGame);
    board.addEventListener('mousedown', resetGame);

    // if (aiMode() && score < 3000) setTimeout(() => board.dispatchEvent(event), 500); //

    // setTimeout(() => board.dispatchEvent(event), 1000); //

}

// const endGame = async () => {

//     let board = document.querySelector('.board');
//     let shapes = [...document.querySelectorAll('.shape:not(.invisible)')];

//     localStorage.removeItem('match3-board');

//     await Promise.all(shapes.map(shape => new Promise(resolve => {

//         let img = shape.firstChild;
//         let delay = (Number(shape.dataset.r) + Number(shape.dataset.c)) * 50;

//         img.style.animationDelay = `${delay}ms`;
//         img.classList.add('volley');

//         img.addEventListener('animationend', () => {

//             img.classList.remove('volley');
//             img.style.removeProperty('animation-delay');

//             resolve();

//         }, { once: true });
//     })));

//     board.addEventListener('touchstart', resetGame);
//     board.addEventListener('mousedown', resetGame);
// }

// const resetGame = async () => {

//     let board = document.querySelector('.board');
//     let score = document.querySelector('.score');
//     let shapes = [...document.querySelectorAll('.shape')];

//     board.removeEventListener('touchstart', resetGame);
//     board.removeEventListener('mousedown', resetGame);

//     await Promise.all(shapes.map(shape => new Promise(async resolve => {
//         shape.classList.add('invisible');
//         shape.addEventListener('transitionend', () => {
//             shape.removeAttribute('style');
//             resolve();
//         }, {once: true});
//     })));

//     score.innerText = 0;

//     initBoard();
//     generateBoard();
//     fillBoard();

//     await Promise.all(shapes.map(shape => new Promise(async resolve => {
//         shape.classList.remove('invisible');
//         shape.addEventListener('transitionend', resolve, {once: true});
//     })));

//     enableTouch();

//     // if (aiMode()) setTimeout(aiPlay, 500);
// }

const resetGame = async () => {

    const DURATION =300;

    let boardEl = document.querySelector('.board');
    let scoreEl = document.querySelector('.score');
    let cells = document.querySelectorAll('.cell');
    let oldShapes = [...document.querySelectorAll('.shape')];

    boardEl.removeEventListener('touchstart', resetGame);
    boardEl.removeEventListener('mousedown', resetGame);

    let rect0 = cells[0].getBoundingClientRect();
    let rect1 = cells[N_COLS].getBoundingClientRect();
    let dist = (rect1.top - rect0.top) * N_ROWS;

    initBoard();
    generateBoard();

    scoreEl.innerText = 0;

    let slideOut = oldShapes.map(shape => new Promise(resolve => {

        let style = window.getComputedStyle(shape);
        let matrix = new DOMMatrix(style.transform);

        shape.classList.add('fall');
        shape.style.transitionDuration = `${DURATION}ms`;

        requestAnimationFrame(() => {
            shape.style.transform = `translate(${matrix.m41}px, ${matrix.m42 + dist}px)`;
        });

        shape.addEventListener('transitionend', () => {
            shape.remove();
            resolve();
        }, {once: true});
    }));

    let slideIn = [];

    for (let r = 0; r < N_ROWS; r++) {
        for (let c = 0; c < N_COLS; c++) {

            slideIn.push(new Promise(resolve => {

                let shape = createShape();
                let cell = cells[r * N_COLS + c];

                shape.firstChild.src = `images/shapes/${shapes[board[r][c]]}.svg`;

                shape.dataset.r = r;
                shape.dataset.c = c;

                let [offsetX, offsetY] = getOffsets(shape, cell);

                shape.style.transform = `translate(${offsetX}px, ${offsetY - dist}px)`;

                let style = window.getComputedStyle(shape);
                let matrix = new DOMMatrix(style.transform);

                shape.classList.add('fall', 'visible');
                shape.style.transitionDuration = `${DURATION}ms`;

                requestAnimationFrame(() => {
                    shape.style.transform = `translate(${matrix.m41}px, ${matrix.m42 + dist}px)`;
                });

                shape.addEventListener('transitionend', () => {
                    shape.classList.remove('fall');
                    shape.style.removeProperty('transition-duration');
                    resolve();
                }, {once: true});
            }));
        }
    }

    await Promise.all([...slideOut, ...slideIn]);

    enableTouch();
}

const aiMode = () => {

    let queryString = window.location.search;
    let urlParams = new URLSearchParams(queryString);
    let mode = urlParams.get('mode');

    // return mode == 'ai';

    return true;
}

const aiPlay = async () => {

    do {
        let moves = getMoves(board);
        // let move = moves[Math.floor(Math.random() * moves.length)];

        if (moves.length == 0) return;

        let move = seqMoves.shift(); //

        await processMove(...move);
        await sleep(200);

    } while (true);
}

const getMoves = (board) => {

    let moves = [];

    const validCoord = (r, c) => r >= 0 && r < N_ROWS && c >= 0 && c < N_COLS;

    const checkMatch = (r, c) => {

        let val = board[r][c];
        let count = 1;
        let col = c - 1;

        while (col >= 0 && board[r][col] == val) {
            count++;
            col--;
        }

        col = c + 1;

        while (col < N_COLS && board[r][col] == val) {
            count++;
            col++;
        }

        if (count >= 3) return true;

        count = 1;
        let row = r - 1;

        while (row >= 0 && board[row][c] == val) {
            count++;
            row--;
        }

        row = r + 1;

        while (row < N_ROWS && board[row][c] == val) {
            count++;
            row++;
        }

        return count >= 3;
    }

    const trySwap = (r1, c1, r2, c2) => {

        if (r2 == r1 && c1 == c2 || board[r1][c1] == board[r2][c2]) return false;

        [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];

        let match = checkMatch(r1, c1) || checkMatch(r2, c2);

        [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];

        return match;
    }

    for (let r = 0; r < N_ROWS; r++) {
        for (let c = 0; c < N_COLS; c++) {
            if (validCoord(r, c + 1) && trySwap(r, c, r, c + 1)) {
                moves.push([r, c, r, c + 1]);
            }

            if (validCoord(r + 1, c) && trySwap(r, c, r + 1, c)) {
                moves.push([r, c, r + 1, c]);
            }
        }
    }

    return moves;
}

const enableTouch = () => {

    let shapes = document.querySelectorAll('.shape');

    shapes.forEach(shape => {
        shape.addEventListener('touchstart', startSwipe);
        shape.addEventListener('mousedown', selectCell);
    });
}

const disableTouch = () => {

    let shapes = document.querySelectorAll('.shape');

    shapes.forEach(shape => {
        shape.removeEventListener('touchstart', startSwipe);
        shape.removeEventListener('mousedown', selectCell);
    });
}

const disableScreen = () => {

    const preventDefault = (e) => e.preventDefault();

    document.addEventListener('touchstart', preventDefault, {passive: false});
    document.addEventListener('mousedown', preventDefault, {passive: false});
}

const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
}

const init = async () => {

    localStorage.removeItem('match3-board'); //
    
    // registerServiceWorker();
    disableScreen();
    createBoard();
    setBoardSize();
    fixHeader();
    initBoard();
    generateBoard();
    createShapes();
    fillBoard();
    showBoard();
    // await sleep(2000)
    // fillBoard();

    enableTouch();

    // if (aiMode()) setTimeout(aiPlay, 1500);

    // endGame();
}

window.onload = () => document.fonts.ready.then(init);