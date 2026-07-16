import os

import os

frontend_dir = r"c:\Users\ABARNA\Downloads\erp-frontend"
for root, dirs, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith((".js", ".jsx", ".html")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                if "inventory-dashboard" in content:
                    print(f"Found in {path}")
            except Exception:
                pass
