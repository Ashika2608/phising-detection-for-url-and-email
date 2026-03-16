import sqlite3

# create database
conn = sqlite3.connect("urls.db")

cursor = conn.cursor()

# create table
cursor.execute("""
CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    result TEXT
)
""")

conn.commit()
conn.close()

print("Database created successfully!")