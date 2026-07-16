with open("C:\\Users\\ABARNA\\.gemini\\antigravity\\brain\\f0278825-845a-42ca-84f5-19e7bbaa2ce6\\.system_generated\\tasks\\task-11247.log", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print("Lines containing users/25:")
for idx, line in enumerate(lines):
    if "users/25" in line or "users/25" in line.lower() or "users" in line:
        # Print a few lines around it
        start = max(0, idx - 5)
        end = min(len(lines), idx + 5)
        print(f"--- Line {idx} ---")
        for i in range(start, end):
            print(f"{i}: {lines[i].strip()}")
