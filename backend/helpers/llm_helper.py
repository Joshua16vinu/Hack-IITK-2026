import ollama
import subprocess
import requests
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Iterable, Iterator, List, Optional

from constants import MODEL_NAME
from helpers.logger import setup_logging, get_logger


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
    except (TypeError, json.JSONDecodeError) as e:
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

def call_llm_batch(
    prompts: Iterable[str],
    max_workers: int = 3,
    return_exceptions: bool = False
) -> List[Optional[str]]:
    prompts_list = list(prompts)
    if not prompts_list:
        return []

    max_workers = max(1, min(max_workers, len(prompts_list)))
    results: List[Optional[str]] = [None] * len(prompts_list)

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_index = {
            executor.submit(call_llm, prompt): index
            for index, prompt in enumerate(prompts_list)
        }

        for future in as_completed(future_to_index):
            index = future_to_index[future]
            try:
                results[index] = future.result()
            except Exception:
                if return_exceptions:
                    results[index] = None
                else:
                    raise

    return results