import { AssistantResult, Conversation, ModelId, ResolutionSections, ResolutionSource } from "@/types.ts";

export const modelLabels: Record<ModelId, string> = {
  "llama3.1:8b": "Ollama Llama 3.1 8B",
  "gpt-4o-mini": "GPT-4o-mini"
};

export const suggestedPrompts = [
  "Enter the numbers without any gaps",
  "Error while accessing logical system &1",
  "Posting change document failed in outbound delivery",
  "Batch classification data is missing during GR"
];

interface MockResolutionTemplate {
  keywords: string[];
  diagnosticLabel: string;
  answerLead: string;
  sections: ResolutionSections;
  sources: ResolutionSource[];
  latencyMs: number;
}

const fallbackTemplate: MockResolutionTemplate = {
  keywords: [],
  diagnosticLabel: "General SAP incident triage",
  answerLead:
    "I could not map this message to one of the seeded demo incidents, so the safest next step is to capture a fuller SAP context and run the API-backed retrieval flow.",
  sections: {
    businessContext:
      "The incident appears to be part of a normal SAP business transaction, but the exact module and object are not clear from the short message alone.",
    rootCause:
      "The current frontend is running in demo mode, so it only has a small set of seeded knowledge-base matches. The Python retrieval pipeline should provide the exact nearest cases once exposed over HTTP.",
    steps: [
      "Capture the complete SAP error text, transaction code, and business step where it appears.",
      "Include any document number, plant, warehouse, or logical system referenced in the message.",
      "Send the enriched query through the backend API so the retriever can surface the nearest Chroma matches."
    ],
    prevention: [
      "Use a standard incident template for SAP support handoffs.",
      "Store verified fixes with module tags, T-codes, and system context."
    ]
  },
  sources: [
    {
      title: "Seeded demo knowledge base",
      system: "Frontend fallback",
      origin: "Mock response",
      summary: "Waiting for backend retrieval. The UI is ready to render exact matches once the API is connected.",
      confidence: "Demo"
    }
  ],
  latencyMs: 620
};

