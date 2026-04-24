import cv2
import os
import numpy as np
from datetime import datetime
from collections import Counter
import csv
from deepface import DeepFace

# ================= SETTINGS =================
DATASET_PATH = "dataset"
THRESHOLD = 0.6   # 🔥 better for cosine similarity

name_buffer = []
last_marked = {}
last_score = 0   # for display

# ================= LOAD DATASET =================
print("Loading dataset...")

embeddings = []
names = []

for person in os.listdir(DATASET_PATH):
    person_path = os.path.join(DATASET_PATH, person)

    if not os.path.isdir(person_path):
        continue

    for img in os.listdir(person_path):
        path = os.path.join(person_path, img)

        try:
            rep = DeepFace.represent(
                img_path=path,
                model_name="Facenet",
                enforce_detection=True   # 🔥 strict detection
            )[0]["embedding"]

            embeddings.append(rep)
            names.append(person)

        except:
            continue

print("Dataset ready ✅")

# ================= ATTENDANCE =================
def mark_attendance(name):
    if name in ["Unknown", "No Face"]:
        return

    now = datetime.now()

    if name in last_marked:
        if (now - last_marked[name]).seconds < 5:
            return

    last_marked[name] = now

    date = now.strftime("%d/%m/%Y")
    time = now.strftime("%I:%M %p").lstrip("0")

    with open("attendance.csv", "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([name, date, time, "-"])

# ================= MATCH =================
def match_face(face_embedding):
    global last_score

    best_score = -1
    best_name = "Unknown"

    for i, db_emb in enumerate(embeddings):
        score = np.dot(face_embedding, db_emb) / (
            np.linalg.norm(face_embedding) * np.linalg.norm(db_emb)
        )

        if score > best_score:
            best_score = score
            best_name = names[i]

    last_score = best_score
    print("Similarity:", best_score)

    if best_score > THRESHOLD:
        return best_name
    else:
        return "Unknown"

# ================= CAMERA =================
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)

    # ================= DETECTION =================
    try:
        rep = DeepFace.represent(
            img_path=frame,
            model_name="Facenet",
            enforce_detection=True   # 🔥 important
        )

        face_embedding = rep[0]["embedding"]
        detected_name = match_face(face_embedding)

    except:
        detected_name = "No Face"

    # ================= SMOOTH =================
    name_buffer.append(detected_name)

    if len(name_buffer) > 10:
        name_buffer.pop(0)

    name = Counter(name_buffer).most_common(1)[0][0]

    # ================= DISPLAY =================
    if name == "No Face":
        color = (200, 200, 200)
    elif name == "Unknown":
        color = (0, 0, 255)
    else:
        color = (0, 255, 0)

    text = f"{name}"

    if name not in ["No Face"]:
        text += f" ({round(last_score, 2)})"

    cv2.putText(frame, text, (30, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

    # ================= ATTENDANCE =================
    if name not in ["Unknown", "No Face"]:
        mark_attendance(name)

    cv2.imshow("DeepFace Live", frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()