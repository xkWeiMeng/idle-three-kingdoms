/**
 * 建造队列浮窗 — 右上角折叠/展开的施工状态面板
 */
var BuildQueueWidget = {
  _el: null,
  _expanded: false,
  _dragState: null,

  init: function () {
    this._el = document.getElementById('build-queue-widget');
    if (!this._el) return;

    EventBus.on('town:queue_updated', this._onUpdate.bind(this));
    EventBus.on('town:building_started', this._onUpdate.bind(this));
    EventBus.on('town:building_cancelled', this._onUpdate.bind(this));
    EventBus.on('town:worker_unlocked', this._onUpdate.bind(this));
    EventBus.on('town:building_upgraded', this._onUpdate.bind(this));
    EventBus.on('game:tick', this._onTick.bind(this));

    this._render();
  },

  _onUpdate: function () {
    this._render();
  },

  _onTick: function () {
    if (this._expanded) {
      this._updateTimers();
    } else {
      this._updateCollapsedTimer();
    }
  },

  _render: function () {
    if (!this._el) return;
    if (this._expanded) {
      this._renderExpanded();
    } else {
      this._renderCollapsed();
    }
  },

  _renderCollapsed: function () {
    var workers = TownManager.getWorkerCount();
    var active = TownManager.getActiveBuildCount();
    var queue = TownManager.getBuildQueue();

    var html = '<div class="bqw-collapsed" data-action="expand">';
    html += '<span class="bqw-icon">🔨</span> ';
    html += '<span class="bqw-status">' + active + '/' + workers;
    if (queue.length > 0) html += ' +' + queue.length;
    html += '</span>';

    if (active > 0) {
      // Find the building with earliest end time for progress display
      var earliest = this._getEarliestActiveBuild();
      if (earliest) {
        var progress = TownManager.getBuildingProgress(earliest.id);
        var remain = TownManager.getRemainingBuildTime(earliest.id);
        html += ' <span class="bqw-progress-mini">';
        html += '<span class="bqw-progress-bar-mini"><span class="bqw-progress-fill-mini" style="width:' + Math.round((progress || 0) * 100) + '%"></span></span>';
        html += ' <span class="bqw-time-mini" data-bqw-collapsed-time>' + this._formatTime(remain) + '</span>';
        html += '</span>';
      }
    } else {
      html += ' <span class="bqw-idle">空闲</span>';
    }

    html += '</div>';

    this._el.innerHTML = html;
    this._el.className = 'build-queue-widget build-queue-collapsed';

    var self = this;
    var collapseBtn = this._el.querySelector('[data-action="expand"]');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', function () {
        self._expanded = true;
        self._render();
      });
    }
  },

  _renderExpanded: function () {
    var workers = TownManager.getWorkerCount();
    var active = TownManager.getActiveBuildCount();
    var freeWorkers = workers - active;
    var queue = TownManager.getBuildQueue();

    var html = '<div class="bqw-header">';
    html += '<span class="bqw-title">建造队列</span>';
    html += '<button class="bqw-close" data-action="collapse">🔽 关闭</button>';
    html += '</div>';

    // Active builds section
    html += '<div class="bqw-section">';
    html += '<div class="bqw-section-title">⚡ 施工中</div>';

    var activeBuilds = this._getActiveBuilds();
    if (activeBuilds.length === 0) {
      html += '<div class="bqw-empty">无施工中的建筑</div>';
    } else {
      for (var i = 0; i < activeBuilds.length; i++) {
        var ab = activeBuilds[i];
        var data = BuildingData[ab.id];
        var level = TownManager.getBuildingLevel(ab.id);
        var progress = TownManager.getBuildingProgress(ab.id) || 0;
        var remain = TownManager.getRemainingBuildTime(ab.id);

        html += '<div class="bqw-active-card">';
        html += '<div class="bqw-card-header">';
        html += '<span>' + (data ? data.emoji : '🏗') + ' ' + (data ? data.name : ab.id) + ' Lv.' + level + '→' + (level + 1) + '</span>';
        html += '<button class="bqw-cancel-active" data-cancel-active="' + ab.id + '">取消</button>';
        html += '</div>';
        html += '<div class="bqw-progress-row">';
        html += '<div class="bqw-progress-bar"><div class="bqw-progress-fill" data-progress-id="' + ab.id + '" style="width:' + Math.round(progress * 100) + '%"></div></div>';
        html += '<span class="bqw-time" data-time-id="' + ab.id + '">' + this._formatTime(remain) + '</span>';
        html += '</div>';
        html += '</div>';
      }
    }

    html += '<div class="bqw-workers-info">空闲工人：' + freeWorkers + '/' + workers + '</div>';
    html += '</div>';

    // Queue section
    html += '<div class="bqw-section">';
    html += '<div class="bqw-section-title">📋 等待队列</div>';

    if (queue.length === 0) {
      html += '<div class="bqw-empty bqw-guide">💡 在建筑面板中点击建造可添加到队列</div>';
    } else {
      html += '<div class="bqw-queue-list" data-bqw-queue-list>';
      for (var j = 0; j < queue.length; j++) {
        var qi = queue[j];
        var qdata = BuildingData[qi.buildingId];
        html += '<div class="bqw-queue-item" data-queue-id="' + qi.id + '" draggable="true">';
        html += '<span class="bqw-drag-handle">≡</span>';
        html += '<span class="bqw-queue-name">' + (qdata ? qdata.emoji : '🏗') + ' ' + (qdata ? qdata.name : qi.buildingId) + ' Lv.' + (qi.targetLevel - 1) + '→' + qi.targetLevel + '</span>';
        html += '<button class="bqw-remove-queue" data-remove-queue="' + qi.id + '">✕</button>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    this._el.innerHTML = html;
    this._el.className = 'build-queue-widget build-queue-expanded';

    this._bindExpandedEvents();
  },

  _bindExpandedEvents: function () {
    var self = this;

    // Collapse button
    var closeBtn = this._el.querySelector('[data-action="collapse"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        self._expanded = false;
        self._render();
      });
    }

    // Cancel active build buttons
    this._el.querySelectorAll('[data-cancel-active]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var buildingId = this.getAttribute('data-cancel-active');
        var data = BuildingData[buildingId];
        var bName = data ? data.name : buildingId;
        Modal.show({
          title: '取消施工',
          content: '<p>取消施工将不退还已消耗的资源，确定取消 <b>' + bName + '</b> 的施工吗？</p>',
          confirmText: '确定取消',
          onConfirm: function () {
            TownManager.cancelActiveBuilding(buildingId);
          }
        });
      });
    });

    // Remove queue item buttons
    this._el.querySelectorAll('[data-remove-queue]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var queueItemId = this.getAttribute('data-remove-queue');
        TownManager.cancelQueueItem(queueItemId);
      });
    });

    // Drag and drop for queue reordering
    this._setupDragAndDrop();
  },

  _setupDragAndDrop: function () {
    var self = this;
    var queueList = this._el.querySelector('[data-bqw-queue-list]');
    if (!queueList) return;

    var items = queueList.querySelectorAll('.bqw-queue-item');

    // Mouse drag
    items.forEach(function (item) {
      item.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', this.getAttribute('data-queue-id'));
        this.classList.add('bqw-dragging');
      });
      item.addEventListener('dragend', function () {
        this.classList.remove('bqw-dragging');
      });
    });

    queueList.addEventListener('dragover', function (e) {
      e.preventDefault();
      var afterEl = self._getDragAfterElement(queueList, e.clientY);
      var dragging = queueList.querySelector('.bqw-dragging');
      if (!dragging) return;
      if (afterEl == null) {
        queueList.appendChild(dragging);
      } else {
        queueList.insertBefore(dragging, afterEl);
      }
    });

    queueList.addEventListener('drop', function (e) {
      e.preventDefault();
      var queueItemId = e.dataTransfer.getData('text/plain');
      // Calculate new index from DOM order
      var itemEls = queueList.querySelectorAll('.bqw-queue-item');
      var newIndex = 0;
      for (var i = 0; i < itemEls.length; i++) {
        if (itemEls[i].getAttribute('data-queue-id') === queueItemId) {
          newIndex = i;
          break;
        }
      }
      TownManager.reorderQueue(queueItemId, newIndex);
    });

    // Touch drag
    var touchDragItem = null;
    var touchStartY = 0;
    var touchItemId = null;

    items.forEach(function (item) {
      var handle = item.querySelector('.bqw-drag-handle');
      if (!handle) return;

      handle.addEventListener('touchstart', function (e) {
        e.preventDefault();
        touchDragItem = item;
        touchItemId = item.getAttribute('data-queue-id');
        touchStartY = e.touches[0].clientY;
        item.classList.add('bqw-dragging');
      }, { passive: false });
    });

    document.addEventListener('touchmove', function (e) {
      if (!touchDragItem || !queueList.contains(touchDragItem)) return;
      e.preventDefault();
      var y = e.touches[0].clientY;
      var afterEl = self._getDragAfterElement(queueList, y);
      if (afterEl == null) {
        queueList.appendChild(touchDragItem);
      } else {
        queueList.insertBefore(touchDragItem, afterEl);
      }
    }, { passive: false });

    document.addEventListener('touchend', function () {
      if (!touchDragItem || !touchItemId) return;
      touchDragItem.classList.remove('bqw-dragging');
      var itemEls = queueList.querySelectorAll('.bqw-queue-item');
      var newIndex = 0;
      for (var i = 0; i < itemEls.length; i++) {
        if (itemEls[i].getAttribute('data-queue-id') === touchItemId) {
          newIndex = i;
          break;
        }
      }
      TownManager.reorderQueue(touchItemId, newIndex);
      touchDragItem = null;
      touchItemId = null;
    });
  },

  _getDragAfterElement: function (container, y) {
    var elements = Array.from(container.querySelectorAll('.bqw-queue-item:not(.bqw-dragging)'));
    var closest = null;
    var closestOffset = Number.NEGATIVE_INFINITY;
    for (var i = 0; i < elements.length; i++) {
      var box = elements[i].getBoundingClientRect();
      var offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closestOffset) {
        closestOffset = offset;
        closest = elements[i];
      }
    }
    return closest;
  },

  _updateTimers: function () {
    if (!this._el) return;
    var activeBuilds = this._getActiveBuilds();
    for (var i = 0; i < activeBuilds.length; i++) {
      var ab = activeBuilds[i];
      var progressEl = this._el.querySelector('[data-progress-id="' + ab.id + '"]');
      var timeEl = this._el.querySelector('[data-time-id="' + ab.id + '"]');
      if (progressEl) {
        var progress = TownManager.getBuildingProgress(ab.id) || 0;
        progressEl.style.width = Math.round(progress * 100) + '%';
      }
      if (timeEl) {
        timeEl.textContent = this._formatTime(TownManager.getRemainingBuildTime(ab.id));
      }
    }
    // Update workers info
    var workersInfo = this._el.querySelector('.bqw-workers-info');
    if (workersInfo) {
      var workers = TownManager.getWorkerCount();
      var active = TownManager.getActiveBuildCount();
      workersInfo.textContent = '空闲工人：' + (workers - active) + '/' + workers;
    }
  },

  _updateCollapsedTimer: function () {
    if (!this._el) return;
    var timeEl = this._el.querySelector('[data-bqw-collapsed-time]');
    if (timeEl) {
      var earliest = this._getEarliestActiveBuild();
      if (earliest) {
        timeEl.textContent = this._formatTime(TownManager.getRemainingBuildTime(earliest.id));
      }
    }
    // Also update progress bar
    var fillEl = this._el.querySelector('.bqw-progress-fill-mini');
    if (fillEl) {
      var earliest2 = this._getEarliestActiveBuild();
      if (earliest2) {
        var progress = TownManager.getBuildingProgress(earliest2.id) || 0;
        fillEl.style.width = Math.round(progress * 100) + '%';
      }
    }
  },

  _getActiveBuilds: function () {
    var builds = [];
    var buildings = TownManager._state ? TownManager._state.buildings : {};
    for (var id in buildings) {
      if (buildings.hasOwnProperty(id) && TownManager.isBuilding(id)) {
        builds.push({ id: id, endTime: buildings[id].buildEndTime });
      }
    }
    builds.sort(function (a, b) { return a.endTime - b.endTime; });
    return builds;
  },

  _getEarliestActiveBuild: function () {
    var builds = this._getActiveBuilds();
    return builds.length > 0 ? builds[0] : null;
  },

  _formatTime: function (seconds) {
    if (!seconds || seconds <= 0) return '0s';
    if (seconds < 60) return seconds + 's';
    if (seconds < 3600) return Math.floor(seconds / 60) + ':' + ('0' + (seconds % 60)).slice(-2);
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    return h + ':' + ('0' + m).slice(-2) + ':' + ('0' + (seconds % 60)).slice(-2);
  }
};
