let board, score;
let nCols = 8;
let nRows = 8;
let nSlides;

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

const compressCols = () => {

    let slides = [];

    for (let c = 0; c < nCols; c++) {
        for (let r = nRows - 1; r >= 0; r--) {

            if (board[r][c] != 0) continue;

            for (let r2 = r - 1; r2 >= 0; r2--) {
    
                if (board[r2][c] != 0) {
                    [board[r][c], board[r2][c]] = [board[r2][c], board[r][c]];
                    slides.push([r2,c,r,c]);
                    break;
                }
            }
        }
    }

    console.log(slides);

    return slides;
}

const updateScore = (matches) => {

    let scoreEl = document.querySelector('h3');
    score += matches.flat().length;

    scoreEl.classList.add('visible');
    scoreEl.firstChild.innerText = score;
}

const newItems = () => {

    let images = document.querySelectorAll('img');

    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            if (board[r][c] != 0) continue; 
            
            let val = Math.floor(Math.random() * 6) + 1

            board[r][c] = val;
            images[r * nCols + c].src = `images/fruits/${fruits[val]}.svg`;
            // images[r * nCols + c].style.opacity = '';
            images[r * nCols + c].style.removeProperty('opacity');
            images[r * nCols + c].classList.remove('invisible');
        }
    }
}

const endSlide = (slides) => {

    console.log("SLIDE END");


    let images = document.querySelectorAll('img:not(.new)');

    slides.forEach(slide => {

        let image1 = images[slide[0] * nCols + slide[1]]; 
        let image2 = images[slide[2] * nCols + slide[3]]; 

        image2.src = image1.src;
        image2.classList.remove('invisible');
        image1.style.removeProperty('transition');
        image1.style.removeProperty('transform');
        
        if (board[slide[0]][slide[1]] == 0) {

            let el = document.querySelector(`[data-row="${slide[0]}"][data-col="${slide[1]}"]`);

            console.log(el);

            image1.src = el.src;

            el.remove();
            
            // image1.style.opacity = 0;
        
        }
    });

    let invisibles = document.querySelectorAll('.invisible');

    invisibles.forEach(image => {

        let i = [...images].indexOf(image);

        console.log(i);

        let [r, c] = [Math.trunc(i / nCols), i % nCols]; 

        image.src = document.querySelector(`[data-row="${r}"][data-col="${c}"]`).src;

        image.classList.remove('invisible');

        document.querySelector(`[data-row="${r}"][data-col="${c}"]`).remove();
    });
}

const slideDown = (slides) => {

    let tempBoard = board.map(arr => arr.slice());
    
    let n = 0;
    let images = document.querySelectorAll('img');

    slides.forEach(slide => {

        n++;

        let image1 = images[slide[0] * nCols + slide[1]]; 
        let image2 = images[slide[2] * nCols + slide[3]]; 
        let image1Rect = image1.getBoundingClientRect();
        let image2Rect = image2.getBoundingClientRect();

        image1.style.transition = 'transform 0.2s cubic-bezier(0.33, 0, 0.66, 0.33)';

        image1.style.transform = `translate(${image2Rect.left - image1Rect.left}px, ${image2Rect.top - image1Rect.top}px`;

        image1.addEventListener('transitionend', e => {

            n--;

            console.log('SLIDES', n);


            if (n > 0) return;

            // console.log(slides)

            console.log("SLIDES");


            endSlide(slides);

            board = tempBoard;

            let matches = findMatches(board);

            if (matches.length > 0) setTimeout(cascade, 100, matches);

            // slides.forEach(slide => {

            //     let image1 = images[slide[0] * nCols + slide[1]]; 
            //     let image2 = images[slide[2] * nCols + slide[3]]; 

            //     image2.src = image1.src;
            //     image2.classList.remove('invisible');
            //     image1.style.removeProperty('transition');
            //     image1.style.removeProperty('transform');
                
            //     // image1.style.opacity = 0;

            //     if (board[slide[0]][slide[1]] == 0) image1.style.opacity = 0;
            // });

            // newItems();

            // let matches = findMatches(board);

            // if (matches.length > 0) setTimeout(cascade, 0, matches);

        }, {once: true});

        // let images = document.querySelectorAll('img');
        
    });

    let cells = document.querySelectorAll('.cell');

    for (let c = 0; c < nCols; c++) {

        let r1;

        for (let r = nRows - 1; r >= 0; r--) {
            if (board[r][c] != 0) continue; 

            n++;
            r1 = r1 || r + 1;

            let offset = document.querySelectorAll(`[data-col="${c}"]`).length;
            let delay = r1 == 1 ? 0 : 0.1 / (r1 - 1);
            let image = document.createElement('img');

            image.classList.add('new');
            image.dataset.col = c;
            image.dataset.row = r;

            cells[cells.length - 1].after(image);

            let image1 = images[c + 0]; 
            let image2 = images[c + 8]; 
            let image0Rect = image.getBoundingClientRect();
            let image1Rect = image1.getBoundingClientRect();
            let image2Rect = image2.getBoundingClientRect();

            let val = Math.floor(Math.random() * 6) + 1

            tempBoard[r][c] = val;

            image.src = `images/fruits/${fruits[val]}.svg`;
            image.style.transform = `translate(${image1Rect.left - image0Rect.left}px, ${image1Rect.top - image0Rect.top - (image2Rect.top - image1Rect.top) * (offset + 1)}px`;

            let style = window.getComputedStyle(image);
            let matrix = new WebKitCSSMatrix(style.transform);

            image.style.transition = `transform 0.2s cubic-bezier(0.33, 0, 0.66, 0.33), opacity 0.1s ${offset * delay}s ease-in`;

            image.style.transform = `translate(${Math.round(matrix.m41)}px, ${Math.round(matrix.m42 + (image2Rect.top - image1Rect.top) * r1)}px)`;
            image.style.opacity = 1;

            image.addEventListener('transitionend', e => {


                n--;

                console.log('NEW', n);

                if (n > 0) return;

                console.log("NEW");

                endSlide(slides);

                board = tempBoard;

                let matches = findMatches(board);

                if (matches.length > 0) setTimeout(cascade, 100, matches);

            }, {once: true});
        }
    }
}

