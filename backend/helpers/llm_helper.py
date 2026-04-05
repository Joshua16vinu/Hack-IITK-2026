import ollama
import subprocess
import requests
import time
import json
from typing import Any, Iterator

from constants import MODEL_NAME
from helpers.logger import setup_logging, get_logger
from helpers.response_formatter import extract_json, is_valid_gaps
from prompts.response_format import REPAIR_LLM_RESPONSE


setup_logging()
logger = get_logger(__name__)


def ensure_ollama_running():
    try:
        requests.get("http://localhost:11434", timeout=2)
    except requests.RequestException:
        logger.warning("Ollama not running. Starting ollama service")
        subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        time.sleep(5)
        logger.info("Ollama startup wait complete")


def call_llm(prompt: str) -> Any:
    ensure_ollama_running()

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "top_p": 0.8,
            # "num_ctx": 4096,
            "num_predict": 512,
        }
    }

    logger.debug("Sending LLM payload with model=%s", MODEL_NAME)

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json=payload,
            # timeout=60
        )
        response.raise_for_status()
    except requests.RequestException as e:
        logger.error("LLM request failed: %s", e)
        raise
    
    body = response.json() 
    logger.debug("LLM raw response body: %s", body) 
    
    generated_text = body.get("response", "")
    logger.info("LLM response received")
    print("Generated text:", generated_text)  # Debug print
    
    try:
        return json.loads(generated_text)
    except (TypeError, json.JSONDecodeError) as e:
        logger.warning("Failed to parse LLM output as JSON: %s. Retrying now...", e)
        try:
            extracted = extract_json(generated_text)
            try:
                return json.loads(extracted)
            except Exception:
                if is_valid_gaps(extracted):
                    return extracted
            print("Extracted text:", extracted)  # Debug print
            logger.info("Attempting to repair LLM response and parse again")
            repaired = repair_llm_response(generated_text)
            if repaired and is_valid_gaps(repaired):
                return repaired
        except Exception as e:
            logger.warning("Failed to parse LLM output as JSON after repair: %s", e)
            return generated_text.strip()
    

def stream_llm(system_prompt: str, prompt: str) -> Iterator[str]:
    ensure_ollama_running()

    logger.info("Starting streamed LLM response")

    try:
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            options={
                "temperature": 0.0,
                "num_ctx": 8192,
                "num_predict": -1
            },
            stream=True
        )

        for part in response:
            chunk = part.get("message", {}).get("content", "")
            if chunk:
                yield chunk
    except Exception as e:
        logger.exception("stream_llm failed: %s", e)
        raise
    
    
def repair_llm_response(response: str) -> str:
    ensure_ollama_running()

    payload = {
        "model": MODEL_NAME,
        "prompt": REPAIR_LLM_RESPONSE.format(response=response),
        "stream": False,
        "options": {
            "temperature": 0.0,
            "top_p": 0.9,
            "num_predict": 512,
        }
    }

    logger.debug("Repairing LLM response with model=%s", MODEL_NAME)

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json=payload
        )
        response.raise_for_status()
    except requests.RequestException as e:
        logger.error("LLM request failed: %s", e)
        raise
    
    body = response.json() 
    logger.debug("Repaired LLM raw response body: %s", body) 
    
    generated_text = body.get("response", "")
    logger.info("Repaired LLM response received")
    
    
    if is_valid_gaps(generated_text):
        return generated_text
    extracted = extract_json(generated_text)
    if extracted:
        if is_valid_gaps(extracted):
            return extracted
    print("Repaired text:", generated_text)  # Debug print
    try:
        return json.loads(generated_text)
    except (TypeError, json.JSONDecodeError) as e:
        logger.warning("Failed to parse repaired LLM output as JSON: %s", e) 
        return generated_text.strip()