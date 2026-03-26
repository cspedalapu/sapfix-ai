import { Conversation } from "../types";
import { modelLabels } from "../data/mockData";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  apiConfigured: boolean;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: string) => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  apiConfigured,
  onNewConversation,
  onSelectConversation
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand-panel">
        <div className="brand-mark">S</div>
        <div>
          <p className="sidebar-label">SAPFix AI</p>
          <h1 className="brand-title">Resolution cockpit</h1>
        </div>
      </div>

      <button className="new-thread-button" type="button" onClick={onNewConversation}>
        New diagnosis
      </button>

      <div className="sidebar-section">
        <p className="sidebar-label">Recent investigations</p>
        <div className="conversation-list">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;

            return (
              <button
                key={conversation.id}
                className={`conversation-card${isActive ? " active" : ""}`}
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="conversation-meta">
                  <span>{conversation.updatedAt}</span>
                  <span>{modelLabels[conversation.model]}</span>
                </div>
                <strong>{conversation.title}</strong>
                <span>{conversation.preview}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-footer">
        <p className="sidebar-label">Runtime</p>
        <div className="runtime-card">
          <span className={`runtime-pill${apiConfigured ? " online" : ""}`}>
            {apiConfigured ? "API ready" : "Mock mode"}
          </span>
          <p>
            {apiConfigured
              ? "The frontend will call POST /chat on the configured backend."
              : "The interface is live, and seeded SAP responses are active until the Python API is connected."}
          </p>
        </div>
      </div>
    </aside>
  );
}
