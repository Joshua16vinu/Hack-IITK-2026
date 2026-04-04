REPAIR_LLM_RESPONSE = """
The following is a response from an LLM that was supposed to be in JSON format, but it is not valid JSON. 
Please attempt to repair the response so that it can be parsed as JSON. 

- Output only valid JSON
- Return only a JSON array of strings with no markdown, no bullets, and no extra text
- Output STRICTLY valid JSON: a list of strings (array), with no explanation or extra text

Response:
{response}
"""