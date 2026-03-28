const Modal = {
  _overlay: null,

  init() {
    this._overlay = document.createElement('div');
    this._overlay.id = 'modal-overlay';
    this._overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9998;display:none;justify-content:center;align-items:center;';
    document.body.appendChild(this._overlay);
  },

  show({ title, content, confirmText = '确认', cancelText = '取消', onConfirm, onCancel, showCancel = true }) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: #16213e;
      border: 1px solid #0f3460;
      border-radius: 12px;
      padding: 20px;
      max-width: 320px;
      width: 85%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.6);
    `;

    modal.innerHTML = `
      <h3 style="color:#f5c518;margin:0 0 12px;font-size:0.95rem;">${title}</h3>
      <div style="color:#eee;font-size:0.78rem;margin-bottom:16px;line-height:1.5;">${content}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        ${showCancel ? `<button class="modal-cancel" style="padding:6px 16px;border-radius:4px;border:1px solid #0f3460;background:#0d1b2a;color:#999;cursor:pointer;font-size:0.75rem;">${cancelText}</button>` : ''}
        <button class="modal-confirm" style="padding:6px 16px;border-radius:4px;border:none;background:#e94560;color:#fff;cursor:pointer;font-size:0.75rem;">${confirmText}</button>
      </div>
    `;

    this._overlay.innerHTML = '';
    this._overlay.appendChild(modal);
    this._overlay.style.display = 'flex';

    const confirmBtn = modal.querySelector('.modal-confirm');
    const cancelBtn = modal.querySelector('.modal-cancel');

    confirmBtn.addEventListener('click', () => {
      this.hide();
      if (onConfirm) onConfirm();
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hide();
        if (onCancel) onCancel();
      });
    }

    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) {
        this.hide();
        if (onCancel) onCancel();
      }
    });
  },

  hide() {
    this._overlay.style.display = 'none';
    this._overlay.innerHTML = '';
  },

  confirm(title, content) {
    return new Promise((resolve) => {
      this.show({
        title, content,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  },

  alert(title, content) {
    return new Promise((resolve) => {
      this.show({
        title, content,
        showCancel: false,
        onConfirm: () => resolve()
      });
    });
  }
};
