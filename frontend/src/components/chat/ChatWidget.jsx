import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, ArrowLeft, Users, Plus, Search, Send, Check, CheckCheck } from 'lucide-react'
import { useChat } from '../../context/ChatContext'
import { useAuth } from '../../context/AuthContext'

/* ──────────── AVATAR ──────────── */
function Avatar({ name, photo, size = 'md', role }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-sm'
  const roleBg = {
    'Head Office': 'ring-amber-400',
    Manager: 'ring-ocean-400',
    Officer: 'ring-emerald-400',
  }
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return photo ? (
    <img
      src={photo}
      alt={name}
      className={`${sz} rounded-full object-cover ring-2 ${roleBg[role] || 'ring-coastal-300'}`}
    />
  ) : (
    <div
      className={`${sz} rounded-full bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center text-white font-bold ring-2 ${roleBg[role] || 'ring-coastal-300'}`}
    >
      {initials}
    </div>
  )
}

/* ──────────── ROLE BADGE ──────────── */
function RoleBadge({ role }) {
  const colors = {
    'Head Office': 'bg-amber-100 text-amber-700',
    Manager: 'bg-ocean-100 text-ocean-700',
    Officer: 'bg-emerald-100 text-emerald-700',
  }
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${colors[role] || 'bg-coastal-100 text-coastal-600'}`}>
      {role}
    </span>
  )
}

/* ──────────── TIME UTIL ──────────── */
function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function fullTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

/* ──────────── CONVERSATION LIST ──────────── */
function ConversationList() {
  const { conversations, setActiveConversation, setView, getConvoDisplay, unreadTotal } = useChat()
  const { currentUser } = useAuth()
  const uid = currentUser?.uid

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-coastal-200/70">
        <h3 className="text-base font-bold text-coastal-800">Messages</h3>
        <button
          onClick={() => setView('new')}
          className="p-2 rounded-xl bg-ocean-50 hover:bg-ocean-100 text-ocean-600 transition-colors"
          title="New chat"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-coastal-100">
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-coastal-400 gap-3 px-6">
            <MessageCircle size={40} strokeWidth={1.5} />
            <p className="text-sm text-center">No conversations yet. Start one!</p>
            <button
              onClick={() => setView('new')}
              className="text-sm text-ocean-500 hover:text-ocean-700 font-medium"
            >
              + New conversation
            </button>
          </div>
        )}
        {conversations.map((convo) => {
          const display = getConvoDisplay(convo)
          const isUnread =
            convo.lastMessage &&
            convo.lastSenderId !== uid &&
            !(convo.readBy && convo.readBy[uid])
          return (
            <button
              key={convo.id}
              onClick={() => {
                setActiveConversation(convo.id)
                setView('thread')
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-ocean-50/60 transition-colors ${
                isUnread ? 'bg-ocean-50/40' : ''
              }`}
            >
              <div className="relative flex-shrink-0">
                <Avatar name={display.name} photo={display.photo} role={display.role} />
                {convo.type === 'group' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-ocean-500 flex items-center justify-center">
                    <Users size={10} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${isUnread ? 'font-bold text-coastal-900' : 'font-medium text-coastal-700'}`}>
                    {display.name}
                  </span>
                  <span className="text-[10px] text-coastal-400 flex-shrink-0">
                    {timeAgo(convo.updatedAt)}
                  </span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${isUnread ? 'text-coastal-700 font-medium' : 'text-coastal-400'}`}>
                  {convo.lastMessage || 'No messages yet'}
                </p>
              </div>
              {isUnread && <div className="w-2.5 h-2.5 rounded-full bg-ocean-500 flex-shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ──────────── NEW CHAT PANEL ──────────── */
function NewChatPanel() {
  const { allUsers, openConversation, setView, createGroupConversation } = useChat()
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('direct') // 'direct' | 'group'
  const [selectedUsers, setSelectedUsers] = useState([])
  const [groupName, setGroupName] = useState('')

  const filtered = allUsers.filter(
    (u) =>
      (u.displayName || u.email || '')
        .toLowerCase()
        .includes(search.toLowerCase()),
  )

  const handleDirectClick = (user) => {
    openConversation(user)
  }

  const toggleSelect = (user) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    )
  }

  const handleCreateGroup = () => {
    if (selectedUsers.length < 2 || !groupName.trim()) return
    createGroupConversation(
      groupName.trim(),
      selectedUsers.map((u) => u.id),
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-coastal-200/70">
        <button
          onClick={() => setView('list')}
          className="p-1.5 rounded-lg hover:bg-coastal-100 text-coastal-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="text-base font-bold text-coastal-800">New Chat</h3>
      </div>

      {/* Mode toggle */}
      <div className="flex mx-4 mt-3 p-1 bg-coastal-100 rounded-xl">
        <button
          onClick={() => { setMode('direct'); setSelectedUsers([]) }}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
            mode === 'direct' ? 'bg-white text-ocean-600 shadow-sm' : 'text-coastal-500'
          }`}
        >
          Direct
        </button>
        <button
          onClick={() => setMode('group')}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
            mode === 'group' ? 'bg-white text-ocean-600 shadow-sm' : 'text-coastal-500'
          }`}
        >
          Group
        </button>
      </div>

      {/* Group name input */}
      {mode === 'group' && (
        <div className="px-4 mt-2">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name..."
            className="w-full text-sm px-3 py-2 bg-coastal-50 border border-coastal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-400/40"
          />
        </div>
      )}

      {/* Search */}
      <div className="relative px-4 mt-2">
        <Search size={14} className="absolute left-7 top-1/2 -translate-y-1/2 text-coastal-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full text-sm pl-9 pr-3 py-2 bg-coastal-50 border border-coastal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-400/40"
        />
      </div>

      {/* Selected users badges */}
      {mode === 'group' && selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 mt-2">
          {selectedUsers.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1 text-xs bg-ocean-100 text-ocean-700 px-2 py-1 rounded-full"
            >
              {(u.displayName || u.email).split(' ')[0]}
              <button onClick={() => toggleSelect(u)} className="hover:text-ocean-900">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* User list */}
      <div className="flex-1 overflow-y-auto mt-2 divide-y divide-coastal-100">
        {filtered.map((user) => {
          const isSelected = selectedUsers.find((u) => u.id === user.id)
          return (
            <button
              key={user.id}
              onClick={() => (mode === 'direct' ? handleDirectClick(user) : toggleSelect(user))}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-ocean-50/60 transition-colors ${
                isSelected ? 'bg-ocean-50/50' : ''
              }`}
            >
              <Avatar name={user.displayName || user.email} photo={user.photoURL} size="sm" role={user.role} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-coastal-800 truncate block">
                  {user.displayName || user.email}
                </span>
                <RoleBadge role={user.role} />
              </div>
              {mode === 'group' && (
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-ocean-500 border-ocean-500' : 'border-coastal-300'
                  }`}
                >
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
              )}
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-coastal-400 text-center py-6">No users found</p>
        )}
      </div>

      {/* Create group button */}
      {mode === 'group' && (
        <div className="p-3 border-t border-coastal-200/70">
          <button
            onClick={handleCreateGroup}
            disabled={selectedUsers.length < 2 || !groupName.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-ocean-500 to-ocean-600 shadow-md shadow-ocean-500/20 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Create Group ({selectedUsers.length} members)
          </button>
        </div>
      )}
    </div>
  )
}

