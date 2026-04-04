import type {
  AnalyzeGapsRequest,
  GapAnalysisResponse,
  RoadmapRequest,
  RevisedPolicyRequest,
  UploadPdfRequest,
  UploadResult,
  RecheckPolicyRequest,
  RecheckPolicyResponse
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

interface ErrorPayload {
  detail?: string | { message?: string; error?: string };
  message?: string;
  error?: string;
}

const parseErrorMessage = async (response: Response) => {
  const rawText = await response.text();

  try {
    const parsed = JSON.parse(rawText) as string | ErrorPayload;

    if (typeof parsed === "string") {
      return parsed;
    }

    const detail = parsed.detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object") {
      const detailMessage = detail.message;
      const detailError = detail.error;
      if (typeof detailMessage === "string") return detailMessage;
      if (typeof detailError === "string") return detailError;
    }

    if (typeof parsed.message === "string") return parsed.message;
    if (typeof parsed.error === "string") return parsed.error;
  } catch {
    // Fall through to raw response text.
  }

  return rawText || response.statusText || "Request failed.";
};

const requestJson = async <T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as T;
};

const requestStream = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  if (!response.body) {
    throw new Error("ReadableStream not supported by browser or empty response");
  }

  return response;
};

export const uploadPdf = async ({ file, domain }: UploadPdfRequest) => {
  const formData = new FormData();
  formData.append("file", file);

  if (domain) {
    formData.append("domain", domain);
  }

  return requestJson<UploadResult>(`${API_BASE_URL}/upload-pdf`, {
    method: "POST",
    body: formData,
  });
};

export const startGapAnalysis = async ({ domainData }: AnalyzeGapsRequest) => {
  return requestJson<GapAnalysisResponse>(`${API_BASE_URL}/analyze-gaps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(domainData),
  });
};

export const getGapAnalysisStatus = async () => {
  return requestJson<GapAnalysisResponse>(`${API_BASE_URL}/analyze-gaps`, {
    method: "GET",
  });
};

export const generateRevisedPolicy = async ({ text, gapAnalysis }: RevisedPolicyRequest) => {
  return requestStream(`${API_BASE_URL}/revised-policy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, gap_analysis: gapAnalysis }),
  });
};

export const getRemainingGaps = async ({ revisedPolicy, gaps }: RecheckPolicyRequest) => {
  return requestJson<RecheckPolicyResponse>(`${API_BASE_URL}/remaining-gaps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ revised_policy: revisedPolicy, gaps: gaps }),
  });
}

export const generateRoadmap = async ({ inputPolicy, revisedPolicy }: RoadmapRequest) => {
  return requestStream(`${API_BASE_URL}/get-roadmap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_policy: inputPolicy,
      revised_policy: revisedPolicy,
    }),
  });
};