const templates: MockResolutionTemplate[] = [
  {
    keywords: ["gap", "gaps", "spaces", "numbers", "number range"],
    diagnosticLabel: "/SCWM/LT 120 - Numeric entry or number-range issue",
    answerLead:
      "I found a close SAP EWM pattern. Start with the simplest cause first: remove any spaces from the numeric field, then confirm the related number range is still valid in SAP.",
    sections: {
      businessContext:
        "This usually appears in warehouse execution when a user enters a document, handling unit, or number-range driven identifier during an operational step.",
      rootCause:
        "The input often contains hidden spaces or formatting noise. In some cases, the backing number range is exhausted or misaligned, which causes SAP to reject the value.",
      steps: [
        "Re-enter the affected value manually and make sure it contains digits only, with no embedded spaces.",
        "Verify the transaction field really expects a numeric identifier and not a mixed-format business key.",
        "If the problem persists, inspect the relevant SNRO interval or warehouse-specific number range setup for available capacity.",
        "Retry the posting or warehouse task creation after the field or number range is corrected."
      ],
      prevention: [
        "Validate copied numeric values before saving documents.",
        "Monitor critical number ranges before they run out in production."
      ]
    },
    sources: [
      {
        title: "Enter the numbers without any gaps",
        system: "SAP EWM",
        origin: "OpenAI resolution",
        summary: "Check input format and ensure the number contains no gaps or formatting noise.",
        confidence: "High match"
      },
      {
        title: "Number range review in SNRO",
        system: "SAP Basis / EWM",
        origin: "Gemini resolution",
        summary: "Extend or correct the affected interval if the numeric object is close to exhaustion.",
        confidence: "Medium match"
      }
    ],
    latencyMs: 860
  },
  {
    keywords: ["logical system", "bd54", "rfc", "destination"],
    diagnosticLabel: "Logical system connectivity and assignment",
    answerLead:
      "This looks like a landscape mapping issue. Check the logical system definition, its assignment, and the RFC destination that supports the cross-system call.",
    sections: {
      businessContext:
        "The failure usually shows up when one SAP component needs to call another system or client during integration, outbound processing, or master-data synchronization.",
      rootCause:
        "A logical system is missing, assigned incorrectly, or linked to the wrong RFC destination. Client-specific customizing can also drift between environments.",
      steps: [
        "Review the logical system entry in BD54 and confirm the expected system name exists.",
        "Check the object or client assignment that should point to that logical system.",
        "Validate the related RFC destination and run a connection test where appropriate.",
        "Retry the original interface or posting after the mapping and connectivity are corrected."
      ],
      prevention: [
        "Transport logical system customizing carefully between environments.",
        "Keep an integration checklist for client copies, RFC changes, and system refreshes."
      ]
    },
    sources: [
      {
        title: "Error while accessing logical system &1",
        system: "SAP integration",
        origin: "OpenAI resolution",
        summary: "Validate logical system assignment and the downstream RFC setup before retrying.",
        confidence: "High match"
      },
      {
        title: "BD54 logical system maintenance",
        system: "SAP Basis",
        origin: "Gemini resolution",
        summary: "Confirm the object name, client mapping, and landscape consistency.",
        confidence: "Medium match"
      }
    ],
    latencyMs: 910
  },
  {
    keywords: ["delivery", "posting change", "outbound", "warehouse task"],
    diagnosticLabel: "Delivery posting or follow-on document failure",
    answerLead:
      "The incident points to a document status mismatch. Review the delivery status, queue the failed follow-on action again, and verify dependent warehouse or output steps.",
    sections: {
      businessContext:
        "These issues often happen when shipping, warehouse execution, and follow-on posting steps are slightly out of sync after a document update.",
      rootCause:
        "A dependent document or status update did not complete cleanly, leaving the outbound delivery in a partially processed state.",
      steps: [
        "Check the delivery document status and identify which follow-on action failed.",
        "Review application logs or queue entries tied to the delivery update.",
        "Resolve the blocking dependency, then repeat the posting change or follow-on job.",
        "Confirm warehouse tasks, output determination, and delivery completion are back in sync."
      ],
      prevention: [
        "Track repeated queue failures by document type.",
        "Alert on outbound deliveries that remain in intermediate statuses for too long."
      ]
    },
    sources: [
      {
        title: "Outbound delivery posting mismatch",
        system: "SAP LE / EWM",
        origin: "Operational pattern",
        summary: "Investigate the blocked follow-on update before retrying the business step.",
        confidence: "Likely match"
      }
    ],
    latencyMs: 770
  },
  {
    keywords: ["batch", "classification", "gr", "goods receipt", "material"],
    diagnosticLabel: "Batch or classification data missing during receipt",
    answerLead:
      "This looks like a master-data completeness issue. Check the batch management settings and whether the expected classification data exists for the material and plant.",
    sections: {
      businessContext:
        "The error tends to appear during goods receipt or batch creation when material-specific classification data is required before the document can post.",
      rootCause:
        "Batch management is active, but the relevant class assignment, characteristics, or plant-level material settings are incomplete.",
      steps: [
        "Confirm the material is correctly set up for batch management in the affected organizational scope.",
        "Review the assigned class and required characteristics for the batch creation process.",
        "Populate the missing classification or batch master data, then retry the goods receipt.",
        "Validate that downstream inventory and quality processes can see the same batch attributes."
      ],
      prevention: [
        "Add a master-data readiness check before go-live or cutover activities.",
        "Use validation rules for materials that require mandatory batch attributes."
      ]
    },
    sources: [
      {
        title: "Batch classification missing at receipt",
        system: "SAP MM / QM",
        origin: "Operational pattern",
        summary: "Review class assignment and required characteristics before posting GR.",
        confidence: "Likely match"
      }
    ],
    latencyMs: 830
  }
];

function pickTemplate(query: string): MockResolutionTemplate {
  const normalized = query.toLowerCase();
  return (
    templates.find((template) =>
      template.keywords.some((keyword) => normalized.includes(keyword))
    ) ?? fallbackTemplate
  );
}

export function buildMockResponse(query: string, model: ModelId): AssistantResult {
  const template = pickTemplate(query);
  const modeSpecificTail =
    model === "gpt-4o-mini"
      ? " Once the backend endpoint is connected, the GitHub Models GPT path can turn the retrieved snippets into a polished final answer."
      : " Once the backend endpoint is connected, the local Llama path can synthesize the retrieved snippets without changing the UI flow.";

  return {
    answer: `${template.answerLead}${modeSpecificTail}`,
    diagnosticLabel: template.diagnosticLabel,
    sections: template.sections,
    sources: template.sources,
    latencyMs: template.latencyMs,
    mode: "mock",
    model,
    requestedModel: model,
    generationModel: model,
    generationLabel: modelLabels[model]
  };
}

export const seededConversations: Conversation[] = [
  {
    id: "conv-new",
    title: "New diagnosis",
    preview: "Start a new SAP investigation",
    updatedAt: "Ready",
    model: "gpt-4o-mini",
    messages: []
  }
];
