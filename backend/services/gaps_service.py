from helpers.llm_helper import call_llm
from prompts.gap_analysis import GAP_ANALYSIS_PROMPT

current_job = {
    "status": "idle",
    "results": []
}


def process_data(data):
    try:
        current_job["results"] = [
            {
                "domain": item.get("domain"),
                "status": "processing",
                "gaps": None
            }
            for item in data
        ]

        current_job["total"] = len(data)
        current_job["completed"] = 0

        for index, item in enumerate(data):
            domain = item.get("domain")
            text = item.get("text")
            nist_policies = item.get("related_nist_policies")

            current_job["current_domain"] = domain

            formatted_policy = "\n\n".join(text) if isinstance(text, list) else (text or "")
            formatted_nist = "\n\n".join(nist_policies) if nist_policies else ""

            try:
                llm_response = call_llm(
                    GAP_ANALYSIS_PROMPT.format(
                        organization_policy=formatted_policy,
                        related_nist_policies=formatted_nist
                    )
                )

                current_job["results"][index] = {
                    "domain": domain,
                    "status": "completed",
                    "gaps": llm_response
                }

            except Exception as e:
                current_job["results"][index] = {
                    "domain": domain,
                    "status": "failed",
                    "error": str(e)
                }

            current_job["completed"] += 1

        current_job["status"] = "completed"

    except Exception as e:
        current_job["status"] = "failed"
        current_job["error"] = str(e)