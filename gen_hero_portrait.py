"""Generate a hero portrait for the idle Three Kingdoms game using CellCog."""
import os
os.environ["CELLCOG_API_KEY"] = "sk_db71e82088d5689a1ae241aaea5786e6d844a81a2dc15daf7215b7944853e8e7"

from cellcog import CellCogClient

client = CellCogClient()

output_dir = os.path.abspath("assets/img/heroes")
os.makedirs(output_dir, exist_ok=True)

prompt = """
为一个搞笑风格的三国题材放置（Idle）手游生成武将头像。

角色：诸葛亮
设定：他是"蜀·外卖公司"的 CEO，手持羽扇，穿着古代与现代混搭的服装（比如古装长袍 + 外卖骑手头盔），表情自信而略带搞笑。

风格要求：
- Q版/卡通风格，适合手游 UI 头像
- 色彩鲜艳、饱和度高
- 透明背景 PNG
- 尺寸：256x256 像素
- 圆形或方形头像构图，聚焦面部和上半身

请生成一张头像图片。
<GENERATE_FILE>{output_path}</GENERATE_FILE>
""".format(output_path=os.path.join(output_dir, "zhugeliang.png").replace("\\", "/"))

print(f"Output path: {os.path.join(output_dir, 'zhugeliang.png')}")
print("Creating CellCog task...")

result = client.create_chat(
    prompt=prompt,
    notify_session_key="agent:main:main",
    task_label="hero-portrait-zhugeliang",
    chat_mode="agent"
)

chat_id = result["chat_id"]
print(f"Chat ID: {chat_id}")
print(f"Status: {result.get('status')}")
print("Waiting for completion...")

completion = client.wait_for_completion(chat_id, timeout=300)
print(f"Completed: {not completion.get('is_operating')}")
print(f"Status: {completion.get('status')}")

print("\n=== Chat History ===")
history = client.get_history(chat_id)
print(history.get("formatted_output", "No output")[:2000])

# Check if file was generated
output_file = os.path.join(output_dir, "zhugeliang.png")
if os.path.exists(output_file):
    size = os.path.getsize(output_file)
    print(f"\n✅ File generated: {output_file} ({size} bytes)")
else:
    print(f"\n⚠️ File not found at {output_file}")
    print("Check ~/.cellcog/chats/ for auto-downloaded files.")
    cellcog_dir = os.path.expanduser(f"~/.cellcog/chats/{chat_id}")
    if os.path.exists(cellcog_dir):
        for root, dirs, files in os.walk(cellcog_dir):
            for f in files:
                fpath = os.path.join(root, f)
                print(f"  Found: {fpath} ({os.path.getsize(fpath)} bytes)")
