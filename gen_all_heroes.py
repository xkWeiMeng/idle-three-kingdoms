"""Batch generate all remaining hero portraits in a single CellCog call."""
import os
os.environ["CELLCOG_API_KEY"] = "sk_db71e82088d5689a1ae241aaea5786e6d844a81a2dc15daf7215b7944853e8e7"

from cellcog import CellCogClient

client = CellCogClient()

output_dir = os.path.abspath("assets/img/heroes").replace("\\", "/")
os.makedirs(output_dir, exist_ok=True)

heroes = [
    # 蜀
    ("liubei",       "刘备", "蜀·外卖公司", "不情愿皇帝", "穿龙袍但表情很不情愿，手拿皇冠像拿烫手山芋，温文尔雅但无奈"),
    ("guanyu",       "关羽", "蜀·外卖公司", "健身搭子", "红脸美髯公，穿运动背心，一手青龙偃月刀改成的杠铃，肌肉发达"),
    ("zhangfei",     "张飞", "蜀·外卖公司", "暴力教练", "黑脸暴躁形象，穿健身教练制服，手拿哨子在咆哮，额头青筋暴起"),
    ("zhaoyun",      "赵云", "蜀·外卖公司", "瑜伽教练", "白袍银甲帅气小生，做瑜伽姿势，手持瑜伽垫和长枪的混合体，优雅自信"),
    ("huangzhong",   "黄忠", "蜀·外卖公司", "退休射箭教练", "白发老将，戴老花眼镜，弓箭姿势但眯着眼睛看不清目标，搞笑认真"),
    ("machao",       "马超", "蜀·外卖公司", "快递小哥", "英俊年轻人，穿外卖骑手服骑电动车，手持长枪当旗杆插外卖旗"),
    # 魏
    ("caocao",       "曹操", "魏·草鞋电商帝国", "鞋业大亨", "奸雄气质，穿西装戴墨镜，手提一篮子草鞋，老板派头十足"),
    ("simayi",       "司马懿", "魏·草鞋电商帝国", "隐形创业者", "阴沉狡猾的狐狸脸，穿低调连帽卫衣，手里拿着隐形墨水笔写商业计划"),
    ("xiahoudun",    "夏侯惇", "魏·草鞋电商帝国", "独眼保安队长", "独眼穿保安制服，戴海盗眼罩，手持对讲机，凶悍但有喜感"),
    ("zhangliao",    "张辽", "魏·草鞋电商帝国", "仓库管理员", "穿仓库工作服戴安全帽，手拿货单和扫码枪，正在盘点货物"),
    ("dianwei",      "典韦", "魏·草鞋电商帝国", "贴身保镖", "壮汉穿黑色保镖西装戴耳麦，双手持安检棒代替双戟，严肃中带萌"),
    ("xunyu",        "荀彧", "魏·草鞋电商帝国", "首席财务官", "文雅书生，穿白衬衫打领带，手拿厚厚的财务报表和计算器，推眼镜"),
    # 吴
    ("sunquan",      "孙权", "吴·直播娱乐", "直播达人", "年轻帅气，手持自拍杆和环形补光灯，穿潮牌衣服，正在直播比心"),
    ("zhouyu",       "周瑜", "吴·直播娱乐", "经纪人/乐手", "风度翩翩弹电吉他，穿摇滚风格的古装混搭，背后有火焰特效"),
    ("sunshangxiang","孙尚香", "吴·直播娱乐", "电竞女主播", "英姿飒爽女性，戴电竞耳机，手拿游戏手柄，穿电竞战队服"),
    ("taishici",     "太史慈", "吴·直播娱乐", "外景记者", "阳光健壮，穿记者马甲，手持话筒采访，背着摄影包"),
    # 群
    ("lvbu",         "吕布", "群·自由职业者", "奶茶店店长", "帅气霸道但围着围裙，方天画戟变成巨型奶茶搅拌棒，手端一杯珍珠奶茶"),
    ("diaochan",     "貂蝉", "群·自由职业者", "美妆博主", "绝世美女，手持化妆刷和口红，面前摆着直播化妆镜和各种美妆产品"),
    ("huatuo",       "华佗", "群·自由职业者", "养生网红", "白发精神老者穿太极服，手持保温杯泡枸杞，背后有中药铺牌匾"),
]

# Build prompt with all GENERATE_FILE tags
generate_tags = ""
hero_descriptions = ""
for i, (file_id, name, faction, title, desc) in enumerate(heroes, 1):
    generate_tags += f'<GENERATE_FILE>{output_dir}/{file_id}.png</GENERATE_FILE>\n'
    hero_descriptions += f"{i}. **{name}**（{faction} · {title}）→ 文件名 `{file_id}.png`\n   描述：{desc}\n\n"

prompt = f"""
为一个搞笑风格的三国题材放置（Idle）手游批量生成 19 张武将 Q 版头像。

## 统一风格要求
- Q版/卡通风格，和已有的诸葛亮头像一致（参考下方）
- 色彩鲜艳、饱和度高
- 透明背景 PNG
- 256×256 像素
- 聚焦面部和上半身

## 已有参考
<SHOW_FILE>{output_dir}/zhugeliang.png</SHOW_FILE>
请确保新生成的 19 张与这张风格保持一致。

## 武将列表
{hero_descriptions}

## 输出文件
{generate_tags}

请逐一生成，确保每个武将特征鲜明、搞笑但好看。
"""

print(f"Generating {len(heroes)} hero portraits...")
print("This may take several minutes...\n")

result = client.create_chat(
    prompt=prompt,
    notify_session_key="agent:main:main",
    task_label="batch-hero-portraits",
    chat_mode="agent"
)

chat_id = result["chat_id"]
print(f"Chat ID: {chat_id}")

# Wait with long timeout for batch generation
completion = client.wait_for_completion(chat_id, timeout=600)
print(f"Completed: {not completion.get('is_operating')}")
print(f"Status: {completion.get('status')}")

# Check results
print("\n=== Generated Files ===")
found = 0
missing = []
for file_id, name, *_ in heroes:
    path = os.path.join(output_dir.replace("/", os.sep), f"{file_id}.png")
    if os.path.exists(path):
        size = os.path.getsize(path)
        print(f"  ✅ {name} ({file_id}.png) - {size} bytes")
        found += 1
    else:
        missing.append((file_id, name))

# Check cellcog download folder for any auto-downloaded files
if missing:
    print(f"\n⚠️ {len(missing)} files not at target path, checking cellcog cache...")
    cellcog_dir = os.path.expanduser(f"~/.cellcog/chats/{chat_id}")
    if os.path.exists(cellcog_dir):
        print(f"  Found cache at: {cellcog_dir}")
        for root, dirs, files in os.walk(cellcog_dir):
            for f in files:
                fpath = os.path.join(root, f)
                print(f"  📁 {fpath} ({os.path.getsize(fpath)} bytes)")

print(f"\n=== Summary: {found}/{len(heroes)} generated ===")

# Print chat history excerpt
history = client.get_history(chat_id)
output = history.get("formatted_output", "")
# Print last portion
if len(output) > 3000:
    print("\n=== Chat History (last 3000 chars) ===")
    print(output[-3000:])
else:
    print("\n=== Chat History ===")
    print(output)
