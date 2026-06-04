# TeleTCM AI Integration Handover

## Objective
Implement a production-ready Flask backend that receives post-`calcAll()` browser payloads and calls Gemini securely for two features: practitioner AI synthesis and patient-facing summaries.

## Confirmed build decisions
- Frontend: plain HTML/JS
- Backend: Flask/Python
- `calcAll()` location: browser only
- First integrations: AI Synthesis and Patient Summary
- Delivery standard: production-ready structure from day one
- Compliance boundary: wellness education only, no diagnosis, no prescription suggestions

## Architecture summary
The design uses a browser-to-Flask-to-Gemini flow. Deterministic scoring remains in the browser-side calculation engine. The Flask backend validates a normalized payload, assembles a feature-specific prompt, calls Gemini, and returns structured JSON.

## Included files
- `app.py`: Flask app bootstrap and CORS setup
- `config.py`: environment-driven settings
- `routes/ai.py`: AI endpoints
- `services/gemini_service.py`: Gemini SDK wrapper
- `schemas/scan_payload.py`: shared request validation schema
- `prompts/synthesis_prompt.py`: practitioner synthesis prompt
- `prompts/patient_summary_prompt.py`: patient summary prompt
- `utils/responses.py`: standard API response helpers
- `frontend-integration.js`: browser integration helpers
- `.env.example`: required environment variables
- `README.md`: quick-start instructions

## Endpoint contract
### `POST /api/ai/synthesis`
Purpose: convert structured scan output into a practitioner-facing reasoning aid.

### `POST /api/ai/patient-summary`
Purpose: convert the same structured scan output into a warm, patient-friendly summary for practitioner review.

## Shared payload design
The shared payload captures:
- client profile and language
- flagged QRMA parameters
- flagged GDV parameters
- confirmed correlations
- cluster scores and severities
- active clusters and primary cluster
- matched TCM patterns
- stress and energy context
- lifestyle scores
- chakra alignment
- red flags
- optional practitioner note

## Compliance guardrails
- AI output is framed strictly as wellness education and functional pattern observation.
- Prompts explicitly prohibit diagnosis, prescriptions, and certainty language.
- Patient summaries are designed for practitioner review before sharing.
- API keys remain server-side only.

## Recommended next steps
1. Connect the real `calcAll()` return object to `buildAiPayload()`.
2. Test `/api/ai/synthesis` with one real scan sample.
3. Tune prompt wording using real practitioner feedback.
4. Enable `/api/ai/patient-summary` in the UI after synthesis is stable.
5. Add persistence for payload, model, prompt version, and response.
6. Add review-state tracking before patient export or WhatsApp sharing.

## Suggested future enhancement
Add an `ai_outputs` table to persist feature type, model version, prompt version, request payload, response payload, reviewer, approval state, and timestamps.
