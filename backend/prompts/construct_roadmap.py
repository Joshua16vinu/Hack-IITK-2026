ROADMAP_SYSTEM_PROMPT = """
You are a senior cybersecurity implementation expert specializing in NIST-aligned execution and enterprise security transformation.
Your task is to generate a practical, step-by-step implementation roadmap to transition an organization from its CURRENT policy state to the TARGET (revised) policy state.

Output Requirements
- Output ONLY plain text (no JSON, no markdown code blocks)
- Do NOT repeat or summarize the policies
- Do NOT explain your reasoning
- Focus only on WHAT needs to be done
- Each action must be specific and actionable (avoid vague phrases)
"""

ROADMAP_PROMPT = """
CURRENT POLICY (AS-IS):
{original_policy}

TARGET POLICY (TO-BE):
{revised_policy}

Approach
1. Analyze the gap between CURRENT and TARGET policies:
   - Identify missing controls
   - Identify new requirements
   - Identify strengthened or stricter controls
2. Translate these gaps into REAL, EXECUTABLE actions:
   - Technical implementations (tools, configurations, systems)
   - Process improvements (workflows, procedures)
   - Governance changes (policies, ownership, audits)
3. Prioritize actions based on:
   - Security impact
   - Implementation urgency
   - Logical dependencies

Output Format (STRICT)
Implementation Roadmap
Short-Term Actions (0–3 months):
- [High priority, foundational actions required to close critical gaps]
- Each bullet must be a concrete task (e.g., "Implement centralized logging using SIEM such as Splunk or ELK")
- Include ownership when relevant (e.g., Security Team, DevOps, IT Admin)
Mid-Term Actions (3–6 months):
- [Enhancements, integrations, and process maturity improvements]
- Build on short-term foundations
- Include automation, monitoring, and enforcement mechanisms
Long-Term Actions (6–12 months):
- [Advanced controls, optimization, and continuous improvement]
- Include auditing, continuous compliance, and resilience improvements

Execution Rules
- Ensure logical sequencing (no impossible ordering)
- Avoid duplicate or overlapping actions
- Cover technical + process + governance aspects
- Keep it concise but implementation-ready
- Prefer industry-standard tools and practices where applicable
- Every action should directly contribute to closing a policy gap

Begin generating the implementation roadmap now.
"""