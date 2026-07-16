with open("c:\\Users\\ABARNA\\Downloads\\backend (1)\\backend\\src\\main\java\\com\\erp\\backend\\service\\DashboardService.java", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "getAIRecommendations" in line:
        print(f"Line {idx}: {line.strip()}")
        # print 50 lines from here
        for i in range(idx, min(len(lines), idx + 100)):
            print(f"{i}: {lines[i].strip()}")
        break
