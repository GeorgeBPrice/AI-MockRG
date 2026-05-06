// User-facing error messages for the /api/generate route, derived from the
// status code and structured `reason`/`field` fields returned by the server.
//
// We deliberately keep these messages generic — enough to help a legitimate
// user fix the request, but without leaking which specific phrase tripped a
// filter or what abuse heuristic ran. Maintainers can read the server-side
// logs / dashboard for the precise reason.

export interface GeneratorErrorBody {
  error?: string;
  message?: string;
  field?: string;
  reason?: string;
  details?: unknown;
}

export interface FriendlyError {
  title: string;
  description: string;
  /**
   * "hardening" — rejected by our prompt-security / SSRF / concurrency gates.
   *   These are surfaced inline above the Generate button so the user can
   *   immediately edit their input and retry without losing focus.
   * "limit" — daily quota or auth issues; toast is still appropriate.
   * "other" — server, network, or unknown; toast.
   */
  kind: "hardening" | "limit" | "other";
}

export function friendlyGenerationError(
  status: number,
  body: GeneratorErrorBody | null | undefined
): FriendlyError {
  const reason = body?.reason;
  const field = body?.field;

  // 422 — semantically valid but refused by our security gates.
  if (status === 422) {
    if (reason === "off_topic_refusal") {
      return {
        kind: "hardening",
        title: "Request not recognised as a mock-data ask",
        description:
          "The model didn't recognise this as a request for synthetic records. Try a clearer schema or example, then generate again.",
      };
    }
    if (reason === "sql_dangerous_statement") {
      return {
        kind: "hardening",
        title: "Generated SQL was rejected",
        description:
          "The generated output contained SQL statements outside the allowed INSERT set. Try regenerating, or switch the output format to JSON or CSV.",
      };
    }
    return {
      kind: "hardening",
      title: "Generation refused",
      description:
        "The request was refused by our content checks. Adjust the schema or examples and try again.",
    };
  }

  // 429 — rate limit OR concurrency cap.
  if (status === 429) {
    if (reason === "concurrency_limit") {
      return {
        kind: "hardening",
        title: "Too many concurrent generations",
        description:
          "You already have generations in flight. Wait for them to finish, then try again.",
      };
    }
    return {
      kind: "limit",
      title: "Daily limit reached",
      description:
        body?.error ||
        "You have used all of your free generations for today. Try again tomorrow, or use your own AI provider key.",
    };
  }

  // 403 — daily limit on /api/generate uses 403, not 429.
  if (status === 403) {
    return {
      kind: "limit",
      title: "Daily limit reached",
      description:
        body?.error ||
        "You have used all of your free generations for today. Try again tomorrow, or use your own AI provider key.",
    };
  }

  // 400 — pre-flight intent check, BYO-key gate, SSRF guard, or zod failure.
  if (status === 400) {
    if (reason === "jailbreak_phrase" || reason === "off_topic") {
      const where =
        field === "examples"
          ? "Examples"
          : field === "additionalInstructions"
            ? "Additional Instructions"
            : "your input";
      return {
        kind: "hardening",
        title: "Request looks off-topic",
        description: `${where} contains wording that doesn't fit a mock-data request. Rephrase it as a description of the records you want, then try again.`,
      };
    }
    if (reason === "byo_key_required") {
      return {
        kind: "hardening",
        title: "Additional Instructions need your own key",
        description:
          "Save your own AI provider API key in Settings and toggle “Use My API Key” to use additional instructions, or remove that field and retry.",
      };
    }
    if (body?.details) {
      return {
        kind: "hardening",
        title: "Invalid request",
        description:
          "Some fields didn't pass validation (length, type, or range). Check your schema, examples, and limits, then try again.",
      };
    }
    return {
      kind: "hardening",
      title: "Request rejected",
      description:
        body?.error ||
        "Your request was rejected. Adjust the schema or settings and try again.",
    };
  }

  // 401 — auth (rare on /api/generate).
  if (status === 401) {
    return {
      kind: "limit",
      title: "Sign-in required",
      description: "Please sign in and try again.",
    };
  }

  // 5xx — server problem.
  if (status >= 500) {
    return {
      kind: "other",
      title: "Service problem",
      description:
        "Something went wrong on our end while generating. Please try again in a moment.",
    };
  }

  // Fallback.
  return {
    kind: "other",
    title: `Generation Failed (${status})`,
    description: body?.error || body?.message || "Unexpected error. Please try again.",
  };
}
