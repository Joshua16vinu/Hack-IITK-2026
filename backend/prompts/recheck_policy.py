RECHECK_POLICY_PROMPT = """
You are a cybersecurity policy analyst specializing in NIST SP 800-53.

TASK:
Analyze the provided revised policy ensure it fully addresses the identified gaps from the gap analysis.
Just make sure all gaps are fully addressed by the revised policy. If any gaps remain unaddressed, identify and list them.
If no gaps remain, strictly return {{"message": "No gaps remain. Revised policy fully addresses all identified gaps."}}

REVISED POLICY:
{revised_policy}

GAP ANALYSIS:
{gaps}

OUTPUT:
STRICTLY return gaps if they remain, otherwise return a message confirming all gaps are addressed.
If no gaps remain, strictly return {{"message": "No gaps remain. Revised policy fully addresses all identified gaps."}}
If gaps remain, return a JSON array of the remaining gaps that are not fully addressed by the revised policy. 
- Each gap must be 1-2 sentences, STRICTLY 3-5 gaps only, and STRICTLY not more than 5 gaps.
- Avoid vague statements; each gap must describe a specific missing capability, process, or requirement.
- It should be in the format ["Gap", "Gap", ..., "Gap"], each array element must be a string with no extra text, no markdown, and no explanations.
"""