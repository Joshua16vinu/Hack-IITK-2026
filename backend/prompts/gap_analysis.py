GAP_ANALYSIS_PROMPT = """
You are a cybersecurity policy analyst specializing in NIST SP 800-53.

TASK:
Analyze the provided organization policy and identify gaps in alignment with NIST standards.

IMPORTANT:
- The organization policy may be provided in multiple sections; analyze them collectively.
- Focus only on identifying specific gaps in the policy content
- Do not rewrite, summarize, or modify the policy
- Do not reference or name any NIST controls
- Do not output JSON instead just give a array of gaps no other text content
- Output only a clear, concise array of gaps
- Each gap must be 1–2 sentences, totally no more than 5 gaps
- Avoid vague statements; each gap must describe a specific missing capability, process, or requirement
- Use formal, professional language

INPUT POLICY:
{organization_policy}

RELATED NIST POLICIES:
{related_nist_policies}

OUTPUT:
Return a clear, concise array of identified gaps in the policy.
"""