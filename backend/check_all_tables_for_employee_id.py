import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="kannaki",
    database="erp_db"
)
cursor = conn.cursor()

# Find all tables with employee_id or similar columns
cursor.execute("""
SELECT TABLE_NAME, COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'erp_db' 
  AND (COLUMN_NAME LIKE '%employee%' OR COLUMN_NAME LIKE '%emp%')
""")
columns = cursor.fetchall()
print("Tables and columns with employee reference name patterns:")
for tbl, col in columns:
    print(f"Table: {tbl}, Column: {col}")

# Get all employee IDs
cursor.execute("SELECT id, name FROM employees")
employees = cursor.fetchall()

print("\nDetailed reference scan for employees:")
for emp_id, emp_name in employees:
    print(f"\nEmployee: {emp_name} (ID: {emp_id})")
    for tbl, col in columns:
        # Avoid checking the employees table itself
        if tbl == 'employees' and col == 'id':
            continue
        try:
            cursor.execute(f"SELECT COUNT(*) FROM `{tbl}` WHERE `{col}` = %s", (emp_id,))
            cnt = cursor.fetchone()[0]
            if cnt > 0:
                print(f"  -> Referenced in table '{tbl}' (column '{col}') count: {cnt}")
        except Exception as e:
            # Column type or name mismatch can be ignored
            pass

cursor.close()
conn.close()
