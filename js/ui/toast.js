const Toast = {
  _container: null,

  init() {
    this._container = document.createElement('div');
    this._container.id = 'toast-container';
    this._container.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column-reverse;align-items:center;gap:8px;pointer-events:none;';
    document.body.appendChild(this._container);

    EventBus.on('toast:show', (data) => this.show(data.message, data.type));
  },

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');

    const colors = {
      success: { bg: '#2a2018', border: '#5d8a48' },
      warning: { bg: '#2a2018', border: '#c98a2e' },
      error: { bg: '#2a2018', border: '#b33a3a' },
      info: { bg: '#2a2018', border: '#4a7fb5' }
    };
    const color = colors[type] || colors.info;

    toast.style.cssText = `
      background: ${color.bg};
      border: 1px solid ${color.border};
      border-left: 3px solid ${color.border};
      color: #e8dcc8;
      padding: 8px 20px;
      border-radius: 2px;
      font-size: 0.78rem;
      opacity: 0;
      transition: opacity 0.3s, transform 0.3s;
      transform: translateY(20px);
      pointer-events: auto;
      max-width: 340px;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.6);
    `;
    toast.innerHTML = message;

    this._container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};
