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

function HelpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.9 9.4a2.4 2.4 0 1 1 4 2c-.9.7-1.4 1.2-1.4 2.4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="2.8" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.9 1.9 0 0 1-2.7 2.7l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.9 1.9 0 0 1-3.8 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1 .2l-.2.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1.9 1.9 0 0 1 0-3.8h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1L4.8 8a1.9 1.9 0 1 1 2.7-2.7l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4a1.9 1.9 0 0 1 3.8 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1-.2l.2-.1A1.9 1.9 0 1 1 19.8 8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6h.2a1.9 1.9 0 0 1 0 3.8h-.2a1 1 0 0 0-.9.7Z" />
    </svg>
  );
}

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  isCollapsed: boolean;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: string) => void;
  onToggleSidebar: () => void;
}

const mainItems = [
  { label: "Search chats", icon: SearchIcon },
  { label: "Knowledge base", icon: BookIcon },
  { label: "System health", icon: PulseIcon }
];

const footerItems = [
  { label: "Settings", icon: SettingsIcon },
  { label: "Help", icon: HelpIcon }
];

export function Sidebar({
  conversations,
  activeConversationId,
  isCollapsed,
  onNewConversation,
  onSelectConversation,
  onToggleSidebar
}: SidebarProps) {
  if (isCollapsed) {
    return (
      <aside className="sidebar collapsed">
        <div className="sidebar-rail-top">
          <button
            className="icon-button sidebar-collapse-button"
            type="button"
            onClick={onToggleSidebar}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelIcon />
          </button>
        </div>

        <div className="sidebar-rail-actions">
          <button
            className="sidebar-rail-button"
            type="button"
            onClick={onNewConversation}
            aria-label="New chat"
            title="New chat"
          >
            <EditIcon />
          </button>

          {mainItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className="sidebar-rail-button"
                type="button"
                aria-label={item.label}
                title={item.label}
              >
                <Icon />
              </button>
            );
          })}
        </div>

        <div className="sidebar-rail-spacer" />

        <div className="sidebar-rail-actions sidebar-rail-footer">
          {footerItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className="sidebar-rail-button"
                type="button"
                aria-label={item.label}
                title={item.label}
              >
                <Icon />
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button className="icon-button brand-icon-button" type="button" aria-label="SAPFix AI home">
          <LogoIcon />
        </button>

        <button
          className="icon-button sidebar-collapse-button"
          type="button"
          onClick={onToggleSidebar}
          aria-label="Collapse sidebar"
        >
          <PanelIcon />
        </button>
      </div>

      <div className="sidebar-primary-actions">
        <button className="sidebar-nav-button primary" type="button" onClick={onNewConversation}>
          <EditIcon className="sidebar-nav-icon" />
          <span>New chat</span>
        </button>

        {mainItems.map((item) => {
          const Icon = item.icon;

          return (
            <button key={item.label} className="sidebar-nav-button" type="button">
              <Icon className="sidebar-nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

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

      <div className="sidebar-footer-nav">
        {footerItems.map((item) => {
          const Icon = item.icon;

          return (
            <button key={item.label} className="sidebar-nav-button footer" type="button">
              <Icon className="sidebar-nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
