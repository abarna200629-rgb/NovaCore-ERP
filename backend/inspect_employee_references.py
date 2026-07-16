import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="kannaki",
        database="erp_db"
    )

conn = get_db_connection()
cursor = conn.cursor()

# Find foreign keys referencing employees table
query = """
SELECT 
  TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM
  INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
  REFERENCED_TABLE_NAME = 'employees'
"""
cursor.execute(query)
fks = cursor.fetchall()
print("Foreign keys referencing employees:")
for fk in fks:
    print(f"Table: {fk[0]}, Column: {fk[1]}, Constraint: {fk[2]}")

# Let's count records for some employee (e.g. employee 8, Lisha V) in other tables
cursor.execute("SELECT id, name FROM employees")
employees = cursor.fetchall()
print("\nEmployee records check in other tables:")
for emp_id, emp_name in employees:
    print(f"\nEmployee: {emp_name} (ID: {emp_id})")
    for fk in fks:
        tbl = fk[0]
        col = fk[1]
        cursor.execute(f"SELECT COUNT(*) FROM {tbl} WHERE {col} = %s", (emp_id,))
        cnt = cursor.fetchone()[0]
        if cnt > 0:
            print(f"  -> Referenced in table '{tbl}' count: {cnt}")

cursor.close()
conn.close()
