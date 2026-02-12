import psycopg2

# 1️⃣ Connect to your database
conn = psycopg2.connect(
    host="localhost",
    port="5432",
    database="Jali DB",       # Make sure this is exactly your DB name
    user="postgres",           # Your PostgreSQL username
    password="Twenty@20"  # Replace with your actual password
)

# 2️⃣ Create a cursor
cur = conn.cursor()

# 3️⃣ Run your query
cur.execute("SELECT * FROM households LIMIT 5;")

# 4️⃣ Fetch results
rows = cur.fetchall()
for row in rows:
    print(row)

# 5️⃣ Close everything
cur.close()
conn.close()

