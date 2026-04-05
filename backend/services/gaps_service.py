from helpers.llm_helper import call_llm
from helpers.logger import get_logger
from prompts.gap_analysis import GAP_ANALYSIS_PROMPT

current_job = {
    "status": "idle",
    "results": []
}

logger = get_logger(__name__)


def process_data(data):
    try:
        logger.info("Gap analysis worker started for %s domains", len(data))
        current_job["results"] = [
            {
                "domain": item.domain,
                "status": "processing",
                "gaps": None
            }
            for item in data
        ]

        current_job["total"] = len(data)
        current_job["completed"] = 0

        for index, item in enumerate(data):
            domain = item.domain
            text = item.text
            nist_policies = item.related_nist_policies

            current_job["current_domain"] = domain

            formatted_policy = "\n\n".join(text) if isinstance(text, list) else str(text)
            formatted_nist = ""
            if isinstance(nist_policies, list):
                formatted_nist = "\n\n".join(
                    policy.content
                    for policy in nist_policies
                    if policy
                )
            elif nist_policies:
                formatted_nist = str(nist_policies)

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
                logger.exception("Gap analysis failed for domain=%s", domain)

            current_job["completed"] += 1

        current_job["status"] = "completed"
        logger.info("Gap analysis worker completed successfully")

    except Exception as e:
        current_job["status"] = "failed"
        current_job["error"] = str(e)
        logger.exception("Gap analysis worker failed")