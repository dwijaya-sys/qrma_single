from flask import Blueprint, request, current_app
from pydantic import ValidationError
from prompts.patient_summary_prompt import build_patient_summary_prompt
from prompts.synthesis_prompt import build_synthesis_prompt
from schemas.scan_payload import ScanPayload
from services.gemini_service import GeminiService
from utils.responses import ok, fail

ai_bp = Blueprint("ai", __name__)


@ai_bp.post("/synthesis")
def ai_synthesis():
    try:
        incoming = request.get_json(force=True)
        payload = ScanPayload.model_validate(incoming)
    except ValidationError as e:
        return fail("Invalid scan payload", 422, e.errors())
    except Exception:
        return fail("Malformed JSON body", 400)

    try:
        prompt = build_synthesis_prompt(
            payload.model_dump(),
            current_app.config["AI_SYNTHESIS_PROMPT_VERSION"],
        )
        result = GeminiService().generate_json(prompt)
        return ok(result)
    except Exception as e:
        return fail("AI synthesis generation failed", 500, {"reason": str(e)})


@ai_bp.post("/patient-summary")
def patient_summary():
    try:
        incoming = request.get_json(force=True)
        payload = ScanPayload.model_validate(incoming)
    except ValidationError as e:
        return fail("Invalid scan payload", 422, e.errors())
    except Exception:
        return fail("Malformed JSON body", 400)

    try:
        prompt = build_patient_summary_prompt(
            payload.model_dump(),
            current_app.config["PATIENT_SUMMARY_PROMPT_VERSION"],
        )
        result = GeminiService().generate_json(prompt)
        return ok(result)
    except Exception as e:
        return fail("Patient summary generation failed", 500, {"reason": str(e)})
