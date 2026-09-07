/**
 * A* Maze Pathfinder - Interactive Visualizer & Lab Suite
 * Fully featured client-side engine for pathfinding simulation.
 */

// --- Audio Synthesizer for Audio Feedback ---
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playExplore(freq = 440) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(Math.min(800, Math.max(200, freq)), this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      // Audio not permitted or interrupted
    }
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.25);
        } catch (e) {}
      }, idx * 70);
    });
  }

  playFail() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }
}

// --- Main Application State ---
class MazeApp {
  constructor() {
    this.dimension = 15;
    this.grid = []; // 2D array: 0, 1, 'S', 'G'
    this.startPos = [0, 0];
    this.goalPos = [14, 14];
    this.currentTool = 'wall'; // 'wall', 'erase', 'start', 'goal'
    this.heuristic = 'manhattan';
    
    this.isMouseDown = false;
    this.isRunning = false;
    this.isPaused = false;
    this.animationTimer = null;
    this.generator = null;

    // Node computation data cache
    this.cellData = {}; // key: "r,c" -> { g, h, f, state, parent }

    // Sound effects
    this.sound = new SoundEffects();

    this.initDOM();
    this.initGrid(this.dimension);
    this.loadLab6x6Preset(); // Default to lab preset or standard
    this.attachEvents();
  }

  initDOM() {
    this.gridContainer = document.getElementById('maze-grid');
    this.toolButtons = document.querySelectorAll('.tool-btn');
    this.presetLabBtn = document.getElementById('preset-lab');
    this.presetTrapBtn = document.getElementById('preset-trap');
    this.presetSpiralBtn = document.getElementById('preset-spiral');
    this.presetRandomBtn = document.getElementById('preset-random');

    this.selectGridSize = document.getElementById('select-grid-size');
    this.selectHeuristic = document.getElementById('select-heuristic');
    this.speedSlider = document.getElementById('speed-slider');
    this.speedLabel = document.getElementById('speed-label');

    this.btnStart = document.getElementById('btn-start-search');
    this.btnStartLabel = document.getElementById('btn-start-label');
    this.btnStep = document.getElementById('btn-step-search');
    this.btnClearPath = document.getElementById('btn-clear-path');
    this.btnResetMaze = document.getElementById('btn-reset-maze');

    this.statStatus = document.getElementById('stat-status');
    this.statPathLength = document.getElementById('stat-path-length');
    this.statVisited = document.getElementById('stat-visited-count');
    this.statFrontier = document.getElementById('stat-frontier-count');
    this.statTime = document.getElementById('stat-execution-time');

    this.terminalOutput = document.getElementById('terminal-output');
    this.btnCopyAscii = document.getElementById('btn-copy-ascii');

    this.btnSoundToggle = document.getElementById('btn-sound-toggle');
    this.soundIcon = document.getElementById('sound-icon');

    // Modals
    this.modalLab = document.getElementById('modal-lab');
    this.btnOpenLab = document.getElementById('btn-open-lab-modal');
    this.btnCloseLab = document.getElementById('btn-close-lab-modal');
    this.btnCloseLabFooter = document.getElementById('btn-close-modal-footer');

    this.modalExport = document.getElementById('modal-export');
    this.btnOpenExport = document.getElementById('btn-export-python');
    this.btnCloseExport = document.getElementById('btn-close-export-modal');
    this.exportCodeDisplay = document.getElementById('export-code-display');
    this.btnCopyPyCode = document.getElementById('btn-copy-py-code');
    this.btnDownloadPy = document.getElementById('btn-download-py-file');

    // Tooltip
    this.inspector = document.getElementById('cell-inspector');
    this.inspCoord = document.getElementById('insp-coord');
    this.inspState = document.getElementById('insp-state');
    this.inspG = document.getElementById('insp-g');
    this.inspH = document.getElementById('insp-h');
    this.inspF = document.getElementById('insp-f');

    // Toast
    this.toast = document.getElementById('toast');
  }

