import os

exception_dir = "c:\\Users\\ABARNA\\Downloads\\backend (1)\\backend\\src\\main\\java\\com\\erp\\backend\\exception"
if os.path.exists(exception_dir):
    print("Files in exception dir:")
    for f in os.listdir(exception_dir):
        print(f)
else:
    print("Exception directory does not exist.")
