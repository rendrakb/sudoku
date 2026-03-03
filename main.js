function solveSudoku(inputBoard, stats) {
  var stats = stats || {};
  stats["easy"] = true;
  var board = JSON.parse(JSON.stringify(inputBoard));
  var possibilities = [[], [], [], [], [], [], [], [], []];

  for (var i = 0; i < 9; i++) {
    for (var j = 0; j < 9; j++) {
      possibilities[i][j] = [
        false,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ];
    }
  }

  var solved = false;
  var impossible = false;
  var mutated = false;
  var needCheckFreedoms = false;

  var loopCount = 0;

  outerLoop: while (!solved && !impossible) {
    solved = true;
    mutated = false;
    loopCount++;

    var leastFree = [];
    var leastRemaining = 9;

    for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
        if (board[i][j] === 0) {
          solved = false;
          var currentPos = possibilities[i][j];

          var zoneRow;
          var zoneCol;

          if (loopCount === 1) {
            zoneRow = getZone(i) * 3;
            zoneCol = getZone(j) * 3;
            currentPos[10] = zoneRow;
            currentPos[11] = zoneCol;
          } else {
            zoneRow = currentPos[10];
            zoneCol = currentPos[11];
          }

          var wasMutated = reducePossibilities(
            board,
            i,
            j,
            currentPos,
            zoneRow,
            zoneCol,
          );

          if (wasMutated) {
            mutated = true;
          }

          var remaining = 0;
          var lastDigit = 0;

          for (var k = 1; k <= 9; k++) {
            if (currentPos[k]) {
              remaining++;
              lastDigit = k;
            }
          }

          if (remaining === 0) {
            impossible = true;
            break outerLoop;
          } else if (remaining === 1) {
            board[i][j] = lastDigit;
            mutated = true;
            continue;
          }

          if (needCheckFreedoms) {
            var solution = checkFreedoms(
              board,
              i,
              j,
              possibilities,
              zoneRow,
              zoneCol,
            );

            if (solution !== 0) {
              board[i][j] = solution;
              mutated = true;
              continue;
            }

            if (remaining === leastRemaining) {
              leastFree.push([i, j]);
            } else if (remaining < leastRemaining) {
              leastRemaining = remaining;
              leastFree = [[i, j]];
            }
          }
        }
      }
    }

    if (mutated === false && solved === false) {
      if (needCheckFreedoms === false) {
        needCheckFreedoms = true;
        stats["medium"] = true;
        continue;
      }

      return solveByGuessing(board, possibilities, leastFree, stats);
    }
  }

  if (impossible) {
    return null;
  } else {
    return board;
  }
}

function getZone(i) {
  if (i < 3) {
    return 0;
  } else if (i < 6) {
    return 1;
  } else {
    return 2;
  }
}

function reducePossibilities(board, row, column, currentPos, zoneRow, zoneCol) {
  var mutated = false;

  for (var k = 0; k < 9; k++) {
    if (currentPos[board[row][k]] || currentPos[board[k][column]]) {
      mutated = true;
    }
    currentPos[board[row][k]] = false;
    currentPos[board[k][column]] = false;
  }

  for (var x = zoneRow; x <= zoneRow + 2; x++) {
    for (var y = zoneCol; y <= zoneCol + 2; y++) {
      var zoneDigit = board[x][y];

      if (currentPos[zoneDigit]) {
        mutated = true;
      }

      currentPos[zoneDigit] = false;
    }
  }

  return mutated;
}

