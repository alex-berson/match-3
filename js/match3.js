let board, score;
let nCols = 8;
let nRows = 8;

const fruits = {
    1:  'apple',
    2:  'tangerine',
    3:  'lemon',
    4:  'kiwi',
    5:  'blueberries',
    6:  'grapes',
}

const touchScreen = () => matchMedia('(hover: none)').matches;

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

    let minSide = screen.height > screen.width ? screen.width : window.innerHeight;
    let cssBoardSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--board-size'));
    let boardSize = Math.ceil(minSide * cssBoardSize / nCols) * nCols;

    document.documentElement.style.setProperty('--board-size', boardSize + 'px');
}

const validVal = (i, j, val) => {

    if (i > 1 && board[i - 1][j] == val && board[i - 2][j] == val) return false;
    if (j > 1 && board[i][j - 1] == val && board[i][j - 2] == val) return false;

    return true;
}

const fillBoard = () => {

    let images = document.querySelectorAll('img');

    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {

            let val;

            do {
                val = Math.floor(Math.random() * 6) + 1;
                board[r][c] = val;
                images[r * nCols + c].src = `images/fruits/${fruits[val]}.svg`;
            } while (!validVal(r, c, val));
        } 
    }
}

const redrawBoard = () => {

    let images = document.querySelectorAll('img');

    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            if (board[r][c] == 0) board[r][c] = Math.floor(Math.random() * 6) + 1;
        }
    }

    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {

            let val = board[r][c];

            images[r * nCols + c].src = `images/fruits/${fruits[val]}.svg`;
            images[r * nCols + c].classList.remove('invisible');
        } 
    }
}

const findMatches = (board) => {

    let matches = [];

    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {

            let match = [[r, c]];
            let c2;

            for (c2 = c + 1; c2 < nCols; c2++) {
                if (board[r][c2] != board[r][c]) break;
                match.push([r, c2]);
            }

            if (match.length >= 3) {
                matches.push(match);
                c = c2 - 1;
            }
        }
    }

    for (let c = 0; c < nCols; c++) {
        for (let r = 0; r < nRows; r++) {

            let match = [[r, c]];
            let r2;

            for (r2 = r + 1; r2 < nRows; r2++) {
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

const validMove = (r1,c1,r2,c2) => { 

    if (!neighbour(r1,c1,r2,c2)) return false;
    if (board[r1][c1] == board[r2][c2]) return false;

    let tempBoard = board.map(arr => arr.slice());

    [tempBoard[r1][c1], tempBoard[r2][c2]] = [tempBoard[r2][c2], tempBoard[r1][c1]];

    let matches = findMatches(tempBoard);

    console.log(matches);

    return matches;
}

const neighbour = (r1,c1,r2,c2) => {

    if (Math.abs(r2 - r1) + Math.abs(c2 - c1) == 1) return true;

    return false;
}

const removeMatches = (matches) => {

    console.log(matches);

    let images = document.querySelectorAll('img');

    for (let match of matches) {

        console.log(match);

        for (let item of match) {

            console.log(item);

            let [r, c] = item;

            board[r][c] = 0;

            images[r * nCols + c].classList.add('invisible');
        }
    }
}

const compressGrid = () => {

    // console.table(board);

    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < r; c++) {
            [board[r][c], board[c][r]] = [board[c][r], board[r][c]];
        }
    }

    for (let i = 0; i < board.length; i++) {
        board[i] = board[i].filter(x => x != 0);
        board[i] = [...Array(nCols - board[i].length).fill(0), ...board[i]];
    }

    console.table(board);

    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < r; c++) {
            [board[r][c], board[c][r]] = [board[c][r], board[r][c]];
        }
    }

    console.table(board);

}

const updateScore = (matches) => {

    let scoreEl = document.querySelector('h3');
    score += matches.flat().length;

    scoreEl.classList.add('visible');
    scoreEl.firstChild.innerText = score;
}

const cascade = (matches) => {

    setTimeout(() => {
        removeMatches(matches);
        updateScore(matches)
    }, 100);

    setTimeout(() => {
        compressGrid();
        redrawBoard();

        let matches = findMatches(board);

        if (matches.length > 0) setTimeout(cascade, 200, matches);
    }, 500);
}

const selectCell = (e) => {

    let image = e.currentTarget;
    let cell = image.parentElement;

    let images = document.querySelectorAll('img');
    let i = [...images].indexOf(image);
    let [r, c] = [Math.trunc(i / nCols), i % nCols];

    if (cell.classList.contains('selected')) {
        cell.classList.remove('selected');
        return;
    }

    i = [...images].findIndex(image => image.parentElement.classList.contains('selected'));

    if (i == -1) {
        cell.classList.add('selected');        
        return;
    }

    let [r2, c2] = [Math.trunc(i / nCols), i % nCols];

    let matches = validMove(r,c,r2,c2);

    if (matches.length > 0) {

        [board[r][c], board[r2][c2]] = [board[r2][c2], board[r][c]];

        tempImage = images[r * nCols + c].src;
        images[r * nCols + c].src = images[r2 * nCols + c2].src;
        images[r2 * nCols + c2].src = tempImage;    

        images[i].parentElement.classList.remove('selected');

        cascade(matches);

        return;
    }

    images[i].parentElement.classList.remove('selected');

    cell.classList.add('selected');        
}

const enableTouch = () => {

    let images = document.querySelectorAll('img');

    for (let image of images) {

        let event = touchScreen() ? 'touchstart' : 'mousedown';

        image.addEventListener(event, selectCell);
    }
}

const disableTouch = () => {

    let images = document.querySelectorAll('img');

    for (let image of images) {

        let event = touchScreen() ? 'touchstart' : 'mousedown';

        image.removeEventListener(event, selectCell);
    }
}

const disableTapZoom = () => {

    const preventDefault = (e) => e.preventDefault();
    const event = touchScreen() ? 'touchstart' : 'mousedown';

    document.body.addEventListener(event, preventDefault, {passive: false});
}

const init = () => {

    disableTapZoom();
    setBoardSize();
    initBoard();
    fillBoard();
    enableTouch();
}

window.onload = () => document.fonts.ready.then(() => init());