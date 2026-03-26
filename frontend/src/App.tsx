import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/components/ChatMessage.tsx";
import { Sidebar } from "@/components/Sidebar.tsx";
import { modelLabels, seededConversations, suggestedPrompts } from "@/data/mockData.ts";
import { hasApiBaseUrl, requestAssistantReply } from "@/lib/chatClient.ts";
import { Conversation, Message, ModelId } from "@/types.ts";

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatUpdatedAt(date: Date): string {
  return `Today | ${formatTime(date)}`;
}

function toConversationTitle(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) {
    return "New diagnosis";
  }

  return trimmed.length <= 28 ? trimmed : `${trimmed.slice(0, 28)}...`;
}

function buildFreshConversation(): Conversation {
  const now = new Date();

  return {
    id: `conv-${now.getTime()}`,
    title: "New diagnosis",
    preview: "Start a new SAP investigation",
    updatedAt: "Ready",
    model: "llama3.1:8b",
    messages: []
  };
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(seededConversations);
  const [activeConversationId, setActiveConversationId] = useState<string>(seededConversations[0].id);
  const [selectedModel, setSelectedModel] = useState<ModelId>(seededConversations[0].model);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0];

  useEffect(() => {
    setSelectedModel(activeConversation.model);
  }, [activeConversation.id, activeConversation.model]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation.messages.length, isLoading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = draft.trim();
    if (!query || isLoading) {
      return;
    }

    const now = new Date();
    const userMessage: Message = {
      id: `user-${now.getTime()}`,
      role: "user",
      text: query,
      timestamp: formatTime(now)
    };

    setDraft("");
    setIsLoading(true);

    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation.id === activeConversationId
          ? {
              ...conversation,
              title: conversation.messages.length === 0 ? toConversationTitle(query) : conversation.title,
              preview: "Working through a new SAP incident",
              updatedAt: formatUpdatedAt(now),
              model: selectedModel,
              messages: [...conversation.messages, userMessage]
            }
          : conversation
      )
    );

    try {
      const result = await requestAssistantReply({
        query,
        model: selectedModel,
        history: activeConversation.messages
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: result.answer,
        timestamp: formatTime(new Date()),
        result
      };

      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === activeConversationId
            ? {
                ...conversation,
                preview: result.diagnosticLabel,
                updatedAt: "Just now",
                model: selectedModel,
                messages: [...conversation.messages, assistantMessage]
              }
            : conversation
        )
      );
    } catch (error) {
      const fallbackMessage: Message = {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        text:
          error instanceof Error
            ? `The frontend could not complete the request: ${error.message}`
            : "The frontend could not complete the request.",
        timestamp: formatTime(new Date()),
        state: "error"
      };

      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === activeConversationId
            ? {
                ...conversation,
                preview: "Request needs attention",
                updatedAt: "Just now",
                messages: [...conversation.messages, fallbackMessage]
              }
            : conversation
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewConversation() {
    const nextConversation = buildFreshConversation();
    setConversations((currentConversations) => [nextConversation, ...currentConversations]);
    setActiveConversationId(nextConversation.id);
    setSelectedModel(nextConversation.model);
    setDraft("");
  }

  function handlePromptSelect(prompt: string) {
    setDraft(prompt);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        apiConfigured={hasApiBaseUrl}
        onNewConversation={handleNewConversation}
        onSelectConversation={setActiveConversationId}
      />

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Chat-first SAP troubleshooting</p>
            <h2>Resolve SAP incidents with a cleaner frontend</h2>
            <p className="workspace-copy">
              This Node.js interface borrows the conversational rhythm of chatgpt.com and adapts it for SAP support:
              left-side history, focused thread view, and a structured resolution card for each answer.
            </p>
          </div>

          <div className="header-controls">
            <label className="model-control">
              <span className="sidebar-label">Model path</span>
              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value as ModelId)}
              >
                {Object.entries(modelLabels).map(([modelId, label]) => (
                  <option key={modelId} value={modelId}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="status-strip">
              <span className="status-badge">100 SAP records</span>
              <span className="status-badge">1,163 embedded chunks</span>
              <span className="status-badge">{hasApiBaseUrl ? "API connected" : "Mock knowledge base"}</span>
            </div>
          </div>
        </header>

        <section className="hero-panel">
          <div className="hero-copy">
            <p className="sidebar-label">Suggested probes</p>
            <h3>Ask the assistant the way an analyst actually works</h3>
            <p>
              Include the message text, module, T-code, and where the process failed. The UI is already ready to render
              business context, root cause, steps, and retrieved matches from the backend.
            </p>
          </div>

          <div className="prompt-grid">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                className="prompt-chip"
                type="button"
                onClick={() => handlePromptSelect(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        <section className="thread-panel">
          {activeConversation.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading ? (
            <article className="message-row assistant">
              <div className="message-avatar assistant">AI</div>
              <div className="message-body">
                <div className="message-meta">
                  <strong>SAPFix AI</strong>
                  <span>Thinking</span>
                </div>
                <div className="message-bubble assistant loading">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </article>
          ) : null}
          <div ref={bottomRef} />
        </section>

        <form className="composer-panel" onSubmit={handleSubmit}>
          <div className="composer-topline">
            <span>{hasApiBaseUrl ? "Backend endpoint configured" : "Fallback mode enabled"}</span>
            <span>{modelLabels[selectedModel]}</span>
          </div>

          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Paste an SAP error message, add the T-code if available, and describe what the user was trying to do."
            rows={4}
          />

          <div className="composer-actions">
            <p>
              Shift+Enter adds a line break. Enter sends the request.
            </p>
            <button className="send-button" type="submit" disabled={isLoading || !draft.trim()}>
              {isLoading ? "Analyzing..." : "Send"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}