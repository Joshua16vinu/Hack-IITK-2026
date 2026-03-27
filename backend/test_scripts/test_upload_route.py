from pathlib import Path

from helpers.pdf_helper import extract_text_from_pdf
from helpers.llm_helper import call_llm
from prompts.input_policy_tagging import INPUT_POLICY_TAGGING_PROMPT
from constants import BACKEND_BASE_DIR


def upload_pdf(file_path: str):
    text = extract_text_from_pdf(file_path)

    prompt = INPUT_POLICY_TAGGING_PROMPT.format(policy_text=text)
    response = call_llm(prompt)
    
    return response



if __name__ == "__main__":
    project_root = Path(BACKEND_BASE_DIR).parent
    test_pdf = project_root / "policies" / "Policy_1.pdf"

    input_chunks = upload_pdf(test_pdf)
    print(input_chunks)