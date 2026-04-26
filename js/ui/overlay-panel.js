/**
 * 浮层面板系统 — 从底部滑出的通用面板容器
 * 替代原有的 tab 切换机制，所有面板以浮层形式呈现
 */
var OverlayPanel = {
  _container: null,
  _backdrop: null,
  _content: null,
  _titleEl: null,
  _isOpen: false,
  _currentId: null,
  _onCloseCallback: null,

  init: function () {
    // Create overlay DOM structure
    this._backdrop = document.createElement('div');
    this._backdrop.id = 'overlay-backdrop';
    this._backdrop.className = 'overlay-backdrop';
    this._backdrop.addEventListener('click', this.close.bind(this));

    this._container = document.createElement('div');
    this._container.id = 'overlay-panel';
    this._container.className = 'overlay-panel';

    // Header with close button
    var header = document.createElement('div');
    header.className = 'overlay-header';

    this._titleEl = document.createElement('h2');
    this._titleEl.className = 'overlay-title';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'overlay-close';
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', this.close.bind(this));

    // Drag handle
    var handle = document.createElement('div');
    handle.className = 'overlay-handle';
    handle.innerHTML = '<span></span>';

    header.appendChild(this._titleEl);
    header.appendChild(closeBtn);

    this._content = document.createElement('div');
    this._content.className = 'overlay-content';

    this._container.appendChild(handle);
    this._container.appendChild(header);
    this._container.appendChild(this._content);

    document.getElementById('app').appendChild(this._backdrop);
    document.getElementById('app').appendChild(this._container);

    // Touch-drag to close
    this._initDragToClose();
  },

  _initDragToClose: function () {
    var startY = 0;
    var currentY = 0;
    var isDragging = false;
    var self = this;
    var handle = this._container.querySelector('.overlay-handle');

    var onStart = function (e) {
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      isDragging = true;
      self._container.style.transition = 'none';
    };

    var onMove = function (e) {
      if (!isDragging) return;
      currentY = (e.touches ? e.touches[0].clientY : e.clientY) - startY;
      if (currentY > 0) {
        self._container.style.transform = 'translateY(' + currentY + 'px)';
      }
    };

    var onEnd = function () {
      if (!isDragging) return;
      isDragging = false;
      self._container.style.transition = '';
      if (currentY > 100) {
        self.close();
      } else {
        self._container.style.transform = '';
      }
      currentY = 0;
    };

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('mousedown', onStart);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchend', onEnd);
    document.addEventListener('mouseup', onEnd);
  },

  /**
   * Show overlay panel
   * @param {Object} opts - { title, content, height, panelId, onClose }
   *   content can be HTML string or DOM element
   *   height: 'auto' | 'half' | 'full' (default: 'half')
   *   panelId: optional, for tracking which panel is open
   */
  show: function (opts) {
    if (!opts) return;

    // Return previous panel to its original parent before replacing content
    if (this._onCloseCallback) {
      this._onCloseCallback();
      this._onCloseCallback = null;
    }

    this._currentId = opts.panelId || null;
    this._onCloseCallback = opts.onClose || null;
    this._titleEl.innerHTML = opts.title || '';

    // Set content
    this._content.innerHTML = '';
    if (typeof opts.content === 'string') {
      this._content.innerHTML = opts.content;
    } else if (opts.content instanceof HTMLElement) {
      this._content.appendChild(opts.content);
    }

    // Height class
    this._container.className = 'overlay-panel';
    var height = opts.height || 'half';
    this._container.classList.add('overlay-' + height);

    // Show
    this._backdrop.classList.add('active');
    this._container.classList.add('active');
    this._container.style.transform = '';
    this._isOpen = true;

    EventBus.emit('overlay:opened', this._currentId);
  },

  /**
   * Show a game panel section (hero, battle, etc.) inside the overlay
   * @param {string} panelId - e.g. 'heroes', 'battle', 'recruit'
   * @param {string} title - Display title
   */
  showPanel: function (panelId, title) {
    var panelEl = document.getElementById('panel-' + panelId);
    if (!panelEl) return;

    // Return previous panel to its original parent before replacing content
    if (this._onCloseCallback) {
      this._onCloseCallback();
      this._onCloseCallback = null;
    }

    // Move panel content into overlay
    this._content.innerHTML = '';
    panelEl.style.display = '';
    this._content.appendChild(panelEl);

    this._titleEl.innerHTML = title || panelId;
    this._currentId = panelId;
    this._onCloseCallback = function () {
      // Return panel to its original parent
      var main = document.getElementById('game-panels');
      if (main && panelEl.parentElement !== main) {
        panelEl.style.display = 'none';
        main.appendChild(panelEl);
      }
    };

    this._container.className = 'overlay-panel overlay-full';
    this._backdrop.classList.add('active');
    this._container.classList.add('active');
    this._container.style.transform = '';
    this._isOpen = true;

    EventBus.emit('overlay:opened', panelId);
    EventBus.emit('tab:switched', panelId);
  },

  close: function () {
    this._backdrop.classList.remove('active');
    this._container.classList.remove('active');
    this._isOpen = false;

    if (this._onCloseCallback) {
      this._onCloseCallback();
      this._onCloseCallback = null;
    }

    var closedId = this._currentId;
    this._currentId = null;
    EventBus.emit('overlay:closed', closedId);
  },

  isOpen: function () {
    return this._isOpen;
  },

  getCurrentId: function () {
    return this._currentId;
  }
};
