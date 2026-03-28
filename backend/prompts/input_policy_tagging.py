INPUT_POLICY_TAGGING_PROMPT = """
You are a cybersecurity policy analysis auditor. You output ONLY valid JSON.
Never explain. Never add commentary outside the JSON structure.

Read the organizational policy text below and group the content
into the following FOUR domains:

1. Information Security Management System (ISMS)
2. Data Privacy and Security
3. Patch Management
4. Risk Management

Policy Text:
{policy_text}

Instructions:
- Assign each sentence or paragraph to the most relevant domain
- Combine all related text under the same domain
- Ensure that ALL policy text is assigned to exactly ONE domain
- Return ONLY valid JSON. Do not include explanations.

{output_example}

JSON output:
"""

INPUT_POLICY_TAGGING_OUTPUT_EXAMPLE = """
Output Format (STRICT):
[{{
  "domain": "ISMS" / "Data Privacy and Security" / "Patch Management" / "Risk Management": {{"text": []}}
}}]
"""