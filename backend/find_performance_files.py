import os

def find_file_pattern(pattern, path):
    results = []
    for root, dirs, files in os.walk(path):
        for f in files:
            if pattern in f:
                results.append(os.path.join(root, f))
    return results

backend_src = "c:\\Users\\ABARNA\\Downloads\\backend (1)\\backend"
print("Performance files:")
for f in find_file_pattern("Performance", backend_src):
    print(f)