function checkFreedoms(board, i, j, possibilities, zoneRow, zoneCol) {
  var answer = 0;
  var currentPos = possibilities[i][j];

  var uniquePosRow = currentPos.slice(0);
  var uniquePosCol = currentPos.slice(0);
  var uniquePosCube = currentPos.slice(0);

  for (var k = 0; k < 9; k++) {
    for (var l = 1; l <= 9; l++) {
      if (board[i][k] === 0 && possibilities[i][k][l] && k !== j) {
        uniquePosRow[l] = false;
      }
      if (board[k][j] === 0 && possibilities[k][j][l] && k !== i) {
        uniquePosCol[l] = false;
      }
    }
  }

  var remainingRow = 0;
  var remainingCol = 0;
  var lastDigitRow = 0;
  var lastDigitCol = 0;

  for (var k = 1; k <= 9; k++) {
    if (uniquePosRow[k]) {
      remainingRow++;
      lastDigitRow = k;
    }
    if (uniquePosCol[k]) {
      remainingCol++;
      lastDigitCol = k;
    }
  }

  if (remainingRow === 1) {
    answer = lastDigitRow;
    return answer;
  }

  if (remainingCol === 1) {
    answer = lastDigitCol;
    return answer;
  }

  for (var x = zoneRow; x <= zoneRow + 2; x++) {
    for (var y = zoneCol; y <= zoneCol + 2; y++) {
      for (var l = 1; l <= 9; l++) {
        if (
          board[x][y] === 0 &&
          possibilities[x][y][l] &&
          (x !== i || y !== j)
        ) {
          uniquePosCube[l] = false;
        }
      }
    }
  }

  var remainingCube = 0;
  var lastDigitCube = 0;

  for (var k = 1; k <= 9; k++) {
    if (uniquePosCube[k]) {
      remainingCube++;
      lastDigitCube = k;
    }
  }

  if (remainingCube == 1) {
    answer = lastDigitCube;
  }

  return answer;
}

function solveByGuessing(board, possibilities, leastFree, stats) {
  if (leastFree.length < 1) {
    return null;
  }

  if ("hard" in stats) {
    stats["vhard"] = true;
  } else {
    stats["hard"] = true;
  }

  var randIndex = getRandom(leastFree.length);
  var randSpot = leastFree[randIndex];

  var guesses = [];
  var currentPos = possibilities[randSpot[0]][randSpot[1]];

  for (var i = 1; i <= 9; i++) {
    if (currentPos[i]) {
      guesses.push(i);
    }
  }

  shuffleArray(guesses);

  for (var i = 0; i < guesses.length; i++) {
    board[randSpot[0]][randSpot[1]] = guesses[i];
    var result = solveSudoku(board, stats);
    if (result != null) {
      return result;
    }
  }

  return null;
}

function getRandom(limit) {
  return Math.floor(Math.random() * limit);
}

function shuffleArray(array) {
  var i = array.length;

  if (i !== 0) {
    while (--i) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }
}

function generatePuzzle(difficulty) {
  if (
    difficulty !== 1 &&
    difficulty !== 2 &&
    difficulty !== 3 &&
    difficulty !== 4 &&
    difficulty !== 5
  ) {
    difficulty = 1;
  }

  var solvedPuzzle = solveSudoku(emptyPuzzle);

  var indexes = new Array(81);

  for (var i = 0; i < 81; i++) {
    indexes[i] = i;
  }

  shuffleArray(indexes);

  var knownCount = 81;

  for (var i = 0; i < 81; i++) {
    if (knownCount <= 25) {
      break;
    }

    if (difficulty == 1 && knownCount <= 35) {
      break;
    }

    var index = indexes[i];

    var row = Math.floor(index / 9);
    var col = index % 9;
    var currentValue = solvedPuzzle[row][col];
    var state = {};
    solvedPuzzle[row][col] = 0;
    solveSudoku(solvedPuzzle, state);

    var undo = false;
    if (difficulty <= 2 && state.medium) {
      undo = true;
    } else if (difficulty <= 3 && state.hard) {
      undo = true;
    } else if (difficulty <= 4 && state.vhard) {
      undo = true;
    }

    if (undo) {
      solvedPuzzle[row][col] = currentValue;
    } else {
      knownCount--;
    }
  }

  return solvedPuzzle;
}

