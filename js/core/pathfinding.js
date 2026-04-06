/**
 * A* 寻路模块 — 4 方向网格寻路
 */
var Pathfinding = {
  findPath: function (grid, start, end) {
    var rows = grid.length;
    if (rows === 0) return null;
    var cols = grid[0].length;

    if (start.x < 0 || start.x >= cols || start.y < 0 || start.y >= rows) return null;
    if (end.x < 0 || end.x >= cols || end.y < 0 || end.y >= rows) return null;
    if (grid[start.y][start.x]) return null;
    if (grid[end.y][end.x]) return null;
    if (start.x === end.x && start.y === end.y) return [{ x: start.x, y: start.y }];

    var DIRS = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

    var openCount = 0;
    var gScore = new Array(rows * cols);
    var fScore = new Array(rows * cols);
    var cameFrom = new Array(rows * cols);
    var closed = new Uint8Array(rows * cols);

    for (var i = 0; i < rows * cols; i++) {
      gScore[i] = Infinity;
      fScore[i] = Infinity;
      cameFrom[i] = -1;
    }

    var startIdx = start.y * cols + start.x;
    var endIdx = end.y * cols + end.x;

    gScore[startIdx] = 0;
    fScore[startIdx] = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);

    // Binary min-heap on fScore
    var heap = [startIdx];
    openCount = 1;

    var _swap = function (a, b) {
      var t = heap[a]; heap[a] = heap[b]; heap[b] = t;
    };
    var _bubbleUp = function (i) {
      while (i > 0) {
        var p = (i - 1) >> 1;
        if (fScore[heap[i]] < fScore[heap[p]]) { _swap(i, p); i = p; } else break;
      }
    };
    var _sinkDown = function (i) {
      var len = heap.length;
      while (true) {
        var s = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < len && fScore[heap[l]] < fScore[heap[s]]) s = l;
        if (r < len && fScore[heap[r]] < fScore[heap[s]]) s = r;
        if (s !== i) { _swap(i, s); i = s; } else break;
      }
    };
    var _pop = function () {
      var top = heap[0];
      var last = heap.pop();
      if (heap.length > 0) { heap[0] = last; _sinkDown(0); }
      return top;
    };

    while (heap.length > 0) {
      var curIdx = _pop();
      if (curIdx === endIdx) {
        var path = [];
        var ci = endIdx;
        while (ci !== -1) {
          path.push({ x: ci % cols, y: (ci / cols) | 0 });
          ci = cameFrom[ci];
        }
        path.reverse();
        return path;
      }

      if (closed[curIdx]) continue;
      closed[curIdx] = 1;

      var cx = curIdx % cols;
      var cy = (curIdx / cols) | 0;

      for (var d = 0; d < 4; d++) {
        var nx = cx + DIRS[d].dx;
        var ny = cy + DIRS[d].dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        var nIdx = ny * cols + nx;
        if (closed[nIdx] || grid[ny][nx]) continue;

        var ng = gScore[curIdx] + 1;
        if (ng < gScore[nIdx]) {
          cameFrom[nIdx] = curIdx;
          gScore[nIdx] = ng;
          fScore[nIdx] = ng + Math.abs(end.x - nx) + Math.abs(end.y - ny);
          heap.push(nIdx);
          _bubbleUp(heap.length - 1);
        }
      }
    }
    return null;
  },

  checkPathExists: function (grid, x, y, spawnPoints, target) {
    var rows = grid.length;
    if (rows === 0) return false;
    var cols = grid[0].length;
    if (x < 0 || x >= cols || y < 0 || y >= rows) return false;

    // Copy grid and place obstacle
    var testGrid = [];
    for (var r = 0; r < rows; r++) {
      testGrid[r] = [];
      for (var c = 0; c < cols; c++) {
        testGrid[r][c] = grid[r][c];
      }
    }
    testGrid[y][x] = 1;

    for (var i = 0; i < spawnPoints.length; i++) {
      var sp = spawnPoints[i];
      if (sp.x === x && sp.y === y) return false;
      if (this.findPath(testGrid, sp, target) === null) return false;
    }
    return true;
  }
};
