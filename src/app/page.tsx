import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bell,
  MessageSquare,
  Users,
  Calendar as CalendarIcon,
  Search,
  Video,
  Phone,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Hash,
  Lock,
  Plus,
  Send,
  Paperclip,
  Smile,
  Reply,
  FileText,
  Download,
  FolderOpen,
  Check,
  Clock,
  MinusCircle,
  Moon,
  Sun,
  Mic,
  MicOff,
  VideoOff,
  MonitorUp,
  PhoneOff,
  PanelRightClose,
  PanelRightOpen,
  Pin,
  Sparkles,
  CheckCheck,
  Edit3,
  Bold,
  Italic,
  Code,
  List,
  X,
  Command,
  Volume2,
  ShieldCheck,
  Database,
  Wifi,
  CornerDownRight,
  Filter,
  UserPlus,
  Info,
} from 'lucide-react';

// ============================================================================
// PHASE 2: DATA MODELS & REAL-TIME SOCKET CONTRACTS (CLEAN-ROOM TYPES)
// ============================================================================

export type PresenceStatus = 'available' | 'busy' | 'dnd' | 'away' | 'offline';
export type AppModule = 'activity' | 'chat' | 'teams' | 'calendar';
export type ChannelTab = 'posts' | 'files' | 'schema';

