from helpers.llm_helper import call_llm, stream_llm
from constants import MODEL_NAME

CALL_LLM_PROMPT = "What is the capital of France?"
STREAM_LLM_PROMPT = "List the first 5 prime numbers."

def test_call_llm():
    response = call_llm(CALL_LLM_PROMPT)
    print("LLM Response:", response)
    
def test_stream_llm():
    for chunk in stream_llm(STREAM_LLM_PROMPT):
        print(chunk, end='', flush=True)
    print()
    
if __name__ == "__main__":
    test_call_llm()
    # test_stream_llm()