  showToast(msg) {
    if (!this.toast) return;
    this.toast.textContent = msg;
    this.toast.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.classList.add('hidden');
    }, 2400);
  }

  initGrid(dim) {
    this.dimension = dim;
    this.stopAnimation();
    this.grid = [];
    this.cellData = {};

    this.startPos = [0, 0];
    this.goalPos = [dim - 1, dim - 1];

    for (let r = 0; r < dim; r++) {
      const row = [];
      for (let c = 0; c < dim; c++) {
        if (r === this.startPos[0] && c === this.startPos[1]) {
          row.push('S');
        } else if (r === this.goalPos[0] && c === this.goalPos[1]) {
          row.push('G');
        } else {
          row.push(0);
        }
      }
      this.grid.push(row);
    }

    this.renderGrid();
    this.updateStatus('Ready', 'status-ready');
    this.resetMetrics();
    this.updateTerminalPreview();
  }

  renderGrid() {
    this.gridContainer.innerHTML = '';
    this.gridContainer.className = `maze-grid-matrix grid-dim-${this.dimension}`;
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.dimension}, 1fr)`;

    for (let r = 0; r < this.dimension; r++) {
      for (let c = 0; c < this.dimension; c++) {
        const cell = document.createElement('div');
        cell.className = 'maze-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.id = `cell-${r}-${c}`;

        const val = this.grid[r][c];
        if (val === 'S') {
          cell.classList.add('cell-start');
          cell.textContent = 'S';
        } else if (val === 'G') {
          cell.classList.add('cell-goal');
          cell.textContent = 'G';
        } else if (val === 1) {
          cell.classList.add('cell-wall');
        }

        this.gridContainer.appendChild(cell);
      }
    }
  }

  attachEvents() {
    // Tool buttons
    this.toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
      });
    });

    // Grid interaction (mouse & touch drag)
    this.gridContainer.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      const cell = e.target.closest('.maze-cell');
      if (cell) {
        this.applyToolToCell(parseInt(cell.dataset.r), parseInt(cell.dataset.c));
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    this.gridContainer.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('.maze-cell');
      if (cell) {
        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);

        if (this.isMouseDown) {
          this.applyToolToCell(r, c);
        }
        this.showInspector(r, c, e);
      }
    });

    this.gridContainer.addEventListener('mouseleave', () => {
      this.hideInspector();
    });

    // Dimension selector
    this.selectGridSize.addEventListener('change', (e) => {
      const dim = parseInt(e.target.value);
      this.initGrid(dim);
    });

    // Heuristic selector
    this.selectHeuristic.addEventListener('change', (e) => {
      this.heuristic = e.target.value;
      this.showToast(`Heuristic updated to ${e.target.options[e.target.selectedIndex].text.split(':')[0]}`);
    });

    // Speed slider
    this.speedSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      let ms = Math.max(2, 100 - val);
      if (val === 100) ms = 0;
      this.speedLabel.textContent = ms === 0 ? 'Instant (0ms)' : `${ms} ms`;
    });

    // Presets
    this.presetLabBtn.addEventListener('click', () => this.loadLab6x6Preset());
    this.presetTrapBtn.addEventListener('click', () => this.loadTrapPreset());
    this.presetSpiralBtn.addEventListener('click', () => this.loadSpiralPreset());
    this.presetRandomBtn.addEventListener('click', () => this.loadRandomPreset());

    // Controls
    this.btnStart.addEventListener('click', () => this.toggleSearch());
    this.btnStep.addEventListener('click', () => this.stepSearch());
    this.btnClearPath.addEventListener('click', () => this.clearPathAndVisited());
    this.btnResetMaze.addEventListener('click', () => this.resetGridWalls());

    // Sound
    this.btnSoundToggle.addEventListener('click', () => {
      this.sound.enabled = !this.sound.enabled;
      this.soundIcon.textContent = this.sound.enabled ? '🔊' : '🔇';
      this.showToast(this.sound.enabled ? 'Sound Effects Enabled' : 'Sound Effects Muted');
    });

    // Modals
    this.btnOpenLab.addEventListener('click', () => this.modalLab.classList.remove('hidden'));
    this.btnCloseLab.addEventListener('click', () => this.modalLab.classList.add('hidden'));
    this.btnCloseLabFooter.addEventListener('click', () => this.modalLab.classList.add('hidden'));

    this.btnOpenExport.addEventListener('click', () => {
      this.exportCodeDisplay.textContent = this.generatePythonCode();
      this.modalExport.classList.remove('hidden');
    });
    this.btnCloseExport.addEventListener('click', () => this.modalExport.classList.add('hidden'));

    this.btnCopyPyCode.addEventListener('click', () => {
      navigator.clipboard.writeText(this.generatePythonCode()).then(() => {
        this.showToast('Python code copied to clipboard!');
      });
    });

    this.btnDownloadPy.addEventListener('click', () => {
      const code = this.generatePythonCode();
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'maze_astar_custom.py';
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('Downloaded maze_astar_custom.py');
    });

    this.btnCopyAscii.addEventListener('click', () => {
      navigator.clipboard.writeText(this.terminalOutput.textContent).then(() => {
        this.showToast('Terminal ASCII output copied!');
      });
    });

    // Close modals on clicking backdrop
    [this.modalLab, this.modalExport].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    });
  }

  applyToolToCell(r, c) {
    if (this.isRunning) return;

    this.clearPathAndVisited();
    const cell = document.getElementById(`cell-${r}-${c}`);
    if (!cell) return;

    if (this.currentTool === 'start') {
      if (r === this.goalPos[0] && c === this.goalPos[1]) return;
      // remove old start
      const oldCell = document.getElementById(`cell-${this.startPos[0]}-${this.startPos[1]}`);
      if (oldCell) {
        oldCell.classList.remove('cell-start');
        oldCell.textContent = '';
      }
      this.grid[this.startPos[0]][this.startPos[1]] = 0;

      // set new start
      this.startPos = [r, c];
      this.grid[r][c] = 'S';
      cell.className = 'maze-cell cell-start';
      cell.textContent = 'S';
    } else if (this.currentTool === 'goal') {
      if (r === this.startPos[0] && c === this.startPos[1]) return;
      // remove old goal
      const oldCell = document.getElementById(`cell-${this.goalPos[0]}-${this.goalPos[1]}`);
      if (oldCell) {
        oldCell.classList.remove('cell-goal');
        oldCell.textContent = '';
      }
      this.grid[this.goalPos[0]][this.goalPos[1]] = 0;

      // set new goal
      this.goalPos = [r, c];
      this.grid[r][c] = 'G';
      cell.className = 'maze-cell cell-goal';
      cell.textContent = 'G';
    } else if (this.currentTool === 'wall') {
      if ((r === this.startPos[0] && c === this.startPos[1]) || (r === this.goalPos[0] && c === this.goalPos[1])) return;
      this.grid[r][c] = 1;
      cell.className = 'maze-cell cell-wall';
      cell.textContent = '';
    } else if (this.currentTool === 'erase') {
      if ((r === this.startPos[0] && c === this.startPos[1]) || (r === this.goalPos[0] && c === this.goalPos[1])) return;
      this.grid[r][c] = 0;
      cell.className = 'maze-cell';
      cell.textContent = '';
    }

    this.updateTerminalPreview();
  }

  // --- Presets ---
  loadLab6x6Preset() {
    this.selectGridSize.value = "6";
    this.dimension = 6;
    this.stopAnimation();

    const sample = [
      ['S',  0,   1,   0,   0,   0 ],
      [ 0,   0,   1,   0,   1,   0 ],
      [ 0,   1,   0,   0,   1,   0 ],
      [ 0,   1,   0,   1,   1,   0 ],
      [ 0,   0,   0,   0,   1,   0 ],
      [ 1,   1,   1,   0,   0,  'G']
    ];

    this.grid = sample.map(row => [...row]);
    this.startPos = [0, 0];
    this.goalPos = [5, 5];
    this.renderGrid();
    this.updateStatus('Loaded Lab 6x6 Default Maze', 'status-ready');
    this.resetMetrics();
    this.updateTerminalPreview();
  }

  loadTrapPreset() {
    this.selectGridSize.value = "10";
    this.dimension = 10;
    this.stopAnimation();
    this.initGrid(10);

    // Create a dead-end trap where straight line is blocked
    for (let r = 0; r < 8; r++) {
      this.grid[r][5] = 1;
    }
    for (let c = 2; c <= 5; c++) {
      this.grid[7][c] = 1;
    }
    this.renderGrid();
    this.updateStatus('Loaded Dead-End Trap Maze', 'status-ready');
    this.updateTerminalPreview();
  }

  loadSpiralPreset() {
    this.selectGridSize.value = "15";
    this.dimension = 15;
    this.stopAnimation();
    this.initGrid(15);

    // Generate spiral walls
    for (let c = 2; c < 13; c++) this.grid[2][c] = 1;
    for (let r = 2; r < 13; r++) this.grid[r][12] = 1;
    for (let c = 4; c < 13; c++) this.grid[12][c] = 1;
    for (let r = 4; r < 13; r++) this.grid[r][4] = 1;
    for (let c = 4; c < 11; c++) this.grid[4][c] = 1;
    for (let r = 4; r < 11; r++) this.grid[r][10] = 1;
    for (let c = 6; c < 11; c++) this.grid[10][c] = 1;
    for (let r = 6; r < 11; r++) this.grid[r][6] = 1;

    this.renderGrid();
    this.updateStatus('Loaded Spiral Maze', 'status-ready');
    this.updateTerminalPreview();
  }

  loadRandomPreset() {
    this.stopAnimation();
    this.clearPathAndVisited();
    for (let r = 0; r < this.dimension; r++) {
      for (let c = 0; c < this.dimension; c++) {
        if ((r === this.startPos[0] && c === this.startPos[1]) || (r === this.goalPos[0] && c === this.goalPos[1])) continue;
        this.grid[r][c] = Math.random() < 0.28 ? 1 : 0;
      }
    }
    this.renderGrid();
    this.updateStatus('Loaded Random Maze', 'status-ready');
    this.updateTerminalPreview();
  }

  resetGridWalls() {
    this.stopAnimation();
    this.initGrid(this.dimension);
    this.showToast('Grid cleared');
  }

  clearPathAndVisited() {
    this.stopAnimation();
    this.cellData = {};
    for (let r = 0; r < this.dimension; r++) {
      for (let c = 0; c < this.dimension; c++) {
        const cell = document.getElementById(`cell-${r}-${c}`);
        if (!cell) continue;
        cell.classList.remove('cell-open', 'cell-closed', 'cell-path');
        const val = this.grid[r][c];
        if (val === 'S') cell.textContent = 'S';
        else if (val === 'G') cell.textContent = 'G';
        else if (val === 1) cell.textContent = '';
        else cell.textContent = '';
      }
    }
    this.updateStatus('Ready', 'status-ready');
    this.resetMetrics();
    this.updateTerminalPreview();
  }

  // --- Heuristic Math ---
  calcHeuristic(p1, p2) {
    const dx = Math.abs(p1[0] - p2[0]);
    const dy = Math.abs(p1[1] - p2[1]);
    if (this.heuristic === 'euclidean') {
      return parseFloat(Math.sqrt(dx * dx + dy * dy).toFixed(1));
    } else if (this.heuristic === 'chebyshev') {
      return Math.max(dx, dy);
    }
    // Default Manhattan
    return dx + dy;
  }

  // --- A* Algorithm Step Generator ---
  *createAStarGenerator() {
    const start = this.startPos;
    const goal = this.goalPos;
    const rows = this.dimension;
    const cols = this.dimension;

    const startH = this.calcHeuristic(start, goal);
    // Priority queue represented as array: [{ f, g, h, r, c }]
    let openList = [{ f: startH, g: 0, h: startH, r: start[0], c: start[1] }];
    const cameFrom = {}; // "r,c" -> [pr, pc]
    const gScore = {}; // "r,c" -> g
    const closedSet = new Set();

    const startKey = `${start[0]},${start[1]}`;
    gScore[startKey] = 0;

    this.cellData[startKey] = { g: 0, h: startH, f: startH, state: 'start' };

    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let visitedCount = 0;

    while (openList.length > 0) {
      // Find node with minimum f, tie break with minimum h
      let minIdx = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[minIdx].f || 
           (openList[i].f === openList[minIdx].f && openList[i].h < openList[minIdx].h)) {
          minIdx = i;
        }
      }

      const current = openList.splice(minIdx, 1)[0];
      const curKey = `${current.r},${current.c}`;

      // Goal Check!
      if (current.r === goal[0] && current.c === goal[1]) {
        // Reconstruct path
        const path = [];
        let curr = [current.r, current.c];
        while (curr) {
          path.push(curr);
          const k = `${curr[0]},${curr[1]}`;
          curr = cameFrom[k];
        }
        path.reverse();

        yield {
          type: 'GOAL_FOUND',
          path,
          visitedCount,
          frontierCount: openList.length,
          current
        };
        return;
      }

      closedSet.add(curKey);
      visitedCount++;

      this.cellData[curKey] = {
        g: current.g,
        h: current.h,
        f: current.f,
        state: (current.r === start[0] && current.c === start[1]) ? 'start' : 'closed'
      };

      yield {
        type: 'VISIT_NODE',
        node: current,
        visitedCount,
        frontierCount: openList.length
      };

      // Explore neighbors
      for (const [dr, dc] of directions) {
        const nr = current.r + dr;
        const nc = current.c + dc;
        const nKey = `${nr},${nc}`;

        // Bounds check
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        // Wall check
        if (this.grid[nr][nc] === 1) continue;
        // Closed set check
        if (closedSet.has(nKey)) continue;

        const tentativeG = current.g + 1;

        if (gScore[nKey] === undefined || tentativeG < gScore[nKey]) {
          cameFrom[nKey] = [current.r, current.c];
          gScore[nKey] = tentativeG;
          const h = this.calcHeuristic([nr, nc], goal);
          const f = tentativeG + h;

          this.cellData[nKey] = {
            g: tentativeG,
            h,
            f,
            state: (nr === goal[0] && nc === goal[1]) ? 'goal' : 'open'
          };

          // If not in open list, add it; otherwise update
          const existing = openList.find(n => n.r === nr && n.c === nc);
          if (!existing) {
            openList.push({ f, g: tentativeG, h, r: nr, c: nc });
          } else {
            existing.f = f;
            existing.g = tentativeG;
            existing.h = h;
          }

          yield {
            type: 'UPDATE_FRONTIER',
            node: { r: nr, c: nc, g: tentativeG, h, f },
            frontierCount: openList.length
          };
        }
      }
    }

    // No path found
    yield {
      type: 'NO_PATH',
      visitedCount,
      frontierCount: 0
    };
  }

  // --- Animation and Runner Controller ---
  toggleSearch() {
    if (this.isRunning) {
      this.pauseSearch();
    } else {
      this.startSearch();
    }
  }

  startSearch() {
    this.clearPathAndVisited();
    this.isRunning = true;
    this.isPaused = false;
    this.btnStartLabel.textContent = 'Pause';
    this.updateStatus('Searching for shortest path...', 'status-searching');

    this.startTime = performance.now();
    this.generator = this.createAStarGenerator();
    this.runLoop();
  }

  pauseSearch() {
    this.isRunning = false;
    this.isPaused = true;
    this.btnStartLabel.textContent = 'Resume';
    this.stopAnimation();
    this.updateStatus('Paused', 'status-ready');
  }

  stopAnimation() {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }
    this.isRunning = false;
    this.btnStartLabel.textContent = 'Find Path';
  }

  stepSearch() {
    if (!this.generator || !this.isPaused) {
      this.clearPathAndVisited();
      this.startTime = performance.now();
      this.generator = this.createAStarGenerator();
      this.isPaused = true;
    }

    const next = this.generator.next();
    if (!next.done) {
      this.processStep(next.value);
    } else {
      this.generator = null;
      this.isPaused = false;
    }
  }

  runLoop() {
    if (!this.isRunning) return;

    const speedVal = parseInt(this.speedSlider.value);
    const delay = speedVal === 100 ? 0 : Math.max(2, 100 - speedVal);

    if (delay === 0) {
      // Instant execution: run till finished
      let step = this.generator.next();
      while (!step.done) {
        this.processStep(step.value);
        if (step.value.type === 'GOAL_FOUND' || step.value.type === 'NO_PATH') break;
        step = this.generator.next();
      }
      return;
    }

    const step = this.generator.next();
    if (!step.done) {
      this.processStep(step.value);
      if (step.value.type === 'GOAL_FOUND' || step.value.type === 'NO_PATH') {
        this.stopAnimation();
        return;
      }
      this.animationTimer = setTimeout(() => this.runLoop(), delay);
    } else {
      this.stopAnimation();
    }
  }

  processStep(data) {
    if (!data) return;

    if (data.visitedCount !== undefined) {
      this.statVisited.textContent = data.visitedCount;
    }
    if (data.frontierCount !== undefined) {
      this.statFrontier.textContent = data.frontierCount;
    }

    if (data.type === 'VISIT_NODE') {
      const { r, c } = data.node;
      if (!(r === this.startPos[0] && c === this.startPos[1]) && 
          !(r === this.goalPos[0] && c === this.goalPos[1])) {
        const cell = document.getElementById(`cell-${r}-${c}`);
        if (cell) {
          cell.classList.remove('cell-open');
          cell.classList.add('cell-closed');
        }
      }
      this.sound.playExplore(300 + (r + c) * 20);
    } else if (data.type === 'UPDATE_FRONTIER') {
      const { r, c } = data.node;
      if (!(r === this.startPos[0] && c === this.startPos[1]) && 
          !(r === this.goalPos[0] && c === this.goalPos[1])) {
        const cell = document.getElementById(`cell-${r}-${c}`);
        if (cell && !cell.classList.contains('cell-closed')) {
          cell.classList.add('cell-open');
        }
      }
    } else if (data.type === 'GOAL_FOUND') {
      this.stopAnimation();
      const elapsed = Math.round(performance.now() - this.startTime);
      this.statTime.textContent = `${elapsed} ms`;
      this.statPathLength.textContent = `${data.path.length - 1} steps`;
      this.updateStatus('Shortest Path Found!', 'status-found');

      // Draw Path
      data.path.forEach(([r, c], idx) => {
        const cell = document.getElementById(`cell-${r}-${c}`);
        if (cell) {
          if (!(r === this.startPos[0] && c === this.startPos[1]) && 
              !(r === this.goalPos[0] && c === this.goalPos[1])) {
            cell.classList.remove('cell-open', 'cell-closed');
            cell.classList.add('cell-path');
            cell.textContent = '*';
          }
        }
      });

      this.sound.playSuccess();
      this.updateTerminalPreview(data.path);
    } else if (data.type === 'NO_PATH') {
      this.stopAnimation();
      const elapsed = Math.round(performance.now() - this.startTime);
      this.statTime.textContent = `${elapsed} ms`;
      this.statPathLength.textContent = 'None';
      this.updateStatus('No Path Found!', 'status-failed');
      this.sound.playFail();
      this.updateTerminalPreview(null, true);
    }
  }

  updateStatus(msg, className) {
    this.statStatus.textContent = msg;
    this.statStatus.className = `metric-value ${className}`;
  }

  resetMetrics() {
    this.statPathLength.textContent = '--';
    this.statVisited.textContent = '0';
    this.statFrontier.textContent = '0';
    this.statTime.textContent = '0 ms';
  }

  // --- Inspector Tooltip ---
  showInspector(r, c, event) {
    const key = `${r},${c}`;
    const data = this.cellData[key];
    const isStart = r === this.startPos[0] && c === this.startPos[1];
    const isGoal = r === this.goalPos[0] && c === this.goalPos[1];
    const isWall = this.grid[r][c] === 1;

    this.inspCoord.textContent = `Cell (${r}, ${c})`;

    let stateLabel = 'Open Path (0)';
    if (isStart) stateLabel = 'Start (S)';
    else if (isGoal) stateLabel = 'Goal (G)';
    else if (isWall) stateLabel = 'Wall (1)';
    else if (data?.state === 'path') stateLabel = 'Shortest Path (*)';
    else if (data?.state === 'closed') stateLabel = 'Evaluated (Closed)';
    else if (data?.state === 'open') stateLabel = 'Frontier (Open)';

    this.inspState.textContent = stateLabel;

    if (data && !isWall) {
      this.inspG.textContent = data.g !== undefined ? data.g : '--';
      this.inspH.textContent = data.h !== undefined ? data.h : '--';
      this.inspF.textContent = data.f !== undefined ? data.f : '--';
    } else {
      const hEst = this.calcHeuristic([r, c], this.goalPos);
      this.inspG.textContent = isWall ? 'N/A (Wall)' : 'Unvisited';
      this.inspH.textContent = isWall ? 'N/A' : `${hEst}`;
      this.inspF.textContent = '--';
    }

    // Position tooltip near cursor within grid stage
    const stageRect = this.gridContainer.parentElement.getBoundingClientRect();
    let left = event.clientX - stageRect.left + 15;
    let top = event.clientY - stageRect.top + 15;

    // Boundary adjust
    if (left + 190 > stageRect.width) left = left - 210;
    if (top + 130 > stageRect.height) top = top - 140;

    this.inspector.style.left = `${Math.max(10, left)}px`;
    this.inspector.style.top = `${Math.max(10, top)}px`;
    this.inspector.classList.remove('hidden');
  }

  hideInspector() {
    this.inspector.classList.add('hidden');
  }

  // --- Terminal Simulation ASCII Output ---
  updateTerminalPreview(path = null, failed = false) {
    let out = "=====================================================\n";
    out += "  MAZE PATHFINDER USING A* HEURISTIC SEARCH (LAB)   \n";
    out += "=====================================================\n\n";

    out += "Initial Maze\n";
    out += "-".repeat(this.dimension * 2 + 3) + "\n";
    for (let r = 0; r < this.dimension; r++) {
      out += "  " + this.grid[r].map(c => (c === 0 ? '0' : c === 1 ? '1' : c)).join(" ") + "\n";
    }
    out += "-".repeat(this.dimension * 2 + 3) + "\n";

    if (path) {
      out += `\n[+] Shortest path found! Total steps: ${path.length - 1}\n`;
      out += `[+] Path coordinates: ${JSON.stringify(path)}\n\n`;

      const solved = this.grid.map(row => [...row]);
      path.forEach(([r, c]) => {
        if (solved[r][c] !== 'S' && solved[r][c] !== 'G') {
          solved[r][c] = '*';
        }
      });

      out += "Solved Maze (Path marked with '*')\n";
      out += "-".repeat(this.dimension * 2 + 3) + "\n";
      for (let r = 0; r < this.dimension; r++) {
        out += "  " + solved[r].join(" ") + "\n";
      }
      out += "-".repeat(this.dimension * 2 + 3) + "\n";
    } else if (failed) {
      out += "\n[-] No path found.\n";
    }

    this.terminalOutput.textContent = out;
  }

  // --- Python Code Generator for Export ---
  generatePythonCode() {
    const formattedMaze = JSON.stringify(this.grid, null, 4)
      .replace(/"S"/g, "'S'")
      .replace(/"G"/g, "'G'");

    return `"""
=============================================================================
Project Title: Maze Pathfinder using A* Heuristic Search Algorithm
Generated from Interactive Web Visualizer Suite
=============================================================================
"""

