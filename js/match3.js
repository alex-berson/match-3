let board, score;

const N_COLS = 7;
const N_ROWS = 7;
const N_SHAPES = 6;

const shapes = {
    1:  'circle',
    2:  'triangle',
    3:  'square',
    4:  'pentagon',
    5:  'hexagon',
    6:  'octagon'
}

const showBoard = () => document.body.classList.add('visible');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const neighbour = (r1,c1,r2,c2) => (Math.abs(r2 - r1) + Math.abs(c2 - c1) == 1);

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

const setBoardSize = () => {

    let minSide = window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight;
    let cssBoardSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--board-size')) / 100;
    let boardSize = Math.ceil(minSide * cssBoardSize / N_COLS) * N_COLS;

    document.documentElement.style.setProperty('--board-size', `${boardSize}px`);
}

const validVal = (i, j, val) => {

    if (i > 1 && board[i - 1][j] == val && board[i - 2][j] == val) return false;
    if (j > 1 && board[i][j - 1] == val && board[i][j - 2] == val) return false;

    return true;
}

const fillBoard = async () => {

    let cells = document.querySelectorAll('.cell');
    let figures = document.querySelectorAll('.figure');

    for (let r = 0; r < N_ROWS; r++) {
        for (let c = 0; c < N_COLS; c++) {

            let val;

            do {
                val = Math.floor(Math.random() * N_SHAPES) + 1;
            } while (!validVal(r, c, val));

            board[r][c] = val;

            let idx = r * N_COLS + c;
            let figure = figures[idx];
            figures[idx].firstChild.src = `images/figures/${shapes[val]}.svg`;

            figure.dataset.r = r;
            figure.dataset.c = c;

            let [offsetX, offsetY] = getOffsets(figures[idx], cells[idx]);
        
            figure.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        } 
    }
}

const getOffsets = (figure, cell) => {

    let figureRect = figure.getBoundingClientRect();
    let cellRect = cell.getBoundingClientRect();
    let offsetX = cellRect.left - figureRect.left + (cellRect.width - figureRect.width) / 2;
    let offsetY = cellRect.top - figureRect.top + (cellRect.height - figureRect.height) / 2;

    return [offsetX, offsetY];
}

const selectCell = async (e) => {

    let figure = e.currentTarget;
    let cells = document.querySelectorAll('.cell');
    let figures = document.querySelectorAll('.figure');
    let i = [...figures].indexOf(figure);
    let [r, c] = [Number(figure.dataset.r), Number(figure.dataset.c)];
    let cell = cells[r * N_COLS + c];

    if (cell.classList.contains('selected')) {
        cell.classList.remove('selected');
        return;
    }

    i = [...cells].findIndex(cell => cell.classList.contains('selected'));

    if (i == -1) {
        cell.classList.add('selected');
        return;
    }

    let [r2, c2] = [Math.trunc(i / N_COLS), i % N_COLS];

    cells[i].classList.remove('selected');

    if (!neighbour(r,c,r2,c2)) {
        cells[r * N_COLS + c].classList.add('selected');
        return;
    }

    disableTouch();
    await swapFigures(r, c, r2, c2);
    enableTouch();
}

