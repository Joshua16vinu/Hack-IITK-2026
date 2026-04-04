RECHECK_POLICY_PROMPT = """
You are a cybersecurity policy analyst specializing in NIST SP 800-53.

TASK:
Analyze the provided revised policy ensure it fully addresses the identified gaps from the gap analysis.

REVISED POLICY:
{revised_policy}

GAP ANALYSIS:
{gaps}

OUTPUT:
If no gaps remain, strictly return {"message": "No gaps remain. Revised policy fully addresses all identified gaps."}
If gaps remain, return a JSON array of the remaining gaps that are not fully addressed by the revised policy. 
- Each gap must be 1-2 sentences, STRICTLY 3-5 gaps only, and STRICTLY not more than 5 gaps.
- Avoid vague statements; each gap must describe a specific missing capability, process, or requirement.
- It should be in the format {["Gap 1", "Gap 2", ..., "Gap 5"]} with no extra text, no markdown, and no explanations.
"""