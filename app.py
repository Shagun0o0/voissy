from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import json
from pathlib import Path
from functools import wraps
import os

app = Flask(__name__)

# Always load data.json next to this file — not relative to the shell's cwd.
_DATA_DIR = Path(__file__).resolve().parent
_DATA_PATH = _DATA_DIR / "data.json"

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")


def load_data():
    with open(_DATA_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def save_data(data):
    with open(_DATA_PATH, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)

def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("user"):
            return jsonify({"status": "error", "message": "Not logged in"}), 401
        return fn(*args, **kwargs)

    return wrapper


def read_json_body():
    """
    Robust JSON reader for this small demo app.
    Some clients don't set Content-Type perfectly; this falls back to json.loads(request.data).
    """
    data = request.get_json(silent=True)
    if isinstance(data, dict):
        return data

    raw = request.get_data(cache=False, as_text=True)
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


@app.route("/")
def home():
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        db = load_data()

        for user in db["users"]:
            if user["username"] == username and user["password"] == password:
                session["user"] = username
                return render_template("index.html")

        return "Invalid credentials"

    return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

@app.route("/reauth", methods=["POST"])
@login_required
def reauth():
    data = read_json_body()
    password = data.get("password")
    if password is None:
        return jsonify({"status": "error", "message": "Missing password"}), 400

    db = load_data()
    username = session.get("user")
    for user in db.get("users", []):
        if user.get("username") == username and user.get("password") == password:
            return jsonify({"status": "success", "message": "Verified"})

    return jsonify({"status": "error", "message": "Verification failed"}), 403

@app.route("/check_balance", methods=["POST"])
@login_required
def check_balance():
    data = read_json_body()
    account_number = data.get("account_number")

    db = load_data()

    for acc in db["accounts"]:
        if str(acc["account_number"]).strip() == str(account_number).strip():
            return jsonify({
                "status": "success",
                "name": acc["name"],
                "balance": acc["balance"]
            })

    return jsonify({"status": "error", "message": "Account not found"})

@app.route("/send_money", methods=["POST"])
@login_required
def send_money():
    data = read_json_body()
    account_number = data.get("account_number")
    raw_amount = data.get("amount")
    try:
        amount = int(raw_amount)
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "Invalid amount"})

    db = load_data()

    for acc in db["accounts"]:
        if str(acc["account_number"]).strip() == str(account_number).strip():
            if acc["balance"] >= amount:
                acc["balance"] -= amount
                save_data(db)

                return jsonify({
                    "status": "success",
                    "message": f"₹{amount} sent successfully. Remaining balance ₹{acc['balance']}"
                })
            else:
                return jsonify({
                    "status": "error",
                    "message": "Insufficient balance"
                })

    return jsonify({"status": "error", "message": "Account not found"})

@app.route("/schemes", methods=["GET"])
@login_required
def schemes():
    db = load_data()
    return jsonify({
        "status": "success",
        "schemes": db.get("schemes", {}),
    })

@app.route("/complaints", methods=["POST"])
@login_required
def create_complaint():
    data = read_json_body()
    db = load_data()

    complaints = db.setdefault("complaints", [])
    complaint_id = f"CMP-{len(complaints) + 1:04d}"

    complaint = {
        "id": complaint_id,
        "category": data.get("category") or "General",
        "description": data.get("description") or "",
        "priority": data.get("priority") or "Normal",
        "contact": data.get("contact") or "",
        "status": "Open",
    }
    complaints.append(complaint)
    save_data(db)

    return jsonify({"status": "success", "message": "Complaint created", "complaint": complaint})

@app.route("/complaints", methods=["GET"])
@login_required
def list_complaints():
    db = load_data()
    return jsonify({"status": "success", "complaints": db.get("complaints", [])})

@app.route("/service_requests", methods=["POST"])
@login_required
def create_service_request():
    data = read_json_body()
    db = load_data()

    requests = db.setdefault("service_requests", [])
    req_id = f"SR-{len(requests) + 1:04d}"

    req = {
        "id": req_id,
        "type": data.get("type") or "General Request",
        "description": data.get("description") or "",
        "contact": data.get("contact") or "",
        "status": "Open",
    }
    requests.append(req)
    save_data(db)

    return jsonify({"status": "success", "message": "Service request created", "service_request": req})

@app.route("/service_requests", methods=["GET"])
@login_required
def list_service_requests():
    db = load_data()
    return jsonify({"status": "success", "service_requests": db.get("service_requests", [])})

@app.route("/mandates", methods=["GET"])
@login_required
def list_mandates():
    db = load_data()
    return jsonify({"status": "success", "mandates": db.get("mandates", [])})

@app.route("/mandates", methods=["POST"])
@login_required
def create_mandate():
    data = read_json_body()
    db = load_data()

    mandates = db.setdefault("mandates", [])
    mand_id = f"MD-{len(mandates) + 1:04d}"

    mandate = {
        "id": mand_id,
        "type": data.get("type") or "UPI Mandate",
        "beneficiary": data.get("beneficiary") or "",
        "vpa": data.get("vpa") or "",
        "amount": data.get("amount"),
        "frequency": data.get("frequency") or "Monthly",
        "start_date": data.get("start_date") or "",
        "status": "Active",
    }
    mandates.append(mandate)
    save_data(db)

    return jsonify({"status": "success", "message": "Mandate created", "mandate": mandate})

@app.route("/ask", methods=["POST"])
@login_required
def ask():
    data = read_json_body()
    question = (data.get("question") or "").strip().lower()
    db = load_data()
    schemes_obj = db.get("schemes", {})

    # Very small keyword-based assistant (no AI dependency).
    if not question:
        return jsonify({"status": "success", "answer": "Please ask a question."})

    if "fd" in question or "fixed deposit" in question:
        fd = schemes_obj.get("fd", [])
        if fd:
            item = fd[0]
            return jsonify({
                "status": "success",
                "answer": f"FD example: {item.get('name')}. ROI: {item.get('roi')}. Tenure: {item.get('tenure')}. Min: {item.get('min_investment')}.",
            })
        return jsonify({"status": "success", "answer": "I don't have FD schemes right now."})

    if "loan" in question or "personal loan" in question:
        loans = schemes_obj.get("loans", [])
        if loans:
            item = loans[0]
            return jsonify({
                "status": "success",
                "answer": f"Loan example: {item.get('name')}. Interest: {item.get('interest_range')}. Tenure: {item.get('tenure')}. Eligibility: {item.get('eligibility')}.",
            })
        return jsonify({"status": "success", "answer": "I don't have loan schemes right now."})

    if "upi mandate" in question or "mandate" in question:
        return jsonify({
            "status": "success",
            "answer": "UPI mandate lets you set recurring payments. Say: beneficiary, vpa, amount, and frequency (monthly/daily). Then create a mandate in the UPI Mandates section.",
        })

    if "complaint" in question or "raise a complaint" in question:
        return jsonify({
            "status": "success",
            "answer": "To raise a complaint: open Complaints tab, choose a category, write description, set priority, add contact, and submit. We'll store it as Open.",
        })

    if "service request" in question or "request" in question:
        return jsonify({
            "status": "success",
            "answer": "To create a service request: open Service Requests tab, choose request type, add details + contact, and submit.",
        })

    # Fallback: show what we can do.
    return jsonify({
        "status": "success",
        "answer": "I can help with: FD/loan schemes, UPI mandate info, raising complaints, and creating service requests. Try saying: 'FD schemes', 'loan interest', 'UPI mandate', 'raise complaint', or 'service request'.",
    })


if __name__ == "__main__":
    app.run(debug=True)