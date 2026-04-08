ROADMAP_SYSTEM_PROMPT = """You are a cybersecurity expert. Generate a plain-text implementation roadmap to close policy gaps. Output only actions — no policy summaries, no reasoning, no vague phrases."""


ROADMAP_PROMPT = """
CURRENT POLICY:
{original_policy}

GAPS:
{gaps}

Generate an implementation roadmap in three tiers. Each bullet = one concrete task with owner where relevant (e.g., Security Team, IT Admin). Sequence logically. Cover technical, process, and governance. Use standard tools (e.g., Splunk, ELK).

Implementation Roadmap
Short-Term (0-3 months):
- [Critical gap closures and foundational controls]

Mid-Term (3-6 months):
- [Automation, integrations, process maturity]

Long-Term (6-12 months):
- [Advanced controls, audits, continuous compliance]
"""