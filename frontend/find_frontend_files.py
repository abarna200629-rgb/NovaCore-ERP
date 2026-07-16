import os

def find_file(name, path):
    for root, dirs, files in os.walk(path):
        if name in files:
            return os.path.join(root, name)
    return None

frontend_src = "c:\\Users\\ABARNA\\Downloads\\erp-frontend\\src"
print("Employees.js path:", find_file("Employees.js", frontend_src))
