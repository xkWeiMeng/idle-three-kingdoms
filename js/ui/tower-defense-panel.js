/**
 * 城防塔防面板 — TowerDefensePanel
 *
 * 规范引用：specs/product-specs/tower-defense-system.md (Active v0.3.0)
 * 执行计划：specs/exec-plans/tower-defense-system.md T13-T17
 *
 * 功能：
 * - T13: 防守模式入口按钮 + Canvas 渲染框架
 * - T14: 塔建造工具栏 + 放置交互
 * - T15: 塔信息/升级/出售面板
 * - T16: 科技面板 + 武将面板
 * - T17: 波次结算弹窗 + 新手引导
 */
var TowerDefensePanel = {

  // --- 状态 ---
  _inDefenseMode: false,
  _rafId: null,
  _selectedTowerType: null,  // 放置模式选中的塔类型 id
  _selectedTowerUid: null,   // 已选中的已建塔 uid（显示射程）
  _placementMode: false,
  _defenseBtn: null,         // 城防入口按钮 DOM
  _statusBar: null,          // 顶部状态栏 DOM
  _toolbar: null,            // 底部工具栏 DOM
  _refreshTimer: null,

  // --- 城墙编辑模式状态 ---
  _wallEditMode: false,      // 是否处于城墙编辑模式
  _wallEditTool: 'place',    // 当前工具: 'place' | 'upgrade' | 'remove' | 'move' | 'gate'
  _wallDragging: false,      // 是否正在拖拽放置
  _wallDragPath: [],         // 拖拽路径 [{gx,gy}, ...]
  _wallMovingUid: null,      // 正在移动的墙段 uid

  // 塔类型 emoji 映射
  _towerEmoji: {
    td_arrow_tower: UIIcons.icon('attack'), td_crossbow: UIIcons.icon('battle'), td_catapult: UIIcons.icon('stone'),
    td_beacon: UIIcons.icon('flame'), td_oil_tower: UIIcons.icon('flame'), td_repeater: UIIcons.icon('attack'),
    td_wood_fence: UIIcons.icon('wood'), td_stone_wall: UIIcons.icon('defense'), td_iron_wall: UIIcons.icon('defense'),
    td_wall: UIIcons.icon('defense'), td_gate: UIIcons.icon('build'),
    td_spike: UIIcons.icon('battle'), td_pitfall: UIIcons.icon('battle'), td_oil_pool: UIIcons.icon('flame'), td_trip_rope: UIIcons.icon('battle')
  },

  // 敌人 emoji 映射
  _enemyEmoji: {
    td_militia: UIIcons.icon('battle'), td_spearman: UIIcons.icon('weapon'), td_heavy_infantry: UIIcons.icon('defense'),
    td_cavalry: UIIcons.icon('mount'), td_iron_cavalry: UIIcons.icon('mount'), td_siege_ram: UIIcons.icon('hammer'),
    td_siege_ladder: UIIcons.icon('build'), td_siege_catapult: UIIcons.icon('stone'), td_battering_ram: UIIcons.icon('hammer'),
    td_assassin: UIIcons.icon('weapon'), td_horse_archer: UIIcons.icon('attack'), td_enemy_general: UIIcons.icon('crown')
  },

  // ========== T13: init + 事件注册 ==========

  init: function () {
    var self = this;

    // 创建状态栏和工具栏（初始隐藏）
    this._createStatusBar();
    this._createToolbar();

    // 监听 TD 事件
    EventBus.on('td:unlocked', function () { });
    EventBus.on('td:wave_started', function () { self._updateStatusBar(); self._updateToolbar(); });
    EventBus.on('td:wave_cleared', function (data) { self._onWaveCleared(data); });
    EventBus.on('td:wave_failed', function (data) { self._onWaveFailed(data); });
    EventBus.on('td:tower_built', function () { self._updateToolbar(); });
    EventBus.on('td:tower_upgraded', function () { self._selectedTowerUid = null; });
    EventBus.on('td:tower_sold', function () { self._selectedTowerUid = null; self._updateToolbar(); });
    EventBus.on('td:enemy_killed', function () { self._updateStatusBar(); });
    EventBus.on('td:hero_assigned', function () { self._updateStatusBar(); });

    // Phase 1: 连杀特效
    this._activeKillStreak = null;
    EventBus.on('td:kill_streak', function (data) {
      self._activeKillStreak = {
        text: data.text,
        color: data.color,
        fontSize: data.fontSize,
        elapsed: 0
      };
    });

    // Phase 1: 体力变化
    EventBus.on('td:stamina_changed', function () { self._updateStatusBar(); });

    // 监听 overlay 关闭以刷新
    EventBus.on('overlay:closed', function () {
      if (self._inDefenseMode) self._updateToolbar();
    });
  },

  // ========== 章节选择入口（更多菜单） ==========

  showChapterSelect: function () {
    var unlocked = typeof TowerDefenseManager !== 'undefined' && TowerDefenseManager.isUnlocked();
    if (!unlocked) {
      var thLevel = 0;
      if (typeof TownManager !== 'undefined' && TownManager.getBuildingLevel) {
        thLevel = TownManager.getBuildingLevel('town_hall');
      }
      EventBus.emit('toast:show', { type: 'info', message: '城防解锁条件：通关 第二章第10关 + 城主府 ≥ 3（当前 Lv.' + thLevel + '）' });
      return;
    }

    var chapters = TowerDefenseManager.getChapters();
    var stamina = TowerDefenseManager.getStamina();
    var html = '<div style="padding:8px;">';

    // 体力显示
    html += '<div style="text-align:center;margin-bottom:12px;padding:8px;background:rgba(22,33,62,0.6);border-radius:8px;">';
    html += '<span style="color:var(--color-gold);">⚡ 体力</span>　';
    html += '<span style="font-size:18px;font-weight:bold;color:' + (stamina.current > 0 ? 'var(--color-success)' : 'var(--color-danger)') + ';">';
    html += stamina.current + '</span>';
    html += '<span style="color:var(--color-text-dim);"> / ' + stamina.max + '</span>';
    if (stamina.current >= stamina.max) {
      html += '<span style="color:var(--color-success);font-size:11px;margin-left:8px;">（体力已满）</span>';
    } else if (stamina.nextRecoverSec > 0) {
      var min = Math.floor(stamina.nextRecoverSec / 60);
      var sec = stamina.nextRecoverSec % 60;
      html += '<span style="color:var(--color-text-dim);font-size:11px;margin-left:8px;">（' + min + ':' + (sec < 10 ? '0' : '') + sec + ' 后恢复1点）</span>';
    }
    html += '</div>';

    // 塔防管理按钮行
    html += '<div style="display:flex;gap:8px;margin-bottom:12px;">';
    html += '<button class="btn" style="flex:1;font-size:12px;padding:6px 0;" onclick="TowerDefensePanel._showTowerManagement()">🏗 防御塔管理</button>';
    html += '<button class="btn" style="flex:1;font-size:12px;padding:6px 0;" onclick="TowerDefensePanel._showTechPanel()">🏗 建筑解锁</button>';
    html += '<button class="btn" style="flex:1;font-size:12px;padding:6px 0;" onclick="TowerDefensePanel._showHeroPanel()">⚔ 武将派驻</button>';
    html += '</div>';

    // 章节列表
    for (var c = 0; c < chapters.length; c++) {
      var ch = chapters[c];
      var starsTotal = 0;
      var starsMax = ch.stages.length * 3;
      for (var s = 0; s < ch.stages.length; s++) {
        starsTotal += ch.stages[s].stars;
      }

      html += '<div class="card" style="margin:8px 0;padding:12px;' + (!ch.unlocked ? 'opacity:0.5;' : '') + '">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
      html += '<div>';
      html += '<b style="color:var(--color-gold);font-size:14px;">第' + ch.id + '章: ' + ch.name + '</b>';
      if (ch.description) {
        html += '<div style="font-size:11px;color:var(--color-text-dim);margin-top:2px;">' + ch.description + '</div>';
      }
      html += '</div>';
      html += '<div style="font-size:12px;">';
      if (ch.cleared) {
        html += '<span style="color:var(--color-success);">✅ 已通关</span> ';
      }
      html += '⭐ ' + starsTotal + '/' + starsMax;
      html += '</div>';
      html += '</div>';
      html += '<div style="font-size:12px;color:var(--color-text-dim);margin-bottom:8px;">' + ch.description + '</div>';

      // 关卡列表
      html += '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
      for (var si = 0; si < ch.stages.length; si++) {
        var stage = ch.stages[si];
        var stageKey = ch.id + '_' + stage.stage;
        var canClick = ch.unlocked && stage.unlocked;
        var bgColor = stage.cleared ? 'rgba(76,175,80,0.3)' : (canClick ? 'rgba(22,33,62,0.8)' : 'rgba(30,30,30,0.6)');
        var borderColor = stage.isBoss ? 'var(--color-primary)' : (stage.cleared ? 'var(--color-success)' : '#4a3728');
        var cursor = canClick ? 'cursor:pointer;' : '';

        html += '<div style="text-align:center;min-width:54px;padding:6px 4px;border-radius:6px;border:1px solid ' + borderColor + ';background:' + bgColor + ';' + cursor + '" ';
        if (canClick) {
          html += 'onclick="TowerDefensePanel._onStageClick(' + ch.id + ',' + stage.stage + ')"';
        }
        html += '>';
        html += '<div style="font-size:13px;font-weight:bold;color:' + (stage.isBoss ? 'var(--color-primary)' : '#eee') + ';">' + (stage.isBoss ? '👑' : '') + stage.stage + '</div>';
        html += '<div style="font-size:9px;color:var(--color-text-dim);white-space:nowrap;overflow:hidden;max-width:54px;">' + stage.name + '</div>';
        if (stage.cleared) {
          var starStr = '';
          for (var st = 0; st < 3; st++) starStr += st < stage.stars ? '⭐' : '☆';
          html += '<div style="font-size:9px;">' + starStr + '</div>';
        } else if (!ch.unlocked || !stage.unlocked) {
          html += '<div style="font-size:12px;">🔒</div>';
        }
        html += '</div>';
      }
      html += '</div>';

      html += '</div>';
    }

    html += '</div>';

    OverlayPanel.show({
      title: UIIcons.icon('town') + ' 城防作战',
      content: html,
      panelId: 'td-chapters',
      height: 'full'
    });
  },

  // 点击关卡
  _onStageClick: function (chapterId, stageNum) {
    var result = TowerDefenseManager.selectStage(chapterId, stageNum);
    if (!result.ok) {
      EventBus.emit('toast:show', { type: 'warning', message: result.reason });
      return;
    }

    // 关卡详情/确认战斗弹窗
    var chData = TDChapterData[chapterId];
    var stageName = result.stage.name;
    var diff = result.stage.difficulty;
    var isBoss = result.stage.isBoss;

    // 显示该关卡的敌人预览
    var waveIndices = result.stage.waves;
    var enemyPreview = [];
    for (var w = 0; w < waveIndices.length; w++) {
      var wd = TDWaveTable[waveIndices[w]];
      if (!wd) continue;
      for (var e = 0; e < wd.enemies.length; e++) {
        var en = wd.enemies[e];
        var enemyName = TDEnemyData[en.type] ? TDEnemyData[en.type].name : en.type;
        enemyPreview.push(en.count + '×' + enemyName);
      }
    }

    var html = '<div style="text-align:center;line-height:1.8;">';
    html += '<p style="font-size:16px;font-weight:bold;color:var(--color-gold);">';
    html += (isBoss ? '👑 ' : '') + '第' + chapterId + '章-' + stageNum + ' ' + stageName + '</p>';
    html += '<p style="color:var(--color-text-dim);font-size:12px;">难度系数: ×' + diff.toFixed(1) + '</p>';
    html += '<p style="font-size:13px;margin-top:8px;">敌人: ' + enemyPreview.join(' ') + '</p>';
    html += '<p style="font-size:11px;color:var(--color-text-dim);margin-top:4px;">你的防御塔将保持当前布阵</p>';

    // 练习模式提示（已通关关卡）
    var stageKey = chapterId + '_' + stageNum;
    var progress = TowerDefenseManager.getState().stageProgress[stageKey];
    var isCleared = progress && progress.cleared;
    if (isCleared) {
      html += '<p style="font-size:11px;color:var(--color-success);margin-top:4px;">✅ 已通关 — 可选择练习模式（免体力，奖励-75%）</p>';
    }
    html += '</div>';

    var self = this;
    var buttons = [];
    if (isCleared) {
      // 已通关：提供练习模式按钮
      Modal.show({
        title: UIIcons.icon('battle') + ' 出击确认',
        content: html,
        confirmText: '开始战斗',
        cancelText: '练习模式',
        showCancel: true,
        onConfirm: function () {
          OverlayPanel.close();
          self._enterDefenseMode();
          setTimeout(function () { self._onStartWave(); }, 500);
        },
        onCancel: function () {
          OverlayPanel.close();
          self._enterDefenseMode();
          setTimeout(function () { self._onStartPractice(); }, 500);
        }
      });
    } else {
      Modal.show({
        title: UIIcons.icon('battle') + ' 出击确认',
        content: html,
        confirmText: '开始战斗',
        cancelText: '取消',
        showCancel: true,
        onConfirm: function () {
          OverlayPanel.close();
          self._enterDefenseMode();
          // 短延迟后自动开始波次
          setTimeout(function () {
            self._onStartWave();
          }, 500);
        }
      });
    }
  },

  // 防御塔管理面板（非战斗时管理塔布阵）
  _showTowerManagement: function () {
    OverlayPanel.close();
    this._enterDefenseMode();
  },

  // ========== T13: 进入/退出防守模式 ==========

  _enterDefenseMode: function () {
    if (this._inDefenseMode) return;

    var result = TowerDefenseManager.enterDefenseMode();
    if (!result) return;

    this._inDefenseMode = true;
    this._selectedTowerType = null;
    this._selectedTowerUid = null;
    this._placementMode = false;

    // 隐藏正常 UI 元素
    this._setNormalUIVisible(false);

    // 显示 TD UI
    this._showStatusBar();
    this._showToolbar();

    // 接管 Canvas 渲染
    this._startTDRenderLoop();

    // 添加 TD Canvas 点击监听
    this._bindCanvasClick();

    // 新手引导
    if (!TowerDefenseManager.getState().tutorialSeen) {
      this._showTutorial();
    }
  },

  _exitDefenseMode: function () {
    if (!this._inDefenseMode) return;

    var result = TowerDefenseManager.exitDefenseMode();
    if (result.needConfirm) {
      var self = this;
      Modal.show({
        title: '⚠ 战斗进行中',
        content: '离开将切换为自动防守，确定离开？',
        confirmText: '确定离开',
        cancelText: '继续战斗',
        onConfirm: function () {
          TowerDefenseManager.forceExitDefenseMode();
          self._doExitDefenseMode();
        }
      });
      return;
    }

    this._doExitDefenseMode();
  },

  _doExitDefenseMode: function () {
    this._inDefenseMode = false;
    this._selectedTowerType = null;
    this._selectedTowerUid = null;
    this._placementMode = false;
    // 清理城墙编辑状态
    this._wallEditMode = false;
    this._wallEditTool = 'place';
    this._wallDragging = false;
    this._wallDragPath = [];
    this._wallMovingUid = null;

    // 停止 TD 渲染循环
    this._stopTDRenderLoop();

    // 移除 Canvas 点击监听
    this._unbindCanvasClick();

    // 隐藏 TD UI
    this._hideStatusBar();
    this._hideToolbar();

    // 恢复正常 UI
    this._setNormalUIVisible(true);
  },

  _setNormalUIVisible: function (visible) {
    // 隐藏/显示构建按钮
    var buildBtn = document.getElementById('btn-build');
    if (buildBtn) buildBtn.style.display = visible ? '' : 'none';

    // 隐藏/显示底部导航
    var nav = document.getElementById('bottom-nav');
    if (nav) nav.style.display = visible ? '' : 'none';
  },

  // ========== T13b: Canvas 渲染循环 ==========

  _startTDRenderLoop: function () {
    if (this._rafId) return;
    var self = this;
    var loop = function () {
      self._renderTDFrame();
      self._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  },

  _stopTDRenderLoop: function () {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  },

  _renderTDFrame: function () {
    if (!this._inDefenseMode) return;
    if (typeof TownWorld === 'undefined' || !TownWorld._canvas || !TownWorld._ctx) return;

    var ctx = TownWorld._ctx;
    var canvas = TownWorld._canvas;
    var w = canvas.width;
    var h = canvas.height;

    // 先让 TownWorld 渲染正常地形和建筑
    // 复用 TownWorld._render 但我们在之后追加 TD 层
    // 停掉 TownWorld 自身循环会更干净，但直接在其上叠加即可
    // TownWorld._render() 已经在自己的 rAF 中调用了，
    // 所以这里直接在当前帧中叠加 TD 层即可

    // 震屏偏移
    var shake = TowerDefenseManager.getScreenShake();
    if (shake) {
      var shakeIntensity = shake.intensity * (1 - shake.elapsed / shake.duration);
      var sx = (Math.random() - 0.5) * 2 * shakeIntensity;
      var sy = (Math.random() - 0.5) * 2 * shakeIntensity;
      ctx.translate(sx, sy);
    }

    ctx.save();
    ctx.scale(TownWorld._cam.zoom, TownWorld._cam.zoom);
    ctx.translate(-TownWorld._cam.x, -TownWorld._cam.y);

    // 绘制 TD 网格高亮
    this._drawGrid(ctx);
    // 绘制已建塔
    this._drawTowers(ctx);
    // 绘制敌人
    this._drawEnemies(ctx);
    // 绘制武将
    this._drawHeroes(ctx);
    // 绘制弹道
    this._drawProjectiles(ctx);
    // 绘制技能特效
    this._drawSkillEffects(ctx);
    // 绘制射程指示器
    this._drawRangeIndicator(ctx);
    // 绘制放置预览
    this._drawPlacementPreview(ctx);

    // 金币粒子（世界坐标）
    var particles = TowerDefenseManager.getParticles();
    if (particles.length > 0) {
      for (var pi = 0; pi < particles.length; pi++) {
        var p = particles[pi];
        var alpha = 1 - (p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        // 小光晕
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Boss 白色闪光（屏幕坐标）
    var flash = TowerDefenseManager.getWhiteFlash();
    if (flash) {
      var flashAlpha = 0.5 * (1 - flash.elapsed / flash.duration);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + flashAlpha + ')';
      ctx.fillRect(0, 0, w, h);
    }

    // 绘制 HUD（屏幕坐标）
    this._drawTownHallHpBar(ctx, w, h);

    // Phase 1: 飘字
    if (typeof TDRenderer !== 'undefined' && typeof TowerDefenseManager !== 'undefined') {
      var damageTexts = TowerDefenseManager.getDamageTexts();
      if (damageTexts.length > 0) {
        ctx.save();
        ctx.scale(TownWorld._cam.zoom, TownWorld._cam.zoom);
        ctx.translate(-TownWorld._cam.x, -TownWorld._cam.y);
        TDRenderer.drawDamageTexts(ctx, damageTexts);
        ctx.restore();
      }

      // Phase 1: 死亡特效
      var dyingEnemies = TowerDefenseManager.getDyingEnemies();
      if (dyingEnemies.length > 0) {
        ctx.save();
        ctx.scale(TownWorld._cam.zoom, TownWorld._cam.zoom);
        ctx.translate(-TownWorld._cam.x, -TownWorld._cam.y);
        for (var de = 0; de < dyingEnemies.length; de++) {
          TDRenderer.drawDyingEnemy(ctx, dyingEnemies[de]);
        }
        ctx.restore();
      }

      // Phase 1: 连杀特效
      if (this._activeKillStreak && this._activeKillStreak.elapsed < 1.5) {
        this._activeKillStreak.elapsed += 0.016;
        TDRenderer.drawKillStreak(ctx, this._activeKillStreak, w, h);
      }

      // Phase 1: 速度指示器
      var speed = TowerDefenseManager.getSpeed();
      TDRenderer.drawSpeedIndicator(ctx, speed, w);

      // Phase 1: 暂停遮罩
      if (TowerDefenseManager.isPaused()) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏸ 已暂停', w / 2, h / 2);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.fillText('点击"继续"恢复战斗', w / 2, h / 2 + 32);
      }
    }
  },

  _drawGrid: function (ctx) {
    var grid = TowerDefenseManager._getCollisionGrid();
    if (!grid) return;

    var TILE = TD_CONSTANTS.TILE_SIZE;
    var towers = TowerDefenseManager.getState().towers;
    var towerPositions = {};
    for (var t = 0; t < towers.length; t++) {
      var tSize = TDGetTowerSize(towers[t].type);
      for (var sy = 0; sy < tSize.h; sy++) {
        for (var sx = 0; sx < tSize.w; sx++) {
          towerPositions[(towers[t].gridX + sx) + ',' + (towers[t].gridY + sy)] = true;
        }
      }
    }

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#4caf50';

    for (var y = 0; y < grid.length; y++) {
      for (var x = 0; x < grid[y].length; x++) {
        if (grid[y][x] === 0 && !towerPositions[x + ',' + y]) {
          ctx.fillRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
        }
      }
    }
    ctx.globalAlpha = 1.0;
  },

  _drawTowers: function (ctx) {
    var state = TowerDefenseManager.getState();
    var towers = state.towers;
    var walls = state.walls || [];
    var TILE = TD_CONSTANTS.TILE_SIZE;
    var battle = TowerDefenseManager._battle;
    var isBattle = !!(battle && battle.active);

    // 先绘制城墙（在底层）
    for (var wi = 0; wi < walls.length; wi++) {
      var w = walls[wi];
      var centerX = w.gridX * TILE + TILE / 2;
      var centerY = w.gridY * TILE + TILE / 2;

      // 选中高亮
      if (this._selectedTowerUid === w.uid) {
        ctx.strokeStyle = '#f5c518';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.gridX * TILE + 1, w.gridY * TILE + 1, TILE - 2, TILE - 2);
      }

      // 获取相邻墙段信息
      var neighbors = TowerDefenseManager.getWallNeighbors(w.gridX, w.gridY);

      // 获取战斗中 HP 比例
      var hpRatio = 1;
      if (isBattle && battle.wallInstances) {
        for (var k = 0; k < battle.wallInstances.length; k++) {
          if (battle.wallInstances[k].uid === w.uid) {
            hpRatio = battle.wallInstances[k].maxHp > 0 ? battle.wallInstances[k].hp / battle.wallInstances[k].maxHp : 0;
            break;
          }
        }
      }

      if (typeof TDRenderer !== 'undefined') {
        TDRenderer.drawTower(ctx, w.type, centerX, centerY, w.level, {
          neighbors: neighbors,
          hpRatio: hpRatio < 1 ? hpRatio : undefined,
          isBattle: isBattle
        });
      }
    }

    // 再绘制防御塔
    for (var i = 0; i < towers.length; i++) {
      var t = towers[i];
      var data = TDTowerData[t.type];
      if (!data) continue;

      var tSize = TDGetTowerSize(t.type);
      var tcX = t.gridX * TILE + tSize.w * TILE / 2;
      var tcY = t.gridY * TILE + tSize.h * TILE / 2;

      // 选中高亮
      if (this._selectedTowerUid === t.uid) {
        ctx.strokeStyle = '#f5c518';
        ctx.lineWidth = 2;
        ctx.strokeRect(t.gridX * TILE + 1, t.gridY * TILE + 1, tSize.w * TILE - 2, tSize.h * TILE - 2);
      }

      // 使用 TDRenderer 绘制
      if (typeof TDRenderer !== 'undefined') {
        TDRenderer.drawTower(ctx, t.type, tcX, tcY, t.level, {});
      } else {
        // Fallback: 简单矩形
        ctx.fillStyle = 'rgba(22,33,62,0.7)';
        ctx.fillRect(t.gridX * TILE + 2, t.gridY * TILE + 2, tSize.w * TILE - 4, tSize.h * TILE - 4);
      }
    }
  },

  _drawEnemies: function (ctx) {
    if (!TowerDefenseManager._battle || !TowerDefenseManager._battle.enemies) return;

    var enemies = TowerDefenseManager._battle.enemies;
    var TILE = TD_CONSTANTS.TILE_SIZE;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.status === 'dead') continue;

      var hpRatio = Math.max(0, e.hp / e.maxHp);

      if (typeof TDRenderer !== 'undefined') {
        TDRenderer.drawEnemy(ctx, e.type, e.x, e.y, hpRatio, {
          detected: e.detected,
          slow: e.slowTimer > 0,
          burn: e.burnTimer > 0,
          facingLeft: false
        });
        // HP 血条
        TDRenderer.drawHpBar(ctx, e.x, e.y - TILE / 2 - 2, hpRatio, TILE * 0.7, 4);
      } else {
        // Fallback: emoji
        var emoji = this._enemyEmoji[e.type] || '👤';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, e.x, e.y - 4);
      }

      // 状态效果
      if (typeof TDRenderer !== 'undefined') {
        if (e.slowTimer > 0) TDRenderer.drawStatusEffect(ctx, 'slow', e.x, e.y);
        if (e.burnTimer > 0) TDRenderer.drawStatusEffect(ctx, 'burn', e.x, e.y);
      }
    }
  },

  _drawHeroes: function (ctx) {
    if (typeof TDRenderer === 'undefined') return;
    var heroes = TowerDefenseManager.getHeroRuntime();

    for (var i = 0; i < heroes.length; i++) {
      var h = heroes[i];
      if (h.status === 'retreated') continue;

      var hpRatio = h.maxHp > 0 ? h.hp / h.maxHp : 1;
      var skillCdRatio = 0;
      if (h.skillCooldown > 0) {
        skillCdRatio = h.skillCooldown / 3; // assume 3s base cooldown
      }

      TDRenderer.drawHero(ctx, {
        name: h.name,
        faction: h.faction,
        level: h.level
      }, h.x, h.y, hpRatio, skillCdRatio, {});

      // HP 条
      TDRenderer.drawHpBar(ctx, h.x, h.y - TD_CONSTANTS.TILE_SIZE * 0.8, hpRatio, 40, 5);

      // Phase 1: 蓄力条
      var heroRt = TowerDefenseManager._heroRuntime[h.uid];
      if (heroRt && typeof TD_ENHANCEMENT !== 'undefined') {
        var chargeTime = TD_ENHANCEMENT.SKILL_CHARGE.BASE_CHARGE_TIME;
        var chargeRatio = (heroRt.chargeProgress || 0) / chargeTime;
        TDRenderer.drawChargeBar(ctx, h.x, h.y, chargeRatio, !!heroRt.chargeReady);
      }
    }
  },

  _drawProjectiles: function (ctx) {
    if (typeof TDRenderer === 'undefined') return;
    if (!TowerDefenseManager._battle) return;
    var projectiles = TowerDefenseManager._battle.projectiles;
    if (!projectiles) return;

    for (var i = 0; i < projectiles.length; i++) {
      var p = projectiles[i];
      TDRenderer.drawProjectile(ctx, p.type, p.x, p.y, p.targetX, p.targetY, p.progress);
    }
  },

  _drawSkillEffects: function (ctx) {
    if (typeof TDRenderer === 'undefined') return;
    if (!TowerDefenseManager._battle) return;
    var effects = TowerDefenseManager._battle.skillEffects;
    if (!effects) return;

    for (var i = 0; i < effects.length; i++) {
      var e = effects[i];
      TDRenderer.drawSkillEffect(ctx, e.type, e.targetX || e.x, e.targetY || e.y, e.progress, {
        radius: e.radius,
        startX: e.x,
        startY: e.y
      });
    }
  },

  _drawRangeIndicator: function (ctx) {
    if (!this._selectedTowerUid) return;

    var tower = TowerDefenseManager._findTower(this._selectedTowerUid);
    if (!tower) return;

    var stats = TowerDefenseManager.getTowerStats(this._selectedTowerUid);
    if (!stats || stats.range <= 0) return;

    var TILE = TD_CONSTANTS.TILE_SIZE;
    var tSize = TDGetTowerSize(tower.type);
    var cx = tower.gridX * TILE + tSize.w * TILE / 2;
    var cy = tower.gridY * TILE + tSize.h * TILE / 2;
    var rangePixels = stats.range * TILE;

    ctx.beginPath();
    ctx.arc(cx, cy, rangePixels, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 197, 24, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 197, 24, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  },

  _drawPlacementPreview: function (ctx) {
    if (!this._placementMode || !this._selectedTowerType) return;

    // 显示鼠标/触摸位置的放置预览（通过 CSS cursor 提示）
    // 实际放置在点击时处理
  },

  _drawTownHallHpBar: function (ctx, w, h) {
    var state = TowerDefenseManager.getState();
    if (!state) return;

    var hp = state.wave.townHallHp;
    var maxHp = state.wave.townHallMaxHp;
    if (maxHp <= 0) return;

    var barW = Math.min(260, w - 40);
    var barH = 12;
    var barX = (w - barW) / 2;
    var barY = 52; // below status bar

    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // HP 填充
    var ratio = Math.max(0, hp / maxHp);
    var color = ratio > 0.5 ? '#4caf50' : (ratio > 0.25 ? '#ff9800' : '#f44336');
    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, barW * ratio, barH);

    // 文本
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏯 ' + Utils.formatNumber(Math.ceil(hp)) + ' / ' + Utils.formatNumber(maxHp), w / 2, barY + barH / 2);
  },

  // ========== T13: Canvas 点击处理 ==========

  _canvasClickHandler: null,
  _canvasDragHandlers: null,

  _bindCanvasClick: function () {
    if (this._canvasClickHandler) return;
    var self = this;
    this._canvasClickHandler = function (e) {
      self._onCanvasClick(e);
    };
    var canvas = TownWorld._canvas;
    if (canvas) {
      canvas.addEventListener('click', this._canvasClickHandler);
      // 拖拽支持（城墙编辑模式）
      this._canvasDragHandlers = {
        mousedown: function (e) { self._onCanvasDragStart(e); },
        mousemove: function (e) { self._onCanvasDragMove(e); },
        mouseup: function (e) { self._onCanvasDragEnd(e); },
        touchstart: function (e) { if (e.touches.length === 1) self._onCanvasDragStart(e.touches[0]); },
        touchmove: function (e) { if (e.touches.length === 1) { e.preventDefault(); self._onCanvasDragMove(e.touches[0]); } },
        touchend: function (e) { self._onCanvasDragEnd(e); }
      };
      canvas.addEventListener('mousedown', this._canvasDragHandlers.mousedown);
      canvas.addEventListener('mousemove', this._canvasDragHandlers.mousemove);
      canvas.addEventListener('mouseup', this._canvasDragHandlers.mouseup);
      canvas.addEventListener('touchstart', this._canvasDragHandlers.touchstart, { passive: false });
      canvas.addEventListener('touchmove', this._canvasDragHandlers.touchmove, { passive: false });
      canvas.addEventListener('touchend', this._canvasDragHandlers.touchend);
    }
  },

  _unbindCanvasClick: function () {
    var canvas = TownWorld._canvas;
    if (canvas) {
      if (this._canvasClickHandler) {
        canvas.removeEventListener('click', this._canvasClickHandler);
      }
      if (this._canvasDragHandlers) {
        canvas.removeEventListener('mousedown', this._canvasDragHandlers.mousedown);
        canvas.removeEventListener('mousemove', this._canvasDragHandlers.mousemove);
        canvas.removeEventListener('mouseup', this._canvasDragHandlers.mouseup);
        canvas.removeEventListener('touchstart', this._canvasDragHandlers.touchstart);
        canvas.removeEventListener('touchmove', this._canvasDragHandlers.touchmove);
        canvas.removeEventListener('touchend', this._canvasDragHandlers.touchend);
        this._canvasDragHandlers = null;
      }
    }
    this._canvasClickHandler = null;
  },

  _getGridFromEvent: function (e) {
    var rect = TownWorld._canvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;
    var world = TownWorld._screenToWorld(sx, sy);
    return TownWorld._worldToGrid(world.x, world.y);
  },

  _onCanvasDragStart: function (e) {
    if (!this._wallEditMode) return;
    var grid = this._getGridFromEvent(e);
    this._onWallEditDragStart(grid.gx, grid.gy);
  },

  _onCanvasDragMove: function (e) {
    if (!this._wallEditMode || !this._wallDragging) return;
    var grid = this._getGridFromEvent(e);
    this._onWallEditDragMove(grid.gx, grid.gy);
  },

  _onCanvasDragEnd: function () {
    if (!this._wallEditMode) return;
    this._onWallEditDragEnd();
  },

  _onCanvasClick: function (e) {
    if (!this._inDefenseMode) return;

    var rect = TownWorld._canvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;
    var world = TownWorld._screenToWorld(sx, sy);
    var gridPos = TownWorld._worldToGrid(world.x, world.y);
    var gx = gridPos.gx;
    var gy = gridPos.gy;

    // 武将部署模式
    if (this._heroDeployUid) {
      this._onCanvasClickForHeroDeploy(gx, gy);
      return;
    }

    // 城墙编辑模式
    if (this._wallEditMode) {
      this._onWallEditClick(gx, gy);
      return;
    }

    // 放置模式：点击空格放置塔
    if (this._placementMode && this._selectedTowerType) {
      var result = TowerDefenseManager.buildTower(this._selectedTowerType, gx, gy);
      if (result.ok) {
        EventBus.emit('toast:show', { type: 'success', message: TDTowerData[this._selectedTowerType].name + ' 已建造！' });
        this._updateToolbar();
      } else {
        EventBus.emit('toast:show', { type: 'warning', message: result.reason });
      }
      return;
    }

    // 非放置模式：检查是否点击了城墙
    var walls = TowerDefenseManager.getState().walls || [];
    for (var wi = 0; wi < walls.length; wi++) {
      var w = walls[wi];
      if (w.gridX === gx && w.gridY === gy) {
        this._selectedTowerUid = w.uid;
        this._showWallInfo(w.uid);
        return;
      }
    }

    // 非放置模式：检查是否点击了已建塔（含多格塔）
    var towers = TowerDefenseManager.getState().towers;
    for (var i = 0; i < towers.length; i++) {
      var t = towers[i];
      var tSize = TDGetTowerSize(t.type);
      if (gx >= t.gridX && gx < t.gridX + tSize.w &&
          gy >= t.gridY && gy < t.gridY + tSize.h) {
        this._selectedTowerUid = t.uid;
        this._showTowerInfo(t.uid);
        return;
      }
    }

    // 点击空白 — 取消选择
    this._selectedTowerUid = null;
  },

  // ========== T13: 状态栏 ==========

  _createStatusBar: function () {
    var container = document.getElementById('town-world-container');
    if (!container) return;

    var bar = document.createElement('div');
    bar.id = 'td-status-bar';
    bar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:42px;background:rgba(0,0,0,0.8);color:#eee;display:none;z-index:101;padding:0 12px;align-items:center;justify-content:space-between;font-size:13px;border-bottom:1px solid var(--color-gold);';
    container.appendChild(bar);
    this._statusBar = bar;
  },

  _showStatusBar: function () {
    if (this._statusBar) {
      this._statusBar.style.display = 'flex';
      this._updateStatusBar();
    }
  },

  _hideStatusBar: function () {
    if (this._statusBar) this._statusBar.style.display = 'none';
  },

  _updateStatusBar: function () {
    if (!this._statusBar || !this._inDefenseMode) return;

    // 城墙编辑模式 — 显示城墙信息
    if (this._wallEditMode) {
      var wallCount = TowerDefenseManager.getWallCount();
      var maxWalls = TowerDefenseManager.getMaxWalls();
      var gold = 0;
      if (typeof ResourceManager !== 'undefined' && ResourceManager.get) {
        gold = ResourceManager.get('gold');
      }
      var toolNames = { place: '放置', gate: '城门', upgrade: '升级', remove: '拆除', move: '移动' };
      this._statusBar.innerHTML =
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span onclick="TowerDefensePanel._exitWallEditMode()" style="cursor:pointer;font-size:16px;">←</span>' +
          '<span>' + UIIcons.icon('defense') + ' 城墙编辑 — ' + (toolNames[this._wallEditTool] || '') + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<span>' + UIIcons.icon('defense') + wallCount + '/' + maxWalls + '</span>' +
          '<span>💰 ' + Utils.formatNumber(gold) + '</span>' +
        '</div>';
      return;
    }

    var state = TowerDefenseManager.getState();
    var battle = TowerDefenseManager._battle;
    var currentStage = TowerDefenseManager._currentStage;
    var waveText = currentStage
      ? '第' + currentStage.chapter + '章-' + currentStage.stage + ' ' + currentStage.data.name
      : '防御塔布阵';
    var gold = 0;
    if (typeof ResourceManager !== 'undefined' && ResourceManager.get) {
      gold = ResourceManager.get('gold');
    }

    var phaseText = '';
    if (battle && battle.active) {
      if (battle.phase === 'prep') {
        phaseText = ' ⏳准备 ' + Math.ceil(battle.prepTimer) + 's';
      } else if (battle.phase === 'active') {
        phaseText = ' ⚔战斗中 (' + battle.enemies.length + '敌)';
      }
      if (battle.isPractice) {
        phaseText += ' 🎯练习';
      }
    }

    // 体力显示
    var stamina = TowerDefenseManager.getStamina();
    var staminaText = '⚡' + stamina.current + '/' + stamina.max;

    this._statusBar.innerHTML =
      '<div style="display:flex;align-items:center;gap:6px;">' +
        '<span onclick="TowerDefensePanel._exitDefenseMode()" style="cursor:pointer;font-size:16px;">←</span>' +
        '<span>🛡 ' + waveText + phaseText + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<span>' + staminaText + '</span>' +
        '<span>💰 ' + Utils.formatNumber(gold) + '</span>' +
      '</div>';

    // 持续刷新状态栏（准备倒计时等）
    if (!this._refreshTimer && this._inDefenseMode) {
      var self = this;
      this._refreshTimer = setInterval(function () {
        if (!self._inDefenseMode) {
          clearInterval(self._refreshTimer);
          self._refreshTimer = null;
          return;
        }
        self._updateStatusBar();
      }, 500);
    }
  },

  // ========== T13 + T14: 底部工具栏 ==========

  _createToolbar: function () {
    var container = document.getElementById('town-world-container');
    if (!container) return;

    var toolbar = document.createElement('div');
    toolbar.id = 'td-toolbar';
    toolbar.style.cssText = 'position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.85);display:none;z-index:101;flex-direction:column;border-top:1px solid var(--color-gold);';
    container.appendChild(toolbar);
    this._toolbar = toolbar;
  },

  _showToolbar: function () {
    if (this._toolbar) {
      this._toolbar.style.display = 'flex';
      this._updateToolbar();
    }
  },

  _hideToolbar: function () {
    if (this._toolbar) this._toolbar.style.display = 'none';
  },

  _updateToolbar: function () {
    if (!this._toolbar || !this._inDefenseMode) return;

    // 城墙编辑模式 — 使用专属工具栏
    if (this._wallEditMode) {
      this._toolbar.innerHTML = this._renderWallToolbar();
      return;
    }

    var state = TowerDefenseManager.getState();
    var battle = TowerDefenseManager._battle;
    var isActive = battle && battle.active;
    var currentStage = TowerDefenseManager._currentStage;
    var html = '';

    // 功能按钮行
    html += '<div style="display:flex;justify-content:space-between;padding:8px 12px;gap:8px;">';
    html += '<button class="btn" style="flex:1;font-size:12px;padding:6px 0;" onclick="TowerDefensePanel._showTechPanel()">🏗 建筑</button>';
    html += '<button class="btn" style="flex:1;font-size:12px;padding:6px 0;" onclick="TowerDefensePanel._showHeroPanel()">⚔ 武将</button>';
    if (!isActive) {
      html += '<button class="btn" style="flex:1;font-size:12px;padding:6px 0;background:#2a3a2a;border-color:#4a6a4a;" onclick="TowerDefensePanel._enterWallEditMode()">' + UIIcons.icon('defense') + ' 城墙</button>';
    }

    if (!isActive) {
      if (currentStage) {
        var stamina = TowerDefenseManager.getStamina();
        var canStart = stamina.current > 0;
        html += '<button class="btn" style="flex:2;font-size:12px;padding:6px 0;' + (canStart ? 'background:linear-gradient(180deg,#d4392b,#a02820);border-color:rgba(232,81,58,0.4);' : 'opacity:0.4;') + '" ' + (canStart ? 'onclick="TowerDefensePanel._onStartWave()"' : 'disabled') + '>⚔ 开始战斗' + (canStart ? '' : '（体力不足）') + '</button>';
      } else {
        html += '<button class="btn" style="flex:2;font-size:12px;padding:6px 0;" onclick="TowerDefensePanel._exitDefenseMode()">✓ 完成布阵</button>';
      }
    } else if (battle.phase === 'prep') {
      html += '<button class="btn" style="flex:2;font-size:12px;padding:6px 0;background:linear-gradient(180deg,#d4a849,#a08030);border-color:rgba(212,168,73,0.4);" onclick="TowerDefensePanel._onSkipPrep()">⏩ 跳过准备</button>';
    } else {
      // 战斗中 — 暂停 + 速度按钮
      var paused = TowerDefenseManager.isPaused();
      var speed = TowerDefenseManager.getSpeed();
      html += '<button class="btn" style="flex:1;font-size:12px;padding:6px 0;background:' + (paused ? '#a08030' : '#333') + ';" onclick="TowerDefensePanel._togglePause()">' + (paused ? '▶ 继续' : '⏸ 暂停') + '</button>';
      html += '<button class="btn" style="flex:1;font-size:12px;padding:6px 0;background:' + (speed >= 3 ? '#a02820' : speed >= 2 ? '#a08030' : '#333') + ';" onclick="TowerDefensePanel._toggleSpeed()">' + speed + '× 速度</button>';
      html += '<button class="btn" style="flex:1;font-size:12px;padding:6px 0;opacity:0.6;" disabled>⚔ 战斗中</button>';
    }

    html += '</div>';

    // Phase 1: 紧急技能 + 武将技能行（战斗中显示）
    if (isActive && battle.phase === 'active') {
      html += '<div style="display:flex;padding:4px 12px;gap:6px;border-bottom:1px solid rgba(255,255,255,0.1);">';

      // 紧急技能
      var eSkills = TowerDefenseManager.getEmergencySkills();
      var eNames = { arrow_rain: UIIcons.iconText('attack', '万箭'), battle_charge: UIIcons.iconText('battle', '冲锋'), iron_wall: UIIcons.iconText('defense', '铁壁') };
      var eIds = ['arrow_rain', 'battle_charge', 'iron_wall'];
      for (var ei = 0; ei < eIds.length; ei++) {
        var eId = eIds[ei];
        var eData = eSkills[eId];
        var eCd = eData ? Math.ceil(eData.cd) : 0;
        var eReady = eCd <= 0;
        html += '<button class="btn" style="flex:1;font-size:11px;padding:4px 0;' + (eReady ? 'background:#2a4a2a;' : 'opacity:0.5;') + '" ' +
          (eReady ? 'onclick="TowerDefensePanel._useEmergencySkill(\'' + eId + '\')"' : 'disabled') + '>' +
          eNames[eId] + (eCd > 0 ? '(' + eCd + 's)' : '') + '</button>';
      }

      html += '</div>';

      // 武将技能按钮
      var heroes = TowerDefenseManager.getHeroRuntime();
      if (heroes.length > 0) {
        html += '<div style="display:flex;padding:4px 12px;gap:6px;">';
        for (var hi = 0; hi < heroes.length; hi++) {
          var hrt = heroes[hi];
          var heroRt = TowerDefenseManager._heroRuntime[hrt.uid];
          var chargeReady = heroRt && heroRt.chargeReady;
          var chargeRatio = 0;
          if (heroRt && typeof TD_ENHANCEMENT !== 'undefined') {
            chargeRatio = Math.min(1, (heroRt.chargeProgress || 0) / TD_ENHANCEMENT.SKILL_CHARGE.BASE_CHARGE_TIME);
          }
          var barColor = chargeReady ? '#FFD700' : '#4CAF50';
          html += '<button class="btn" style="flex:1;font-size:11px;padding:4px 0;position:relative;overflow:hidden;' + (chargeReady ? 'background:#4a3a00;border-color:#FFD700;' : '') + '" ' +
            (chargeReady ? 'onclick="TowerDefensePanel._manualSkill(\'' + hrt.uid + '\')"' : 'disabled') + '>' +
            '<div style="position:absolute;bottom:0;left:0;height:3px;width:' + (chargeRatio * 100) + '%;background:' + barColor + ';"></div>' +
            '⚔' + hrt.name.charAt(0) + (chargeReady ? ' ★' : '') + '</button>';
        }
        html += '</div>';
      }
    }

    // 塔建造工具栏（横向滚动）
    html += '<div style="display:flex;overflow-x:auto;padding:6px 12px 10px;gap:8px;-webkit-overflow-scrolling:touch;">';

    // 取消放置按钮（放置模式时显示）
    if (this._placementMode) {
      html += '<div style="display:flex;flex-direction:column;align-items:center;min-width:56px;cursor:pointer;" onclick="TowerDefensePanel._cancelPlacement()">';
      html += '<div style="width:44px;height:44px;border-radius:6px;border:2px solid #f44336;background:rgba(244,67,54,0.2);display:flex;align-items:center;justify-content:center;font-size:20px;">✕</div>';
      html += '<span style="font-size:10px;color:#f44336;margin-top:2px;">取消</span>';
      html += '</div>';
    }

    var towerIds = Object.keys(TDTowerData);
    for (var i = 0; i < towerIds.length; i++) {
      var id = towerIds[i];
      var data = TDTowerData[id];
      // 跳过城墙/城门类型（有专属编辑器）和旧版墙体
      if (id === 'td_wall' || id === 'td_gate' || id === 'td_wood_fence' || id === 'td_stone_wall' || id === 'td_iron_wall') continue;
      // 检查城主府等级解锁
      var thLevel = 0;
      if (typeof TownManager !== 'undefined' && TownManager.getBuildingLevel) {
        thLevel = TownManager.getBuildingLevel('town_hall');
      }
      if (data.requiredTownHall && thLevel < data.requiredTownHall) continue;

      var canAfford = true;
      if (typeof ResourceManager !== 'undefined' && !ResourceManager.canAffordMultiple(data.cost)) {
        canAfford = false;
      }

      var isSelected = this._selectedTowerType === id;
      var borderColor = isSelected ? '#f5c518' : (canAfford ? '#4a3728' : '#333');
      var opacity = canAfford ? '1' : '0.4';

      // 费用文本
      var costText = '';
      if (data.cost.gold) costText = Utils.formatNumber(data.cost.gold) + '金';

      html += '<div style="display:flex;flex-direction:column;align-items:center;min-width:56px;cursor:pointer;opacity:' + opacity + ';" onclick="TowerDefensePanel._selectTowerType(\'' + id + '\')">';
      html += '<div style="width:44px;height:44px;border-radius:6px;border:2px solid ' + borderColor + ';background:rgba(22,33,62,0.8);display:flex;align-items:center;justify-content:center;font-size:20px;">' + (this._towerEmoji[id] || '🔷') + '</div>';
      html += '<span style="font-size:10px;color:#ccc;margin-top:2px;white-space:nowrap;">' + costText + '</span>';
      html += '</div>';
    }

    html += '</div>';

    this._toolbar.innerHTML = html;
  },

  // ========== T14: 塔建造交互 ==========

  _selectTowerType: function (typeId) {
    if (this._selectedTowerType === typeId && this._placementMode) {
      // 再次点击取消
      this._cancelPlacement();
      return;
    }

    this._selectedTowerType = typeId;
    this._selectedTowerUid = null;
    this._placementMode = true;

    var data = TDTowerData[typeId];
    if (data) {
      EventBus.emit('toast:show', { type: 'info', message: '点击空闲格子放置 ' + data.name });
    }

    this._updateToolbar();
  },

  _cancelPlacement: function () {
    this._selectedTowerType = null;
    this._placementMode = false;
    this._updateToolbar();
  },

  _onStartWave: function () {
    var started = TowerDefenseManager.startWave();
    if (started) {
      this._updateStatusBar();
      this._updateToolbar();
    }
  },

  _onStartPractice: function () {
    var started = TowerDefenseManager.startWave({ practice: true });
    if (started) {
      EventBus.emit('toast:show', { type: 'info', message: '练习模式：奖励减少75%' });
      this._updateStatusBar();
      this._updateToolbar();
    }
  },

  _toggleSpeed: function () {
    TowerDefenseManager.toggleSpeed();
    this._updateToolbar();
  },

  _togglePause: function () {
    TowerDefenseManager.togglePause();
    this._updateToolbar();
  },

  _useEmergencySkill: function (skillId) {
    var used = TowerDefenseManager.useEmergencySkill(skillId);
    if (used) {
      var names = { arrow_rain: '万箭齐发', battle_charge: '擂鼓助威', iron_wall: '金城汤池' };
      EventBus.emit('toast:show', { type: 'success', message: names[skillId] + '！' });
      this._updateToolbar();
    }
  },

  _manualSkill: function (heroUid) {
    var used = TowerDefenseManager.manualReleaseSkill(heroUid);
    if (used) {
      EventBus.emit('toast:show', { type: 'success', message: '手动释放技能！伤害×1.5' });
      this._updateToolbar();
    }
  },

  _onSkipPrep: function () {
    TowerDefenseManager.skipPrep();
    this._updateStatusBar();
    this._updateToolbar();
  },

  // ========== T15: 塔信息/升级/出售面板 ==========

  _showTowerInfo: function (towerUid) {
    var stats = TowerDefenseManager.getTowerStats(towerUid);
    if (!stats) return;

    var tower = TowerDefenseManager._findTower(towerUid);
    if (!tower) return;

    var data = TDTowerData[tower.type];
    if (!data) return;

    var emoji = this._towerEmoji[tower.type] || '🔷';

    var html = '<div style="text-align:center;padding:8px;">';

    // 名称和等级
    html += '<div style="font-size:28px;margin:4px 0;">' + emoji + '</div>';
    html += '<h3 style="color:var(--color-gold);margin:4px 0;">' + data.name + ' Lv.' + tower.level + '</h3>';

    // 属性
    html += '<div style="display:flex;justify-content:space-around;margin:12px 0;font-size:13px;color:var(--color-text);">';
    if (stats.atk > 0) html += '<div>⚔ ATK: ' + Utils.formatNumber(stats.atk) + '</div>';
    if (stats.hp > 0) html += '<div>❤ HP: ' + Utils.formatNumber(stats.hp) + '</div>';
    if (stats.range > 0) html += '<div>🎯 射程: ' + stats.range + '</div>';
    if (stats.attackSpeed > 0) html += '<div>⚡ 攻速: ' + stats.attackSpeed + '/s</div>';
    html += '</div>';

    // DPS 和击杀数
    if (stats.dps > 0) {
      html += '<div style="font-size:12px;color:var(--color-text-dim);margin:4px 0;">DPS: ' + stats.dps + '</div>';
    }
    html += '<div style="font-size:12px;color:var(--color-text-dim);margin:4px 0;">击杀数: ' + stats.kills + '</div>';

    // 特殊效果
    if (data.special) {
      var specialText = this._getSpecialText(data.special);
      html += '<div style="font-size:11px;color:#ff9800;margin:8px 0;">✨ ' + specialText + '</div>';
    }

    html += '<hr style="border-color:#4a3728;margin:12px 0;">';

    // 升级按钮
    if (tower.level < TD_CONSTANTS.MAX_TOWER_LEVEL) {
      var upgradeCost = TowerDefenseManager.getUpgradeCost(towerUid);
      var canUpgrade = TowerDefenseManager.canUpgradeTower(towerUid);
      var costStr = this._formatCost(upgradeCost);
      var upgradeDisabled = canUpgrade.ok ? '' : 'opacity:0.5;pointer-events:none;';
      html += '<button class="btn" style="width:100%;margin:4px 0;font-size:13px;' + upgradeDisabled + '" onclick="TowerDefensePanel._upgradeTower(\'' + towerUid + '\')">⬆ 升级 Lv.' + (tower.level + 1) + '　费用: ' + costStr + '</button>';
      if (!canUpgrade.ok) {
        html += '<div style="font-size:11px;color:var(--color-danger);margin:2px 0;">' + canUpgrade.reason + '</div>';
      }
    } else {
      html += '<button class="btn" style="width:100%;margin:4px 0;font-size:13px;opacity:0.5;" disabled>⬆ 已满级</button>';
    }

    // 出售按钮
    var sellRate = (TowerDefenseManager._battle && TowerDefenseManager._battle.active) ? TD_CONSTANTS.SELL_RATE_ACTIVE : TD_CONSTANTS.SELL_RATE_IDLE;
    var sellRefund = this._calcSellRefund(tower);
    var sellStr = this._formatCost(sellRefund);
    html += '<button class="btn" style="width:100%;margin:4px 0;font-size:13px;background:#3a2020;border-color:#7a3030;" onclick="TowerDefensePanel._sellTower(\'' + towerUid + '\')">🔻 出售　返还: ' + sellStr + ' (' + Math.round(sellRate * 100) + '%)</button>';

    html += '</div>';

    OverlayPanel.show({
      title: emoji + ' ' + data.name,
      content: html,
      panelId: 'td-tower-info',
      height: 'half'
    });
  },

  _upgradeTower: function (uid) {
    var result = TowerDefenseManager.upgradeTower(uid);
    if (result.ok) {
      EventBus.emit('toast:show', { type: 'success', message: '升级成功！' });
      OverlayPanel.close();
      this._updateToolbar();
    } else {
      EventBus.emit('toast:show', { type: 'warning', message: result.reason });
    }
  },

  _sellTower: function (uid) {
    var self = this;
    Modal.show({
      title: '确认出售',
      content: '确定要出售此防御塔吗？',
      confirmText: '出售',
      cancelText: '取消',
      onConfirm: function () {
        var result = TowerDefenseManager.sellTower(uid);
        if (result.ok) {
          EventBus.emit('toast:show', { type: 'success', message: '已出售，返还资源' });
          OverlayPanel.close();
          self._selectedTowerUid = null;
          self._updateToolbar();
        } else {
          EventBus.emit('toast:show', { type: 'warning', message: result.reason });
        }
      }
    });
  },

  _calcSellRefund: function (tower) {
    var data = TDTowerData[tower.type];
    if (!data) return {};

    var rate = (TowerDefenseManager._battle && TowerDefenseManager._battle.active) ? TD_CONSTANTS.SELL_RATE_ACTIVE : TD_CONSTANTS.SELL_RATE_IDLE;
    var totalCost = {};
    for (var res in data.cost) {
      if (data.cost.hasOwnProperty(res)) {
        totalCost[res] = data.cost[res];
      }
    }
    for (var lv = 2; lv <= tower.level; lv++) {
      var mul = TD_UPGRADE_TABLE[lv].costMul;
      for (var r in data.cost) {
        if (data.cost.hasOwnProperty(r)) {
          totalCost[r] = (totalCost[r] || 0) + Math.floor(data.cost[r] * mul);
        }
      }
    }
    var refund = {};
    for (var rr in totalCost) {
      if (totalCost.hasOwnProperty(rr)) {
        refund[rr] = Math.floor(totalCost[rr] * rate);
      }
    }
    return refund;
  },

  _getSpecialText: function (special) {
    var map = {
      'detect': '探测地下敌人',
      'detect_atk_buff_20': '探测地下 + 范围内塔ATK+20%',
      'splash_1': '溅射攻击（1格范围50%伤害）',
      'homing_splash_1': '追踪导弹 + 溅射1格',
      'multi_2': '同时攻击2个目标',
      'armor_pierce_50': '穿甲（忽略50%防御）',
      'pierce_beam': '穿透光束（直线所有敌人受伤）',
      'contact_damage': '接触敌人持续造成伤害',
      'slow_50_3s': '减速50%持续3秒（一次性）',
      'burn_5s_cd15': '灼烧5秒（冷却15秒）',
      'aoe_1': '范围爆炸（1格范围，一次性）',
      'wall_damage_x2': '对墙体伤害×2'
    };
    return map[special] || special;
  },

  _formatCost: function (cost) {
    if (!cost) return '—';
    var parts = [];
    var names = { gold: '金', wood: '木', stone: '石', iron: '铁' };
    for (var res in cost) {
      if (cost.hasOwnProperty(res) && cost[res] > 0) {
        parts.push(Utils.formatNumber(cost[res]) + (names[res] || res));
      }
    }
    return parts.join(' ') || '—';
  },

  // ========== 城墙编辑系统 (T5-T8) ==========

  _enterWallEditMode: function () {
    if (TowerDefenseManager._battle && TowerDefenseManager._battle.active) {
      EventBus.emit('toast:show', { type: 'warning', message: '战斗中无法编辑城墙' });
      return;
    }
    this._wallEditMode = true;
    this._wallEditTool = 'place';
    this._placementMode = false;
    this._selectedTowerType = null;
    this._selectedTowerUid = null;
    this._updateToolbar();
    this._updateStatusBar();
    EventBus.emit('toast:show', { type: 'info', message: '进入城墙编辑模式 — 点击放置城墙' });
  },

  _exitWallEditMode: function () {
    this._wallEditMode = false;
    this._wallEditTool = 'place';
    this._wallDragging = false;
    this._wallDragPath = [];
    this._wallMovingUid = null;
    this._selectedTowerUid = null;
    this._updateToolbar();
    this._updateStatusBar();
  },

  _setWallTool: function (tool) {
    this._wallEditTool = tool;
    this._wallDragging = false;
    this._wallDragPath = [];
    this._wallMovingUid = null;
    this._selectedTowerUid = null;
    this._updateToolbar();
    var names = { place: '放置城墙', upgrade: '升级城墙', remove: '拆除城墙', move: '移动城墙', gate: '放置城门' };
    EventBus.emit('toast:show', { type: 'info', message: '当前工具: ' + (names[tool] || tool) });
  },

  // 城墙编辑模式下的 Canvas 点击处理
  _onWallEditClick: function (gx, gy) {
    var tool = this._wallEditTool;

    if (tool === 'place') {
      var result = TowerDefenseManager.buildWall(gx, gy);
      if (result.ok) {
        EventBus.emit('toast:show', { type: 'success', message: '城墙已放置' });
      } else {
        EventBus.emit('toast:show', { type: 'warning', message: result.reason });
      }
      this._updateStatusBar();
      return;
    }

    if (tool === 'gate') {
      var result2 = TowerDefenseManager.buildGate(gx, gy);
      if (result2.ok) {
        EventBus.emit('toast:show', { type: 'success', message: '城门已放置' });
      } else {
        EventBus.emit('toast:show', { type: 'warning', message: result2.reason });
      }
      this._updateStatusBar();
      return;
    }

    if (tool === 'upgrade') {
      var wall = TowerDefenseManager._findWallAtGrid(gx, gy);
      if (wall) {
        this._showWallInfo(wall.uid);
      } else {
        EventBus.emit('toast:show', { type: 'info', message: '请点击已有的城墙' });
      }
      return;
    }

    if (tool === 'remove') {
      var wall2 = TowerDefenseManager._findWallAtGrid(gx, gy);
      if (wall2) {
        this._confirmRemoveWall(wall2.uid);
      } else {
        EventBus.emit('toast:show', { type: 'info', message: '请点击要拆除的城墙' });
      }
      return;
    }

    if (tool === 'move') {
      if (this._wallMovingUid) {
        // 第二次点击 — 移动到目标位置
        var moveResult = TowerDefenseManager.moveWall(this._wallMovingUid, gx, gy);
        if (moveResult.ok) {
          EventBus.emit('toast:show', { type: 'success', message: '城墙已移动' });
        } else {
          EventBus.emit('toast:show', { type: 'warning', message: moveResult.reason });
        }
        this._wallMovingUid = null;
      } else {
        // 第一次点击 — 选中要移动的墙
        var wall3 = TowerDefenseManager._findWallAtGrid(gx, gy);
        if (wall3) {
          this._wallMovingUid = wall3.uid;
          this._selectedTowerUid = wall3.uid;
          EventBus.emit('toast:show', { type: 'info', message: '已选中，点击目标位置移动' });
        } else {
          EventBus.emit('toast:show', { type: 'info', message: '请先点击要移动的城墙' });
        }
      }
      return;
    }
  },

  // 城墙拖拽放置
  _onWallEditDragStart: function (gx, gy) {
    if (this._wallEditTool === 'place' || this._wallEditTool === 'upgrade') {
      this._wallDragging = true;
      this._wallDragPath = [{ gx: gx, gy: gy }];
      if (this._wallEditTool === 'place') {
        TowerDefenseManager.buildWall(gx, gy);
      } else {
        var w = TowerDefenseManager._findWallAtGrid(gx, gy);
        if (w) TowerDefenseManager.upgradeWall(w.uid);
      }
    }
  },

  _onWallEditDragMove: function (gx, gy) {
    if (!this._wallDragging) return;
    var path = this._wallDragPath;
    var last = path[path.length - 1];
    if (last && last.gx === gx && last.gy === gy) return;
    path.push({ gx: gx, gy: gy });
    if (this._wallEditTool === 'place') {
      TowerDefenseManager.buildWall(gx, gy);
    } else if (this._wallEditTool === 'upgrade') {
      var w = TowerDefenseManager._findWallAtGrid(gx, gy);
      if (w) TowerDefenseManager.upgradeWall(w.uid);
    }
  },

  _onWallEditDragEnd: function () {
    if (!this._wallDragging) return;
    this._wallDragging = false;
    var count = this._wallDragPath.length;
    this._wallDragPath = [];
    if (count > 1) {
      EventBus.emit('toast:show', { type: 'success', message: '批量放置 ' + count + ' 段城墙' });
    }
    this._updateStatusBar();
  },

  // 城墙信息面板（点击已有墙 → 升级/拆除）
  _showWallInfo: function (wallUid) {
    var wall = TowerDefenseManager._findWall(wallUid);
    if (!wall) return;

    var upgradeTable = typeof TDWallUpgradeTable !== 'undefined' ? TDWallUpgradeTable : null;
    var currentData = upgradeTable ? upgradeTable[wall.level] : null;
    var nextData = upgradeTable && wall.level < 10 ? upgradeTable[wall.level + 1] : null;
    var maxLevel = TowerDefenseManager.getMaxWallLevel();
    var isGate = wall.type === 'td_gate';
    var typeName = isGate ? '城门' : '城墙';
    var tierNames = { wood: '木栅栏', stone: '石城墙', iron: '铁壁', gold: '金城墙', legend: '传奇城墙' };
    var tier = currentData ? (tierNames[currentData.tier] || typeName) : typeName;

    var html = '<div style="text-align:center;padding:8px;">';
    html += '<div style="font-size:28px;margin:4px 0;">' + (isGate ? UIIcons.icon('build') : UIIcons.icon('defense')) + '</div>';
    html += '<h3 style="color:var(--color-gold);margin:4px 0;">' + tier + ' Lv.' + wall.level + '</h3>';

    // HP 信息
    if (currentData) {
      var hp = isGate ? Math.floor(currentData.hp * 0.8) : currentData.hp;
      html += '<div style="font-size:13px;color:var(--color-text);margin:8px 0;">❤ HP: ' + Utils.formatNumber(hp) + '</div>';
    }

    html += '<hr style="border-color:#4a3728;margin:12px 0;">';

    // 升级按钮
    if (wall.level < 10 && wall.level < maxLevel) {
      var cost = TowerDefenseManager.getWallUpgradeCost(wall.uid);
      var canAfford = typeof ResourceManager !== 'undefined' ? ResourceManager.canAffordMultiple(cost) : true;
      var costStr = this._formatCost(cost);
      var nextHp = nextData ? (isGate ? Math.floor(nextData.hp * 0.8) : nextData.hp) : '?';
      html += '<div style="font-size:12px;color:var(--color-text-dim);margin:4px 0;">升级到 Lv.' + (wall.level + 1) + '：HP ' + Utils.formatNumber(nextHp) + '</div>';
      html += '<button class="btn" style="width:100%;margin:4px 0;font-size:13px;' + (canAfford ? '' : 'opacity:0.5;pointer-events:none;') + '" onclick="TowerDefensePanel._upgradeWall(\'' + wallUid + '\')">⬆ 升级　费用: ' + costStr + '</button>';
    } else if (wall.level >= maxLevel && wall.level < 10) {
      html += '<div style="font-size:12px;color:var(--color-danger);margin:4px 0;">需要升级城墙建筑解锁更高等级</div>';
      html += '<button class="btn" style="width:100%;margin:4px 0;font-size:13px;opacity:0.5;" disabled>⬆ 等级上限 Lv.' + maxLevel + '</button>';
    } else {
      html += '<button class="btn" style="width:100%;margin:4px 0;font-size:13px;opacity:0.5;" disabled>⬆ 已满级</button>';
    }

    // 拆除按钮（返还 50%）
    var removeCost = currentData ? {} : {};
    if (currentData && currentData.cost) {
      removeCost = {};
      for (var res in currentData.cost) {
        if (currentData.cost.hasOwnProperty(res)) {
          removeCost[res] = Math.floor(currentData.cost[res] * 0.5);
        }
      }
    }
    var removeStr = this._formatCost(removeCost);
    html += '<button class="btn" style="width:100%;margin:4px 0;font-size:13px;background:#3a2020;border-color:#7a3030;" onclick="TowerDefensePanel._confirmRemoveWall(\'' + wallUid + '\')">🔻 拆除　返还: ' + removeStr + ' (50%)</button>';

    html += '</div>';

    OverlayPanel.show({
      title: (isGate ? UIIcons.icon('build') : UIIcons.icon('defense')) + ' ' + tier,
      content: html,
      panelId: 'td-wall-info',
      height: 'half'
    });
  },

  _upgradeWall: function (uid) {
    var result = TowerDefenseManager.upgradeWall(uid);
    if (result.ok) {
      EventBus.emit('toast:show', { type: 'success', message: '城墙升级成功！' });
      OverlayPanel.close();
      this._updateStatusBar();
    } else {
      EventBus.emit('toast:show', { type: 'warning', message: result.reason });
    }
  },

  _batchUpgradeWalls: function () {
    // 找出所有最低等级的墙段
    var walls = TowerDefenseManager.getState().walls || [];
    if (walls.length === 0) {
      EventBus.emit('toast:show', { type: 'warning', message: '没有城墙可升级' });
      return;
    }
    var maxLevel = TowerDefenseManager.getMaxWallLevel();
    var minLv = 999;
    for (var i = 0; i < walls.length; i++) {
      if (walls[i].level < minLv) minLv = walls[i].level;
    }
    if (minLv >= maxLevel) {
      EventBus.emit('toast:show', { type: 'warning', message: '所有城墙已达当前等级上限' });
      return;
    }
    var uids = [];
    for (var j = 0; j < walls.length; j++) {
      if (walls[j].level === minLv) uids.push(walls[j].uid);
    }
    var results = TowerDefenseManager.upgradeWallBatch(uids);
    var success = 0;
    for (var k = 0; k < results.length; k++) {
      if (results[k].ok) success++;
    }
    if (success > 0) {
      EventBus.emit('toast:show', { type: 'success', message: '批量升级 ' + success + ' 段城墙至 Lv.' + (minLv + 1) + '！' });
    } else {
      EventBus.emit('toast:show', { type: 'warning', message: '资源不足或已达等级上限' });
    }
    this._updateStatusBar();
  },

  _confirmRemoveWall: function (uid) {
    var self = this;
    Modal.show({
      title: '确认拆除',
      content: '确定要拆除此城墙吗？将返还 50% 资源。',
      confirmText: '拆除',
      cancelText: '取消',
      onConfirm: function () {
        var result = TowerDefenseManager.removeWall(uid);
        if (result.ok) {
          EventBus.emit('toast:show', { type: 'success', message: '已拆除，返还资源' });
          OverlayPanel.close();
          self._selectedTowerUid = null;
          self._updateStatusBar();
        } else {
          EventBus.emit('toast:show', { type: 'warning', message: result.reason });
        }
      }
    });
  },

  // 城墙编辑模式工具栏渲染
  _renderWallToolbar: function () {
    var state = TowerDefenseManager.getState();
    var wallCount = TowerDefenseManager.getWallCount();
    var maxWalls = TowerDefenseManager.getMaxWalls();
    var maxLevel = TowerDefenseManager.getMaxWallLevel();
    var walls = (TowerDefenseManager.getState().walls || []);
    var avgLevel = 0;
    if (walls.length > 0) {
      var sum = 0;
      for (var wsi = 0; wsi < walls.length; wsi++) sum += walls[wsi].level || 1;
      avgLevel = sum / walls.length;
    }
    var buildCost = (typeof TDWallUpgradeTable !== 'undefined' && TDWallUpgradeTable[1]) ? TDWallUpgradeTable[1].cost : null;
    var costStr = buildCost ? this._formatCost(buildCost) : '';

    var html = '';

    // 信息栏
    html += '<div style="display:flex;justify-content:space-between;padding:6px 12px;font-size:12px;color:#ccc;border-bottom:1px solid rgba(255,255,255,0.1);">';
    html += '<span>' + UIIcons.icon('defense') + ' 城墙: ' + wallCount + '/' + maxWalls + '</span>';
    html += '<span>最高等级: Lv.' + maxLevel + '</span>';
    if (walls.length > 0) {
      html += '<span>平均: Lv.' + avgLevel.toFixed(1) + '</span>';
    }
    html += '</div>';

    // 工具栏按钮
    html += '<div style="display:flex;padding:8px 12px;gap:6px;">';
    var tools = [
      { id: 'place', icon: UIIcons.icon('defense'), label: '放置', desc: '新Lv.1 ' + costStr },
      { id: 'gate', icon: UIIcons.icon('build'), label: '城门', desc: '特殊墙段' },
      { id: 'upgrade', icon: '⬆', label: '升级', desc: '点击/拖拽' },
      { id: 'remove', icon: '🔻', label: '拆除', desc: '返还50%' },
      { id: 'move', icon: '↔', label: '移动', desc: '免费' }
    ];

    for (var i = 0; i < tools.length; i++) {
      var t = tools[i];
      var active = this._wallEditTool === t.id;
      html += '<div style="display:flex;flex-direction:column;align-items:center;flex:1;cursor:pointer;opacity:' + (active ? '1' : '0.6') + ';" onclick="TowerDefensePanel._setWallTool(\'' + t.id + '\')">';
      html += '<div style="width:40px;height:40px;border-radius:6px;border:2px solid ' + (active ? '#f5c518' : '#4a3728') + ';background:' + (active ? 'rgba(245,197,24,0.15)' : 'rgba(22,33,62,0.8)') + ';display:flex;align-items:center;justify-content:center;font-size:18px;">' + t.icon + '</div>';
      html += '<span style="font-size:10px;color:' + (active ? '#f5c518' : '#999') + ';margin-top:2px;">' + t.label + '</span>';
      html += '</div>';
    }

    html += '</div>';

    // 批量升级按钮
    html += '<div style="display:flex;padding:4px 12px 8px;gap:6px;">';
    html += '<button class="btn" style="flex:1;font-size:12px;padding:6px 0;" onclick="TowerDefensePanel._batchUpgradeWalls()">⬆ 批量升级最低等级</button>';
    html += '<button class="btn" style="flex:1;font-size:12px;padding:6px 0;background:#3a2020;border-color:#7a3030;" onclick="TowerDefensePanel._exitWallEditMode()">✓ 完成编辑</button>';
    html += '</div>';

    return html;
  },

  // ========== T16: 科技面板 ==========

  _showTechPanel: function () {
    var thLevel = 0;
    if (typeof TownManager !== 'undefined' && TownManager.getBuildingLevel) {
      thLevel = TownManager.getBuildingLevel('town_hall');
    }
    
    var html = '<div style="padding:8px;">';
    html += '<div style="text-align:center;margin-bottom:12px;">';
    html += '<span style="font-size:16px;color:var(--color-gold);">🏯 城主府等级: Lv.' + thLevel + '</span>';
    html += '</div>';
    
    // 按城主府等级分组显示建筑
    var unlockLevels = typeof TDTownHallUnlockTable !== 'undefined' ? TDTownHallUnlockTable : {};
    var levels = Object.keys(unlockLevels).sort(function(a,b){ return parseInt(a)-parseInt(b); });
    
    for (var li = 0; li < levels.length; li++) {
      var level = parseInt(levels[li]);
      var towerIds = unlockLevels[level];
      var isUnlocked = thLevel >= level;
      
      html += '<div class="card" style="margin:8px 0;padding:12px;' + (!isUnlocked ? 'opacity:0.5;' : '') + '">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
      html += '<b style="color:var(--color-gold);">城主府 Lv.' + level + '</b>';
      html += '<span style="font-size:12px;color:' + (isUnlocked ? 'var(--color-success)' : 'var(--color-text-dim)') + ';">' + (isUnlocked ? '✅ 已解锁' : UIIcons.icon('lock') + ' 未解锁') + '</span>';
      html += '</div>';
      
      html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
      for (var t = 0; t < towerIds.length; t++) {
        var td = TDTowerData[towerIds[t]];
        if (!td) continue;
        html += '<div style="text-align:center;min-width:60px;padding:4px;">';
        html += '<div style="width:48px;height:48px;border:1px solid #4a3728;border-radius:4px;display:flex;align-items:center;justify-content:center;margin:0 auto;">';
        // 用 emoji fallback 或 canvas 缩略图（这里用文字标识）
        html += '<span style="font-size:11px;color:#ccc;">' + td.name.substring(0,2) + '</span>';
        html += '</div>';
        html += '<div style="font-size:10px;color:var(--color-text);margin-top:2px;">' + td.name + '</div>';
        var costText = '';
        if (td.cost.gold) costText = td.cost.gold + '金';
        html += '<div style="font-size:9px;color:var(--color-text-dim);">' + costText + '</div>';
        html += '</div>';
      }
      html += '</div></div>';
    }
    
    html += '</div>';
    
    OverlayPanel.show({
      title: '🏗 建筑解锁',
      content: html,
      panelId: 'td-tech',
      height: 'full'
    });
  },

  // _startResearch removed — replaced by town hall unlock system

  // ========== T16: 武将面板 ==========

  _showHeroPanel: function () {
    var state = TowerDefenseManager.getState();
    var assigned = TowerDefenseManager.getAssignedHeroes();
    var html = '<div style="padding:8px;">';

    // 已派驻武将
    html += '<div style="font-size:13px;color:var(--color-gold);margin-bottom:8px;">⚔ 防守武将 (' + assigned.length + '/' + TD_CONSTANTS.MAX_ASSIGNED_HEROES + ')</div>';

    if (assigned.length > 0) {
      for (var i = 0; i < assigned.length; i++) {
        var a = assigned[i];
        var bonus = Math.floor(a.stats.atk / 10);
        html += '<div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:8px;margin:4px 0;">';
        html += '<div>';
        html += '<b>' + (a.stats.name || '武将') + '</b> Lv.' + a.stats.level;
        html += '<span style="color:var(--color-success);margin-left:6px;font-size:12px;">ATK+' + bonus + '%</span>';
        html += '<span style="color:var(--color-gold);margin-left:6px;font-size:11px;">已派驻</span>';
        html += '</div>';
        html += '<button class="btn" style="font-size:11px;padding:4px 8px;background:#3a2020;border-color:#7a3030;" onclick="TowerDefensePanel._removeHero(\'' + a.uid + '\')">撤回</button>';
        html += '</div>';
      }
    } else {
      html += '<div style="color:var(--color-text-dim);font-size:12px;margin:8px 0;">暂无派驻武将</div>';
    }

    html += '<hr style="border-color:#4a3728;margin:12px 0;">';
    html += '<div style="font-size:13px;color:var(--color-text);margin-bottom:8px;">可派驻武将</div>';

    // 可用武将列表
    var allHeroes = [];
    if (typeof HeroManager !== 'undefined' && HeroManager.getAll) {
      allHeroes = HeroManager.getAll();
    }
    var teamUids = (typeof HeroManager !== 'undefined' && HeroManager.getTeamUids) ? HeroManager.getTeamUids() : [];
    var assignedUids = state.assignedHeroes;

    for (var h = 0; h < allHeroes.length; h++) {
      var hero = allHeroes[h];
      if (assignedUids.indexOf(hero.uid) !== -1) continue; // 已派驻的跳过

      var isInTeam = teamUids.indexOf(hero.uid) !== -1;
      var heroStats = null;
      if (typeof HeroManager !== 'undefined' && HeroManager.getHeroStats) {
        heroStats = HeroManager.getHeroStats(hero.uid);
      }
      if (!heroStats) continue;

      var heroBonus = Math.floor(heroStats.atk / 10);

      html += '<div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:8px;margin:4px 0;' + (isInTeam ? 'opacity:0.5;' : '') + '">';
      html += '<div>';
      html += '<b>' + (heroStats.name || '武将') + '</b> Lv.' + heroStats.level;
      html += '<span style="color:var(--color-text-dim);margin-left:6px;font-size:12px;">ATK+' + heroBonus + '%</span>';
      html += '</div>';

      if (isInTeam) {
        html += '<span style="font-size:11px;color:var(--color-danger);">出征中(不可用)</span>';
      } else {
        html += '<button class="btn" style="font-size:11px;padding:4px 8px;" onclick="TowerDefensePanel._startHeroDeploy(\'' + hero.uid + '\')">📌 部署</button>';
      }
      html += '</div>';
    }

    if (allHeroes.length === 0) {
      html += '<div style="color:var(--color-text-dim);font-size:12px;">暂无武将</div>';
    }

    html += '</div>';

    OverlayPanel.show({
      title: UIIcons.icon('battle') + ' 防守武将',
      content: html,
      panelId: 'td-heroes',
      height: 'half'
    });
  },

  _assignHero: function (heroUid) {
    var assigned = TowerDefenseManager.getAssignedHeroes();
    if (assigned.length >= TD_CONSTANTS.MAX_ASSIGNED_HEROES) {
      // 满员，确认替换
      var self = this;
      Modal.show({
        title: '防守位已满',
        content: '防守位已有 ' + TD_CONSTANTS.MAX_ASSIGNED_HEROES + ' 名武将，新武将将替换最后一名。确认？',
        confirmText: '确认替换',
        onConfirm: function () {
          var result = TowerDefenseManager.assignHero(heroUid);
          if (result.ok) {
            EventBus.emit('toast:show', { type: 'success', message: '武将已派驻！' });
            self._showHeroPanel(); // 刷新
          } else {
            EventBus.emit('toast:show', { type: 'warning', message: result.reason });
          }
        }
      });
      return;
    }

    var result = TowerDefenseManager.assignHero(heroUid);
    if (result.ok) {
      EventBus.emit('toast:show', { type: 'success', message: '武将已派驻！' });
      this._showHeroPanel(); // 刷新
    } else {
      EventBus.emit('toast:show', { type: 'warning', message: result.reason });
    }
  },

  _removeHero: function (heroUid) {
    TowerDefenseManager.removeHero(heroUid);
    EventBus.emit('toast:show', { type: 'info', message: '武将已撤回' });
    this._showHeroPanel(); // 刷新
  },

  _heroDeployUid: null,

  _startHeroDeploy: function (heroUid) {
    this._heroDeployUid = heroUid;
    this._placementMode = false;
    this._selectedTowerType = null;
    OverlayPanel.close();
    EventBus.emit('toast:show', { type: 'info', message: '点击地图选择武将部署位置' });
  },

  _onCanvasClickForHeroDeploy: function (gx, gy) {
    if (!this._heroDeployUid) return false;

    var result = TowerDefenseManager.deployHero(this._heroDeployUid, gx, gy);
    if (result.ok) {
      EventBus.emit('toast:show', { type: 'success', message: '武将已部署！' });
    } else {
      EventBus.emit('toast:show', { type: 'warning', message: result.reason });
    }
    this._heroDeployUid = null;
    return true;
  },

  // ========== T17: 波次结算弹窗 ==========

  _onWaveCleared: function (data) {
    if (!this._inDefenseMode) return;
    if (data.auto) return; // 自动防守不弹窗

    this._updateStatusBar();
    this._updateToolbar();

    var rewards = data.rewards || {};

    // 关卡通关信息
    var titleText = '🎉 战斗胜利！';
    var stageInfo = '';
    if (data.chapter && data.stage) {
      titleText = '🎉 第' + data.chapter + '章-' + data.stage + ' 通关！';
      // 查找星级
      var key = data.chapter + '_' + data.stage;
      var progress = TowerDefenseManager.getState().stageProgress[key];
      if (progress) {
        var starStr = '';
        for (var i = 0; i < 3; i++) starStr += i < progress.stars ? '⭐' : '☆';
        stageInfo = '<p style="font-size:16px;margin:4px 0;">' + starStr + '</p>';
      }
    }

    var self = this;
    var isManual = !data.auto;
    var bonusText = isManual ? '<p style="font-size:11px;color:var(--color-success);">手动加成: +30%金币 +20%经验</p>' : '';
    var practiceText = data.isPractice ? '<p style="font-size:11px;color:var(--color-text-dim);">🎯 练习模式 — 奖励×25%，无装备/玉石掉落</p>' : '';

    // 连杀加成信息
    var killStreakText = '';
    if (data.maxKillStreak && data.maxKillStreak >= 2) {
      var bonusPct = Math.round((data.killStreakGoldBonus || 0) * 100);
      killStreakText = '<p style="font-size:11px;color:#FFD700;">🔥 最高连杀: ' + data.maxKillStreak + (bonusPct > 0 ? '（金币+' + bonusPct + '%）' : '') + '</p>';
    }

    Modal.show({
      title: titleText,
      content:
        '<div style="text-align:center;line-height:1.8;">' +
          stageInfo +
          '<p>💰 ' + Utils.formatNumber(rewards.gold || 0) + ' 金币　⭐ ' + Utils.formatNumber(rewards.exp || 0) + ' 经验</p>' +
          (rewards.jade ? '<p>💎 ' + rewards.jade + ' 玉璧</p>' : '') +
          (rewards.equipDrop ? '<p style="color:var(--color-primary);">🎁 获得装备掉落！</p>' : '') +
          bonusText +
          practiceText +
          killStreakText +
        '</div>',
      confirmText: '返回',
      showCancel: false,
      onConfirm: function () {
        self._exitDefenseMode();
        // 重新打开章节选择
        setTimeout(function () {
          self.showChapterSelect();
        }, 300);
      }
    });
  },

  _onWaveFailed: function (data) {
    if (!this._inDefenseMode) return;

    this._updateStatusBar();
    this._updateToolbar();

    var self = this;
    Modal.show({
      title: '💀 防守失败',
      content:
        '<div style="text-align:center;line-height:1.8;">' +
          '<p>城主府被攻破！</p>' +
          '<p style="font-size:12px;color:var(--color-text-dim);">城主府 HP 已恢复，可重新挑战</p>' +
          '<p style="font-size:12px;color:var(--color-text-dim);">提示：升级防御塔或增加新塔提升防御力</p>' +
        '</div>',
      confirmText: '返回',
      showCancel: false,
      onConfirm: function () {
        self._exitDefenseMode();
        setTimeout(function () {
          self.showChapterSelect();
        }, 300);
      }
    });
  },

  // ========== T17: 新手引导 ==========

  _showTutorial: function () {
    var self = this;
    var steps = [
      {
        title: UIIcons.icon('defense') + ' 城防指南 (1/3)',
        content: '<div style="text-align:center;line-height:1.8;"><p>从底部工具栏选择防御塔</p><p>然后点击地图上的 <span style="color:#4caf50;">绿色格子</span> 放置</p><p style="font-size:18px;margin-top:8px;">🏹 试试放置一座箭塔！</p></div>'
      },
      {
        title: UIIcons.icon('defense') + ' 城防指南 (2/3)',
        content: '<div style="text-align:center;line-height:1.8;"><p>敌人将从地图边缘进攻</p><p>防守 <span style="color:var(--color-gold);">城主府 🏯</span> 不被攻破！</p><p style="font-size:12px;color:var(--color-text-dim);margin-top:8px;">敌人会沿路径向城主府推进<br>墙体可以阻挡敌人前进</p></div>'
      },
      {
        title: UIIcons.icon('defense') + ' 城防指南 (3/3)',
        content: '<div style="text-align:center;line-height:1.8;"><p>准备好后点击</p><p style="color:var(--color-primary);font-size:16px;font-weight:bold;">⚔ 开始波次</p><p style="font-size:12px;color:var(--color-text-dim);margin-top:8px;">通关波次获得金币和经验奖励<br>手动操作比自动防守收益更高！</p></div>'
      }
    ];

    var showStep = function (idx) {
      if (idx >= steps.length) {
        // 引导完成
        TowerDefenseManager._state.tutorialSeen = true;
        return;
      }

      Modal.show({
        title: steps[idx].title,
        content: steps[idx].content,
        confirmText: idx < steps.length - 1 ? '下一步' : '开始防守！',
        showCancel: false,
        onConfirm: function () {
          showStep(idx + 1);
        }
      });
    };

    showStep(0);
  },

  // ========== 工具方法 ==========

  _formatTime: function (seconds) {
    if (seconds === null || seconds === undefined) return '--:--';
    seconds = Math.max(0, Math.ceil(seconds));
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    if (m > 60) {
      var h = Math.floor(m / 60);
      m = m % 60;
      return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
};
