import { FormEvent, KeyboardEvent, SVGProps, useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/components/ChatMessage.tsx";
import { Sidebar } from "@/components/Sidebar.tsx";
import { modelLabels, seededConversations } from "@/data/mockData.ts";
import { requestAssistantReply } from "@/lib/chatClient.ts";
import { Conversation, Message, ModelId } from "@/types.ts";

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

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
    return "New chat";
  }

  return trimmed.length <= 28 ? trimmed : `${trimmed.slice(0, 28)}...`;
}

function buildFreshConversation(): Conversation {
  const now = new Date();

  return {
    id: `conv-${now.getTime()}`,
    title: "New chat",
    preview: "Start a conversation",
    updatedAt: "Ready",
    model: "gpt-4o-mini",
    messages: []
  };
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(seededConversations);
  const [activeConversationId, setActiveConversationId] = useState<string>(seededConversations[0].id);
  const [selectedModel, setSelectedModel] = useState<ModelId>(seededConversations[0].model);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0];
  const isEmpty = activeConversation.messages.length === 0;

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
              preview: "Thinking...",
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

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  }

  function renderComposer(empty: boolean) {
    return (
      <form className={`composer-panel${empty ? " empty" : ""}`} onSubmit={handleSubmit}>
        <button className="composer-icon-button" type="button" aria-label="Add context">
          <PlusIcon />
        </button>

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          placeholder="Ask about an SAP issue"
          rows={1}
        />

        <button className="composer-submit" type="submit" disabled={isLoading || !draft.trim()}>
          {isLoading ? "Working" : "Send"}
        </button>
      </form>
    );
  }

  return (
    <div className={`app-shell${isSidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        isCollapsed={isSidebarCollapsed}
        onNewConversation={handleNewConversation}
        onSelectConversation={setActiveConversationId}
        onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
      />

      <main className="workspace">
        <header className="workspace-topbar">
          <div className="workspace-title-row">
            <button className="chat-title-button" type="button">
              <span>SAPFix AI</span>
              <span className="title-caret">⌄</span>
            </button>
          </div>

          <div className="workspace-actions">
            <label className="model-control">
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
          </div>
        </header>

        {isEmpty ? (
          <section className="empty-state">
            <h2 className="empty-title">Draft your issue...</h2>
            {renderComposer(true)}
          </section>
        ) : (
          <>
            <section className="thread-panel">
              {activeConversation.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isLoading ? (
                <article className="message-row assistant">
                  <div className="message-meta assistant">
                    <strong>SAPFix AI</strong>
                    <span>Working</span>
                  </div>
                  <div className="message-bubble assistant loading">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </article>
              ) : null}
              <div ref={bottomRef} />
            </section>

            {renderComposer(false)}
          </>
        )}
      </main>
    </div>
  );
}


