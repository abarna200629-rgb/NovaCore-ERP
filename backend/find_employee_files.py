import os

def find_file(name, path):
    for root, dirs, files in os.walk(path):
        if name in files:
            return os.path.join(root, name)
    return None

backend_src = "c:\\Users\\ABARNA\\Downloads\\backend (1)\\backend"
print("EmployeeController.java path:", find_file("EmployeeController.java", backend_src))
print("EmployeeService.java path:", find_file("EmployeeService.java", backend_src))
