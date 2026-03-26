import ollama
import subprocess
import requests
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Iterable, Iterator, List, Optional

from constants import MODEL_NAME


def ensure_ollama_running():
    try:
        requests.get("http://localhost:11434", timeout=2)
    except requests.RequestException:
        subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        time.sleep(5)


def call_llm(
    prompt: str,
    # output_format: Optional[dict] = None,
    stream: bool = False
) -> Any:
    ensure_ollama_running()

    print("\n===== LLM INPUT =====")
    print(prompt)
    print("======================\n")

    payload = {
        "model":  MODEL_NAME,
        "prompt": prompt,
        "stream": stream,
        "options": {
            "temperature": 0.0,
            "num_ctx":     4096,
            "num_predict": 900
        }
    }

    # if output_format is not None:
    #     payload["format"] = output_format

    if stream:
        def _stream_chunks() -> Iterator[str]:
            response = requests.post(
                "http://localhost:11434/api/generate",
                json=payload,
                stream=True
            )
            response.raise_for_status()
            for line in response.iter_lines():
                if not line:
                    continue
                print(line.decode(), flush=True)
                chunk = json.loads(line)
                yield chunk.get("response", "")
                if chunk.get("done"):
                    break
        print("\n===== LLM OUTPUT (STREAM) =====")
        print(_stream_chunks())
        print("======================\n")
        return _stream_chunks()

    print("payload", payload)
    response = requests.post(
        "http://localhost:11434/api/generate",
        json=payload
    )
    response.raise_for_status()

    body = response.json()
    generated_text = body.get("response", "")
    print("\n===== LLM OUTPUT =====")
    print(generated_text)
    print("======================\n")
    return json.loads(generated_text)

def stream_llm(prompt: str) -> Iterator[str]:
    ensure_ollama_running()

    print("\n===== LLM INPUT (STREAM) =====")
    print(prompt)
    print("==============================\n")

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a cybersecurity policy analysis assistant. "
                    "Follow the instructions strictly and return structured output."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        options={
            "temperature": 0.0,
            "num_predict": 900
        },
        stream=True
    )

    print("\n===== LLM OUTPUT (STREAM) =====")
    for part in response:
        chunk = part.get("message", {}).get("content", "")
        if chunk:
            print(chunk, end="", flush=True)
            yield chunk
    print("\n===============================\n")

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