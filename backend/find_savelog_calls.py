import os

search_dir = r"c:\Users\ABARNA\Downloads\backend (1)\backend\src\main\java"
keyword = "saveLog"

print(f"Searching for '{keyword}' calls:")
for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith(".java"):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line_num, line in enumerate(f, 1):
                        if keyword in line:
                            print(f"{file}:{line_num} -> {line.strip()}")
            except Exception as e:
                pass
