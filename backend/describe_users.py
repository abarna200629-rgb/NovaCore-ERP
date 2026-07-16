import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="kannaki",
    database="erp_db"
)
cursor = conn.cursor()
cursor.execute("DESCRIBE users")
for col in cursor.fetchall():
    print(col)
cursor.close()
conn.close()
