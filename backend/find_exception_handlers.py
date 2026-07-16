import os

def find_advice(path):
    results = []
    for root, dirs, files in os.walk(path):
        for f in files:
            if f.endswith(".java"):
                fpath = os.path.join(root, f)
                with open(fpath, "r", encoding="utf-8", errors="ignore") as file:
                    content = file.read()
                    if "@ControllerAdvice" in content or "Advice" in f:
                        results.append((f, fpath))
    return results

backend_src = "c:\\Users\\ABARNA\\Downloads\\backend (1)\\backend"
print("Advice classes found:")
for f, fpath in find_advice(backend_src):
    print(f, "at", fpath)
