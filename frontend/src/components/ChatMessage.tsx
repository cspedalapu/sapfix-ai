import { modelLabels } from "@/data/mockData.ts";
import { Message } from "@/types.ts";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const requestedModelLabel = message.result ? modelLabels[message.result.model] : "";
  const generationLabel = message.result?.generationLabel ?? requestedModelLabel;
  const usedModelLine = message.result
    ? message.result.requestedModel && generationLabel !== requestedModelLabel
      ? `Model used: ${generationLabel} | Requested: ${requestedModelLabel}`
      : `Model used: ${generationLabel}`
    : "";

  return (
    <article className={`message-row ${message.role}`}>
      {isAssistant ? (
        <div className="message-meta assistant">
          <strong>SAPFix AI</strong>
          <span>{message.timestamp}</span>
        </div>
      ) : null}

      <div className={`message-bubble ${message.role}${message.state === "error" ? " error" : ""}`}>
        <p>{message.text}</p>
      </div>

      {isAssistant && message.result ? (
        <section className="result-card">
          <div className="result-header">
            <h3 className="result-title">{message.result.diagnosticLabel}</h3>

            <div className="result-pills">
              <span className="result-pill">{message.result.mode.toUpperCase()}</span>
              <span className="result-pill">{generationLabel}</span>
              <span className="result-pill">{message.result.latencyMs} ms</span>
            </div>
          </div>

          {usedModelLine ? <p className="result-runtime">{usedModelLine}</p> : null}
          {message.result.generationNote ? <p className="result-runtime warning">{message.result.generationNote}</p> : null}

          <div className="result-grid">
            <div className="result-block">
              <p className="result-block-label">Business context</p>
              <p>{message.result.sections.businessContext}</p>
            </div>

            <div className="result-block">
              <p className="result-block-label">Root cause</p>
              <p>{message.result.sections.rootCause}</p>
            </div>
          </div>

          <div className="result-block wide">
            <p className="result-block-label">Steps</p>
            <ol>
              {message.result.sections.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}
    </article>
  );
}
