# UI 像素图标资源

本目录存放通过生图 skill 生成的幻想三国 UI 像素图标。

- 输出尺寸：96x96 PNG
- 风格：three-kingdoms-ink-gold-pixel-raster
- 生成摘要：6 张 4x4 生图母版，统一要求 16-bit pixel art、三国古风、深墨描边、朱红与鎏金点缀、纯色绿幕/洋红幕背景、无文字标签。
- 接入方式：`js/core/ui-icons.js` 通过 `UIIcons.icon()` 和 `UIIcons.render()` 生成 PNG 图标。
- 语义说明：`descriptions.json` 记录每个图标的视觉内容、游戏语义和推荐使用场景，供后续 Agent 查询。

## 生图母版

| 文件 | 主题 |
|------|------|
| sheets/ui-icons-sheet-1.png | 核心资源与主导航 |
| sheets/ui-icons-sheet-2.png | 系统入口与玩法 |
| sheets/ui-icons-sheet-3.png | 状态与操作 |
| sheets/ui-icons-sheet-4.png | 战斗属性与物品 |
| sheets/ui-icons-sheet-5.png | 冒险、菜园与日常操作补充 |
| sheets/ui-icons-sheet-6.png | 试炼增益与敌军类型补充 |

## 图标清单

| ID | 名称 | 分类 | 文件 |
|----|------|------|------|
| abyss | 深渊 | system | abyss.png |
| accessory | 饰品 | item | accessory.png |
| achievement | 成就 | system | achievement.png |
| adventure | 冒险 | navigation | adventure.png |
| armor | 防具 | item | armor.png |
| attack | 攻击 | combat | attack.png |
| bag | 背包 | item | bag.png |
| battle | 战斗 | navigation | battle.png |
| book | 图鉴 | item | book.png |
| boss | Boss | combat | boss.png |
| buff-attack | 虎威 | buff | buff-attack.png |
| buff-crit | 破军 | buff | buff-crit.png |
| buff-defense | 龟甲 | buff | buff-defense.png |
| buff-double | 连击 | buff | buff-double.png |
| buff-energy | 气海 | buff | buff-energy.png |
| buff-heal | 妙手 | buff | buff-heal.png |
| buff-hp | 生机 | buff | buff-hp.png |
| buff-lifesteal | 嗜血 | buff | buff-lifesteal.png |
| buff-speed | 神速 | buff | buff-speed.png |
| buff-thorns | 荆棘 | buff | buff-thorns.png |
| build | 建造 | system | build.png |
| calendar | 日历 | system | calendar.png |
| check | 完成 | state | check.png |
| chest | 宝箱 | item | chest.png |
| close | 关闭 | state | close.png |
| compost | 堆肥 | system | compost.png |
| cook | 料理 | action | cook.png |
| core | 核心 | system | core.png |
| crop | 作物 | item | crop.png |
| crown | 首领 | combat | crown.png |
| daily | 日挑 | system | daily.png |
| defeat | 失败 | state | defeat.png |
| defense | 城防 | system | defense.png |
| economy | 经济 | system | economy.png |
| enemy | 敌人 | combat | enemy.png |
| enemy-archer | 弓手 | combat | enemy-archer.png |
| enemy-assassin | 刺客 | combat | enemy-assassin.png |
| enemy-dagger | 匕首敌兵 | combat | enemy-dagger.png |
| enemy-drum | 战鼓 | combat | enemy-drum.png |
| enemy-magic | 术士 | combat | enemy-magic.png |
| enemy-shield | 盾卫 | combat | enemy-shield.png |
| equipment | 装备 | navigation | equipment.png |
| exp | 经验 | resource | exp.png |
| farm | 菜园 | system | farm.png |
| fertilizer | 肥料 | item | fertilizer.png |
| flame | 火焰 | combat | flame.png |
| food | 粮草 | resource | food.png |
| forge | 锻造 | system | forge.png |
| functional | 功能 | system | functional.png |
| gift | 奖励 | action | gift.png |
| gold | 金币 | resource | gold.png |
| hammer | 锤子 | action | hammer.png |
| harvest | 收获 | action | harvest.png |
| heroes | 武将 | navigation | heroes.png |
| hp | 生命 | stat | hp.png |
| idea | 建议 | action | idea.png |
| idle | 挂机 | action | idle.png |
| iron | 铁矿 | resource | iron.png |
| jade | 玉璧 | resource | jade.png |
| list | 列表 | action | list.png |
| lock | 未解锁 | state | lock.png |
| manage | 管理 | system | manage.png |
| map | 地图 | navigation | map.png |
| meal | 餐食 | item | meal.png |
| merchant | 商人 | navigation | merchant.png |
| more | 更多 | navigation | more.png |
| mount | 坐骑 | item | mount.png |
| parking | 驿站 | system | parking.png |
| pest | 虫害 | state | pest.png |
| production | 生产 | system | production.png |
| quest | 任务 | navigation | quest.png |
| recruit | 招募 | navigation | recruit.png |
| seed | 种子 | item | seed.png |
| sell | 售卖 | action | sell.png |
| settings | 设置 | system | settings.png |
| shop | 商铺 | system | shop.png |
| soil | 田地 | system | soil.png |
| sort | 排序 | action | sort.png |
| sparkle | 特殊 | action | sparkle.png |
| spd | 速度 | stat | spd.png |
| speed | 速度 | action | speed.png |
| stats | 统计 | system | stats.png |
| stone | 石材 | resource | stone.png |
| story | 剧情 | system | story.png |
| synth | 合成 | action | synth.png |
| tag | 折扣 | action | tag.png |
| time | 时间 | action | time.png |
| town | 城镇 | navigation | town.png |
| trial | 试炼 | system | trial.png |
| trophy | 奖杯 | state | trophy.png |
| user | 角色 | state | user.png |
| victory | 胜利 | state | victory.png |
| warning | 警告 | state | warning.png |
| water | 浇水 | action | water.png |
| weapon | 武器 | item | weapon.png |
| wood | 木材 | resource | wood.png |
