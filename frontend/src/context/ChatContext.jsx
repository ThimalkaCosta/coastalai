import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const ChatContext = createContext()

export function ChatProvider({ children }) {
  const { currentUser, userProfile } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('list') // 'list' | 'thread' | 'new'

  const uid = currentUser?.uid

  // Real-time listener for all active users (for new-chat search)
  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users'), where('status', '==', 'active'))
    const unsub = onSnapshot(q, (snap) => {
      setAllUsers(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.id !== uid && u.role),
      )
    })
    return unsub
  }, [uid])

  // Real-time listener for conversations where current user is a participant
  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', uid),
      orderBy('updatedAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      const convos = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setConversations(convos)

      // Count unread
      let count = 0
      convos.forEach((c) => {
        const readBy = c.readBy || {}
        if (!readBy[uid] && c.lastMessage && c.lastSenderId !== uid) {
          count++
        }
      })
      setUnreadTotal(count)
    })
    return unsub
  }, [uid])

  // Real-time listener for messages in the active conversation
  useEffect(() => {
    if (!activeConversation) {
      setMessages([])
      return
    }
    const q = query(
      collection(db, 'conversations', activeConversation, 'messages'),
      orderBy('createdAt', 'asc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })

    // Mark conversation as read
    markRead(activeConversation)

    return unsub
  }, [activeConversation])

  const markRead = useCallback(
    async (convoId) => {
      if (!uid || !convoId) return
      try {
        await updateDoc(doc(db, 'conversations', convoId), {
          [`readBy.${uid}`]: true,
        })
      } catch (_) {
        /* ignore */
      }
    },
    [uid],
  )

  // Send a message
  const sendMessage = useCallback(
    async (text) => {
      if (!uid || !activeConversation || !text.trim()) return
      const senderName =
        userProfile?.displayName || currentUser?.displayName || 'Unknown'

      await addDoc(
        collection(db, 'conversations', activeConversation, 'messages'),
        {
          text: text.trim(),
          senderId: uid,
          senderName,
          senderPhoto: currentUser?.photoURL || null,
          senderRole: userProfile?.role || '',
          createdAt: serverTimestamp(),
        },
      )

      // Update conversation metadata
      const convo = conversations.find((c) => c.id === activeConversation)
      const readBy = {}
      if (convo) {
        convo.participantIds.forEach((pid) => {
          readBy[pid] = pid === uid
        })
      }

      await updateDoc(doc(db, 'conversations', activeConversation), {
        lastMessage: text.trim().slice(0, 100),
        lastSenderId: uid,
        lastSenderName: senderName,
        updatedAt: serverTimestamp(),
        readBy,
      })
    },
    [uid, activeConversation, currentUser, userProfile, conversations],
  )

  // Start or open existing 1:1 conversation
  const openConversation = useCallback(
    async (otherUser) => {
      if (!uid) return

      // Check if 1-on-1 conversation already exists
      const existing = conversations.find(
        (c) =>
          c.type === 'direct' &&
          c.participantIds.length === 2 &&
          c.participantIds.includes(otherUser.id),
      )

      if (existing) {
        setActiveConversation(existing.id)
        setView('thread')
        return existing.id
      }

      // Create new conversation
      const senderName =
        userProfile?.displayName || currentUser?.displayName || 'Unknown'
      const newConvo = await addDoc(collection(db, 'conversations'), {
        type: 'direct',
        participantIds: [uid, otherUser.id],
        participants: {
          [uid]: {
            displayName: senderName,
            email: currentUser?.email || '',
            photoURL: currentUser?.photoURL || null,
            role: userProfile?.role || '',
          },
          [otherUser.id]: {
            displayName: otherUser.displayName || otherUser.email,
            email: otherUser.email || '',
            photoURL: otherUser.photoURL || null,
            role: otherUser.role || '',
          },
        },
        lastMessage: '',
        lastSenderId: '',
        lastSenderName: '',
        readBy: { [uid]: true, [otherUser.id]: true },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setActiveConversation(newConvo.id)
      setView('thread')
      return newConvo.id
    },
    [uid, conversations, currentUser, userProfile],
  )

  // Create a group conversation
  const createGroupConversation = useCallback(
    async (name, memberIds) => {
      if (!uid) return
      const senderName =
        userProfile?.displayName || currentUser?.displayName || 'Unknown'

      const allIds = [uid, ...memberIds.filter((id) => id !== uid)]

      // Build participants map
      const participantsMap = {
        [uid]: {
          displayName: senderName,
          email: currentUser?.email || '',
          photoURL: currentUser?.photoURL || null,
          role: userProfile?.role || '',
        },
      }
      memberIds.forEach((mid) => {
        const u = allUsers.find((au) => au.id === mid)
        if (u) {
          participantsMap[mid] = {
            displayName: u.displayName || u.email,
            email: u.email || '',
            photoURL: u.photoURL || null,
            role: u.role || '',
          }
        }
      })

      const newConvo = await addDoc(collection(db, 'conversations'), {
        type: 'group',
        name,
        participantIds: allIds,
        participants: participantsMap,
        lastMessage: '',
        lastSenderId: '',
        lastSenderName: '',
        readBy: Object.fromEntries(allIds.map((id) => [id, true])),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setActiveConversation(newConvo.id)
      setView('thread')
      return newConvo.id
    },
    [uid, currentUser, userProfile, allUsers],
  )

  // Leave a group conversation
  const leaveGroup = useCallback(
    async (convoId) => {
      if (!uid || !convoId) return
      const convo = conversations.find((c) => c.id === convoId)
      if (convo?.type !== 'group') return

      const remaining = convo.participantIds.filter((id) => id !== uid)
      if (remaining.length === 0) {
        await deleteDoc(doc(db, 'conversations', convoId))
      } else {
        await updateDoc(doc(db, 'conversations', convoId), {
          participantIds: remaining,
          [`participants.${uid}`]: deleteField(),
        })
      }
      if (activeConversation === convoId) {
        setActiveConversation(null)
        setView('list')
      }
    },
    [uid, conversations, activeConversation],
  )

  // Helper to get conversation display info
  const getConvoDisplay = useCallback(
    (convo) => {
      if (convo.type === 'group') {
        return {
          name: convo.name || 'Group Chat',
          photo: null,
          role: 'Group',
          memberCount: convo.participantIds?.length || 0,
        }
      }
      // Direct conversation — show the other person
      const otherId = convo.participantIds?.find((id) => id !== uid)
      const other = convo.participants?.[otherId] || {}
      return {
        name: other.displayName || 'Unknown',
        photo: other.photoURL || null,
        role: other.role || '',
      }
    },
    [uid],
  )

  const value = {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    allUsers,
    unreadTotal,
    open,
    setOpen,
    view,
    setView,
    sendMessage,
    openConversation,
    createGroupConversation,
    leaveGroup,
    getConvoDisplay,
    markRead,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  return useContext(ChatContext)
}
