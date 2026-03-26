import { Conversation } from "@/types.ts";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: string) => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onNewConversation,
  onSelectConversation
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand-line">
          <div className="brand-mark">S</div>
          <span className="brand-name">SAPFix AI</span>
        </div>

        <button className="ghost-button" type="button" onClick={onNewConversation}>
          New chat
        </button>

        <button className="search-button" type="button">
          <span>Search chats</span>
          <span className="search-shortcut">Ctrl K</span>
        </button>
      </div>

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
              <strong>{conversation.title}</strong>
              <span>{conversation.preview}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}