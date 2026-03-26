import { Message } from "@/types.ts";
import { modelLabels } from "@/data/mockData.ts";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <article className={`message-row ${message.role}`}>
      <div className={`message-avatar ${message.role}`}>
        {isAssistant ? "AI" : "You"}
      </div>

      <div className="message-body">
        <div className="message-meta">
          <strong>{isAssistant ? "SAPFix AI" : "Operator"}</strong>
          <span>{message.timestamp}</span>
        </div>

        <div className={`message-bubble ${message.role}${message.state === "error" ? " error" : ""}`}>
          <p>{message.text}</p>
        </div>

        {isAssistant && message.result ? (
          <section className="resolution-card">
            <div className="resolution-card-header">
              <div>
                <p className="sidebar-label">Matched pattern</p>
                <h3>{message.result.diagnosticLabel}</h3>
              </div>

              <div className="resolution-stats">
                <span className="stat-pill">{message.result.mode.toUpperCase()}</span>
                <span className="stat-pill">{modelLabels[message.result.model]}</span>
                <span className="stat-pill">{message.result.latencyMs} ms</span>
              </div>
            </div>

            <div className="section-grid">
              <div className="info-panel">
                <p className="sidebar-label">Business context</p>
                <p>{message.result.sections.businessContext}</p>
              </div>
              <div className="info-panel">
                <p className="sidebar-label">Root cause</p>
                <p>{message.result.sections.rootCause}</p>
              </div>
            </div>

            <div className="list-grid">
              <div className="info-panel">
                <p className="sidebar-label">Resolution steps</p>
                <ol>
                  {message.result.sections.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="info-panel">
                <p className="sidebar-label">Prevention</p>
                <ul>
                  {message.result.sections.prevention.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="sources-panel">
              <p className="sidebar-label">Retrieved guidance</p>
              <div className="source-grid">
                {message.result.sources.map((source) => (
                  <div className="source-card" key={`${source.title}-${source.origin}`}>
                    <div className="source-card-head">
                      <strong>{source.title}</strong>
                      <span>{source.confidence}</span>
                    </div>
                    <p className="source-system">{source.system} - {source.origin}</p>
                    <p>{source.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
