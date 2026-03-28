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
      success: { bg: '#1b5e20', border: '#4caf50' },
      warning: { bg: '#e65100', border: '#ff9800' },
      error: { bg: '#b71c1c', border: '#e94560' },
      info: { bg: '#0d47a1', border: '#2196f3' }
    };
    const color = colors[type] || colors.info;

    toast.style.cssText = `
      background: ${color.bg};
      border: 1px solid ${color.border};
      color: #fff;
      padding: 8px 20px;
      border-radius: 18px;
      font-size: 0.78rem;
      opacity: 0;
      transition: opacity 0.3s, transform 0.3s;
      transform: translateY(20px);
      pointer-events: auto;
      max-width: 340px;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.5);
    `;
    toast.textContent = message;

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
