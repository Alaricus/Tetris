(() => {
  const score = document.querySelector('.score');
  const line = document.querySelector('.line');
  const level = document.querySelector('.level');
  const next = document.querySelector('.next');
  const message = document.querySelector('.message');
  const messageText = document.querySelector('.messageText');
  const well = document.querySelector('.well');
  const ctx = well.getContext('2d');
  const ctxNext = next.getContext('2d');
  const audio = new Audio('tetris.mp3');

  const tetrominoes = [
    [[4, 4], [4, 4]], // O
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]], // T
    [[2, 0, 0], [2, 2, 2], [0, 0, 0]], // L
    [[0, 0, 3], [3, 3, 3], [0, 0, 0]], // J
    [[0, 5, 5], [5, 5, 0], [0, 0, 0]], // S
    [[6, 6, 0], [0, 6, 6], [0, 0, 0]], // Z
    [[0, 0, 0, 0], [7, 7, 7, 7], [0, 0, 0, 0]], // I
  ];

  const colors = [
    '#dddddd', // well
    '#d9c838',
    '#862186',
    '#e9a236',
    '#0a4399',
    '#2c8a57',
    '#a30c0c',
    '#4ca3cB',
    '#black', // stroke
  ];

  let data = { over: true };

  const renderNext = () => {
    ctxNext.canvas.width = data.size * data.nextTetromino[0].length;
    ctxNext.canvas.height = data.size * data.nextTetromino[0].length;
    ctxNext.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctxNext.fillStyle = colors[data.nextIndex];
    ctxNext.strokeStyle = colors[8];
    data.nextTetromino.forEach((row, i) => {
      row.forEach((col, j) => {
        if (data.nextTetromino[i][j] !== 0) {
          ctxNext.fillRect(j * data.size, i * data.size, data.size, data.size);
          ctxNext.strokeRect(j * data.size, i * data.size, data.size, data.size);
        }
      });
    });
  };

  const setNewTetromino = () => {
    if (data.nextIndex && data.nextTetromino) {
      data.index = data.nextIndex;
      data.tetromino = data.nextTetromino;
    } else {
    const i = Math.floor(Math.random() * tetrominoes.length);
      data.index = i + 1;
      data.tetromino = tetrominoes[i];
    }
    setNextTetromino();
    renderNext();
  };

  const setNextTetromino = () => {
    const i = Math.floor(Math.random() * tetrominoes.length);
    data.nextIndex = i + 1;
    data.nextTetromino = tetrominoes[i];
  };

  const renderWell = () => {
    line.textContent = data.line;
    level.textContent = data.level;
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    data.well.forEach((row, i) => {
      row.forEach((col, j) => {
        ctx.fillStyle = colors[data.well[i][j]];
        ctx.strokeStyle = colors[8];
        if (data.well[i][j] !== 0) {
          ctx.fillRect(j * data.size, i * data.size, data.size, data.size);
          ctx.strokeRect(j * data.size, i * data.size, data.size, data.size);
        }
      });
    });
  };

  const setCoords = (tet, pos) =>
    tet.map((row, i) =>
      row.map((col, j) => (
        { x: pos.x + j, y: pos.y + i, z: col !== 0 }
      ))
    ).flat();

  const placeOnWell = coords => {
    coords.forEach(c => {
      if (c.y >= 0 && c.z) {
        data.well[c.y][c.x] = data.index;
      }
    });
  };

  const removeFromWell = (coords, well) => {
    coords.forEach(coord => {
      if (coord.y >= 0 && coord.z) {
        well[coord.y][coord.x] = 0;
      }
    });
  };

  const isFilled = () => {
    const topRow = data.well[0];
    return topRow[3] !== 0 || topRow[4] !== 0 || topRow[5] !== 0 || topRow[6] !== 0;
  };

  const canMove = (dir) => {
    const tempWell = JSON.parse(JSON.stringify(data.well));
    const tempPos = {...data.pos};
    data.oldCoords && removeFromWell(data.oldCoords, tempWell);

    if (dir === 'rotate') {
      const flipTet = t => t[0].map((c, i) => t.map(t => t[i]));
      const rotateTet = t => flipTet([...t].reverse());
      tempTet = rotateTet(data.tetromino);
      const tempCoords = setCoords(tempTet, tempPos);
      const collided = tempCoords.some(c => {
        return c.z && c.y >= 0 && ((!!tempWell[c.y][c.x]) || (tempWell[c.y][c.x] !== 0))
      });

      if (!collided) {
        data.tetromino = rotateTet(data.tetromino);
        return true;
      }
      return false;
    }

    if (dir === 'down') {
      tempPos.y += 1;
      const tempCoords = setCoords(data.tetromino, tempPos);
      const collided = tempCoords.some(c => (
        c.z && c.y >= 0 && ((!tempWell[c.y]) || (tempWell[c.y][c.x] !== 0))
      ));
      if (data.oldCoords && collided && !isFilled()) {
        data.pos = { x: 3, y: -2 };
        data.newCoords = null;
        data.oldCoords = null;
        data.score += 3 * data.level;
        score.textContent = data.score;
        clearFullRows();
        setNewTetromino();
      }
      if (collided && isFilled()) {
        data.over = true;
      }
      return !collided;
    }

    if (dir === 'left') {
      tempPos.x -= 1;
      const tempCoords = setCoords(data.tetromino, tempPos);
      return !tempCoords.some(c => (
        c.z && (!(tempWell[c.y] && !tempWell[c.y][c.x]) || (tempWell[c.y][c.x] !== 0))
      ));
    }

    if (dir === 'right') {
      tempPos.x += 1;
      const tempCoords = setCoords(data.tetromino, tempPos);
      return !tempCoords.some(c => (
        c.z && (!(tempWell[c.y] && !tempWell[c.y][c.x]) || (tempWell[c.y][c.x] !== 0))
      ));
    }

    return true;
  };

  const move = (dir) => {
    if (dir === 'down') {
      data.pos.y += 1;
    }
    if (dir === 'left') {
      data.pos.x -= 1;
    }
    if (dir === 'right') {
      data.pos.x += 1;
    }
    data.newCoords = setCoords(data.tetromino, data.pos);
    data.oldCoords && removeFromWell(data.oldCoords, data.well);
    placeOnWell(data.newCoords);
    data.oldCoords = data.newCoords;
    renderWell();
  };

  const clearFullRows = () => {
    data.well = data.well.reduce((acc, cur) => {
      if (cur.every(c => c !== 0)) {
        data.line++;
        return [Array(10).fill(0), ...acc]
      }
      return [...acc, cur];
    }, []);

    if ((data.line >= 1) && (data.line <= 90)) {
      data.level = Math.trunc(1 + ((data.line - 1) / 10));
      audio.playbackRate = data.level * 0.1 + 1;
    }
    else if (data.line >= 91) {
      data.level = 10;
    }

    data.delay = ((11 - data.level) * 50);
  };

  const freeFall = () => {
    data.now = Date.now();
    if (data.now - data.before >= data.delay) {
      data.before = data.now;
      canMove('down') && move('down');
    }

    if (audio.currentTime >= 32) {
      audio.currentTime = 0;
    }

    if (data.over) {
      message.style.visibility = 'visible';
      messageText.style.display = 'block';
      audio.pause();
      audio.currentTime = 0;
    } else {
      requestAnimationFrame(freeFall);
    }
  };

  const init = () => {
    data = {
      ...data,
      size: 32,
      score: 0,
      line: 0,
      level: 1,
      oldCoords: null,
      newCoords: null,
      pos: { x: 3, y: -2 },
      well: Array(20).fill(0).map(item => Array(10).fill(0)),
      tetromino: null,
      index: null,
      nextTetromino: null,
      nextIndex: null,
      before: Date.now(),
      now: null,
      delay: 500,
      music: localStorage.getItem('music') !== 'false',
    };

    audio.playbackRate = 1;

    score.textContent = data.score;
    line.textContent = data.line;
    level.textContent = data.level;
    setNewTetromino();
    ctx.canvas.width = data.size * 10;
    ctx.canvas.height = data.size * 20;
    renderWell();
    !data.over && requestAnimationFrame(freeFall);
  };

  window.addEventListener('keydown', (e) => {
    e.preventDefault();
    if (e.code === 'Space') {
      while(canMove('down')) {
        move('down');
      }
    }
    e.code === 'ArrowDown' && canMove('down') && move('down');
    e.code === 'ArrowLeft' && !data.over && canMove('left') && move('left');
    e.code === 'ArrowRight' && !data.over && canMove('right') && move('right');
    e.code === 'ArrowUp' && !data.over && canMove('rotate') && move();

    if (e.code === 'KeyS' && data.over) {
      message.style.visibility = 'hidden';
      data.over = false;
      data.music && audio.play();
      init();
    }

    if (e.code === 'KeyM') {
      data.music && audio.play && audio.pause();
      !data.music && audio.pause && audio.play();
      data.music = !data.music;
      localStorage.setItem('music', data.music);
    }
  });

  init();
})();
