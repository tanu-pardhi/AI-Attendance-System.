from flask import Flask, jsonify
from flask_cors import CORS
import subprocess
import csv
from datetime import datetime
import sqlite3

app = Flask(__name__)
CORS(app)

process = None   # 🔥 Track camera process

# ================= DATABASE =================
def init_db():
    conn = sqlite3.connect("attendance.db")
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        date TEXT,
        entry TEXT,
        exit TEXT
    )
    """)

    conn.commit()
    conn.close()


# ================= CSV ➝ DB SYNC (IMPORTANT) =================
def save_to_db(name, date, entry, exit):
    conn = sqlite3.connect("attendance.db")
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO attendance (name, date, entry, exit)
    VALUES (?, ?, ?, ?)
    """, (name, date, entry, exit))

    conn.commit()
    conn.close()


# ================= HOME =================
@app.route('/')
def home():
    return "Backend Running ✅"


# ================= START CAMERA =================
@app.route('/start')
def start():
    global process

    if process is None:
        process = subprocess.Popen(["python", "main.py"])
        return "Camera Started ✅"
    else:
        return "Camera Already Running ⚠️"


# ================= STOP CAMERA =================
@app.route('/stop')
def stop():
    global process

    if process is not None:
        process.terminate()
        process = None
        return "Camera Stopped 🛑"
    else:
        return "Camera Not Running ❌"


# ================= GET ATTENDANCE =================
@app.route('/attendance')
def get_attendance():
    data = []

    # 🔥 Try DB first
    try:
        conn = sqlite3.connect("attendance.db")
        cursor = conn.cursor()

        cursor.execute("SELECT name, date, entry, exit FROM attendance")
        rows = cursor.fetchall()

        conn.close()

        if rows:
            return jsonify(rows)
    except:
        pass

    # 🔁 Fallback CSV
    try:
        with open('attendance.csv', 'r') as file:
            reader = csv.reader(file)
            for row in reader:
                if row and row[0] != "":
                    data.append(row)
        return jsonify(data)
    except:
        return jsonify([])


# ================= EXIT USER =================
@app.route('/exit/<name>')
def exit_user(name):
    rows = []
    found = False

    now = datetime.now()
    today = now.strftime("%d-%m-%Y")
    exit_time = now.strftime("%I:%M %p").lstrip("0")

    try:
        with open("attendance.csv", "r") as f:
            reader = list(csv.reader(f))

        # ✅ Check name exists
        for row in reader:
            if row[0].strip().lower() == name.strip().lower():
                found = True

        if not found:
            return "Invalid Name ❌"

        # ✅ Update last entry
        updated = False
        for row in reversed(reader):
            if (not updated and 
                row[0].strip().lower() == name.strip().lower() 
                and len(row) > 3 and row[3] == "-"):

                row[3] = exit_time
                updated = True

                # 🔥 ALSO SAVE TO DATABASE
                save_to_db(row[0], row[1], row[2], exit_time)

            rows.insert(0, row)

        with open("attendance.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerows(rows)

        return "Exit Updated ✅"

    except Exception as e:
        print(e)
        return "Error ❌"


# ================= AUTO SYNC CSV TO DB =================
def sync_csv_to_db():
    try:
        with open("attendance.csv", "r") as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 4:
                    save_to_db(row[0], row[1], row[2], row[3])
    except:
        pass


# ================= RUN =================
if __name__ == "__main__":
    init_db()
    sync_csv_to_db()   # 🔥 first time sync
    app.run(host="127.0.0.1", port=5000, debug=True)