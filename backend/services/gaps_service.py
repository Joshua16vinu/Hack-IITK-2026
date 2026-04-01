

from helpers.llm_helper import call_llm
from prompts.gap_analysis import GAP_ANALYSIS_PROMPT
from routes.upload_route import jobs

def process_data(job_id, data):
    try:
        for item in data:
            domain = item.get("domain")
            text = item.get("text")
            nist_policies = item.get("related_nist_policies")

            formatted_policy = "\n\n".join(text) if isinstance(text, list) else text
            formatted_nist = "\n\n".join(nist_policies)

            jobs[job_id]["results"].append({
                "domain": domain,
                "status": "processing",
                "gaps": None
            })

            index = len(jobs[job_id]["results"]) - 1

            try:
                llm_response = call_llm(
                    GAP_ANALYSIS_PROMPT.format(
                        organization_policy=formatted_policy,
                        related_nist_policies=formatted_nist
                    )
                )

                # update result
                jobs[job_id]["results"][index] = {
                    "domain": domain,
                    "status": "completed",
                    "gaps": llm_response
                }

            except Exception as e:
                jobs[job_id]["results"][index] = {
                    "domain": domain,
                    "status": "failed",
                    "error": str(e)
                }

        jobs[job_id]["status"] = "completed"

    except Exception:
        jobs[job_id]["status"] = "failed"