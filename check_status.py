"""Check batch hero generation status and wait for completion."""
import os
os.environ["CELLCOG_API_KEY"] = "sk_db71e82088d5689a1ae241aaea5786e6d844a81a2dc15daf7215b7944853e8e7"
from cellcog import CellCogClient
client = CellCogClient()

chat_id = "69c8b8cb9741613376186256"

status = client.get_status(chat_id)
is_op = status.get("is_operating")
print("Operating:", is_op)

if is_op:
    print("Still working, waiting up to 10 more minutes...")
    completion = client.wait_for_completion(chat_id, timeout=600)
    print("Completed:", not completion.get("is_operating"))

# Check files
output_dir = os.path.abspath("assets/img/heroes")
heroes = ["liubei","guanyu","zhangfei","zhaoyun","huangzhong","machao",
          "caocao","simayi","xiahoudun","zhangliao","dianwei","xunyu",
          "sunquan","zhouyu","sunshangxiang","taishici","lvbu","diaochan","huatuo"]
found = 0
for h in heroes:
    path = os.path.join(output_dir, h + ".png")
    if os.path.exists(path):
        found += 1
        print("  OK", h + ".png", os.path.getsize(path), "bytes")

# Check cellcog cache
cellcog_dir = os.path.expanduser("~/.cellcog/chats/" + chat_id)
if os.path.exists(cellcog_dir):
    print("Cache dir:", cellcog_dir)
    for root, dirs, files in os.walk(cellcog_dir):
        for f in files:
            fp = os.path.join(root, f)
            print("  CACHE", f, os.path.getsize(fp), "bytes")

print("\nFound:", found, "/ 19")

# Get latest history
history = client.get_history(chat_id)
output = history.get("formatted_output", "")
parts = output.split("<MESSAGE FROM cellcog")
if len(parts) > 1:
    last_msg = parts[-1][:3000]
    print("\n=== CellCog Response ===")
    print(last_msg)
else:
    print("No CellCog response yet")
