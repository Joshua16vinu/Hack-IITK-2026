REVISED_POLICY_PROMPT = """
You are a cybersecurity policy expert specializing in NIST framework alignment. Your task is to revise and improve the given organization policy by addressing the identified gaps.
Original Organization Policy:
{organization_policy}
Identified Gaps:
{gap_analysis}

Instructions:
1. Rewrite and enhance the policy to address all identified gaps.
2. Ensure the policy aligns with NIST standards.
3. Improve clarity, structure, and completeness.
4. Do NOT mention gaps explicitly — integrate improvements naturally.
5. Maintain a formal and professional policy tone.
6. Return ONLY plain text. Do NOT return JSON.
7. Do NOT include roadmap or implementation steps. Do NOT include explanations or meta-comments.
8. Maintain all headings and sub-headings of the Organization Policy, only update the content under the headings and sub-headings.

Generate a complete, well-structured revised policy.
"""