export interface UserProfile {
  _id: string;
  email: string;
  displayName: string;
  title: string;
  department: string;
  initials: string;
  avatarColor: string;
  status: PresenceStatus;
  customStatusMessage?: string;
  lastSeen: string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ChannelItem {
  _id: string;
  teamId: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  unreadCount?: number;
  files: AttachmentItem[];
}

export interface TeamWorkspace {
  _id: string;
  name: string;
  description: string;
  initials: string;
  accentColor: string;
  memberIds: string[];
  channels: ChannelItem[];
}

export interface DirectConversation {
  _id: string;
  isGroup: boolean;
  title?: string;
  participantIds: string[];
  pinned: boolean;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: string;
}

export interface ThreadMessage {
  _id: string;
  channelId?: string | null;
  conversationId?: string | null;
  senderId: string;
  senderName: string;
  senderInitials: string;
  senderAvatarColor: string;
  subject?: string;
  content: string;
  attachments: AttachmentItem[];
  parentMessageId?: string | null;
  replyCount: number;
  lastReplyAt?: string;
  reactions: Record<string, string[]>; // emoji -> array of userIds
  isPinned?: boolean;
  createdAt: string;
}

export interface ActivityNotification {
  _id: string;
  type: 'mention' | 'reply' | 'reaction' | 'meeting';
  actorId: string;
  actorName: string;
  actorInitials: string;
  actorColor: string;
  summary: string;
  preview: string;
  targetModule: 'teams' | 'chat';
  targetTeamId?: string;
  targetChannelId?: string;
  targetConversationId?: string;
  targetMessageId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CalendarMeeting {
  _id: string;
  title: string;
  dayIndex: number; // 0 = Mon .. 4 = Fri
  startHour: number; // e.g. 9.5 = 9:30 AM
  durationHours: number;
  organizerName: string;
  channelLabel?: string;
  attendeeIds: string[];
  isLive?: boolean;
}

export interface CallParticipant {
  userId: string;
  displayName: string;
  title: string;
  initials: string;
  avatarColor: string;
  isMicMuted: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  isLocal?: boolean;
}

// ============================================================================
// INITIAL GROUNDED SEED STATE
// ============================================================================

const INITIAL_USERS: Record<string, UserProfile> = {
  'user-me': {
    _id: 'user-me',
    email: 'alex.rivera@pulseteams.dev',
    displayName: 'Alex Rivera',
    title: 'Lead Full-Stack Architect',
    department: 'Core Platform',
    initials: 'AR',
    avatarColor: '#5B5FC7',
    status: 'available',
    customStatusMessage: 'Shipping Next.js 14 + LiveKit v2',
    lastSeen: 'Just now',
  },
  'user-sarah': {
    _id: 'user-sarah',
    email: 'sarah.chen@pulseteams.dev',
    displayName: 'Sarah Chen',
    title: 'Staff Design Systems Engineer',
    department: 'Design Systems',
    initials: 'SC',
    avatarColor: '#0E7878',
    status: 'available',
    customStatusMessage: 'Reviewing Fluent v9 token contrast',
    lastSeen: 'Active now',
  },
  'user-marcus': {
    _id: 'user-marcus',
    email: 'marcus.vance@pulseteams.dev',
    displayName: 'Marcus Vance',
    title: 'Principal Real-Time Systems Engineer',
    department: 'Infrastructure',
    initials: 'MV',
    avatarColor: '#B446C2',
    status: 'busy',
    customStatusMessage: 'Load-testing Socket.io Redis adapter',
    lastSeen: '2m ago',
  },
  'user-priya': {
    _id: 'user-priya',
    email: 'priya.nair@pulseteams.dev',
    displayName: 'Priya Nair',
    title: 'WebRTC Media Pipeline Lead',
    department: 'Audio/Video Engine',
    initials: 'PN',
    avatarColor: '#D83B01',
    status: 'dnd',
    customStatusMessage: 'Debugging SFU simulcast layers',
    lastSeen: '5m ago',
  },
  'user-david': {
    _id: 'user-david',
    email: 'david.kim@pulseteams.dev',
    displayName: 'David Kim',
    title: 'Database Reliability Engineer',
    department: 'Data Platform',
    initials: 'DK',
    avatarColor: '#2B88D8',
    status: 'away',
    customStatusMessage: 'Stepped out for coffee',
    lastSeen: '18m ago',
  },
};

const INITIAL_TEAMS: TeamWorkspace[] = [
  {
    _id: 'team-platform',
    name: 'Core Platform Engineering',
    description: 'Next.js 14 App Router shell, Socket.io engine, and Mongoose persistence layer.',
    initials: 'CP',
    accentColor: '#5B5FC7',
    memberIds: ['user-me', 'user-sarah', 'user-marcus', 'user-priya', 'user-david'],
    channels: [
      {
        _id: 'chan-general',
        teamId: 'team-platform',
        name: 'General',
        description: 'Architecture announcements, milestone sign-offs, and cross-team syncs.',
        type: 'public',
        files: [
          {
            id: 'file-1',
            name: '01-architecture-and-ui-spec.md',
            sizeBytes: 14820,
            mimeType: 'text/markdown',
            uploadedBy: 'Alex Rivera',
            uploadedAt: 'Today, 10:15 AM',
          },
          {
            id: 'file-2',
            name: 'socket-event-contracts-v2.ts',
            sizeBytes: 8420,
            mimeType: 'application/typescript',
            uploadedBy: 'Marcus Vance',
            uploadedAt: 'Yesterday, 4:40 PM',
          },
          {
            id: 'file-3',
            name: 'mongoose-compound-indexes.pdf',
            sizeBytes: 312400,
            mimeType: 'application/pdf',
            uploadedBy: 'David Kim',
            uploadedAt: 'Nov 8, 2:10 PM',
          },
        ],
      },
      {
        _id: 'chan-realtime',
        teamId: 'team-platform',
        name: 'realtime-socket-engine',
        description: 'Socket.io namespaces, optimistic UI acks, presence heartbeats, and typing timers.',
        type: 'public',
        unreadCount: 2,
        files: [
          {
            id: 'file-4',
            name: 'redis-streams-benchmark.csv',
            sizeBytes: 45120,
            mimeType: 'text/csv',
            uploadedBy: 'Marcus Vance',
            uploadedAt: 'Today, 9:05 AM',
          },
        ],
      },
      {
        _id: 'chan-webrtc',
        teamId: 'team-platform',
        name: 'webrtc-livekit-sfu',
        description: 'LiveKit room tokens, screen share getDisplayMedia, and active speaker detection.',
        type: 'private',
        files: [
          {
            id: 'file-5',
            name: 'simulcast-bitrate-ladder.json',
            sizeBytes: 6190,
            mimeType: 'application/json',
            uploadedBy: 'Priya Nair',
            uploadedAt: 'Yesterday, 6:12 PM',
          },
        ],
      },
    ],
  },
  {
    _id: 'team-design',
    name: 'Fluent UI & Design System',
    description: 'Clean-room surface elevation tokens, 3-pane geometry, and keyboard accessibility.',
    initials: 'DS',
    accentColor: '#0E7878',
    memberIds: ['user-me', 'user-sarah'],
    channels: [
      {
        _id: 'chan-tokens',
        teamId: 'team-design',
        name: 'General',
        description: 'Dark/light mode CSS variables, 68px rail metrics, and WCAG contrast verification.',
        type: 'public',
        files: [
          {
            id: 'file-6',
            name: 'dark-mode-surface-tokens.json',
            sizeBytes: 5240,
            mimeType: 'application/json',
            uploadedBy: 'Sarah Chen',
            uploadedAt: 'Today, 11:20 AM',
          },
        ],
      },
      {
        _id: 'chan-a11y',
        teamId: 'team-design',
        name: 'keyboard-navigation',
        description: 'Ctrl+1..4 module switching, Ctrl+E Command Palette, and focus ring traps.',
        type: 'public',
        files: [],
      },
    ],
  },
];

const INITIAL_MESSAGES: ThreadMessage[] = [
  // Root Post 1 in chan-general (3 replies -> demonstrates collapsed summary expander by default)
  {
    _id: 'msg-root-1',
    channelId: 'chan-general',
    senderId: 'user-sarah',
    senderName: 'Sarah Chen',
    senderInitials: 'SC',
    senderAvatarColor: '#0E7878',
    subject: 'Phase 1 Clean-Room UI Spec & 3-Pane Shell Geometry Verified',
    content:
      'We have locked in the 3-pane layout geometry: **68px** far-left `AppNavigationRail`, resizable **280px–320px** `SecondaryListPane`, and flexible `MainStageContainer` (`min-w-0 flex-1`). Try resizing the secondary pane border or pressing `Ctrl+E` to test the command bar.',
    attachments: [
      {
        id: 'att-spec-1',
        name: '01-architecture-and-ui-spec.md',
        sizeBytes: 14820,
        mimeType: 'text/markdown',
        uploadedBy: 'Sarah Chen',
        uploadedAt: '10:15 AM',
      },
    ],
    parentMessageId: null,
    replyCount: 3,
    lastReplyAt: '10:28 AM',
    reactions: {
      '👍': ['user-me', 'user-marcus', 'user-priya'],
      '🚀': ['user-me', 'user-david'],
    },
    isPinned: true,
    createdAt: 'Today, 10:15 AM',
  },
  {
    _id: 'msg-reply-101',
    channelId: 'chan-general',
    senderId: 'user-marcus',
    senderName: 'Marcus Vance',
    senderInitials: 'MV',
    senderAvatarColor: '#B446C2',
    content:
      'Confirmed on the Socket.io contract side! `parentMessageId` indexes cleanly on `{ channelId: 1, parentMessageId: 1, createdAt: 1 }` in Mongoose so root thread queries stay O(log n).',
    attachments: [],
    parentMessageId: 'msg-root-1',
    replyCount: 0,
    reactions: { '❤️': ['user-sarah'] },
    createdAt: 'Today, 10:19 AM',
  },
  {
    _id: 'msg-reply-102',
    channelId: 'chan-general',
    senderId: 'user-priya',
    senderName: 'Priya Nair',
    senderInitials: 'PN',
    senderAvatarColor: '#D83B01',
    content:
      'I hooked the top-right **Meet Now** button into our WebRTC / LiveKit stage. Starting a call automatically sets your live presence badge to `Busy (In a call)` and opens the real-time video grid with screen share (`getDisplayMedia`).',
    attachments: [],
    parentMessageId: 'msg-root-1',
    replyCount: 0,
    reactions: { '🎉': ['user-me', 'user-sarah', 'user-marcus'] },
    createdAt: 'Today, 10:24 AM',
  },
  {
    _id: 'msg-reply-103',
    channelId: 'chan-general',
    senderId: 'user-me',
    senderName: 'Alex Rivera',
    senderInitials: 'AR',
    senderAvatarColor: '#5B5FC7',
    content:
      'Awesome work team.Notice how threads with 3+ replies collapse into a summary bar by default—click the summary bar to expand all replies, or click **Reply** to attach an inline composer directly to this card.',
    attachments: [],
    parentMessageId: 'msg-root-1',
    replyCount: 0,
    reactions: { '👍': ['user-sarah'] },
    createdAt: 'Today, 10:28 AM',
  },

  // Root Post 2 in chan-general (1 reply -> rendered inline by default per spec)
  {
    _id: 'msg-root-2',
    channelId: 'chan-general',
    senderId: 'user-david',
    senderName: 'David Kim',
    senderInitials: 'DK',
    senderAvatarColor: '#2B88D8',
    subject: 'MongoDB Mongoose Schema & Optimistic Ack Pipeline Ready',
    content:
      'All five core schemas (`User`, `Team`, `Channel`, `Conversation`, `Message`) are live. Reaction maps use `Map<string, string[]>` so toggling emojis is idempotent per `userId`. Check the **Architecture & Schemas** tab in the header to inspect the code!',
    attachments: [],
    parentMessageId: null,
    replyCount: 1,
    lastReplyAt: '11:05 AM',
    reactions: { '👀': ['user-me', 'user-marcus'] },
    createdAt: 'Today, 11:02 AM',
  },
  {
    _id: 'msg-reply-201',
    channelId: 'chan-general',
    senderId: 'user-sarah',
    senderName: 'Sarah Chen',
    senderInitials: 'SC',
    senderAvatarColor: '#0E7878',
    content: 'Love that 1–2 replies render inline automatically without needing an extra click.',
    attachments: [],
    parentMessageId: 'msg-root-2',
    replyCount: 0,
    reactions: {},
    createdAt: 'Today, 11:05 AM',
  },

  // Root Post in chan-realtime
  {
    _id: 'msg-root-3',
    channelId: 'chan-realtime',
    senderId: 'user-marcus',
    senderName: 'Marcus Vance',
    senderInitials: 'MV',
    senderAvatarColor: '#B446C2',
    subject: 'Socket.io Typing Indicator Throttling (2000ms emit / 3500ms expiry)',
    content:
      'When you type in any channel reply box or 1:1 chat input, we emit `typing:start` and trigger a realistic peer reply simulation so you can test the animated 3-dot `"User is typing..."` indicator and instant message arrival in real time.',
    attachments: [],
    parentMessageId: null,
    replyCount: 0,
    reactions: { '🚀': ['user-me', 'user-priya'] },
    createdAt: 'Today, 11:30 AM',
  },

  // Root Post in chan-webrtc
  {
    _id: 'msg-root-4',
    channelId: 'chan-webrtc',
    senderId: 'user-priya',
    senderName: 'Priya Nair',
    senderInitials: 'PN',
    senderAvatarColor: '#D83B01',
    subject: 'WebRTC / LiveKit Stage & Screen Sharing (getDisplayMedia)',
    content:
      'Click **Meet Now** in the top-right header to launch the multi-participant video call stage. You can toggle your local camera (`getUserMedia`), mute/unmute mic, share your screen (`getDisplayMedia`), spotlight active speakers, and open the in-call chat drawer.',
    attachments: [],
    parentMessageId: null,
    replyCount: 0,
    reactions: { '🎉': ['user-me'] },
    createdAt: 'Today, 11:45 AM',
  },

  // Root Post in chan-tokens
  {
    _id: 'msg-root-5',
    channelId: 'chan-tokens',
    senderId: 'user-sarah',
    senderName: 'Sarah Chen',
    senderInitials: 'SC',
    senderAvatarColor: '#0E7878',
    subject: 'Surface Layer Tokens: Dark (#141414 / #1F1F1F / #292929) & Light Mode',
    content:
      'Toggle the **Sun / Moon** theme button in the top global bar to verify our clean-room CSS token palette across all 3 panes.',
    attachments: [],
    parentMessageId: null,
    replyCount: 0,
    reactions: { '❤️': ['user-me'] },
    createdAt: 'Today, 12:00 PM',
  },

  // Direct Chat Messages (conv-sarah)
  {
    _id: 'dm-101',
    conversationId: 'conv-sarah',
    senderId: 'user-sarah',
    senderName: 'Sarah Chen',
    senderInitials: 'SC',
    senderAvatarColor: '#0E7878',
    content: 'Hey Alex! Did you verify the inline reply composer behavior on root channel posts?',
    attachments: [],
    parentMessageId: null,
    replyCount: 0,
    reactions: { '👍': ['user-me'] },
    createdAt: '10:40 AM',
  },
  {
    _id: 'dm-102',
    conversationId: 'conv-sarah',
    senderId: 'user-me',
    senderName: 'Alex Rivera',
    senderInitials: 'AR',
    senderAvatarColor: '#5B5FC7',
    content:
      'Yes! Clicking Reply attaches the Markdown composer directly to that thread card, and sending a message here in 1:1 Chat triggers your live Socket.io typing indicator and auto-response.',
    attachments: [],
    parentMessageId: null,
    replyCount: 0,
    reactions: { '❤️': ['user-sarah'] },
    createdAt: '10:42 AM',
  },

  // Direct Chat Messages (conv-marcus)
  {
    _id: 'dm-201',
    conversationId: 'conv-marcus',
    senderId: 'user-marcus',
    senderName: 'Marcus Vance',
    senderInitials: 'MV',
    senderAvatarColor: '#B446C2',
    content:
      'Socket.io reconnection backoff and optimistic `tempId -> _id` message acknowledgment are both green.',
    attachments: [],
    parentMessageId: null,
    replyCount: 0,
    reactions: { '🚀': ['user-me'] },
    createdAt: 'Yesterday',
  },

  // Group Chat Messages (conv-group-leads)
  {
    _id: 'dm-301',
    conversationId: 'conv-group-leads',
    senderId: 'user-priya',
    senderName: 'Priya Nair',
    senderInitials: 'PN',
    senderAvatarColor: '#D83B01',
    content: 'Ready for our architecture demo call? Hit **Meet Now** whenever you want to test the video stage.',
    attachments: [],
    parentMessageId: null,
    replyCount: 0,
    reactions: { '👍': ['user-me', 'user-sarah', 'user-marcus'] },
    createdAt: '11:15 AM',
  },
];

const INITIAL_CONVERSATIONS: DirectConversation[] = [
  {
    _id: 'conv-sarah',
    isGroup: false,
    participantIds: ['user-me', 'user-sarah'],
    pinned: true,
    unreadCount: 0,
    lastMessageAt: '10:42 AM',
    lastMessagePreview: 'Yes! Clicking Reply attaches the Markdown composer...',
  },
  {
    _id: 'conv-group-leads',
    isGroup: true,
    title: 'Architecture & WebRTC Sync',
    participantIds: ['user-me', 'user-sarah', 'user-marcus', 'user-priya'],
    pinned: true,
    unreadCount: 1,
    lastMessageAt: '11:15 AM',
    lastMessagePreview: 'Priya: Ready for our architecture demo call?',
  },
  {
    _id: 'conv-marcus',
    isGroup: false,
    participantIds: ['user-me', 'user-marcus'],
    pinned: false,
    unreadCount: 0,
    lastMessageAt: 'Yesterday',
    lastMessagePreview: 'Socket.io reconnection backoff and optimistic...',
  },
  {
    _id: 'conv-priya',
    isGroup: false,
    participantIds: ['user-me', 'user-priya'],
    pinned: false,
    unreadCount: 0,
    lastMessageAt: 'Nov 8',
    lastMessagePreview: 'LiveKit SFU token endpoint is wired to /api/livekit',
  },
];

const INITIAL_ACTIVITIES: ActivityNotification[] = [
  {
    _id: 'act-1',
    type: 'mention',
    actorId: 'user-priya',
    actorName: 'Priya Nair',
    actorInitials: 'PN',
    actorColor: '#D83B01',
    summary: 'mentioned you in Core Platform Engineering > General',
    preview: 'I hooked the top-right Meet Now button into our WebRTC / LiveKit stage...',
    targetModule: 'teams',
    targetTeamId: 'team-platform',
    targetChannelId: 'chan-general',
    targetMessageId: 'msg-root-1',
    isRead: false,
    createdAt: '10:24 AM',
  },
  {
    _id: 'act-2',
    type: 'reply',
    actorId: 'user-sarah',
    actorName: 'Sarah Chen',
    actorInitials: 'SC',
    actorColor: '#0E7878',
    summary: 'replied to David Kim in Core Platform Engineering > General',
    preview: 'Love that 1–2 replies render inline automatically without needing an extra click.',
    targetModule: 'teams',
    targetTeamId: 'team-platform',
    targetChannelId: 'chan-general',
    targetMessageId: 'msg-root-2',
    isRead: false,
    createdAt: '11:05 AM',
  },
  {
    _id: 'act-3',
    type: 'reaction',
    actorId: 'user-marcus',
    actorName: 'Marcus Vance',
    actorInitials: 'MV',
    actorColor: '#B446C2',
    summary: 'reacted 🚀 to your message in Architecture & WebRTC Sync',
    preview: 'Ready for our architecture demo call? Hit Meet Now whenever you want...',
    targetModule: 'chat',
    targetConversationId: 'conv-group-leads',
    isRead: true,
    createdAt: '11:16 AM',
  },
];

const INITIAL_MEETINGS: CalendarMeeting[] = [
  {
    _id: 'mtg-1',
    title: 'Daily Core Platform Standup',
    dayIndex: 1,
    startHour: 9.5,
    durationHours: 0.5,
    organizerName: 'Alex Rivera',
    channelLabel: 'Core Platform Engineering > General',
    attendeeIds: ['user-me', 'user-sarah', 'user-marcus', 'user-priya'],
    isLive: true,
  },
  {
    _id: 'mtg-2',
    title: 'Fluent v9 Design Tokens & A11y Audit',
    dayIndex: 1,
    startHour: 11,
    durationHours: 1,
    organizerName: 'Sarah Chen',
    channelLabel: 'Fluent UI & Design System > General',
    attendeeIds: ['user-me', 'user-sarah'],
  },
  {
    _id: 'mtg-3',
    title: 'Socket.io & Mongoose Load Benchmark Review',
    dayIndex: 2,
    startHour: 14,
    durationHours: 1,
    organizerName: 'Marcus Vance',
    channelLabel: 'Core Platform Engineering > realtime-socket-engine',
    attendeeIds: ['user-me', 'user-marcus', 'user-david'],
  },
  {
    _id: 'mtg-4',
    title: 'WebRTC / LiveKit SFU Architecture Deep Dive',
    dayIndex: 3,
    startHour: 10,
    durationHours: 1.5,
    organizerName: 'Priya Nair',
    channelLabel: 'Core Platform Engineering > webrtc-livekit-sfu',
    attendeeIds: ['user-me', 'user-priya', 'user-marcus'],
  },
];

const QUICK_EMOJIS = ['👍', '❤️', '🎉', '🚀', '👀'];

// ============================================================================
// HELPER COMPONENTS: PRESENCE BADGE & MARKDOWN LITE RENDERER
// ============================================================================

function PresenceBadge({
  status,
  size = 'sm',
}: {
  status: PresenceStatus;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5';

  if (status === 'available') {
    return (
      <span
        title="Available"
        className={`${dim} rounded-full bg-[#6BB700] ring-2 ring-[var(--bg-surface-ring,#1F1F1F)] flex items-center justify-center`}
      >
        <Check className="w-2 h-2 text-white stroke-[3]" />
      </span>
    );
  }
  if (status === 'busy') {
    return (
      <span
        title="Busy / In a call"
        className={`${dim} rounded-full bg-[#D13438] ring-2 ring-[var(--bg-surface-ring,#1F1F1F)]`}
      />
    );
  }
  if (status === 'dnd') {
    return (
      <span
        title="Do Not Disturb"
        className={`${dim} rounded-full bg-[#C50F1F] ring-2 ring-[var(--bg-surface-ring,#1F1F1F)] flex items-center justify-center`}
      >
        <span className="w-1.5 h-[2px] bg-white rounded-full" />
      </span>
    );
  }
  if (status === 'away') {
    return (
      <span
        title="Away"
        className={`${dim} rounded-full bg-[#EAA300] ring-2 ring-[var(--bg-surface-ring,#1F1F1F)] flex items-center justify-center`}
      >
        <Clock className="w-2 h-2 text-black stroke-[3]" />
      </span>
    );
  }
  return (
    <span
      title="Offline"
      className={`${dim} rounded-full bg-zinc-500 border-2 border-zinc-300 dark:border-zinc-700 ring-2 ring-[var(--bg-surface-ring,#1F1F1F)]`}
    />
  );
}

function AvatarWithPresence({
  name,
  initials,
  color,
  status,
  size = 'md',
}: {
  name: string;
  initials: string;
  color: string;
  status?: PresenceStatus;
  size?: 'sm' | 'md' | 'lg';
}) {
  const box =
    size === 'lg'
      ? 'w-10 h-10 text-sm'
      : size === 'md'
      ? 'w-8 h-8 text-xs'
      : 'w-6 h-6 text-[10px]';

  return (
    <div className="relative inline-flex shrink-0 select-none" title={`${name} (${status || 'available'})`}>
      <div
        style={{ backgroundColor: color }}
        className={`${box} rounded-full font-semibold text-white flex items-center justify-center shadow-sm`}
      >
        {initials}
      </div>
      {status && (
        <span className="absolute -bottom-0.5 -right-0.5">
          <PresenceBadge status={status} size={size === 'lg' ? 'md' : 'sm'} />
        </span>
      )}
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  // Lightweight clean-room inline formatter for **bold**, `code`, and @mentions
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|@[A-Za-z]+\s?[A-Za-z]*)/g);
  return (
    <span className="leading-relaxed break-words">
      {tokens.map((tok, i) => {
        if (tok.startsWith('**') && tok.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold">
              {tok.slice(2, -2)}
            </strong>
          );
        }
        if (tok.startsWith('`') && tok.endsWith('`')) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 mx-0.5 text-xs font-mono rounded bg-black/10 dark:bg-white/10 text-[#5B5FC7] dark:text-[#9299F7]"
            >
              {tok.slice(1, -1)}
            </code>
          );
        }
        if (tok.startsWith('@')) {
          return (
            <span
              key={i}
              className="px-1 py-0.5 rounded bg-[#5B5FC7]/15 text-[#5B5FC7] dark:text-[#9299F7] font-medium"
            >
              {tok}
            </span>
          );
        }
        return <React.Fragment key={i}>{tok}</React.Fragment>;
      })}
    </span>
  );
}

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Theme & Shell Geometry State
  const [isDark, setIsDark] = useState(true);
  const [activeModule, setActiveModule] = useState<AppModule>('teams');
  const [secondaryWidth, setSecondaryWidth] = useState<number>(296);
  const [isSecondaryCollapsed, setIsSecondaryCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showRightInfoDrawer, setShowRightInfoDrawer] = useState(false);

  // Domain Data State
  const [users, setUsers] = useState<Record<string, UserProfile>>(INITIAL_USERS);
  const [teams, setTeams] = useState<TeamWorkspace[]>(INITIAL_TEAMS);
  const [conversations, setConversations] = useState<DirectConversation[]>(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState<ThreadMessage[]>(INITIAL_MESSAGES);
  const [activities, setActivities] = useState<ActivityNotification[]>(INITIAL_ACTIVITIES);
  const [meetings, setMeetings] = useState<CalendarMeeting[]>(INITIAL_MEETINGS);

  // Navigation & Selection State
  const [expandedTeamIds, setExpandedTeamIds] = useState<Record<string, boolean>>({
    'team-platform': true,
    'team-design': true,
  });
  const [selectedTeamId, setSelectedTeamId] = useState<string>('team-platform');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('chan-general');
  const [activeChannelTab, setActiveChannelTab] = useState<ChannelTab>('posts');
  const [selectedConversationId, setSelectedConversationId] = useState<string>('conv-sarah');
  const [activityFilterUnread, setActivityFilterUnread] = useState(false);
  const [chatFilterQuery, setChatFilterQuery] = useState('');

  // Channel Thread State Machine
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [activeReplyThreadId, setActiveReplyThreadId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [isNewPostExpanded, setIsNewPostExpanded] = useState(false);
  const [newPostSubject, setNewPostSubject] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostAttachments, setNewPostAttachments] = useState<AttachmentItem[]>([]);

  // 1:1 & Group Chat Composer State
  const [chatDraft, setChatDraft] = useState('');

  // Real-time Socket.io Simulation State (Typing, Presence, Live Logs)
  const [typingByRoom, setTypingByRoom] = useState<
    Record<string, Array<{ userId: string; displayName: string }>>
  >({});
  const [socketEventsLog, setSocketEventsLog] = useState<
    Array<{ id: string; time: string; event: string; detail: string }>
  >([
    {
      id: 'evt-init-1',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      event: 'socket:connected',
      detail: 'Namespace /api/socket/io • Authenticated as Alex Rivera (user-me)',
    },
    {
      id: 'evt-init-2',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      event: 'room:join',
      detail: 'Joined room chan-general & presence broadcast active',
    },
  ]);

  // Command Palette (`Ctrl+E`) & Modals State
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isNewChannelModalOpen, setIsNewChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingDay, setNewMeetingDay] = useState(2);
  const [newMeetingHour, setNewMeetingHour] = useState(13);

  // Milestone 4: WebRTC / LiveKit "Meet Now" Call Stage State
  const [isInCall, setIsInCall] = useState(false);
  const [callRoomTitle, setCallRoomTitle] = useState('General — Meet Now');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('user-sarah');
  const [showInCallChat, setShowInCallChat] = useState(true);
  const [callElapsedSeconds, setCallElapsedSeconds] = useState(0);
  const [preCallStatus, setPreCallStatus] = useState<PresenceStatus>('available');
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  const currentUser = users['user-me'];

  const appendSocketLog = (event: string, detail: string) => {
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setSocketEventsLog((prev) => [
      { id: `evt-${Date.now()}-${Math.random()}`, time, event, detail },
      ...prev.slice(0, 24),
    ]);
  };

  // ============================================================================
  // KEYBOARD SHORTCUTS: Ctrl+1..4 Navigation & Ctrl+E Command Bar
  // ============================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key === '1') {
        e.preventDefault();
        setActiveModule('activity');
        appendSocketLog('nav:shortcut', 'Switched to Activity (Ctrl+1)');
      } else if (isMod && e.key === '2') {
        e.preventDefault();
        setActiveModule('chat');
        appendSocketLog('nav:shortcut', 'Switched to Chat (Ctrl+2)');
      } else if (isMod && e.key === '3') {
        e.preventDefault();
        setActiveModule('teams');
        appendSocketLog('nav:shortcut', 'Switched to Teams (Ctrl+3)');
      } else if (isMod && e.key === '4') {
        e.preventDefault();
        setActiveModule('calendar');
        appendSocketLog('nav:shortcut', 'Switched to Calendar (Ctrl+4)');
      } else if (isMod && (e.key.toLowerCase() === 'e' || e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandOpen(false);
        setActiveReplyThreadId(null);
        setIsStatusMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ============================================================================
  // SECONDARY PANE DRAG RESIZER (240px - 400px)
  // ============================================================================
  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const nextWidth = Math.min(400, Math.max(240, e.clientX - 68));
      setSecondaryWidth(nextWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // ============================================================================
  // CALL TIMER & ACTIVE SPEAKER SIMULATION
  // ============================================================================
  useEffect(() => {
    if (!isInCall) {
      setCallElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setCallElapsedSeconds((s) => s + 1);
    }, 1000);

    const speakerCycle = setInterval(() => {
      const pool = ['user-sarah', 'user-marcus', 'user-priya', 'user-me'];
      const next = pool[Math.floor(Math.random() * pool.length)];
      setActiveSpeakerId(next);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(speakerCycle);
    };
  }, [isInCall]);

  // Clean up media streams on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ============================================================================
  // DERIVED SELECTIONS
  // ============================================================================
  const currentTeam = useMemo(
    () => teams.find((t) => t._id === selectedTeamId) || teams[0],
    [teams, selectedTeamId]
  );

  const currentChannel = useMemo(
    () =>
      currentTeam.channels.find((c) => c._id === selectedChannelId) ||
      currentTeam.channels[0],
    [currentTeam, selectedChannelId]
  );

  const currentConversation = useMemo(
    () =>
      conversations.find((c) => c._id === selectedConversationId) ||
      conversations[0],
    [conversations, selectedConversationId]
  );

  const channelRootMessages = useMemo(
    () =>
      messages.filter(
        (m) => m.channelId === currentChannel._id && !m.parentMessageId
      ),
    [messages, currentChannel._id]
  );

  const repliesByParentId = useMemo(() => {
    const map: Record<string, ThreadMessage[]> = {};
    messages.forEach((m) => {
      if (m.parentMessageId) {
        if (!map[m.parentMessageId]) map[m.parentMessageId] = [];
        map[m.parentMessageId].push(m);
      }
    });
    return map;
  }, [messages]);

  const directChatMessages = useMemo(
    () =>
      messages.filter((m) => m.conversationId === currentConversation._id),
    [messages, currentConversation._id]
  );

  const unreadActivityCount = useMemo(
    () => activities.filter((a) => !a.isRead).length,
    [activities]
  );

  const unreadChatCount = useMemo(
    () => conversations.reduce((acc, c) => acc + c.unreadCount, 0),
    [conversations]
  );

  // ============================================================================
  // REAL-TIME SOCKET ACTIONS: SEND MESSAGE, REPLY, REACT, TYPING, PRESENCE
  // ============================================================================

  const updateMyPresence = (status: PresenceStatus, customStatusMessage?: string) => {
    setUsers((prev) => ({
      ...prev,
      'user-me': {
        ...prev['user-me'],
        status,
        customStatusMessage:
          customStatusMessage !== undefined
            ? customStatusMessage
            : prev['user-me'].customStatusMessage,
        lastSeen: 'Just now',
      },
    }));
    appendSocketLog(
      'presence:set',
      `User user-me transitioned to "${status.toUpperCase()}"`
    );
    setIsStatusMenuOpen(false);
  };

  const triggerSimulatedPeerReply = (
    contextType: 'channel' | 'chat',
    roomId: string,
    parentMessageId: string | null,
    userPromptText: string
  ) => {
    // Select a peer responder
    const responder =
      contextType === 'chat'
        ? (() => {
            const peerId =
              currentConversation.participantIds.find((id) => id !== 'user-me') ||
              'user-sarah';
            return users[peerId] || users['user-sarah'];
          })()
        : users['user-marcus'];

    // 1. Emit typing:start after 600ms
    setTimeout(() => {
      setTypingByRoom((prev) => ({
        ...prev,
        [roomId]: [{ userId: responder._id, displayName: responder.displayName }],
      }));
      appendSocketLog(
        'typing:update',
        `${responder.displayName} started typing in ${roomId}`
      );
    }, 550);

    // 2. Emit message:new after 2300ms and clear typing indicator
    setTimeout(() => {
      setTypingByRoom((prev) => ({
        ...prev,
        [roomId]: [],
      }));

      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const replyId = `msg-sim-${Date.now()}`;
      const smartContent =
        contextType === 'channel'
          ? `Ack via Socket.io! Logged your update ("${userPromptText.slice(
              0,
              48
            )}") into MongoDB thread \`${parentMessageId || 'root'}\` with zero packet loss.`
          : `Got it! I just saw "${userPromptText.slice(
              0,
              45
            )}" come through on the real-time Socket.io stream.`;

      const incomingMsg: ThreadMessage = {
        _id: replyId,
        channelId: contextType === 'channel' ? roomId : null,
        conversationId: contextType === 'chat' ? roomId : null,
        senderId: responder._id,
        senderName: responder.displayName,
        senderInitials: responder.initials,
        senderAvatarColor: responder.avatarColor,
        content: smartContent,
        attachments: [],
        parentMessageId: parentMessageId || null,
        replyCount: 0,
        reactions: {},
        createdAt: `Today, ${nowStr}`,
      };

      setMessages((prev) => {
        const next = [...prev, incomingMsg];
        if (parentMessageId) {
          return next.map((m) =>
            m._id === parentMessageId
              ? { ...m, replyCount: m.replyCount + 1, lastReplyAt: nowStr }
              : m
          );
        }
        return next;
      });

      if (contextType === 'chat') {
        setConversations((prev) =>
          prev.map((c) =>
            c._id === roomId
              ? {
                  ...c,
                  lastMessageAt: nowStr,
                  lastMessagePreview: `${responder.displayName.split(' ')[0]}: ${smartContent}`,
                }
              : c
          )
        );
      }

      appendSocketLog(
        'message:new',
        `Received ${replyId} from ${responder.displayName} in ${roomId}`
      );
    }, 2300);
  };

  const handleSendRootPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const nowStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newId = `msg-root-${Date.now()}`;

    const newPost: ThreadMessage = {
      _id: newId,
      channelId: currentChannel._id,
      senderId: currentUser._id,
      senderName: currentUser.displayName,
      senderInitials: currentUser.initials,
      senderAvatarColor: currentUser.avatarColor,
      subject: newPostSubject.trim() || undefined,
      content: newPostContent.trim(),
      attachments: newPostAttachments,
      parentMessageId: null,
      replyCount: 0,
      reactions: {},
      createdAt: `Today, ${nowStr}`,
    };

    setMessages((prev) => [...prev, newPost]);

    // If attachments were included, sync them to Channel Files tab too
    if (newPostAttachments.length > 0) {
      setTeams((prev) =>
        prev.map((team) =>
          team._id === currentTeam._id
            ? {
                ...team,
                channels: team.channels.map((ch) =>
                  ch._id === currentChannel._id
                    ? { ...ch, files: [...newPostAttachments, ...ch.files] }
                    : ch
                ),
              }
            : team
        )
      );
    }

    appendSocketLog(
      'message:send',
      `Created root thread ${newId} in #${currentChannel.name}`
    );

    const promptCopy = newPostContent.trim();
    setNewPostSubject('');
    setNewPostContent('');
    setNewPostAttachments([]);
    setIsNewPostExpanded(false);

    triggerSimulatedPeerReply('channel', currentChannel._id, newId, promptCopy);
  };

  const handleSendThreadReply = (parentMessageId: string) => {
    const draft = (replyDrafts[parentMessageId] || '').trim();
    if (!draft) return;

    const nowStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const replyId = `msg-reply-${Date.now()}`;

    const replyMsg: ThreadMessage = {
      _id: replyId,
      channelId: currentChannel._id,
      senderId: currentUser._id,
      senderName: currentUser.displayName,
      senderInitials: currentUser.initials,
      senderAvatarColor: currentUser.avatarColor,
      content: draft,
      attachments: [],
      parentMessageId,
      replyCount: 0,
      reactions: {},
      createdAt: `Today, ${nowStr}`,
    };

    setMessages((prev) =>
      [...prev, replyMsg].map((m) =>
        m._id === parentMessageId
          ? { ...m, replyCount: m.replyCount + 1, lastReplyAt: nowStr }
          : m
      )
    );
    setExpandedThreads((prev) => ({ ...prev, [parentMessageId]: true }));
    setReplyDrafts((prev) => ({ ...prev, [parentMessageId]: '' }));

    appendSocketLog(
      'message:send (reply)',
      `Appended reply ${replyId} to parent thread ${parentMessageId}`
    );

    triggerSimulatedPeerReply('channel', currentChannel._id, parentMessageId, draft);
  };

  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatDraft.trim()) return;

    const nowStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dmId = `dm-${Date.now()}`;
    const body = chatDraft.trim();

    const newDm: ThreadMessage = {
      _id: dmId,
      conversationId: currentConversation._id,
      senderId: currentUser._id,
      senderName: currentUser.displayName,
      senderInitials: currentUser.initials,
      senderAvatarColor: currentUser.avatarColor,
      content: body,
      attachments: [],
      parentMessageId: null,
      replyCount: 0,
      reactions: {},
      createdAt: nowStr,
    };

    setMessages((prev) => [...prev, newDm]);
    setConversations((prev) =>
      prev.map((c) =>
        c._id === currentConversation._id
          ? { ...c, lastMessageAt: nowStr, lastMessagePreview: `You: ${body}` }
          : c
      )
    );
    setChatDraft('');
    appendSocketLog(
      'message:send (chat)',
      `Sent DM ${dmId} in conversation ${currentConversation._id}`
    );

    triggerSimulatedPeerReply('chat', currentConversation._id, null, body);
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m._id !== messageId) return m;
        const existing = m.reactions[emoji] || [];
        const hasReacted = existing.includes(currentUser._id);
        const nextUsers = hasReacted
          ? existing.filter((id) => id !== currentUser._id)
          : [...existing, currentUser._id];
        const nextReactions = { ...m.reactions };
        if (nextUsers.length === 0) {
          delete nextReactions[emoji];
        } else {
          nextReactions[emoji] = nextUsers;
        }
        return { ...m, reactions: nextReactions };
      })
    );
    appendSocketLog(
      'message:reaction:toggle',
      `Toggled ${emoji} on message ${messageId}`
    );
  };

  const handleUploadSampleFile = (target: 'composer' | 'channel') => {
    const sampleFiles = [
      { name: 'webrtc-sfu-topology-diagram.png', sizeBytes: 248900, mimeType: 'image/png' },
      { name: 'q4-latency-telemetry-report.pdf', sizeBytes: 512000, mimeType: 'application/pdf' },
      { name: 'livekit-room-config.yaml', sizeBytes: 4120, mimeType: 'text/yaml' },
    ];
    const pick = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
    const item: AttachmentItem = {
      id: `file-${Date.now()}`,
      name: pick.name,
      sizeBytes: pick.sizeBytes,
      mimeType: pick.mimeType,
      uploadedBy: currentUser.displayName,
      uploadedAt: 'Just now',
    };

    if (target === 'composer') {
      setNewPostAttachments((prev) => [...prev, item]);
    } else {
      setTeams((prev) =>
        prev.map((t) =>
          t._id === currentTeam._id
            ? {
                ...t,
                channels: t.channels.map((c) =>
                  c._id === currentChannel._id
                    ? { ...c, files: [item, ...c.files] }
                    : c
                ),
              }
            : t
        )
      );
      appendSocketLog('channel:file:upload', `Uploaded ${item.name} to #${currentChannel.name}`);
    }
  };

  // ============================================================================
  // MILESTONE 4: WEBRTC / LIVEKIT "MEET NOW" CALL STAGE HANDLERS
  // ============================================================================

  const startMeetNowCall = (title: string) => {
    setPreCallStatus(currentUser.status);
    updateMyPresence('busy', 'In a call');
    setCallRoomTitle(title);
    setIsInCall(true);
    setMediaNotice(null);
    appendSocketLog(
      'call:join',
      `Joined LiveKit/WebRTC room "${title}" • Presence auto-set to BUSY`
    );
  };

  const leaveMeetNowCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setIsCamOn(false);
    setIsScreenSharing(false);
    setIsInCall(false);
    updateMyPresence(preCallStatus, 'Shipping Next.js 14 + LiveKit v2');
    appendSocketLog(
      'call:leave',
      `Left call "${callRoomTitle}" • Presence restored to ${preCallStatus.toUpperCase()}`
    );
  };

  const toggleCamera = async () => {
    if (isCamOn) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      setIsCamOn(false);
      appendSocketLog('webrtc:camera', 'Local video track stopped');
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        localStreamRef.current = stream;
        setIsCamOn(true);
        setMediaNotice('Live hardware camera stream active (getUserMedia).');
        setTimeout(() => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }, 100);
        appendSocketLog('webrtc:camera', 'Published local camera track via getUserMedia');
      } else {
        throw new Error('Camera API blocked in sandboxed iframe');
      }
    } catch {
      // Fallback simulated camera canvas stream when browser permissions are restricted in iframe
      setIsCamOn(true);
      setMediaNotice(
        'Hardware camera permission restricted by sandboxed iframe — rendering simulated HD WebRTC camera feed.'
      );
      appendSocketLog(
        'webrtc:camera (simulated)',
        'Published synthetic WebRTC video track (sandbox fallback)'
      );
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      appendSocketLog('webrtc:screenshare', 'Stopped getDisplayMedia screen share');
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        setMediaNotice('Live screen share stream active (getDisplayMedia).');
        setTimeout(() => {
          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = stream;
          }
        }, 100);
        appendSocketLog('webrtc:screenshare', 'Published screen share track via getDisplayMedia');
      } else {
        throw new Error('getDisplayMedia restricted in iframe');
      }
    } catch {
      setIsScreenSharing(true);
      setMediaNotice(
        'getDisplayMedia restricted by iframe sandbox — displaying live interactive Architecture Board screen-share stream.'
      );
      appendSocketLog(
        'webrtc:screenshare (simulated)',
        'Published virtual screen-share track (sandbox fallback)'
      );
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const rem = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${rem}`;
  };

  // ============================================================================
  // COMMAND PALETTE (`Ctrl+E`) EXECUTION
  // ============================================================================
  const executeSlashCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    if (trimmed === '/available') {
      updateMyPresence('available');
    } else if (trimmed === '/busy') {
      updateMyPresence('busy');
    } else if (trimmed === '/dnd') {
      updateMyPresence('dnd');
    } else if (trimmed === '/away') {
      updateMyPresence('away');
    } else if (trimmed === '/meet') {
      startMeetNowCall(`${currentChannel.name} — Instant Call`);
    }
    setIsCommandOpen(false);
    setCommandQuery('');
  };

  // ============================================================================
  // CREATE CHANNEL & CREATE MEETING HANDLERS
  // ============================================================================
  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    const cleanName = newChannelName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
    const newChan: ChannelItem = {
      _id: `chan-${Date.now()}`,
      teamId: currentTeam._id,
      name: cleanName,
      description: newChannelDesc.trim() || 'Team collaboration channel',
      type: newChannelType,
      files: [],
    };
    setTeams((prev) =>
      prev.map((t) =>
        t._id === currentTeam._id
          ? { ...t, channels: [...t.channels, newChan] }
          : t
      )
    );
    setSelectedChannelId(newChan._id);
    setNewChannelName('');
    setNewChannelDesc('');
    setIsNewChannelModalOpen(false);
    appendSocketLog('channel:create', `Created ${newChannelType} channel #${cleanName}`);
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle.trim()) return;
    const mtg: CalendarMeeting = {
      _id: `mtg-${Date.now()}`,
      title: newMeetingTitle.trim(),
      dayIndex: newMeetingDay,
      startHour: newMeetingHour,
      durationHours: 1,
      organizerName: currentUser.displayName,
      channelLabel: `${currentTeam.name} > ${currentChannel.name}`,
      attendeeIds: ['user-me', 'user-sarah', 'user-marcus'],
    };
    setMeetings((prev) => [...prev, mtg]);
    setNewMeetingTitle('');
    setIsNewMeetingModalOpen(false);
    appendSocketLog('calendar:schedule', `Scheduled "${mtg.title}"`);
  };

  // Surface token palette based on Dark / Light theme
  const themeClasses = isDark
    ? 'dark bg-[#292929] text-white'
    : 'bg-white text-[#242424]';

  return (
    <div className={`${themeClasses} h-screen w-screen overflow-hidden flex flex-col font-sans select-none`}>
      {/* ==================================================================== */}
      {/* TOP GLOBAL HEADER BAR (48px fixed height)                            */}
      {/* ==================================================================== */}
      <header
        className={`h-12 shrink-0 px-4 flex items-center justify-between border-b z-30 ${
          isDark
            ? 'bg-[#141414] border-[#3D3D3D] text-white'
            : 'bg-[#EBEBEB] border-[#E0E0E0] text-[#242424]'
        }`}
      >
        {/* Left: Brand Identity & Workspace Pill */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-[#5B5FC7] flex items-center justify-center text-white font-bold text-xs shadow-sm">
            PT
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight">PulseTeams</span>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium bg-[#5B5FC7]/20 text-[#7B83EB] border border-[#5B5FC7]/30">
              Next.js 14 • Socket.io • LiveKit
            </span>
          </div>
        </div>

        {/* Center: Global Command & Search Bar (Ctrl+E) */}
        <button
          onClick={() => setIsCommandOpen(true)}
          className={`w-full max-w-md h-8 px-3 rounded-md border flex items-center justify-between text-xs transition ${
            isDark
              ? 'bg-[#292929] border-[#3D3D3D] text-zinc-400 hover:border-[#7B83EB]'
              : 'bg-white border-[#D0D0D0] text-zinc-500 hover:border-[#5B5FC7]'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>Search messages, channels, or type /busy, /available, /meet...</span>
          </span>
          <kbd
            className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
              isDark ? 'bg-[#1F1F1F] text-zinc-400' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            Ctrl+E
          </kbd>
        </button>

        {/* Right: Socket Status Pill, Theme Toggle, & User Presence Menu */}
        <div className="flex items-center gap-2.5 relative">
          <button
            onClick={() => setShowRightInfoDrawer((v) => !v)}
            title="Toggle Real-Time Socket.io & MongoDB Telemetry Drawer"
            className={`h-7 px-2.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 border transition ${
              showRightInfoDrawer
                ? 'bg-[#5B5FC7] text-white border-[#5B5FC7]'
                : isDark
                ? 'bg-[#1F1F1F] border-[#3D3D3D] text-emerald-400 hover:bg-[#292929]'
                : 'bg-white border-zinc-300 text-emerald-700 hover:bg-zinc-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Socket.io Connected</span>
          </button>

          <button
            onClick={() => setIsDark((d) => !d)}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`p-1.5 rounded-md transition ${
              isDark ? 'hover:bg-[#292929] text-zinc-300' : 'hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Current User Profile & Presence Switcher */}
          <button
            onClick={() => setIsStatusMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition"
          >
            <AvatarWithPresence
              name={currentUser.displayName}
              initials={currentUser.initials}
              color={currentUser.avatarColor}
              status={currentUser.status}
              size="sm"
            />
            <span className="text-xs font-medium hidden sm:inline">{currentUser.displayName}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {isStatusMenuOpen && (
            <div
              className={`absolute right-0 top-11 w-64 rounded-lg border shadow-xl p-2 z-50 ${
                isDark ? 'bg-[#292929] border-[#3D3D3D]' : 'bg-white border-zinc-200'
              }`}
            >
              <div className="px-2 py-2 border-b border-zinc-500/20 flex items-center gap-2.5">
                <AvatarWithPresence
                  name={currentUser.displayName}
                  initials={currentUser.initials}
                  color={currentUser.avatarColor}
                  status={currentUser.status}
                  size="md"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{currentUser.displayName}</div>
                  <div className="text-[11px] opacity-60 truncate">{currentUser.email}</div>
                </div>
              </div>
              <div className="py-1">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider opacity-50">
                  Set Live Presence (`presence:set`)
                </div>
                {(
                  [
                    { id: 'available', label: 'Available' },
                    { id: 'busy', label: 'Busy' },
                    { id: 'dnd', label: 'Do not disturb' },
                    { id: 'away', label: 'Be right back / Away' },
                    { id: 'offline', label: 'Appear offline' },
                  ] as Array<{ id: PresenceStatus; label: string }>
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => updateMyPresence(item.id)}
                    className={`w-full px-2.5 py-1.5 text-xs rounded-md flex items-center justify-between transition ${
                      currentUser.status === item.id
                        ? 'bg-[#5B5FC7]/20 text-[#7B83EB] font-medium'
                        : 'hover:bg-zinc-500/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <PresenceBadge status={item.id} size="sm" />
                      <span>{item.label}</span>
                    </span>
                    {currentUser.status === item.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 3-PANE WORKSPACE BODY                                                */}
      {/* ==================================================================== */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* ------------------------------------------------------------------ */}
        {/* PANE 1: FAR-LEFT APP NAVIGATION RAIL (68px fixed width)            */}
        {/* ------------------------------------------------------------------ */}
        <nav
          aria-label="Primary App Bar"
          className={`w-[68px] shrink-0 flex flex-col items-center justify-between py-2 border-r z-20 ${
            isDark ? 'bg-[#141414] border-[#3D3D3D]' : 'bg-[#EBEBEB] border-[#E0E0E0]'
          }`}
        >
          <div className="w-full flex flex-col items-center gap-1">
            {(
              [
                {
                  id: 'activity',
                  label: 'Activity',
                  shortcut: 'Ctrl+1',
                  icon: Bell,
                  badge: unreadActivityCount,
                },
                {
                  id: 'chat',
                  label: 'Chat',
                  shortcut: 'Ctrl+2',
                  icon: MessageSquare,
                  badge: unreadChatCount,
                },
                {
                  id: 'teams',
                  label: 'Teams',
                  shortcut: 'Ctrl+3',
                  icon: Users,
                  badge: 0,
                },
                {
                  id: 'calendar',
                  label: 'Calendar',
                  shortcut: 'Ctrl+4',
                  icon: CalendarIcon,
                  badge: 0,
                },
              ] as const
            ).map((nav) => {
              const IconComp = nav.icon;
              const isActive = activeModule === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => {
                    setActiveModule(nav.id);
                    if (isSecondaryCollapsed) setIsSecondaryCollapsed(false);
                  }}
                  title={`${nav.label} (${nav.shortcut})`}
                  className={`relative w-full py-2.5 flex flex-col items-center justify-center gap-1 transition group ${
                    isActive
                      ? isDark
                        ? 'text-[#7B83EB]'
                        : 'text-[#5B5FC7]'
                      : isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-[#292929]/60'
                      : 'text-zinc-600 hover:text-black hover:bg-black/5'
                  }`}
                >
                  {/* 3px x 24px Vertical Active Pill Indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#5B5FC7] dark:bg-[#7B83EB]" />
                  )}
                  <div className="relative">
                    <IconComp className="w-5 h-5" />
                    {nav.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#D13438] text-white text-[10px] font-bold flex items-center justify-center">
                        {nav.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium tracking-tight">{nav.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Rail Controls: Collapse Secondary Sidebar & Architecture Spec View */}
          <div className="w-full flex flex-col items-center gap-2 pb-1">
            <button
              onClick={() => {
                setActiveModule('teams');
                setActiveChannelTab('schema');
              }}
              title="Inspect Mongoose Models & Socket.io Contracts"
              className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[9px] transition ${
                activeChannelTab === 'schema' && activeModule === 'teams'
                  ? 'bg-[#5B5FC7]/20 text-[#7B83EB]'
                  : 'opacity-70 hover:opacity-100 hover:bg-zinc-500/10'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Schemas</span>
            </button>

            <button
              onClick={() => setIsSecondaryCollapsed((c) => !c)}
              title={isSecondaryCollapsed ? 'Expand Secondary Pane' : 'Collapse Secondary Pane'}
              className="p-2 rounded-md opacity-70 hover:opacity-100 hover:bg-zinc-500/10 transition"
            >
              {isSecondaryCollapsed ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>
          </div>
        </nav>

        {/* ------------------------------------------------------------------ */}
        {/* PANE 2: SECONDARY LIST PANE (280px–320px resizable / collapsible)  */}
        {/* ------------------------------------------------------------------ */}
        {!isSecondaryCollapsed && (
          <aside
            style={{ width: `${secondaryWidth}px` }}
            className={`shrink-0 h-full flex flex-col border-r relative select-none z-10 ${
              isDark ? 'bg-[#1F1F1F] border-[#3D3D3D]' : 'bg-[#F5F5F5] border-[#E0E0E0]'
            }`}
          >
            {/* MODULE A: TEAMS -> CHANNELS TREE */}
            {activeModule === 'teams' && (
              <>
                <div className="h-[60px] px-4 flex items-center justify-between border-b border-zinc-500/15 shrink-0">
                  <h2 className="text-base font-semibold tracking-tight">Teams</h2>
                  <button
                    onClick={() => setIsNewChannelModalOpen(true)}
                    title="Create a new channel in current team"
                    className="p-1.5 rounded-md bg-[#5B5FC7]/15 text-[#5B5FC7] dark:text-[#7B83EB] hover:bg-[#5B5FC7]/25 transition flex items-center gap-1 text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Channel</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-2 px-2 space-y-2">
                  {teams.map((team) => {
                    const isExpanded = !!expandedTeamIds[team._id];
                    return (
                      <div key={team._id} className="space-y-0.5">
                        {/* Team Accordion Header */}
                        <button
                          onClick={() =>
                            setExpandedTeamIds((prev) => ({
                              ...prev,
                              [team._id]: !prev[team._id],
                            }))
                          }
                          className={`w-full px-2 py-2 rounded-md flex items-center justify-between text-left transition ${
                            isDark ? 'hover:bg-[#383838]' : 'hover:bg-[#EAEAEA]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                            )}
                            <div
                              style={{ backgroundColor: team.accentColor }}
                              className="w-7 h-7 rounded-md text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
                            >
                              {team.initials}
                            </div>
                            <span className="text-sm font-semibold truncate">{team.name}</span>
                          </div>
                        </button>

                        {/* Channels List */}
                        {isExpanded && (
                          <div className="pl-6 pr-1 space-y-0.5">
                            {team.channels.map((chan) => {
                              const isSelected =
                                selectedTeamId === team._id &&
                                selectedChannelId === chan._id &&
                                !isInCall;
                              return (
                                <button
                                  key={chan._id}
                                  onClick={() => {
                                    setSelectedTeamId(team._id);
                                    setSelectedChannelId(chan._id);
                                    // Clear unread badge
                                    setTeams((prev) =>
                                      prev.map((t) =>
                                        t._id === team._id
                                          ? {
                                              ...t,
                                              channels: t.channels.map((c) =>
                                                c._id === chan._id ? { ...c, unreadCount: 0 } : c
                                              ),
                                            }
                                          : t
                                      )
                                    );
                                    appendSocketLog('room:join', `Switched to channel #${chan.name}`);
                                  }}
                                  className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-xs transition ${
                                    isSelected
                                      ? isDark
                                        ? 'bg-[#33344A] text-white font-semibold'
                                        : 'bg-[#E0E2F8] text-[#242424] font-semibold'
                                      : chan.unreadCount
                                      ? 'font-semibold hover:bg-zinc-500/10'
                                      : 'opacity-80 hover:opacity-100 hover:bg-zinc-500/10'
                                  }`}
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    {chan.type === 'private' ? (
                                      <Lock className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                    ) : (
                                      <Hash className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                    )}
                                    <span className="truncate">{chan.name}</span>
                                  </span>
                                  {chan.unreadCount ? (
                                    <span className="px-1.5 py-0.2 rounded-full bg-[#5B5FC7] text-white text-[10px] font-bold">
                                      {chan.unreadCount}
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* MODULE B: 1:1 & GROUP CHAT LIST */}
            {activeModule === 'chat' && (
              <>
                <div className="h-[60px] px-4 flex items-center justify-between border-b border-zinc-500/15 shrink-0">
                  <h2 className="text-base font-semibold tracking-tight">Chat</h2>
                  <span className="text-[11px] opacity-60">{conversations.length} threads</span>
                </div>
                <div className="p-2.5 border-b border-zinc-500/10">
                  <div
                    className={`h-8 px-2.5 rounded-md border flex items-center gap-2 text-xs ${
                      isDark ? 'bg-[#292929] border-[#3D3D3D]' : 'bg-white border-zinc-300'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5 opacity-50" />
                    <input
                      value={chatFilterQuery}
                      onChange={(e) => setChatFilterQuery(e.target.value)}
                      placeholder="Filter by name or message..."
                      className="bg-transparent outline-none w-full text-xs"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {conversations
                    .filter((conv) => {
                      if (!chatFilterQuery.trim()) return true;
                      const peerId = conv.participantIds.find((id) => id !== 'user-me') || 'user-sarah';
                      const label = conv.isGroup
                        ? conv.title || 'Group'
                        : users[peerId]?.displayName || '';
                      return (
                        label.toLowerCase().includes(chatFilterQuery.toLowerCase()) ||
                        conv.lastMessagePreview.toLowerCase().includes(chatFilterQuery.toLowerCase())
                      );
                    })
                    .map((conv) => {
                      const peerId =
                        conv.participantIds.find((id) => id !== 'user-me') || 'user-sarah';
                      const peer = users[peerId] || users['user-sarah'];
                      const title = conv.isGroup ? conv.title : peer.displayName;
                      const isSelected = selectedConversationId === conv._id;

                      return (
                        <button
                          key={conv._id}
                          onClick={() => {
                            setSelectedConversationId(conv._id);
                            setConversations((prev) =>
                              prev.map((c) =>
                                c._id === conv._id ? { ...c, unreadCount: 0 } : c
                              )
                            );
                            appendSocketLog('room:join', `Opened chat ${title}`);
                          }}
                          className={`w-full p-2.5 rounded-lg flex items-start gap-2.5 text-left transition ${
                            isSelected
                              ? isDark
                                ? 'bg-[#33344A]'
                                : 'bg-[#E0E2F8]'
                              : isDark
                              ? 'hover:bg-[#383838]'
                              : 'hover:bg-[#EAEAEA]'
                          }`}
                        >
                          <AvatarWithPresence
                            name={title || 'Chat'}
                            initials={conv.isGroup ? 'AW' : peer.initials}
                            color={conv.isGroup ? '#5B5FC7' : peer.avatarColor}
                            status={conv.isGroup ? 'available' : peer.status}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold truncate flex items-center gap-1">
                                {conv.pinned && <Pin className="w-3 h-3 opacity-60 rotate-45" />}
                                {title}
                              </span>
                              <span className="text-[10px] opacity-60 shrink-0">
                                {conv.lastMessageAt}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <p className="text-[11px] opacity-70 truncate">
                                {conv.lastMessagePreview}
                              </p>
                              {conv.unreadCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-[#D13438] text-white text-[10px] font-bold">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </>
            )}

            {/* MODULE C: ACTIVITY FEED */}
            {activeModule === 'activity' && (
              <>
                <div className="h-[60px] px-4 flex items-center justify-between border-b border-zinc-500/15 shrink-0">
                  <h2 className="text-base font-semibold tracking-tight">Activity</h2>
                  <button
                    onClick={() => setActivityFilterUnread((u) => !u)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                      activityFilterUnread
                        ? 'bg-[#5B5FC7] text-white'
                        : 'bg-zinc-500/10 hover:bg-zinc-500/20'
                    }`}
                  >
                    Unread only
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {activities
                    .filter((a) => (activityFilterUnread ? !a.isRead : true))
                    .map((act) => (
                      <button
                        key={act._id}
                        onClick={() => {
                          setActivities((prev) =>
                            prev.map((x) => (x._id === act._id ? { ...x, isRead: true } : x))
                          );
                          if (act.targetModule === 'teams' && act.targetTeamId && act.targetChannelId) {
                            setSelectedTeamId(act.targetTeamId);
                            setSelectedChannelId(act.targetChannelId);
                            setActiveModule('teams');
                          } else if (act.targetModule === 'chat' && act.targetConversationId) {
                            setSelectedConversationId(act.targetConversationId);
                            setActiveModule('chat');
                          }
                        }}
                        className={`w-full p-2.5 rounded-lg flex items-start gap-2.5 text-left transition ${
                          !act.isRead
                            ? isDark
                              ? 'bg-[#33344A]/70 hover:bg-[#33344A]'
                              : 'bg-[#E0E2F8]/70 hover:bg-[#E0E2F8]'
                            : 'hover:bg-zinc-500/10'
                        }`}
                      >
                        <AvatarWithPresence
                          name={act.actorName}
                          initials={act.actorInitials}
                          color={act.actorColor}
                          status={users[act.actorId]?.status || 'available'}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{act.actorName}</span>
                            <span className="text-[10px] opacity-60">{act.createdAt}</span>
                          </div>
                          <p className="text-[11px] opacity-80 leading-snug mt-0.5">{act.summary}</p>
                          <p className="text-[11px] opacity-60 truncate mt-1 italic">
                            "{act.preview}"
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              </>
            )}

            {/* MODULE D: CALENDAR SIDEBAR */}
            {activeModule === 'calendar' && (
              <>
                <div className="h-[60px] px-4 flex items-center justify-between border-b border-zinc-500/15 shrink-0">
                  <h2 className="text-base font-semibold tracking-tight">Calendar</h2>
                  <button
                    onClick={() => setIsNewMeetingModalOpen(true)}
                    className="px-2.5 py-1 rounded-md bg-[#5B5FC7] text-white text-xs font-medium hover:bg-[#4F52B2] transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New</span>
                  </button>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto">
                  <div
                    className={`p-3 rounded-lg border ${
                      isDark ? 'bg-[#292929] border-[#3D3D3D]' : 'bg-white border-zinc-200'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-2">November 2026 — Sprint Week</div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] opacity-60 mb-1">
                      <span>M</span>
                      <span>T</span>
                      <span>W</span>
                      <span>T</span>
                      <span>F</span>
                      <span>S</span>
                      <span>S</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {Array.from({ length: 14 }, (_, i) => i + 9).map((day) => (
                        <span
                          key={day}
                          className={`py-1 rounded ${
                            day === 10
                              ? 'bg-[#5B5FC7] text-white font-bold'
                              : 'hover:bg-zinc-500/10'
                          }`}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60 px-1">
                      Scheduled Meetings
                    </div>
                    {meetings.map((mtg) => (
                      <div
                        key={mtg._id}
                        className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                          isDark ? 'bg-[#292929] border-[#3D3D3D]' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div className="font-semibold flex items-center justify-between">
                          <span className="truncate">{mtg.title}</span>
                          {mtg.isLive && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] opacity-70">{mtg.channelLabel}</div>
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] opacity-60">By {mtg.organizerName}</span>
                          <button
                            onClick={() => startMeetNowCall(mtg.title)}
                            className="px-2 py-0.5 rounded bg-[#5B5FC7] text-white text-[11px] font-medium hover:bg-[#4F52B2]"
                          >
                            Join Call
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Drag Handle for Resizable Secondary Sidebar */}
            <div
              onMouseDown={() => setIsResizing(true)}
              title="Drag to resize sidebar (240px–400px)"
              className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#5B5FC7]/60 transition"
            />
          </aside>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PANE 3: MAIN STAGE CONTAINER (Header + View Stage + Composer)      */}
        {/* ------------------------------------------------------------------ */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {/* ================================================================ */}
          {/* VIEW 1: WEBRTC / LIVEKIT "MEET NOW" CALL STAGE                   */}
          {/* ================================================================ */}
          {isInCall ? (
            <div className="flex-1 flex flex-col h-full bg-[#111111] text-white overflow-hidden">
              {/* Call Top Header */}
              <div className="h-14 px-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <span>{callRoomTitle}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                        {formatDuration(callElapsedSeconds)}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      LiveKit SFU Room • Simulcast WebRTC Stage • Active Speaker Highlight
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowInCallChat((v) => !v)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 border transition ${
                      showInCallChat
                        ? 'bg-[#5B5FC7] border-[#5B5FC7] text-white'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Meeting Chat</span>
                  </button>
                  <button
                    onClick={leaveMeetNowCall}
                    className="px-3.5 py-1.5 rounded-md bg-[#D13438] hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>Leave</span>
                  </button>
                </div>
              </div>

              {mediaNotice && (
                <div className="px-5 py-1.5 bg-[#5B5FC7]/20 border-b border-[#5B5FC7]/30 text-[11px] text-indigo-200 flex items-center justify-between">
                  <span>{mediaNotice}</span>
                  <button onClick={() => setMediaNotice(null)} className="opacity-70 hover:opacity-100">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Call Center Body: Video Grid + Optional In-Call Chat Drawer */}
              <div className="flex-1 flex min-h-0 overflow-hidden">
                <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
                  {/* Screen Share Spotlight Banner when active */}
                  {isScreenSharing && (
                    <div className="relative rounded-xl border-2 border-[#7B83EB] bg-zinc-950 overflow-hidden min-h-[240px] flex flex-col justify-between p-4 shadow-lg">
                      <video
                        ref={screenVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
                      />
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-md bg-[#5B5FC7] text-white text-xs font-semibold flex items-center gap-1.5">
                          <MonitorUp className="w-3.5 h-3.5" />
                          <span>Alex Rivera — Screen Share (`getDisplayMedia`)</span>
                        </span>
                        <button
                          onClick={toggleScreenShare}
                          className="px-2.5 py-1 rounded bg-red-600/80 hover:bg-red-600 text-xs font-medium"
                        >
                          Stop Sharing
                        </button>
                      </div>
                      <div className="relative z-10 my-4 grid grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800">
                          <div className="text-indigo-400 font-semibold mb-1">Next.js 14 App Shell</div>
                          <div className="text-zinc-400 text-[11px]">
                            68px Rail • 296px Resizable Tree • 960px Feed
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800">
                          <div className="text-emerald-400 font-semibold mb-1">Socket.io Engine</div>
                          <div className="text-zinc-400 text-[11px]">
                            Optimistic tempId ack • 2000ms typing throttle
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800">
                          <div className="text-amber-400 font-semibold mb-1">LiveKit WebRTC SFU</div>
                          <div className="text-zinc-400 text-[11px]">
                            JWT room grant • Active speaker border ring
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2x2 Participant Video Grid */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[320px]">
                    {(
                      [
                        {
                          user: currentUser,
                          isLocal: true,
                          muted: isMicMuted,
                          camOn: isCamOn,
                        },
                        {
                          user: users['user-sarah'],
                          isLocal: false,
                          muted: false,
                          camOn: true,
                        },
                        {
                          user: users['user-marcus'],
                          isLocal: false,
                          muted: false,
                          camOn: false,
                        },
                        {
                          user: users['user-priya'],
                          isLocal: false,
                          muted: true,
                          camOn: true,
                        },
                      ] as const
                    ).map(({ user, isLocal, muted, camOn }) => {
                      const isSpeaking = activeSpeakerId === user._id && !muted;
                      return (
                        <div
                          key={user._id}
                          onClick={() => setActiveSpeakerId(user._id)}
                          className={`relative rounded-xl overflow-hidden border-2 transition cursor-pointer flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 ${
                            isSpeaking
                              ? 'border-[#7B83EB] shadow-[0_0_20px_rgba(123,131,235,0.35)]'
                              : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {/* Local or Simulated Camera Stream Layer */}
                          {isLocal && camOn && (
                            <>
                              <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/60 via-transparent to-emerald-900/30 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="w-16 h-16 rounded-full mx-auto bg-[#5B5FC7] flex items-center justify-center text-xl font-bold shadow-lg ring-4 ring-indigo-400/30">
                                    {user.initials}
                                  </div>
                                  <span className="mt-2 inline-block px-2 py-0.5 rounded bg-black/50 text-[10px] text-emerald-300">
                                    HD Camera Feed Active (1080p)
                                  </span>
                                </div>
                              </div>
                            </>
                          )}

                          {!isLocal && camOn && (
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-zinc-900 flex flex-col items-center justify-center">
                              <div
                                style={{ backgroundColor: user.avatarColor }}
                                className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg ${
                                  isSpeaking ? 'ring-4 ring-[#7B83EB] scale-105 transition' : ''
                                }`}
                              >
                                {user.initials}
                              </div>
                              <span className="mt-2 text-[11px] text-zinc-400">{user.title}</span>
                            </div>
                          )}

                          {!camOn && (
                            <div className="flex flex-col items-center justify-center">
                              <div
                                style={{ backgroundColor: user.avatarColor }}
                                className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg ${
                                  isSpeaking ? 'ring-4 ring-[#7B83EB]' : ''
                                }`}
                              >
                                {user.initials}
                              </div>
                              <span className="mt-2 text-xs text-zinc-400">{user.title}</span>
                            </div>
                          )}

                          {/* Bottom-left Participant Badge */}
                          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-sm flex items-center gap-2 text-xs">
                            {muted ? (
                              <MicOff className="w-3.5 h-3.5 text-red-400" />
                            ) : (
                              <Volume2
                                className={`w-3.5 h-3.5 ${
                                  isSpeaking ? 'text-[#7B83EB] animate-pulse' : 'text-emerald-400'
                                }`}
                              />
                            )}
                            <span className="font-medium">
                              {user.displayName} {isLocal ? '(You)' : ''}
                            </span>
                            {isSpeaking && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#5B5FC7] text-white">
                                Speaking
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Call Controls Floating Dock */}
                  <div className="h-14 rounded-xl bg-zinc-900/90 border border-zinc-800 px-6 flex items-center justify-center gap-3 shrink-0">
                    <button
                      onClick={() => {
                        setIsMicMuted((m) => !m);
                        appendSocketLog(
                          'call:state:change',
                          `Microphone ${!isMicMuted ? 'muted' : 'unmuted'}`
                        );
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition ${
                        isMicMuted
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{isMicMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                    </button>

                    <button
                      onClick={toggleCamera}
                      className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition ${
                        isCamOn
                          ? 'bg-[#5B5FC7] text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                      <span>{isCamOn ? 'Camera On' : 'Start Camera'}</span>
                    </button>

                    <button
                      onClick={toggleScreenShare}
                      className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition ${
                        isScreenSharing
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      <MonitorUp className="w-4 h-4" />
                      <span>{isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}</span>
                    </button>

                    <button
                      onClick={leaveMeetNowCall}
                      className="px-5 py-2 rounded-full bg-[#D13438] hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-2"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>End Call</span>
                    </button>
                  </div>
                </div>

                {/* In-Call Real-Time Chat Drawer */}
                {showInCallChat && (
                  <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
                    <div className="h-12 px-4 border-b border-zinc-800 flex items-center justify-between text-xs font-semibold">
                      <span>In-Call Meeting Chat</span>
                      <button
                        onClick={() => setShowInCallChat(false)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                      {directChatMessages.map((m) => (
                        <div key={m._id} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                            <span className="font-semibold text-white">{m.senderName}</span>
                            <span>{m.createdAt}</span>
                          </div>
                          <div className="text-zinc-200">
                            <FormattedText text={m.content} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendDirectMessage} className="p-3 border-t border-zinc-800 flex gap-2">
                      <input
                        value={chatDraft}
                        onChange={(e) => setChatDraft(e.target.value)}
                        placeholder="Send a message to the call..."
                        className="flex-1 h-8 px-2.5 rounded bg-zinc-900 border border-zinc-700 text-xs outline-none focus:border-[#7B83EB]"
                      />
                      <button
                        type="submit"
                        className="px-3 h-8 rounded bg-[#5B5FC7] hover:bg-[#4F52B2] text-white text-xs font-medium"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ) : activeModule === 'calendar' ? (
            /* ================================================================ */
            /* VIEW 2: WORK-WEEK CALENDAR & "MEET NOW" SCHEDULER                */
            /* ================================================================ */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="h-[60px] px-6 border-b border-zinc-500/15 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-[#5B5FC7]" />
                  <div>
                    <h1 className="text-base font-semibold">Work-Week Schedule • Nov 9 – Nov 13, 2026</h1>
                    <p className="text-[11px] opacity-60">Click any meeting block to launch the WebRTC / LiveKit stage</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startMeetNowCall('Instant Ad-Hoc Meeting')}
                    className="px-3 py-1.5 rounded-md border border-zinc-500/30 hover:bg-zinc-500/10 text-xs font-medium flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5 text-[#5B5FC7]" />
                    <span>Meet Now</span>
                  </button>
                  <button
                    onClick={() => setIsNewMeetingModalOpen(true)}
                    className="px-3 py-1.5 rounded-md bg-[#5B5FC7] hover:bg-[#4F52B2] text-white text-xs font-medium flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Meeting</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-5 gap-3 min-h-[480px]">
                  {['Mon 9', 'Tue 10 (Today)', 'Wed 11', 'Thu 12', 'Fri 13'].map((dayLabel, idx) => (
                    <div
                      key={dayLabel}
                      className={`rounded-xl border p-3 flex flex-col gap-2.5 ${
                        idx === 1
                          ? isDark
                            ? 'bg-[#33344A]/30 border-[#7B83EB]/50'
                            : 'bg-[#E0E2F8]/40 border-[#5B5FC7]/50'
                          : isDark
                          ? 'bg-[#1F1F1F]/60 border-[#3D3D3D]'
                          : 'bg-zinc-50 border-zinc-200'
                      }`}
                    >
                      <div className="text-xs font-semibold pb-2 border-b border-zinc-500/15 flex items-center justify-between">
                        <span>{dayLabel}</span>
                        {idx === 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#5B5FC7] text-white">
                            Today
                          </span>
                        )}
                      </div>

                      {meetings
                        .filter((m) => m.dayIndex === idx)
                        .map((mtg) => (
                          <div
                            key={mtg._id}
                            onClick={() => startMeetNowCall(mtg.title)}
                            className="p-3 rounded-lg bg-[#5B5FC7]/15 border-l-4 border-[#5B5FC7] hover:bg-[#5B5FC7]/25 transition cursor-pointer space-y-1.5"
                          >
                            <div className="text-xs font-semibold leading-snug">{mtg.title}</div>
                            <div className="text-[11px] opacity-75">
                              {Math.floor(mtg.startHour)}:
                              {mtg.startHour % 1 === 0.5 ? '30' : '00'} • {mtg.durationHours}h
                            </div>
                            <div className="text-[10px] opacity-60 truncate">{mtg.channelLabel}</div>
                            <div className="pt-1 flex items-center justify-between">
                              <span className="text-[10px] font-medium text-[#7B83EB]">
                                Click to Join WebRTC →
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeModule === 'chat' ? (
            /* ================================================================ */
            /* VIEW 3: REAL-TIME 1:1 & GROUP CHAT ENGINE                        */
            /* ================================================================ */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Chat Stage Header (60px) */}
              <div className="h-[60px] px-6 border-b border-zinc-500/15 flex items-center justify-between shrink-0">
                {(() => {
                  const peerId =
                    currentConversation.participantIds.find((id) => id !== 'user-me') ||
                    'user-sarah';
                  const peer = users[peerId] || users['user-sarah'];
                  const chatTitle = currentConversation.isGroup
                    ? currentConversation.title
                    : peer.displayName;
                  return (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarWithPresence
                          name={chatTitle || 'Chat'}
                          initials={currentConversation.isGroup ? 'AW' : peer.initials}
                          color={currentConversation.isGroup ? '#5B5FC7' : peer.avatarColor}
                          status={currentConversation.isGroup ? 'available' : peer.status}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h1 className="text-base font-semibold truncate">{chatTitle}</h1>
                            {!currentConversation.isGroup && (
                              <span className="text-xs opacity-60 hidden sm:inline">
                                • {peer.title}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] opacity-60 truncate">
                            {currentConversation.isGroup
                              ? `${currentConversation.participantIds.length} participants • Real-time Socket.io room ${currentConversation._id}`
                              : `${peer.customStatusMessage || peer.status} • Last seen ${peer.lastSeen}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startMeetNowCall(`${chatTitle} — Audio/Video Call`)}
                          className="px-3 py-1.5 rounded-md bg-[#5B5FC7] hover:bg-[#4F52B2] text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Meet Now</span>
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Direct Chat Messages Stream */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                <div className="max-w-[960px] mx-auto w-full space-y-3">
                  {directChatMessages.map((msg) => {
                    const isMine = msg.senderId === currentUser._id;
                    const sender = users[msg.senderId] || currentUser;
                    return (
                      <div
                        key={msg._id}
                        className={`group flex items-start gap-3 ${
                          isMine ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <AvatarWithPresence
                          name={msg.senderName}
                          initials={msg.senderInitials}
                          color={msg.senderAvatarColor}
                          status={sender.status}
                          size="md"
                        />
                        <div
                          className={`max-w-xl rounded-xl p-3.5 border relative transition ${
                            isMine
                              ? isDark
                                ? 'bg-[#33344A] border-[#5B5FC7]/40 text-white'
                                : 'bg-[#E0E2F8] border-[#5B5FC7]/30 text-[#242424]'
                              : isDark
                              ? 'bg-[#333333] border-[#3D3D3D]'
                              : 'bg-[#F5F5F5] border-zinc-200'
                          }`}
                        >
                          {/* Hover Quick Emoji Reaction Pill */}
                          <div
                            className={`opacity-0 group-hover:opacity-100 transition absolute -top-3 ${
                              isMine ? 'left-2' : 'right-2'
                            } px-1.5 py-0.5 rounded-full border shadow-md flex items-center gap-1 z-10 ${
                              isDark ? 'bg-[#292929] border-[#3D3D3D]' : 'bg-white border-zinc-200'
                            }`}
                          >
                            {QUICK_EMOJIS.map((emo) => (
                              <button
                                key={emo}
                                onClick={() => handleToggleReaction(msg._id, emo)}
                                className="hover:scale-125 transition text-xs px-1"
                              >
                                {emo}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center justify-between gap-4 text-[11px] opacity-70 mb-1">
                            <span className="font-semibold">{msg.senderName}</span>
                            <span className="flex items-center gap-1">
                              {msg.createdAt}
                              {isMine && <CheckCheck className="w-3.5 h-3.5 text-[#7B83EB]" />}
                            </span>
                          </div>
                          <div className="text-sm">
                            <FormattedText text={msg.content} />
                          </div>

                          {/* Reaction Badges */}
                          {Object.keys(msg.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {Object.entries(msg.reactions).map(([emo, uids]) => (
                                <button
                                  key={emo}
                                  onClick={() => handleToggleReaction(msg._id, emo)}
                                  className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border ${
                                    uids.includes(currentUser._id)
                                      ? 'bg-[#5B5FC7]/20 border-[#5B5FC7] text-[#7B83EB]'
                                      : 'bg-black/10 dark:bg-white/5 border-transparent'
                                  }`}
                                >
                                  <span>{emo}</span>
                                  <span className="text-[11px] font-semibold">{uids.length}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Real-Time Typing Indicator */}
                  {(typingByRoom[currentConversation._id] || []).length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-[#7B83EB] font-medium pl-2 animate-pulse">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7B83EB] animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7B83EB] animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7B83EB] animate-bounce [animation-delay:300ms]" />
                      </span>
                      <span>
                        {typingByRoom[currentConversation._id]
                          .map((u) => u.displayName)
                          .join(', ')}{' '}
                        is typing...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Chat Composer */}
              <div className="px-6 pb-5 pt-2 shrink-0">
                <form
                  onSubmit={handleSendDirectMessage}
                  className={`max-w-[960px] mx-auto rounded-lg border p-2.5 flex items-center gap-2 shadow-sm ${
                    isDark ? 'bg-[#333333] border-[#3D3D3D]' : 'bg-white border-zinc-300'
                  }`}
                >
                  <input
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    placeholder={`Type a new message in ${
                      currentConversation.isGroup
                        ? currentConversation.title
                        : 'this conversation'
                    } (Socket.io auto-reply enabled)...`}
                    className="flex-1 bg-transparent text-sm outline-none px-2"
                  />
                  <button
                    type="submit"
                    disabled={!chatDraft.trim()}
                    className="px-3.5 py-1.5 rounded-md bg-[#5B5FC7] hover:bg-[#4F52B2] disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* ================================================================ */
            /* VIEW 4: TEAMS -> CHANNEL STAGE (POSTS, FILES, & SCHEMA TABS)     */
            /* ================================================================ */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Main Stage Header (60px fixed height) */}
              <div className="h-[60px] px-6 border-b border-zinc-500/15 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6 min-w-0 h-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      style={{ backgroundColor: currentTeam.accentColor }}
                      className="w-8 h-8 rounded-md text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
                    >
                      {currentTeam.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {currentChannel.type === 'private' ? (
                          <Lock className="w-4 h-4 opacity-70" />
                        ) : (
                          <Hash className="w-4 h-4 opacity-70" />
                        )}
                        <h1 className="text-base font-semibold truncate">{currentChannel.name}</h1>
                      </div>
                      <p className="text-[11px] opacity-60 truncate hidden md:block">
                        {currentChannel.description}
                      </p>
                    </div>
                  </div>

                  {/* Stage Tabs: Posts | Files | Architecture & Schemas */}
                  <div className="flex items-center gap-1 h-full">
                    {(
                      [
                        { id: 'posts', label: 'Posts' },
                        { id: 'files', label: `Files (${currentChannel.files.length})` },
                        { id: 'schema', label: 'Mongoose & Socket Spec' },
                      ] as const
                    ).map((tab) => {
                      const active = activeChannelTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveChannelTab(tab.id)}
                          className={`h-full px-3 text-xs font-semibold relative flex items-center transition ${
                            active
                              ? isDark
                                ? 'text-[#7B83EB]'
                                : 'text-[#5B5FC7]'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          <span>{tab.label}</span>
                          {active && (
                            <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-[#5B5FC7] dark:bg-[#7B83EB]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Top-Right Header Actions: Member Avatars + Meet Now */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden lg:flex -space-x-1.5 overflow-hidden p-1">
                    {currentTeam.memberIds.map((uid) => {
                      const u = users[uid];
                      if (!u) return null;
                      return (
                        <AvatarWithPresence
                          key={uid}
                          name={u.displayName}
                          initials={u.initials}
                          color={u.avatarColor}
                          status={u.status}
                          size="sm"
                        />
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      startMeetNowCall(`${currentTeam.name} • #${currentChannel.name}`)
                    }
                    className="px-3.5 py-1.5 rounded-md bg-[#5B5FC7] hover:bg-[#4F52B2] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Meet Now</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: CHANNEL THREADED POSTS */}
              {activeChannelTab === 'posts' && (
                <>
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    <div className="max-w-[960px] mx-auto w-full space-y-4">
                      {channelRootMessages.map((rootMsg) => {
                        const replies = repliesByParentId[rootMsg._id] || [];
                        const isExpanded = !!expandedThreads[rootMsg._id];
                        // Spec 3.2: 1-2 replies show inline automatically; 3+ collapse by default unless toggled
                        const shouldCollapse = replies.length >= 3 && !isExpanded;
                        const visibleReplies = shouldCollapse
                          ? replies.slice(-1)
                          : replies;
                        const isReplyingHere = activeReplyThreadId === rootMsg._id;
                        const author = users[rootMsg.senderId] || currentUser;

                        return (
                          <article
                            key={rootMsg._id}
                            className={`group rounded-lg border shadow-sm transition relative ${
                              isDark
                                ? 'bg-[#333333] border-[#3D3D3D]'
                                : 'bg-white border-[#E0E0E0]'
                            }`}
                          >
                            {/* Floating Hover Reaction & Reply Action Bar */}
                            <div
                              className={`opacity-0 group-hover:opacity-100 transition absolute -top-3 right-4 px-2 py-1 rounded-full border shadow-md flex items-center gap-1 z-10 ${
                                isDark
                                  ? 'bg-[#292929] border-[#3D3D3D]'
                                  : 'bg-white border-zinc-200'
                              }`}
                            >
                              {QUICK_EMOJIS.map((emo) => (
                                <button
                                  key={emo}
                                  onClick={() => handleToggleReaction(rootMsg._id, emo)}
                                  className="hover:scale-125 transition text-xs px-1"
                                  title={`React with ${emo}`}
                                >
                                  {emo}
                                </button>
                              ))}
                              <span className="h-3 w-[1px] bg-zinc-500/30 mx-1" />
                              <button
                                onClick={() => setActiveReplyThreadId(rootMsg._id)}
                                className="px-1.5 py-0.5 text-[11px] font-medium flex items-center gap-1 text-[#7B83EB] hover:underline"
                              >
                                <Reply className="w-3 h-3" />
                                <span>Reply</span>
                              </button>
                            </div>

                            {/* Root Post Content Body */}
                            <div className="p-4">
                              <div className="flex items-start gap-3">
                                <AvatarWithPresence
                                  name={rootMsg.senderName}
                                  initials={rootMsg.senderInitials}
                                  color={rootMsg.senderAvatarColor}
                                  status={author.status}
                                  size="md"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-semibold">
                                        {rootMsg.senderName}
                                      </span>
                                      <span className="text-[11px] opacity-60">
                                        {author.title}
                                      </span>
                                      <span className="text-[11px] opacity-50">
                                        • {rootMsg.createdAt}
                                      </span>
                                    </div>
                                    {rootMsg.isPinned && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5B5FC7]/15 text-[#7B83EB] font-medium flex items-center gap-1">
                                        <Pin className="w-3 h-3" />
                                        Pinned
                                      </span>
                                    )}
                                  </div>

                                  {rootMsg.subject && (
                                    <h3 className="text-base font-semibold mt-1.5 mb-1">
                                      {rootMsg.subject}
                                    </h3>
                                  )}

                                  <div className="text-sm mt-1">
                                    <FormattedText text={rootMsg.content} />
                                  </div>

                                  {/* Attachments */}
                                  {rootMsg.attachments.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {rootMsg.attachments.map((att) => (
                                        <div
                                          key={att.id}
                                          onClick={() => setActiveChannelTab('files')}
                                          className={`px-3 py-2 rounded-md border text-xs flex items-center gap-2 cursor-pointer transition ${
                                            isDark
                                              ? 'bg-[#292929] border-[#3D3D3D] hover:border-[#7B83EB]'
                                              : 'bg-zinc-50 border-zinc-200 hover:border-[#5B5FC7]'
                                          }`}
                                        >
                                          <FileText className="w-4 h-4 text-[#7B83EB]" />
                                          <div>
                                            <div className="font-medium">{att.name}</div>
                                            <div className="text-[10px] opacity-60">
                                              {(att.sizeBytes / 1024).toFixed(1)} KB • Click to view in Files
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Aggregated Reaction Pills */}
                                  {Object.keys(rootMsg.reactions).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                      {Object.entries(rootMsg.reactions).map(([emo, uids]) => (
                                        <button
                                          key={emo}
                                          onClick={() => handleToggleReaction(rootMsg._id, emo)}
                                          className={`px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1 border transition ${
                                            uids.includes(currentUser._id)
                                              ? 'bg-[#5B5FC7]/20 border-[#5B5FC7] text-[#7B83EB] font-medium'
                                              : 'bg-zinc-500/10 border-transparent hover:border-zinc-500/30'
                                          }`}
                                        >
                                          <span>{emo}</span>
                                          <span className="text-[11px]">{uids.length}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Thread Replies Section (Spec 3.2 Collapse/Expand State Machine) */}
                            {replies.length > 0 && (
                              <div
                                className={`border-t px-4 py-2.5 space-y-2.5 rounded-b-lg ${
                                  isDark
                                    ? 'bg-[#262626] border-[#3D3D3D]'
                                    : 'bg-[#F9F9FB] border-[#E8E8E8]'
                                }`}
                              >
                                {replies.length >= 3 && (
                                  <button
                                    onClick={() =>
                                      setExpandedThreads((prev) => ({
                                        ...prev,
                                        [rootMsg._id]: !prev[rootMsg._id],
                                      }))
                                    }
                                    className="text-xs font-medium text-[#7B83EB] hover:underline flex items-center gap-1.5"
                                  >
                                    <CornerDownRight className="w-3.5 h-3.5" />
                                    <span>
                                      {shouldCollapse
                                        ? `See all ${replies.length} replies (Last reply ${
                                            rootMsg.lastReplyAt || 'recently'
                                          })`
                                        : `Collapse ${replies.length} replies`}
                                    </span>
                                  </button>
                                )}

                                {visibleReplies.map((rep) => {
                                  const repAuthor = users[rep.senderId] || currentUser;
                                  return (
                                    <div
                                      key={rep._id}
                                      className="flex items-start gap-2.5 pt-1 group/reply"
                                    >
                                      <AvatarWithPresence
                                        name={rep.senderName}
                                        initials={rep.senderInitials}
                                        color={rep.senderAvatarColor}
                                        status={repAuthor.status}
                                        size="sm"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold">
                                              {rep.senderName}
                                            </span>
                                            <span className="text-[10px] opacity-60">
                                              {rep.createdAt}
                                            </span>
                                          </div>
                                          <div className="opacity-0 group-hover/reply:opacity-100 flex items-center gap-1">
                                            {['👍', '❤️', '🎉'].map((emo) => (
                                              <button
                                                key={emo}
                                                onClick={() => handleToggleReaction(rep._id, emo)}
                                                className="text-xs px-1 hover:scale-125 transition"
                                              >
                                                {emo}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="text-xs mt-0.5">
                                          <FormattedText text={rep.content} />
                                        </div>
                                        {Object.keys(rep.reactions).length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {Object.entries(rep.reactions).map(([emo, uids]) => (
                                              <button
                                                key={emo}
                                                onClick={() => handleToggleReaction(rep._id, emo)}
                                                className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#5B5FC7]/15 text-[#7B83EB] flex items-center gap-1"
                                              >
                                                <span>{emo}</span>
                                                <span>{uids.length}</span>
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Card Footer: Inline Reply Expander or Attached Composer */}
                            <div
                              className={`border-t px-4 py-2 rounded-b-lg ${
                                isDark ? 'border-[#3D3D3D]' : 'border-[#EAEAEA]'
                              }`}
                            >
                              {!isReplyingHere ? (
                                <button
                                  onClick={() => setActiveReplyThreadId(rootMsg._id)}
                                  className="text-xs font-medium opacity-75 hover:opacity-100 hover:text-[#7B83EB] flex items-center gap-1.5 transition"
                                >
                                  <Reply className="w-3.5 h-3.5" />
                                  <span>Reply</span>
                                </button>
                              ) : (
                                <div className="space-y-2 py-1">
                                  <div className="flex items-center justify-between text-[11px] opacity-70">
                                    <span>
                                      Replying to <strong>{rootMsg.senderName}</strong> (`parentMessageId: {rootMsg._id}`)
                                    </span>
                                    <button
                                      onClick={() => setActiveReplyThreadId(null)}
                                      className="hover:opacity-100"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex gap-2">
                                    <input
                                      autoFocus
                                      value={replyDrafts[rootMsg._id] || ''}
                                      onChange={(e) =>
                                        setReplyDrafts((prev) => ({
                                          ...prev,
                                          [rootMsg._id]: e.target.value,
                                        }))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleSendThreadReply(rootMsg._id);
                                        }
                                      }}
                                      placeholder="Write an inline thread reply (supports **bold**, `code`, @mention)..."
                                      className={`flex-1 h-8 px-3 rounded-md border text-xs outline-none ${
                                        isDark
                                          ? 'bg-[#1F1F1F] border-[#3D3D3D] focus:border-[#7B83EB]'
                                          : 'bg-white border-zinc-300 focus:border-[#5B5FC7]'
                                      }`}
                                    />
                                    <button
                                      onClick={() => handleSendThreadReply(rootMsg._id)}
                                      className="px-3 h-8 rounded-md bg-[#5B5FC7] hover:bg-[#4F52B2] text-white text-xs font-medium flex items-center gap-1"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>Reply</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })}

                      {/* Real-time Typing Indicator inside Channel */}
                      {(typingByRoom[currentChannel._id] || []).length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-[#7B83EB] font-medium pl-2 animate-pulse">
                          <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7B83EB] animate-bounce" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7B83EB] animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7B83EB] animate-bounce [animation-delay:300ms]" />
                          </span>
                          <span>
                            {typingByRoom[currentChannel._id]
                              .map((u) => u.displayName)
                              .join(', ')}{' '}
                            is typing a reply...
                          </span>
                        </div>
                      )}
                      <div ref={feedEndRef} />
                    </div>
                  </div>

                  {/* Bottom Pinned Root Post Composer */}
                  <div className="px-6 pb-5 pt-2 shrink-0">
                    <div className="max-w-[960px] mx-auto w-full">
                      {!isNewPostExpanded ? (
                        <button
                          onClick={() => setIsNewPostExpanded(true)}
                          className="px-4 py-2.5 rounded-lg bg-[#5B5FC7] hover:bg-[#4F52B2] text-white text-xs font-semibold flex items-center gap-2 shadow-md transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Start a new post</span>
                        </button>
                      ) : (
                        <form
                          onSubmit={handleSendRootPost}
                          className={`rounded-lg border p-3.5 shadow-lg space-y-2.5 ${
                            isDark
                              ? 'bg-[#333333] border-[#5B5FC7]/60'
                              : 'bg-white border-[#5B5FC7]'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-zinc-500/15 pb-2">
                            <input
                              value={newPostSubject}
                              onChange={(e) => setNewPostSubject(e.target.value)}
                              placeholder="Add a subject line (optional)"
                              className="flex-1 bg-transparent text-sm font-semibold outline-none"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setNewPostContent((c) => `${c} **bold** `)}
                                title="Bold"
                                className="p-1 rounded hover:bg-zinc-500/15"
                              >
                                <Bold className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewPostContent((c) => `${c} \`code\` `)}
                                title="Inline Code"
                                className="p-1 rounded hover:bg-zinc-500/15"
                              >
                                <Code className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUploadSampleFile('composer')}
                                title="Attach file"
                                className="p-1 rounded hover:bg-zinc-500/15"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsNewPostExpanded(false)}
                                className="p-1 rounded hover:bg-zinc-500/15 ml-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <textarea
                            rows={2}
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder={`Start a new threaded conversation in #${currentChannel.name}...`}
                            className="w-full bg-transparent text-sm outline-none resize-none"
                          />

                          {newPostAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {newPostAttachments.map((att) => (
                                <span
                                  key={att.id}
                                  className="px-2 py-1 rounded bg-[#5B5FC7]/15 text-[#7B83EB] text-xs flex items-center gap-1.5"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>{att.name}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] opacity-60">
                              Supports Markdown (`**bold**`, `` `code` ``, `@mention`) • Socket.io auto-ack
                            </span>
                            <button
                              type="submit"
                              disabled={!newPostContent.trim()}
                              className="px-4 py-1.5 rounded-md bg-[#5B5FC7] hover:bg-[#4F52B2] disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5"
                            >
                              <span>Post</span>
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: CHANNEL FILES REPOSITORY */}
              {activeChannelTab === 'files' && (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-[960px] mx-auto space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold">
                          Shared Files in #{currentChannel.name}
                        </h2>
                        <p className="text-xs opacity-60">
                          Files attached to channel root posts automatically sync here.
                        </p>
                      </div>
                      <button
                        onClick={() => handleUploadSampleFile('channel')}
                        className="px-3 py-1.5 rounded-md bg-[#5B5FC7] hover:bg-[#4F52B2] text-white text-xs font-medium flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </button>
                    </div>

                    <div
                      className={`rounded-lg border overflow-hidden ${
                        isDark ? 'bg-[#333333] border-[#3D3D3D]' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <table className="w-full text-left text-xs">
                        <thead
                          className={`border-b uppercase text-[10px] tracking-wider opacity-70 ${
                            isDark ? 'bg-[#292929] border-[#3D3D3D]' : 'bg-zinc-50 border-zinc-200'
                          }`}
                        >
                          <tr>
                            <th className="py-2.5 px-4">File Name</th>
                            <th className="py-2.5 px-4">Type</th>
                            <th className="py-2.5 px-4">Uploaded By</th>
                            <th className="py-2.5 px-4">Modified</th>
                            <th className="py-2.5 px-4 text-right">Size</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-500/15">
                          {currentChannel.files.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center opacity-60">
                                No files uploaded to #{currentChannel.name} yet. Click "Upload File" above to add one.
                              </td>
                            </tr>
                          ) : (
                            currentChannel.files.map((file) => (
                              <tr key={file.id} className="hover:bg-zinc-500/10 transition">
                                <td className="py-2.5 px-4 font-medium flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-[#7B83EB]" />
                                  <span>{file.name}</span>
                                </td>
                                <td className="py-2.5 px-4 opacity-70 font-mono text-[11px]">
                                  {file.mimeType}
                                </td>
                                <td className="py-2.5 px-4">{file.uploadedBy}</td>
                                <td className="py-2.5 px-4 opacity-70">{file.uploadedAt}</td>
                                <td className="py-2.5 px-4 text-right font-mono">
                                  {(file.sizeBytes / 1024).toFixed(1)} KB
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MONGOOSE SCHEMAS & SOCKET.IO CONTRACTS INSPECTOR */}
              {activeChannelTab === 'schema' && (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-[960px] mx-auto space-y-4">
                    <div className="p-4 rounded-lg border border-[#5B5FC7]/40 bg-[#5B5FC7]/10">
                      <h2 className="text-sm font-semibold text-[#7B83EB]">
                        Phase 2 & 3 Full-Stack Architecture Contracts
                      </h2>
                      <p className="text-xs opacity-80 mt-1">
                        The complete Next.js 14 project (`src/models/*`, `src/types/socket.ts`, `server.ts`, and `src/app/api/livekit/route.ts`) has been scaffolded and packaged alongside this interactive workspace.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div
                        className={`p-4 rounded-lg border font-mono space-y-2 ${
                          isDark ? 'bg-[#1F1F1F] border-[#3D3D3D]' : 'bg-zinc-50 border-zinc-200'
                        }`}
                      >
                        <div className="font-sans font-semibold text-emerald-400">
                          Mongoose Model: `src/models/Message.ts`
                        </div>
                        <pre className="text-[11px] overflow-x-auto leading-relaxed opacity-90">
{`const MessageSchema = new Schema<IMessage>({
  channelId: { type: ObjectId, ref: 'Channel', index: true },
  conversationId: { type: ObjectId, ref: 'Conversation' },
  senderId: { type: ObjectId, ref: 'User', required: true },
  subject: { type: String, trim: true },
  content: { type: String, required: true },
  parentMessageId: { type: ObjectId, ref: 'Message', default: null },
  replyCount: { type: Number, default: 0 },
  reactions: { type: Map, of: [String], default: {} },
}, { timestamps: true });`}
                        </pre>
                      </div>

                      <div
                        className={`p-4 rounded-lg border font-mono space-y-2 ${
                          isDark ? 'bg-[#1F1F1F] border-[#3D3D3D]' : 'bg-zinc-50 border-zinc-200'
                        }`}
                      >
                        <div className="font-sans font-semibold text-indigo-400">
                          Socket.io Events: `src/types/socket.ts`
                        </div>
                        <pre className="text-[11px] overflow-x-auto leading-relaxed opacity-90">
{`export interface ServerToClientEvents {
  'message:new': (msg: SerializedMessage) => void;
  'message:ack': (p: { tempId: string; savedMessage: SerializedMessage }) => void;
  'message:reaction:updated': (p: { messageId: string; reactions: Record<string, string[]> }) => void;
  'typing:update': (p: { roomId: string; typingUsers: UserRef[] }) => void;
  'presence:changed': (p: PresenceUpdatePayload) => void;
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ------------------------------------------------------------------ */}
        {/* PANE 4: CONTEXTUAL RIGHT TELEMETRY DRAWER (Socket.io Live Stream)  */}
        {/* ------------------------------------------------------------------ */}
        {showRightInfoDrawer && (
          <aside
            className={`w-80 shrink-0 border-l flex flex-col z-20 ${
              isDark ? 'bg-[#1F1F1F] border-[#3D3D3D]' : 'bg-[#F5F5F5] border-[#E0E0E0]'
            }`}
          >
            <div className="h-[60px] px-4 border-b border-zinc-500/15 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold">Socket.io & Presence Bus</span>
              </div>
              <button
                onClick={() => setShowRightInfoDrawer(false)}
                className="p-1 rounded hover:bg-zinc-500/15"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-zinc-500/15 space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                Workspace Member Presence (`User.status`)
              </div>
              {Object.values(users).map((u) => (
                <div key={u._id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <AvatarWithPresence
                      name={u.displayName}
                      initials={u.initials}
                      color={u.avatarColor}
                      status={u.status}
                      size="sm"
                    />
                    <span className="truncate font-medium">{u.displayName}</span>
                  </div>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-zinc-500/15">
                    {u.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                Real-Time Event Log
              </div>
              {socketEventsLog.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-2 rounded border text-[11px] space-y-0.5 ${
                    isDark ? 'bg-[#292929] border-[#3D3D3D]' : 'bg-white border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-[#7B83EB] font-semibold">{evt.event}</span>
                    <span className="opacity-50">{evt.time}</span>
                  </div>
                  <div className="opacity-80 leading-snug">{evt.detail}</div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: COMMAND PALETTE (`Ctrl+E` / `Cmd+E`)                        */}
      {/* ==================================================================== */}
      {isCommandOpen && (
        <div
          onClick={() => setIsCommandOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-start justify-center pt-20 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden ${
              isDark ? 'bg-[#292929] border-[#3D3D3D]' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="p-3 border-b border-zinc-500/20 flex items-center gap-2.5">
              <Command className="w-4 h-4 text-[#7B83EB]" />
              <input
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commandQuery.startsWith('/')) {
                    executeSlashCommand(commandQuery);
                  }
                }}
                placeholder="Type /available, /busy, /dnd, /meet, or jump to a channel..."
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button
                onClick={() => setIsCommandOpen(false)}
                className="text-xs opacity-60 hover:opacity-100"
              >
                ESC
              </button>
            </div>

            <div className="p-2 max-h-72 overflow-y-auto space-y-1 text-xs">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase opacity-50">
                Slash Commands & Shortcuts
              </div>
              {[
                { cmd: '/available', desc: 'Set presence status to Available (Online)' },
                { cmd: '/busy', desc: 'Set presence status to Busy' },
                { cmd: '/dnd', desc: 'Set presence status to Do Not Disturb' },
                { cmd: '/meet', desc: 'Launch an instant WebRTC / LiveKit Meet Now call' },
              ].map((item) => (
                <button
                  key={item.cmd}
                  onClick={() => executeSlashCommand(item.cmd)}
                  className="w-full px-3 py-2 rounded-md hover:bg-[#5B5FC7]/20 flex items-center justify-between text-left"
                >
                  <span className="font-mono font-semibold text-[#7B83EB]">{item.cmd}</span>
                  <span className="opacity-75">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: CREATE NEW CHANNEL                                          */}
      {/* ==================================================================== */}
      {isNewChannelModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateChannel}
            className={`w-full max-w-md rounded-xl border p-5 space-y-4 shadow-2xl ${
              isDark ? 'bg-[#292929] border-[#3D3D3D]' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Create Channel in {currentTeam.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsNewChannelModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Channel Name</label>
                <input
                  required
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. release-v2-telemetry"
                  className={`w-full h-9 px-3 rounded border outline-none ${
                    isDark ? 'bg-[#1F1F1F] border-[#3D3D3D]' : 'bg-zinc-50 border-zinc-300'
                  }`}
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Description</label>
                <input
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="Purpose of this channel..."
                  className={`w-full h-9 px-3 rounded border outline-none ${
                    isDark ? 'bg-[#1F1F1F] border-[#3D3D3D]' : 'bg-zinc-50 border-zinc-300'
                  }`}
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Privacy Type</label>
                <select
                  value={newChannelType}
                  onChange={(e) =>
                    setNewChannelType(e.target.value as 'public' | 'private')
                  }
                  className={`w-full h-9 px-3 rounded border outline-none ${
                    isDark ? 'bg-[#1F1F1F] border-[#3D3D3D]' : 'bg-zinc-50 border-zinc-300'
                  }`}
                >
                  <option value="public">Standard (Public — visible to everyone on the team)</option>
                  <option value="private">Private (Locked — selected members only)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewChannelModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs hover:bg-zinc-500/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#5B5FC7] text-white text-xs font-semibold"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: SCHEDULE NEW MEETING                                        */}
      {/* ==================================================================== */}
      {isNewMeetingModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateMeeting}
            className={`w-full max-w-md rounded-xl border p-5 space-y-4 shadow-2xl ${
              isDark ? 'bg-[#292929] border-[#3D3D3D]' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Schedule Channel Meeting</h3>
              <button
                type="button"
                onClick={() => setIsNewMeetingModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Meeting Title</label>
                <input
                  required
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  placeholder="e.g. Architecture Sign-off Sync"
                  className={`w-full h-9 px-3 rounded border outline-none ${
                    isDark ? 'bg-[#1F1F1F] border-[#3D3D3D]' : 'bg-zinc-50 border-zinc-300'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium mb-1">Day</label>
                  <select
                    value={newMeetingDay}
                    onChange={(e) => setNewMeetingDay(Number(e.target.value))}
                    className={`w-full h-9 px-2 rounded border outline-none ${
                      isDark ? 'bg-[#1F1F1F] border-[#3D3D3D]' : 'bg-zinc-50 border-zinc-300'
                    }`}
                  >
                    <option value={0}>Monday</option>
                    <option value={1}>Tuesday</option>
                    <option value={2}>Wednesday</option>
                    <option value={3}>Thursday</option>
                    <option value={4}>Friday</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Start Hour (24h)</label>
                  <input
                    type="number"
                    min={8}
                    max={18}
                    value={newMeetingHour}
                    onChange={(e) => setNewMeetingHour(Number(e.target.value))}
                    className={`w-full h-9 px-3 rounded border outline-none ${
                      isDark ? 'bg-[#1F1F1F] border-[#3D3D3D]' : 'bg-zinc-50 border-zinc-300'
                    }`}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewMeetingModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs hover:bg-zinc-500/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#5B5FC7] text-white text-xs font-semibold"
              >
                Schedule Meeting
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
