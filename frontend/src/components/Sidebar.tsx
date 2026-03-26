import { SVGProps } from "react";
import { Conversation } from "@/types.ts";

function LogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M9.3 4.6a4.6 4.6 0 0 1 5.63 1.17l.35.45.56-.08a4.58 4.58 0 0 1 4.84 6.24l-.24.52.37.41a4.6 4.6 0 0 1-4.14 7.61l-.57-.08-.29.49a4.59 4.59 0 0 1-7.96-.04l-.28-.46-.54.08a4.6 4.6 0 0 1-4.2-7.58l.37-.42-.24-.51a4.58 4.58 0 0 1 5.34-6.25Z" />
      <path d="M9.1 8.4 12 6.8l2.9 1.6v3.2L12 13.2 9.1 11.6Z" />
      <path d="M12 13.2v4.1" />
    </svg>
  );
}

function PanelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="4.5" y="5" width="15" height="14" rx="3" />
      <path d="M11 5v14" />
    </svg>
  );
}

function EditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 20h4.2l9.7-9.7a2.1 2.1 0 0 0-3-3L5.2 17v3Z" />
      <path d="m13.8 7.2 3 3" />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M5.5 6.5A2.5 2.5 0 0 1 8 4h10.5v15H8a2.5 2.5 0 0 0-2.5 2.5" />
      <path d="M5.5 6.5V19" />
      <path d="M8.5 8.5h6" />
    </svg>
  );
}

function PulseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 12h4l2-4 4 8 2-4h6" />
    </svg>
  );
}

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: string) => void;
  onCloseSidebar: () => void;
}

const secondaryItems = [
  { label: "Incidents", icon: EditIcon },
  { label: "Knowledge base", icon: BookIcon },
  { label: "System health", icon: PulseIcon }
];

export function Sidebar({
  conversations,
  activeConversationId,
  onNewConversation,
  onSelectConversation,
  onCloseSidebar
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button className="icon-button brand-icon-button" type="button" aria-label="SAPFix AI home">
          <LogoIcon />
        </button>

        <button
          className="icon-button sidebar-collapse-button"
          type="button"
          onClick={onCloseSidebar}
          aria-label="Close sidebar"
        >
          <PanelIcon />
        </button>
      </div>

      <div className="sidebar-primary-actions">
        <button className="sidebar-nav-button primary" type="button" onClick={onNewConversation}>
          <EditIcon className="sidebar-nav-icon" />
          <span>New chat</span>
        </button>

        <button className="sidebar-nav-button" type="button">
          <SearchIcon className="sidebar-nav-icon" />
          <span>Search chats</span>
          <span className="sidebar-shortcut">Ctrl K</span>
        </button>
      </div>

      <nav className="sidebar-secondary-nav" aria-label="Workspace navigation">
        {secondaryItems.map((item) => {
          const Icon = item.icon;

          return (
            <button key={item.label} className="sidebar-nav-button secondary" type="button">
              <Icon className="sidebar-nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="conversation-section-title">Recent</div>

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
