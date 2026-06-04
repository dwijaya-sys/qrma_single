# TeleTCM AI Package

Production-shaped Flask integration package for two AI features:
- Practitioner AI Synthesis
- Patient Summary

## What is included
- Flask app shell
- Gemini service wrapper
- Request schema validation with Pydantic
- Prompt builders for both features
- Frontend integration sample for browser-side `calcAll()` output
- Environment example file

## Quick start
1. Create a virtual environment.
2. Install dependencies:
   `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and add your Gemini API key.
4. Run the app:
   `python app.py`
5. Test health endpoint:
   `GET /health`

## Endpoints
- `POST /api/ai/synthesis`
- `POST /api/ai/patient-summary`

## Production notes
- Keep Gemini API keys only on the server.
- Review all patient-facing summaries before sharing.
- Store prompt version, model name, payload, and response for audit.
- Keep outputs within wellness education only.