const swapFigures = async (r1,c1,r2,c2) => {

    let cells = document.querySelectorAll('.cell');
    let figure1 = document.querySelector(`.figure[data-r="${r1}"][data-c="${c1}"]`);
    let figure2 = document.querySelector(`.figure[data-r="${r2}"][data-c="${c2}"]`);
    let [offsetX1, offsetY1] = getOffsets(figure1, cells[r2 * N_COLS + c2]);
    let [offsetX2, offsetY2] = getOffsets(figure2, cells[r1 * N_COLS + c1]);
    let style1 = window.getComputedStyle(figure1);
    let style2 = window.getComputedStyle(figure2);
    let matrix1 = new WebKitCSSMatrix(style1.transform);
    let matrix2 = new WebKitCSSMatrix(style2.transform);

    figure1.classList.add('move');
    figure2.classList.add('move', 'upper');

    figure1.style.transform = `translate(${matrix1.m41 + offsetX1}px, ${matrix1.m42 + offsetY1}px)`;
    figure2.style.transform = `translate(${matrix2.m41 + offsetX2}px, ${matrix2.m42 + offsetY2}px)`;

    let matches = validMove(r1,c1,r2,c2);

    if (matches.length > 0) {

        [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];

        figure1.dataset.r = r2;
        figure1.dataset.c = c2;
        figure2.dataset.r = r1;
        figure2.dataset.c = c1;

        await Promise.all([figure1, figure2].map(figure => new Promise(resolve => {

            figure.addEventListener('transitionend', () => {

                figure.classList.remove('move', 'upper');

                resolve();

            }, {once: true});
        })));

        await sleep(0);
        await updateBoard(matches);

        return;
    }

    await Promise.all([figure1, figure2].map(figure => new Promise(resolve => {
        figure.addEventListener('transitionend', () => resolve(), {once: true});
    })));

    figure1.style.transform = `translate(${matrix1.m41}px, ${matrix1.m42}px)`;
    figure2.style.transform = `translate(${matrix2.m41}px, ${matrix2.m42}px)`;

    await Promise.all([figure1, figure2].map(figure => new Promise(resolve => {

        figure.addEventListener('transitionend', () => {

            figure.classList.remove('move', 'upper');

            resolve();

        }, {once: true});
    })));
}

const validMove = (r1,c1,r2,c2) => { 

    if (!neighbour(r1,c1,r2,c2)) return [];

    let tempBoard = board.map(arr => arr.slice());

    [tempBoard[r1][c1], tempBoard[r2][c2]] = [tempBoard[r2][c2], tempBoard[r1][c1]];

    return findMatches(tempBoard);
}

const findMatches = (board) => {

    let matches = [];

    for (let r = 0; r < N_ROWS; r++) {
        for (let c = 0; c < N_COLS; c++) {

            let c2, match = [[r, c]];

            for (c2 = c + 1; c2 < N_COLS; c2++) {
                if (board[r][c2] != board[r][c]) break;
                match.push([r, c2]);
            }

            if (match.length >= 3) {
                matches.push(match);
                c = c2 - 1;
            }
        }
    }

    for (let c = 0; c < N_COLS; c++) {
        for (let r = 0; r < N_ROWS; r++) {

            let r2, match = [[r, c]];

            for (r2 = r + 1; r2 < N_ROWS; r2++) {
                if (board[r2][c] != board[r][c]) break;
                match.push([r2, c]);
            }

            if (match.length >= 3) {
                matches.push(match);
                r = r2 - 1;
            }
        }
    }

    return matches;
}

const updateBoard = async (matches) => {

    removeMatches(matches);
    updateScore(matches);
    await sleep(300);
    await slideDown();
}

const removeMatches = (matches) => {

    for (let match of matches) {
        for (let item of match) {

            let [r, c] = item;
            let figure = document.querySelector(`.figure[data-r="${r}"][data-c="${c}"]`);

            board[r][c] = 0;

            figure.classList.add('invisible');
            figure.addEventListener('transitionend', figure.remove, {once: true});
        }
    }
}

