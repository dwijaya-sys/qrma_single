from flask import Flask
from flask_cors import CORS
from config import Config
from routes.ai import ai_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        resources={r"/api/*": {"origins": [app.config["ALLOWED_ORIGIN"]] if app.config["ALLOWED_ORIGIN"] != "*" else "*"}},
        supports_credentials=False,
    )

    app.register_blueprint(ai_bp, url_prefix="/api/ai")

    @app.get("/health")
    def health():
        return {"ok": True, "service": "teletcm-ai"}

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