/* ──────────── MESSAGE THREAD ──────────── */
function MessageThread() {
  const {
    messages,
    sendMessage,
    activeConversation,
    conversations,
    getConvoDisplay,
    setView,
    setActiveConversation,
  } = useChat()
  const { currentUser } = useAuth()
  const uid = currentUser?.uid
  const [text, setText] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const convo = conversations.find((c) => c.id === activeConversation)
  const display = convo ? getConvoDisplay(convo) : { name: 'Chat', photo: null, role: '' }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [activeConversation])

  const handleSend = () => {
    if (!text.trim()) return
    sendMessage(text)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages by date
  let lastDate = ''

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-coastal-200/70 bg-white/80 backdrop-blur-sm">
        <button
          onClick={() => {
            setActiveConversation(null)
            setView('list')
          }}
          className="p-1.5 rounded-lg hover:bg-coastal-100 text-coastal-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <Avatar name={display.name} photo={display.photo} size="sm" role={display.role} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-coastal-800 truncate">{display.name}</p>
          {display.role && <RoleBadge role={display.role} />}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 bg-gradient-to-b from-coastal-50/50 to-white">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-coastal-400">Say hello! 👋</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === uid
          const msgDate = msg.createdAt
            ? (msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt)).toLocaleDateString()
            : ''
          let showDate = false
          if (msgDate && msgDate !== lastDate) {
            showDate = true
            lastDate = msgDate
          }

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="text-[10px] bg-coastal-100 text-coastal-500 px-3 py-1 rounded-full font-medium">
                    {msgDate}
                  </span>
                </div>
              )}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
                {!isMine && convo?.type === 'group' && (
                  <Avatar name={msg.senderName} photo={msg.senderPhoto} size="sm" />
                )}
                <div
                  className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? 'bg-gradient-to-br from-ocean-500 to-ocean-600 text-white rounded-br-md'
                      : 'bg-white border border-coastal-200 text-coastal-800 rounded-bl-md shadow-sm'
                  }`}
                >
                  {!isMine && convo?.type === 'group' && (
                    <p className="text-[10px] font-bold text-ocean-500 mb-0.5">{msg.senderName}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p
                    className={`text-[10px] mt-1 flex items-center gap-1 ${
                      isMine ? 'text-ocean-200 justify-end' : 'text-coastal-400'
                    }`}
                  >
                    {fullTime(msg.createdAt)}
                    {isMine && <CheckCheck size={12} />}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-coastal-200/70 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 text-sm px-4 py-2.5 bg-coastal-50 border border-coastal-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-ocean-400/40 max-h-24"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-md shadow-ocean-500/20 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────── MAIN CHAT WIDGET ──────────── */
export default function ChatWidget() {
  const { open, setOpen, unreadTotal, view } = useChat()
  const { currentUser } = useAuth()

  if (!currentUser) return null

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[9999] p-4 rounded-full bg-gradient-to-br from-ocean-500 to-ocean-600 text-white shadow-xl shadow-ocean-500/30 hover:shadow-2xl hover:shadow-ocean-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && unreadTotal > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white"
          >
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </motion.span>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-[9998] w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-coastal-200/60 overflow-hidden flex flex-col"
          >
            {view === 'list' && <ConversationList />}
            {view === 'new' && <NewChatPanel />}
            {view === 'thread' && <MessageThread />}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
