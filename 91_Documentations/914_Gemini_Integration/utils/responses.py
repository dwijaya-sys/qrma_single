from flask import jsonify


def ok(data, status=200):
    return jsonify({"ok": True, "data": data}), status


def fail(message, status=400, details=None):
    return jsonify({
        "ok": False,
        "error": {
            "message": message,
            "details": details or {}
        }
    }), status
