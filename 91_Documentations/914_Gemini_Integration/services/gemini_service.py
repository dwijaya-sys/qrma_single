import json
from flask import current_app
from google import genai
from google.genai import types


class GeminiService:
    def __init__(self):
        api_key = current_app.config["GEMINI_API_KEY"]
        self.model = current_app.config["GEMINI_MODEL"]
        self.client = genai.Client(api_key=api_key)

    def generate_json(self, prompt: str) -> dict:
        config = types.GenerateContentConfig(
            temperature=0.2,
            response_mime_type="application/json",
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=config,
        )

        text = response.text.strip()
        return json.loads(text)
