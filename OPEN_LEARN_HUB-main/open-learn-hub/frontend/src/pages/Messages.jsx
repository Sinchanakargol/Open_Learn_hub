import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import io from 'socket.io-client'
import api from '../services/api'
import { Search, Send, Plus, Users, User, MoreVertical, Smile, Paperclip } from 'lucide-react'

export default function Messages() {
  const { user } = useSelector(s => s.auth)
  const location = useLocation()
  
  const [socket, setSocket] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
    const newSocket = io(socketUrl, {
      auth: { token: localStorage.getItem('token') }
    })
    
    setSocket(newSocket)
    
    return () => newSocket.disconnect()
  }, [])

  // Load conversations
  useEffect(() => {
    loadConversations()
  }, [])

  // Auto-select conversation from navigation state
  useEffect(() => {
    if (location.state?.conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c._id === location.state.conversationId)
      if (conv) {
        setSelectedConversation(conv)
      }
    }
  }, [location.state, conversations])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    socket.on('new-message', ({ message }) => {
      // Add message to current conversation if viewing it
      if (selectedConversation && message.conversation === selectedConversation._id) {
        setMessages(prev => [...prev, message])
        scrollToBottom()
      }
      
      // Update conversation list
      loadConversations()
    })

    socket.on('user-typing', ({ userId, userName }) => {
      if (selectedConversation) {
        setTypingUsers(prev => [...prev.filter(u => u.userId !== userId), { userId, userName }])
      }
    })

    socket.on('user-stopped-typing', ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId))
    })

    socket.on('user-online', ({ userId, userName }) => {
      setOnlineUsers(prev => [...prev, { userId, userName }])
    })

    socket.on('user-offline', ({ userId }) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== userId))
    })

    socket.on('message-edited', ({ messageId, newContent, editedAt }) => {
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, content: newContent, isEdited: true, editedAt } : m
      ))
    })

    socket.on('message-deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId))
    })

    socket.on('error', ({ message }) => {
      console.error('Socket error:', message)
    })

    return () => {
      socket.off('new-message')
      socket.off('user-typing')
      socket.off('user-stopped-typing')
      socket.off('user-online')
      socket.off('user-offline')
      socket.off('message-edited')
      socket.off('message-deleted')
      socket.off('error')
    }
  }, [socket, selectedConversation])

  // Join conversation room
  useEffect(() => {
    if (socket && selectedConversation) {
      socket.emit('join-conversation', { conversationId: selectedConversation._id })
      loadMessages(selectedConversation._id)
      
      return () => {
        socket.emit('leave-conversation', { conversationId: selectedConversation._id })
      }
    }
  }, [socket, selectedConversation])

  const loadConversations = async () => {
    try {
      const { data } = await api.get('/messaging/conversations')
      setConversations(data)
    } catch (error) {
      console.error('Load conversations error:', error)
    }
  }

  const loadMessages = async (conversationId) => {
    try {
      const { data } = await api.get(`/messaging/conversations/${conversationId}/messages`)
      setMessages(data.messages)
      scrollToBottom()
    } catch (error) {
      console.error('Load messages error:', error)
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !selectedConversation) return

    socket.emit('send-message', {
      conversationId: selectedConversation._id,
      content: newMessage.trim()
    })

    setNewMessage('')
    stopTyping()
  }

  const handleTyping = () => {
    if (!socket || !selectedConversation) return

    socket.emit('typing-start', { conversationId: selectedConversation._id })

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(stopTyping, 3000)
  }

  const stopTyping = () => {
    if (!socket || !selectedConversation) return
    socket.emit('typing-stop', { conversationId: selectedConversation._id })
  }

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const { data } = await api.get(`/messaging/users/search?query=${query}`)
      setSearchResults(data)
    } catch (error) {
      console.error('Search users error:', error)
    }
  }

  const startDirectConversation = async (recipientId) => {
    try {
      const { data } = await api.get(`/messaging/direct/${recipientId}`)
      setSelectedConversation(data)
      setShowUserSearch(false)
      setSearchQuery('')
      loadConversations()
    } catch (error) {
      console.error('Start conversation error:', error)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const getConversationName = (conv) => {
    if (conv.type === 'direct') {
      const otherUser = conv.participants.find(p => p._id !== user.id)
      return otherUser?.name || 'Unknown User'
    }
    return conv.name || 'Group Chat'
  }

  const getConversationAvatar = (conv) => {
    if (conv.type === 'direct') {
      const otherUser = conv.participants.find(p => p._id !== user.id)
      return otherUser?.name?.charAt(0).toUpperCase() || '?'
    }
    return 'G'
  }

  const formatTime = (date) => {
    const d = new Date(date)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    return d.toLocaleDateString()
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar - Conversations List */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white mb-3">Messages</h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                searchUsers(e.target.value)
              }}
              onFocus={() => setShowUserSearch(true)}
            />
          </div>
        </div>

        {/* User Search Results */}
        {showUserSearch && searchResults.length > 0 && (
          <div className="p-2 border-b border-slate-700 max-h-48 overflow-y-auto">
            <p className="text-xs text-slate-400 px-2 mb-2">Start new conversation</p>
            {searchResults.map(u => (
              <button
                key={u._id}
                onClick={() => startDirectConversation(u._id)}
                className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.role}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <button
              key={conv._id}
              onClick={() => {
                setSelectedConversation(conv)
                setShowUserSearch(false)
                setSearchQuery('')
              }}
              className={`w-full p-4 flex items-start gap-3 hover:bg-slate-700 transition-colors ${
                selectedConversation?._id === conv._id ? 'bg-slate-700' : ''
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {getConversationAvatar(conv)}
                </div>
                {conv.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                    {conv.unreadCount}
                  </div>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-semibold">{getConversationName(conv)}</h3>
                  {conv.lastMessage?.timestamp && (
                    <span className="text-xs text-slate-400">
                      {formatTime(conv.lastMessage.timestamp)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 truncate">
                  {conv.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {getConversationAvatar(selectedConversation)}
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {getConversationName(selectedConversation)}
                </h3>
                <p className="text-xs text-slate-400">
                  {typingUsers.length > 0 ? `${typingUsers[0].userName} is typing...` : 'Online'}
                </p>
              </div>
            </div>
            <button className="p-2 hover:bg-slate-700 rounded-lg">
              <MoreVertical className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => {
              const isOwn = msg.sender._id === user.id
              const showDate = idx === 0 || formatDate(messages[idx - 1].createdAt) !== formatDate(msg.createdAt)

              return (
                <div key={msg._id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                      {!isOwn && (
                        <p className="text-xs text-slate-400 mb-1 ml-1">{msg.sender.name}</p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs opacity-70">{formatTime(msg.createdAt)}</span>
                          {msg.isEdited && <span className="text-xs opacity-70">(edited)</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 bg-slate-800 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-700 rounded-lg">
                <Paperclip className="w-5 h-5 text-slate-400" />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  handleTyping()
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="p-2 hover:bg-slate-700 rounded-lg">
                <Smile className="w-5 h-5 text-slate-400" />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              Select a conversation
            </h3>
            <p className="text-slate-500">
              Choose a conversation from the sidebar or start a new one
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
