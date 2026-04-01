GAP_ANALYSIS_PROMPT = """
You are a cybersecurity policy analyst specializing in NIST SP 800-53.

TASK:
Analyze the provided organization policy and identify gaps in alignment with NIST standards.

IMPORTANT:
- The organization policy may be provided in multiple sections; treat it as a single unified document
- Focus only on identifying specific gaps in the policy content
- Do not rewrite, summarize, or modify the policy
- Do not reference or name any NIST controls
- Do not output JSON or structured data
- Output only a clear, concise list of gaps
- Each gap must be 1–2 sentences
- Avoid vague statements; each gap must describe a specific missing capability, process, or requirement
- Use formal, professional language

INPUT POLICY:
{organization_policy}

RELATED NIST POLICIES:
{related_nist_policies}

OUTPUT:
Return a clear, concise list of identified gaps in the policy.
"""