function verifySolution(board, onlyFullySolved) {
  var resp = {};
  resp["valid"] = false;

  if (board === null) {
    resp["invalidBoard"] = "Board was null";
    return resp;
  }

  var rows = [];
  var cols = [];
  var cubes = [
    [[], [], []],
    [[], [], []],
    [[], [], []],
  ];
  for (var i = 0; i < 9; i++) {
    rows.push([]);
    cols.push([]);
  }

  for (var i = 0; i < 9; i++) {
    for (var j = 0; j < 9; j++) {
      var digit = board[i][j];

      if (digit === 0) {
        if (onlyFullySolved) {
          resp["notFullySolved"] = "Board still has unknowns";
          return resp;
        } else {
          continue;
        }
      }

      if (digit in rows[i]) {
        resp["badRow"] = i;
        return resp;
      } else {
        rows[i][digit] = true;
      }

      if (digit in cols[j]) {
        resp["badCol"] = j;
        return resp;
      } else {
        cols[j][digit] = true;
      }

      var cube = cubes[getZone(i)][getZone(j)];

      if (digit in cube) {
        resp["badCube"] = [getZone(i) * 3, getZone(j) * 3];
        return resp;
      } else {
        cube[digit] = true;
      }
    }
  }

  resp["valid"] = true;
  return resp;
}

var emptyPuzzle = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

var timerInterval = null;
var timerStart = 0;
var timerElapsed = 0;
var timerRunning = false;
var lastTime = null;
var bestTime = null;

function formatTime(ms) {
  var totalSeconds = Math.floor(ms / 1000);
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = totalSeconds % 60;
  return (
    minutes.toString().padStart(2, "0") +
    ":" +
    seconds.toString().padStart(2, "0")
  );
}

function updateTimeDisplays() {
  var cur = document.getElementById("currentTime");
  if (cur) cur.textContent = formatTime(timerElapsed);
  var lastEl = document.getElementById("lastTime");
  if (lastEl)
    lastEl.textContent =
      "last: " + (lastTime != null ? formatTime(lastTime) : "--:--");
  var bestEl = document.getElementById("bestTime");
  if (bestEl)
    bestEl.textContent =
      "best: " + (bestTime != null ? formatTime(bestTime) : "--:--");
}

function loadStoredTimes() {
  var lt = localStorage.getItem("sudoku_last");
  var bt = localStorage.getItem("sudoku_best");
  if (lt) lastTime = parseInt(lt);
  if (bt) bestTime = parseInt(bt);
  updateTimeDisplays();
}

function storeTimes() {
  if (lastTime != null) localStorage.setItem("sudoku_last", lastTime);
  if (bestTime != null) localStorage.setItem("sudoku_best", bestTime);
}

function startTimer() {
  if (timerRunning) return;
  timerStart = Date.now() - timerElapsed;
  timerInterval = setInterval(function () {
    timerElapsed = Date.now() - timerStart;
    updateTimeDisplays();
  }, 1000);
  timerRunning = true;
  updateTimeDisplays();
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerRunning = false;
  timerElapsed = Date.now() - timerStart;
  lastTime = timerElapsed;
  if (bestTime === null || lastTime < bestTime) {
    bestTime = lastTime;
  }
  updateTimeDisplays();
  storeTimes();
}

function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerRunning = false;
  timerElapsed = 0;
  timerStart = 0;
  updateTimeDisplays();
}

function cellInputHandler(event) {
  if (!this.value.match(/^[1-9]$/)) {
    this.value = "";
  } else {
    if (!timerRunning) {
      startTimer();
    }
  }
}

function renderBoard(board) {
  for (var i = 0; i < 9; i++) {
    for (var j = 0; j < 9; j++) {
      var id = "" + i + j;
      var el = document.getElementById(id);
      var val = board[i][j];
      var child;
      var elClass;

      if (val === 0) {
        child = document.createElement("input");
        child.setAttribute("maxlength", 1);
        child.addEventListener("keyup", cellInputHandler, false);
        child.addEventListener("blur", cellInputHandler, false);
        elClass = "editValue";
      } else {
        child = document.createElement("span");
        child.textContent = val;
        elClass = "staticValue";
      }

      el.innerHTML = "";
      el.setAttribute("class", "cell " + elClass);
      el.appendChild(child);
    }
  }
}

function renderSolvedBoard(board) {
  for (var i = 0; i < 9; i++) {
    for (var j = 0; j < 9; j++) {
      var id = "" + i + j;
      var el = document.getElementById(id);
      var val = board[i][j];
      var child = el.children[0];
      if (child.tagName === "INPUT") {
        child.value = val;
      }
    }
  }
}

