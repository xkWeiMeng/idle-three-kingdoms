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
      background: #2a2018;
      border: 2px solid #4a3728;
      border-radius: 4px;
      padding: 20px;
      max-width: 320px;
      width: 85%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.7);
      position: relative;
    `;

    modal.innerHTML = `
      <div style="position:absolute;top:-1px;left:-1px;width:14px;height:14px;border-top:2px solid #d4a849;border-left:2px solid #d4a849;opacity:0.5;pointer-events:none;"></div>
      <div style="position:absolute;bottom:-1px;right:-1px;width:14px;height:14px;border-bottom:2px solid #d4a849;border-right:2px solid #d4a849;opacity:0.5;pointer-events:none;"></div>
      <h3 style="color:#d4a849;margin:0 0 12px;font-size:0.95rem;font-family:'STZhongsong','SimSun','Noto Serif SC',serif;">${title}</h3>
      <div style="color:#e8dcc8;font-size:0.78rem;margin-bottom:16px;line-height:1.5;">${content}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #4a3728;padding-top:12px;">
        ${showCancel ? `<button class="modal-cancel" style="padding:6px 16px;border-radius:2px;border:1px solid #4a3728;background:#120e0a;color:#a09080;cursor:pointer;font-size:0.75rem;">${cancelText}</button>` : ''}
        <button class="modal-confirm" style="padding:6px 16px;border-radius:2px;border:1px solid rgba(232,81,58,0.4);background:linear-gradient(180deg,#d4392b,#a02820);color:#fff;cursor:pointer;font-size:0.75rem;text-shadow:0 1px 2px rgba(0,0,0,0.4);">${confirmText}</button>
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
