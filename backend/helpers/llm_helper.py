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
            "num_predict": 512
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
    
    try:
        return json.loads(generated_text)
    except json.JSONDecodeError:
        try:
            extracted = extract_json(generated_text)
            if extracted:
                try:
                    parsed = json.loads(extracted)
                    if is_valid_gaps(parsed):
                        return parsed
                except Exception:
                    pass
            
            repaired = call_llm(REPAIR_LLM_RESPONSE.format(response=generated_text))
            if repaired and is_valid_gaps(repaired):
                return repaired
        except Exception as e:
            logger.warning("Failed to parse LLM output as JSON: %s", e) 
            return generated_text.strip()
    

def stream_llm(prompt: str) -> Iterator[str]:
    ensure_ollama_running()

    logger.info("Starting streamed LLM response")

    try:
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
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