function getCurrentBoard() {
  var board = new Array(9);

  for (var i = 0; i < 9; i++) {
    for (var j = 0; j < 9; j++) {
      if (j === 0) {
        board[i] = new Array(9);
      }
      var id = "" + i + j;
      var el = document.getElementById(id);
      var child = el.children[0];
      var value = "0";
      if (child.tagName === "INPUT") {
        value = child.value;
      } else if (child.tagName == "SPAN") {
        value = child.textContent;
      }
      if (value.match(/^[1-9]$/)) {
        value = parseInt(value);
      } else {
        value = 0;
      }
      board[i][j] = value;
    }
  }

  return board;
}

function initialize() {
  loadStoredTimes();

  var currentPuzzle = generatePuzzle();
  renderBoard(currentPuzzle);
  resetTimer();

  var winBlock = document.getElementById("youWon");
  var noErrorsSpan = document.getElementById("noErrors");
  var errorsFoundSpan = document.getElementById("errorsFound");
  var difficulty = document.getElementById("difficulty");
  var currentErrors = [];

  var clearErrors = function () {
    errorsFoundSpan.style.display = "none";
    noErrorsSpan.style.display = "none";

    for (var i = 0; i < currentErrors.length; i++) {
      currentErrors[i].setAttribute(
        "class",
        currentErrors[i].getAttribute("class").replace(" error", ""),
      );
    }
    currentErrors = [];
  };

  document.getElementById("checkButton").addEventListener(
    "click",
    function () {
      clearErrors();

      var board = getCurrentBoard();
      var result = verifySolution(board);
      if (result["valid"]) {
        var validMessages = [
          "KEEP GOING",
          "AWESOME",
          "EXCELLENT",
          "NICE",
          "SWEET",
          "GOOD"
        ];

        if (verifySolution(board, true)["valid"]) {
          winBlock.style.display = "block";
          stopTimer();
        } else {
          noErrorsSpan.textContent =
            validMessages[getRandom(validMessages.length)];
          noErrorsSpan.style.display = "block";
        }
      } else {
        if ("badRow" in result) {
          var row = result["badRow"];
          for (var i = 0; i < 9; i++) {
            var el = document.getElementById("" + row + i);
            el.setAttribute("class", el.getAttribute("class") + " error");
            currentErrors.push(el);
          }
        } else if ("badCol" in result) {
          var col = result["badCol"];
          for (var i = 0; i < 9; i++) {
            var el = document.getElementById("" + i + col);
            el.setAttribute("class", el.getAttribute("class") + " error");
            currentErrors.push(el);
          }
        } else if ("badCube" in result) {
          var cubeRow = result["badCube"][0];
          var cubeCol = result["badCube"][1];
          for (var x = cubeRow + 2; x >= cubeRow; x--) {
            for (var y = cubeCol + 2; y >= cubeCol; y--) {
              var el = document.getElementById("" + x + y);
              el.setAttribute("class", el.getAttribute("class") + " error");
              currentErrors.push(el);
            }
          }
        }
        errorsFoundSpan.style.display = "block";
      }
    },
    false,
  );

  document.getElementById("winCloseButton").addEventListener(
    "click",
    function () {
      winBlock.style.display = "none";
    },
    false,
  );

  document.getElementById("winNewGameButton").addEventListener(
    "click",
    function () {
      clearErrors();
      currentPuzzle = generatePuzzle(
        parseInt(difficulty.options[difficulty.selectedIndex].value),
      );
      renderBoard(currentPuzzle);
      resetTimer();
      winBlock.style.display = "none";
    },
    false,
  );

  document.getElementById("newGameButton").addEventListener(
    "click",
    function () {
      clearErrors();
      currentPuzzle = generatePuzzle(
        parseInt(difficulty.options[difficulty.selectedIndex].value),
      );
      renderBoard(currentPuzzle);
      resetTimer();
    },
    false,
  );

  document.getElementById("solveButton").addEventListener(
    "click",
    function () {
      clearErrors();
      resetTimer();
      renderSolvedBoard(solveSudoku(currentPuzzle));
    },
    false,
  );

  addEventListener(
    "mouseup",
    function (event) {
      if (event.which === 1) {
        noErrorsSpan.style.display = "none";
      }
    },
    false,
  );
}

addEventListener("DOMContentLoaded", initialize, false);