const updateScore = (matches) => {

    let scoreEl = document.querySelector('.score');
    score += matches.flat().length;

    scoreEl.classList.add('visible');
    scoreEl.innerText = score;
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

const slideDown = async () => {

    let [falling, empty] = compressColumns();
    let cells = document.querySelectorAll('.cell');

    let fallingPromises = falling.map(item => new Promise(resolve => {

        let [r, c, r2, c2] = item;
        let cell = cells[r2 * N_COLS + c2];
        let figure = document.querySelector(`.figure[data-r="${r}"][data-c="${c}"]`);
        let [offsetX, offsetY] = getOffsets(figure, cell);
        let style = window.getComputedStyle(figure);
        let matrix = new WebKitCSSMatrix(style.transform);

        figure.dataset.r = r2;
        figure.dataset.c = c2;

        figure.classList.add('fall');
        
        requestAnimationFrame(() => {
            figure.style.transform = `translate(${matrix.m41 + offsetX}px, ${matrix.m42 + offsetY}px)`;
        });

        figure.addEventListener('transitionend', () => {
            figure.classList.remove('fall');
            resolve();
        }, {once: true});
    }));

    let emptyPromises = empty.map(item => new Promise(async resolve => {
        
        let [n, r, c] = item;
        let img = document.createElement('img');
        let figure = document.createElement('div');
        let val = Math.floor(Math.random() * N_SHAPES) + 1;
        let height = cells[0].getBoundingClientRect().height;
        let delay = n * 200 / (n + r + 1);

        if (delay > 0) await sleep(delay);

        figure.classList.add('figure');
        figure.appendChild(img);
        cells[cells.length - 1].insertAdjacentElement('afterend', figure);

        let [offsetX, offsetY] = getOffsets(figure, cells[c]);
        offsetY = offsetY - height;

        board[r][c] = val;
            
        figure.firstChild.src = `images/figures/${shapes[val]}.svg`;
        figure.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

        [offsetX, offsetY] = getOffsets(figure, cells[r * N_COLS + c]);

        let style = window.getComputedStyle(figure);
        let matrix = new WebKitCSSMatrix(style.transform);

        figure.dataset.r = r;
        figure.dataset.c = c;

        figure.classList.add('fall', 'visible');
        figure.style.transitionDuration = `${200 - delay}ms`;

        requestAnimationFrame(() => {
            figure.style.transform = `translate(${matrix.m41 + offsetX}px, ${matrix.m42 + offsetY}px)`;
        });

        figure.addEventListener('transitionend', () => {

            figure.classList.remove('fall');
            figure.style.removeProperty('transition-duration');

            resolve();

        }, { once: true });
    }));

    await Promise.all([...fallingPromises, ...emptyPromises]);

    let matches = findMatches(board);

    if (matches.length > 0) {
        await sleep(100);
        await updateBoard(matches);
        return;
    }
}

const startSwipe = (e) => {

    let figure = e.currentTarget;
    let board = document.querySelector('.board');
    let touch = e.touches[e.touches.length - 1];

    board.dataset.touchId = touch.identifier;
    board.dataset.startX = touch.clientX;
    board.dataset.startY = touch.clientY;
    board.dataset.r = figure.dataset.r;
    board.dataset.c = figure.dataset.c;

    board.addEventListener('touchmove', processSwipe);
}

const processSwipe = (e) => {

    let board = document.querySelector('.board');
    let touchID = Number(board.dataset.touchId);
    let touch = [...e.changedTouches].find(touch => touch.identifier == touchID);

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

        disableTouch();
        endSwipe(direction);
    }
}

const endSwipe = async (direction) => {

    let board = document.querySelector('.board');
    let r = Number(board.dataset.r);
    let c = Number(board.dataset.c);
    let r2 = r, c2 = c;

    switch (direction) {

        case 'up':
            r2 = r - 1;
            break;
        case 'right':
            c2 = c + 1;
            break;
        case 'down':
            r2 = r + 1;
            break;
        case 'left':
            c2 = c - 1;
            break;
    }

    if (r2 < 0 || r2 >= N_ROWS || c2 < 0 || c2 >= N_COLS) {
        enableTouch();
        return;
    }

    await swapFigures(r2, c2, r, c);
    enableTouch();
}

const enableTouch = () => {

    let figures = document.querySelectorAll('.figure');

    figures.forEach(figure => {
        figure.addEventListener('touchstart', startSwipe);
        figure.addEventListener('mousedown', selectCell);
    });
}

const disableTouch = () => {

    let figures = document.querySelectorAll('.figure');

    figures.forEach(figure => {
        figure.removeEventListener('touchstart', startSwipe);
        figure.removeEventListener('mousedown', selectCell);
    });
}

const disableScreen = () => {

    const preventDefault = (e) => e.preventDefault();

    document.addEventListener('touchstart', preventDefault, {passive: false});
    document.addEventListener('mousedown', preventDefault, {passive: false});
}

const init = () => {

    disableScreen();
    setBoardSize();
    initBoard();
    fillBoard();
    showBoard();
    enableTouch();
}

window.onload = () => document.fonts.ready.then(init);