const cascade = (matches) => {

    setTimeout(() => {
        removeMatches(matches);
        updateScore(matches)
    }, 100);

    setTimeout(() => {
        let slides = compressCols();

        if (slides.length > 0) {
            // nSlides = 0;
            slideDown(slides);
            // newItems2();
            return;
        }

        slideDown(slides);

        // newItems2();
        // newItems();

        // let matches = findMatches(board);

        // if (matches.length > 0) setTimeout(cascade, 100, matches);
    }, 400);
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

const slideUp = () => {

    let images = document.querySelectorAll('img');
    let image1 = images[3]; 
    let image2 = images[11]; 

    let image1Rect = image1.getBoundingClientRect();
    let image2Rect = image2.getBoundingClientRect();

    image1.style.transform = `translateY(${image1Rect.top - image2Rect.top}px)`;
}

const newItems2 = () => {

    let images = document.querySelectorAll('img');
    let cells = document.querySelectorAll('.cell');

    for (let c = 0; c < nCols; c++) {

        let r1;

        for (let r = nRows - 1; r >= 0; r--) {

            if (board[r][c] != 0) continue; 

            r1 = r1 || r + 1;

            let  n = document.querySelectorAll(`[data-col="${c}"]`).length;
            let delay = r1 == 1 ? 0 : 0.1 / (r1 - 1);
            let image = document.createElement('img');

            image.classList.add('new');
            image.dataset.col = c;
            image.dataset.row = r;


            cells[cells.length - 1].after(image);

            let image1 = images[c + 0]; 
            let image2 = images[c + 8]; 
            let image0Rect = image.getBoundingClientRect();
            let image1Rect = image1.getBoundingClientRect();
            let image2Rect = image2.getBoundingClientRect();

            let val = Math.floor(Math.random() * 6) + 1

            // board[r][c] = val;

            image.src = `images/fruits/${fruits[val]}.svg`;
            image.style.transform = `translate(${image1Rect.left - image0Rect.left}px, ${image1Rect.top - image0Rect.top - (image2Rect.top - image1Rect.top) * (n + 1)}px`;

            let style = window.getComputedStyle(image);
            let matrix = new WebKitCSSMatrix(style.transform);

            image.style.transition = `transform 0.2s cubic-bezier(0.33, 0, 0.66, 0.33), opacity 0.1s ${n * delay}s ease-in`;

            image.style.transform = `translate(${Math.round(matrix.m41)}px, ${Math.round(matrix.m42 + (image2Rect.top - image1Rect.top) * r1)}px)`;
            image.style.opacity = 1;

            // image.addEventLstener('transitionend', e => {


            //     n--;

            //     if (n == 0) console.log('ZERO');

            //     image1.src = image.src;
            //     image1.classList.remove('invisible');
            //     image1.style.opacity = '';
            //     image.remove();

            // }, {once: true});
        }
    }
}

// const newImage = (col) => {

//     console.log(col);

//     let cells = document.querySelectorAll('.cell');
//     let images = document.querySelectorAll('img');

//     let image = document.createElement('img');

//     image.classList.add('new');
//     image.dataset.col = col;

//     cells[cells.length - 1].after(image);

//     let image1 = images[col + 0]; 
//     let image2 = images[col + 8]; 

//     let image0Rect = image.getBoundingClientRect();
//     let image1Rect = image1.getBoundingClientRect();
//     let image2Rect = image2.getBoundingClientRect();

//     let val = Math.floor(Math.random() * 6) + 1

//     image.src = `images/fruits/${fruits[val]}.svg`;

//     image.style.transform = `translate(${image1Rect.left - image0Rect.left}px, ${image1Rect.top - image0Rect.top - (image2Rect.top - image1Rect.top)}px`;


//     let style = window.getComputedStyle(image);
//     let matrix = new WebKitCSSMatrix(style.transform);

//     image.style.transition = 'transform 0.2s cubic-bezier(0.33, 0, 0.66, 0.33), opacity 0.5s ease-in';


//     image.style.transform = `translate(${Math.round(matrix.m41)}px, ${Math.round(matrix.m42 + (image2Rect.top - image1Rect.top))}px)`;
//     image.style.opacity = 1;

//     // image.addEventListener('transitionend', e => {


//     //     image2.src = image1.src;
//     //     image2.classList.remove('invisible');

//     // }, {once: true});



//     // image.style.removeProperty('opacity');
//     // image.classList.remove('invisible');
// }

const init = () => {

    disableTapZoom();
    setBoardSize();
    initBoard();
    fillBoard();
    enableTouch();


    // slideUp();

    // newImage(1);
}

window.onload = () => document.fonts.ready.then(init());