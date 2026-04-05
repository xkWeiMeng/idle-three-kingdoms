/**
 * 剧情管理器 —— 主线剧情推进 + 自言自语调度
 */
const StoryManager = {
  _state: {
    currentChapter: 'prologue',      // 当前章节
    completedChapters: [],            // 已完成章节列表
    seenScenes: [],                   // 已看过的场景 id
    monologueCooldown: 0,             // 自言自语冷却时间（秒）
    latestMonologue: null,            // 最近一次自言自语
  },

  MONOLOGUE_INTERVAL: 30, // 每30秒触发一次自言自语
  _heroIdAlias: {
    shu_zhugeliang: 'zhuge_liang',
    shu_liubei: 'liu_bei',
    shu_guanyu: 'guan_yu',
    shu_zhangfei: 'zhang_fei',
    shu_zhaoyun: 'zhao_yun',
    shu_huangzhong: 'huang_zhong',
    shu_machao: 'ma_chao',
    wei_caocao: 'cao_cao',
    wei_simayi: 'sima_yi',
    wei_xiahoudun: 'xiahou_dun',
    wei_zhangliao: 'zhang_liao',
    wei_dianwei: 'dian_wei',
    wei_xunyu: 'xun_yu',
    wu_sunquan: 'sun_quan',
    wu_zhouyu: 'zhou_yu',
    wu_sunshangxiang: 'sun_shangxiang',
    wu_taishici: 'tai_shi_ci',
    qun_lvbu: 'lv_bu',
    qun_diaochan: 'diao_chan',
    qun_huatuo: 'hua_tuo',
  },

  init(saved) {
    const data = (saved && saved.story) ? saved.story : saved;
    if (data && data.currentChapter !== undefined) {
      this._state = { ...this._state, ...data };
    }
  },

  _toStoryHeroId(heroId) {
    return this._heroIdAlias[heroId] || heroId;
  },

  /** 每 tick 减少冷却，触发自言自语 */
  onTick(dt) {
    this._state.monologueCooldown -= dt;
    if (this._state.monologueCooldown <= 0) {
      this._triggerMonologue();
      this._state.monologueCooldown = this.MONOLOGUE_INTERVAL;
    }
  },

  /** 获取当前可用的主线场景 */
  getCurrentScenes() {
    const chapter = this.getCurrentChapter();
    return chapter ? chapter.scenes : [];
  },

  getCurrentChapter() {
    if (this._state.currentChapter === 'prologue') {
      return MainStory.prologue;
    }
    return MainStory.chapters.find(c => c.id === this._state.currentChapter) || null;
  },

  /** 标记场景已读 */
  markSceneSeen(sceneId) {
    if (!this._state.seenScenes.includes(sceneId)) {
      this._state.seenScenes.push(sceneId);
      EventBus.emit('story:scene_seen', sceneId);
    }
  },

  /** 推进到下一章 */
  advanceChapter() {
    const chapters = MainStory.chapters;
    const idx = chapters.findIndex(c => c.id === this._state.currentChapter);

    if (this._state.currentChapter === 'prologue') {
      if (chapters.length > 0) {
        this._state.completedChapters.push('prologue');
        this._state.currentChapter = chapters[0].id;
        EventBus.emit('story:chapter_unlocked', chapters[0]);
      }
    } else if (idx >= 0 && idx < chapters.length - 1) {
      this._state.completedChapters.push(this._state.currentChapter);
      this._state.currentChapter = chapters[idx + 1].id;
      EventBus.emit('story:chapter_unlocked', chapters[idx + 1]);
    }
  },

  /** 检查剧情解锁条件 */
  checkUnlock(stageId) {
    const chapters = MainStory.chapters;
    const currentIdx = chapters.findIndex(c => c.id === this._state.currentChapter);
    const nextChapter = chapters[currentIdx + 1];
    if (nextChapter &&
        nextChapter.unlockCondition?.type === 'stage_clear' &&
        nextChapter.unlockCondition.stageId <= stageId) {
      this.advanceChapter();
    }
  },

  /** 触发一条随机自言自语 */
  _triggerMonologue() {
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 6;

    // 确定场景类别
    let category = 'idle';
    if (isNight) category = 'night';
    if (!isNight && ResourceManager.get(CONSTANTS.RESOURCE.GOLD) < 80) {
      category = 'lowMoney';
    } else if (!isNight && Math.random() < 0.1) {
      category = 'bored';
    }

    // 从所有已拥有武将 + 系统中随机选一个
    const sources = ['system'];
    const heroes = HeroManager.getAll();
    heroes.forEach(h => {
      const storyHeroId = this._toStoryHeroId(h.id);
      if (IdleMonologues[storyHeroId]) sources.push(storyHeroId);
    });

    const sourceId = sources[Utils.randInt(0, sources.length - 1)];
    const pool = IdleMonologues[sourceId];
    if (!pool) return;

    const lines = pool[category] || pool.idle || [];
    if (lines.length === 0) return;

    const line = lines[Utils.randInt(0, lines.length - 1)];
    const speakerName = sourceId === 'system' ? '天道系统' :
      (CharacterProfiles[sourceId]?.name || sourceId);

    const payload = { speaker: speakerName, text: line, ts: Date.now() };
    this._state.latestMonologue = payload;
    EventBus.emit('story:monologue', payload);
  },

  /** 获取角色对话 */
  getDialogue(characterId, category) {
    const dialogues = CharacterDialogues[characterId];
    if (!dialogues || !dialogues[category]) return null;
    const lines = dialogues[category];
    if (lines.length === 0) return null;
    return lines[Utils.randInt(0, lines.length - 1)];
  },

  /** 获取角色人设 */
  getProfile(characterId) {
    return CharacterProfiles[characterId] || null;
  },

  getState() {
    return Utils.deepClone(this._state);
  },
};
