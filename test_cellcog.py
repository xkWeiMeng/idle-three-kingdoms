"""Quick CellCog API test — verifies connection and runs a simple task."""
import os
os.environ["CELLCOG_API_KEY"] = "sk_db71e82088d5689a1ae241aaea5786e6d844a81a2dc15daf7215b7944853e8e7"

from cellcog import CellCogClient

client = CellCogClient()

# Step 1: Check account status
print("=== 1. Account Status ===")
try:
    status = client.get_account_status()
    print(status)
except Exception as e:
    print(f"Error: {e}")
    print("API key may be invalid or network issue.")
    exit(1)

# Step 2: Create a simple test task
print("\n=== 2. Creating Test Task ===")
try:
    result = client.create_chat(
        prompt="Say 'Hello from CellCog!' in Chinese. Keep it short, one sentence only.",
        notify_session_key="agent:main:main",
        task_label="connection-test",
        chat_mode="agent"
    )
    print(f"Chat ID: {result.get('chat_id')}")
    print(f"Status: {result.get('status')}")
    print(f"Explanation: {result.get('explanation')}")
except Exception as e:
    print(f"Error: {e}")
    exit(1)

# Step 3: Wait for result
print("\n=== 3. Waiting for result (timeout 120s) ===")
try:
    completion = client.wait_for_completion(result["chat_id"], timeout=120)
    print(f"Completed: {not completion.get('is_operating')}")
    print(f"Status: {completion.get('status')}")
    print(f"Message: {completion.get('status_message')}")
except Exception as e:
    print(f"Error waiting: {e}")

# Step 4: Get history to see the response
print("\n=== 4. Chat History ===")
try:
    history = client.get_history(result["chat_id"])
    print(history.get("formatted_output", "No output"))
except Exception as e:
    print(f"Error getting history: {e}")

print("\n=== Test Complete ===")
