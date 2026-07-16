import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="kannaki",
        database="erp_db"
    )
    cursor = conn.cursor()
    
    # Check if employee_id column already exists in users
    cursor.execute("DESCRIBE users")
    cols = [c[0] for c in cursor.fetchall()]
    if 'employee_id' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN employee_id BIGINT")
        cursor.execute("ALTER TABLE users ADD CONSTRAINT fk_user_employee FOREIGN KEY (employee_id) REFERENCES employees(id)")
        print("Successfully added employee_id column and foreign key constraint in users table.")
    else:
        print("employee_id column already exists.")
        
    conn.commit()
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
