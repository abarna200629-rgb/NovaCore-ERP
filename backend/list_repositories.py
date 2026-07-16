import os

path = r"c:\Users\ABARNA\Downloads\backend (1)\backend\src\main\java\com\erp\backend\repository"
for root, dirs, files in os.walk(path):
    for file in files:
        if file.endswith(".java"):
            print(os.path.join(root, file))
