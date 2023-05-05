let board, score;

const fruits = {
    1:  'apple',
    2:  'tangerine',
    3:  'lemon',
    4:  'kiwi',
    5:  'blueberries',
    6:  'grapes',
}

let nCols = 8;
let nRows = 8;

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
    if (j > 1 && board[i][j -1] == val && board[i][j -2] == val) return false;

    return true;
}

const fillBoard = () => {

    let images = document.querySelectorAll('img');

    for (let i = 0; i < nRows; i++) {
        for (let j = 0; j < nCols; j++) {

            let val;

            do {
                val = Math.floor(Math.random() * 6) + 1;
                board[i][j] = val;
                images[i * nCols + j].src = `images/fruits/${fruits[val]}.svg`;
            } while (!validVal(i, j, val));
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
    // let [r, c] = [r1, c1];
    // let matches = [[r, c]];

    // while (r > 0) {

    //     r--;
    //     if (tempBoard[r][c] != tempBoard[r1][c1]) break;
    //     matches.push([r,c]);
    // }

    // [r, c] = [r1, c1];

    // while (r < 7) {

    //     r++;
    //     if (tempBoard[r][c] != tempBoard[r1][c1]) break;
    //     matches.push([r,c]);
    // }

    // [r, c] = [r1, c1];

    // if (matches.length < 3) matches = [[r, c]];

    // while (c > 0) {

    //     c--;
    //     if (tempBoard[r][c] != tempBoard[r1][c1]) break;
    //     matches.push([r,c]);
    // }

    // [r, c] = [r1, c1];

    // while (c < 7) {

    //     c++;
    //     if (tempBoard[r][c] != tempBoard[r1][c1]) break;
    //     matches.push([r,c]);
    // }

    // return matches.length < 3 ? null : matches;

    // return true;

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

            let r = item[0];
            let c = item[1];

            board[r][c] = 0;

            // images[r * nCols + c].src = '';
            images[r * nCols + c].classList.add('invisible');

        }
    }
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

        setTimeout(removeMatches, 100, matches);

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