import heapq

def manhattan_distance(point1, point2):
    """Calculates Manhattan Distance: h(n) = |x1 - x2| + |y1 - y2|"""
    return abs(point1[0] - point2[0]) + abs(point1[1] - point2[1])

def print_maze(maze, title="Maze:"):
    print(f"\\n{title}")
    print("-" * (len(maze[0]) * 2 + 3))
    for row in maze:
        print("  " + " ".join(str(cell) for cell in row))
    print("-" * (len(maze[0]) * 2 + 3))

def find_positions(maze):
    start = None
    goal = None
    for r in range(len(maze)):
        for c in range(len(maze[0])):
            if maze[r][c] == 'S':
                start = (r, c)
            elif maze[r][c] == 'G':
                goal = (r, c)
    return start, goal

def a_star_search(maze):
    start, goal = find_positions(maze)
    if not start or not goal:
        print("Start ('S') or Goal ('G') missing!")
        return None

    rows, cols = len(maze), len(maze[0])
    open_list = []
    heapq.heappush(open_list, (manhattan_distance(start, goal), 0, start))
    came_from = {}
    g_score = {start: 0}
    closed_set = set()
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    while open_list:
        current_f, current_g, current = heapq.heappop(open_list)

        if current == goal:
            path = []
            curr = current
            while curr in came_from:
                path.append(curr)
                curr = came_from[curr]
            path.append(start)
            path.reverse()
            return path

        closed_set.add(current)

        for dr, dc in directions:
            neighbor = (current[0] + dr, current[1] + dc)
            r, c = neighbor
            if 0 <= r < rows and 0 <= c < cols:
                if maze[r][c] == 1 or maze[r][c] == '1' or neighbor in closed_set:
                    continue

                tentative_g = current_g + 1
                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f = tentative_g + manhattan_distance(neighbor, goal)
                    heapq.heappush(open_list, (f, tentative_g, neighbor))

    return None

def solve_maze(maze):
    print_maze(maze, "Initial Maze")
    path = a_star_search(maze)
    if path:
        print(f"[+] Shortest path found! Total steps: {len(path) - 1}")
        print(f"[+] Path coordinates: {path}")
        solved_maze = [row[:] for row in maze]
        for r, c in path:
            if solved_maze[r][c] not in ('S', 'G'):
                solved_maze[r][c] = '*'
        print_maze(solved_maze, "Solved Maze (Path marked with '*')")
    else:
        print("[-] No path found.")

if __name__ == "__main__":
    # Custom Maze from Visualizer (${this.dimension}x${this.dimension})
    custom_maze = ${formattedMaze}

    solve_maze(custom_maze)
`;
  }
}

// Instantiate on load
document.addEventListener('DOMContentLoaded', () => {
  window.mazeApp = new MazeApp();
});
