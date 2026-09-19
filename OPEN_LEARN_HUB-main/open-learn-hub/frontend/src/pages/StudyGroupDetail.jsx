import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import api from '../services/api'
import io from 'socket.io-client'

export default function StudyGroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('chat')
  const [socket, setSocket] = useState(null)
  const [onlineMembers, setOnlineMembers] = useState([])
  const [isJoining, setIsJoining] = useState(false)
  const [showResourceForm, setShowResourceForm] = useState(false)
  const [resourceForm, setResourceForm] = useState({ title: '', url: '', type: 'link' })
  const messagesEndRef = useRef(null)
  const user = useSelector(state => state.auth.user) || {}

  useEffect(() => {
    loadGroup()
    
    // Connect to Socket.IO
    const newSocket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    })
    
    setSocket(newSocket)
    
    // Join study group room
    newSocket.emit('join-study-group', id)
    
    // Listen for new messages
    newSocket.on('study-group-message', (message) => {
      setMessages(prev => [...prev, message])
      scrollToBottom()
    })
    
    // Listen for online members
    newSocket.on('study-group-members', (members) => {
      setOnlineMembers(members)
    })
    
    return () => {
      newSocket.emit('leave-study-group', id)
      newSocket.close()
    }
  }, [id])

  const loadGroup = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/study-groups/${id}`)
      console.log('Group loaded:', data)
      console.log('Current user:', user)
      console.log('Group members:', data.members)
      setGroup(data)
      // Load messages (you might want to add this endpoint)
      // const { data: msgs } = await api.get(`/study-groups/${id}/messages`)
      // setMessages(msgs)
    } catch (err) {
      console.error('Failed to load group:', err)
      alert('Failed to load study group')
      navigate('/study-groups')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket) return

    const message = {
      groupId: id,
      userId: user.id,
      userName: user.name,
      text: newMessage.trim(),
      timestamp: new Date()
    }

    socket.emit('study-group-message', message)
    setNewMessage('')
  }

  const leaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return
    
    try {
      await api.post(`/study-groups/${id}/leave`)
      alert('✅ Left group successfully')
      navigate('/study-groups')
    } catch (err) {
      alert('Failed to leave group')
    }
  }

  const addResource = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/study-groups/${id}/resources`, resourceForm)
      setResourceForm({ title: '', url: '', type: 'link' })
      setShowResourceForm(false)
      loadGroup()
      alert('✅ Resource added!')
    } catch (err) {
      console.error('Failed to add resource:', err)
      alert('Failed to add resource')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  if (!group) return null

  // Check membership more reliably
  const isMember = group.members?.some(m => {
    const memberId = typeof m.user === 'object' ? m.user._id : m.user
    const userId = user.id || user._id
    console.log('Checking member:', memberId, 'against user:', userId)
    return memberId?.toString() === userId?.toString()
  }) || false
  
  const isAdmin = group.members?.find(m => {
    const memberId = typeof m.user === 'object' ? m.user._id : m.user
    const userId = user.id || user._id
    return memberId?.toString() === userId?.toString()
  })?.role === 'admin'
  
  console.log('=== MEMBERSHIP CHECK ===')
  console.log('Is Member:', isMember)
  console.log('User ID:', user.id || user._id)
  console.log('Members:', group.members?.map(m => ({
    id: typeof m.user === 'object' ? m.user._id : m.user,
    role: m.role
  })))

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white mb-6 flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
          <p className="text-green-100 mb-2">{group.description}</p>
          <div className="flex items-center space-x-4 text-sm">
            <span>👥 {group.members?.length || 0} members</span>
            <span>🟢 {onlineMembers.length} online</span>
            {group.isPrivate && <span>🔒 Private</span>}
          </div>
        </div>
        <div className="flex space-x-2">
          {isMember && (
            <button
              onClick={leaveGroup}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-all"
            >
              Leave Group
            </button>
          )}
          <button
            onClick={() => navigate('/study-groups')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-all"
          >
            ← Back
          </button>
        </div>
      </div>

      {!isMember ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
          <p className="text-lg mb-4">You are not a member of this group</p>
          <button
            onClick={async () => {
              setIsJoining(true)
              try {
                const { data } = await api.post(`/study-groups/${id}/join`)
                console.log('Join response:', data)
                alert('✅ Joined group successfully!')
                await loadGroup()
              } catch (err) {
                console.error('Join error:', err.response?.data)
                const errorMsg = err.response?.data?.message || 'Failed to join group'
                alert(`❌ ${errorMsg}`)
              } finally {
                setIsJoining(false)
              }
            }}
            disabled={isJoining}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isJoining ? 'Joining...' : 'Join Group'}
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tabs */}
            <div className="flex space-x-2 bg-white dark:bg-slate-800 p-2 rounded-lg shadow">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  activeTab === 'resources'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                📚 Resources
              </button>
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-[600px]">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-900">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <span className="text-4xl mb-2 block">💬</span>
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.userId === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                            msg.userId === user.id
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none shadow'
                          }`}
                        >
                          {msg.userId !== user.id && (
                            <p className="text-xs font-semibold mb-1 text-indigo-600 dark:text-indigo-400">
                              {msg.userName}
                            </p>
                          )}
                          <p className="break-words">{msg.text}</p>
                          <p className={`text-xs mt-1 ${msg.userId === user.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      📚 Shared Resources
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Share helpful links, articles, and study materials
                    </p>
                  </div>
                  <button
                    onClick={() => setShowResourceForm(!showResourceForm)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
                  >
                    {showResourceForm ? 'Cancel' : '+ Add Resource'}
                  </button>
                </div>

                {/* Add Resource Form */}
                {showResourceForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    onSubmit={addResource}
                    className="mb-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 rounded-xl border-2 border-indigo-200 dark:border-indigo-900 space-y-4"
                  >
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                      ➕ Add New Resource
                    </h4>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Resource Title *
                      </label>
                      <input
                        type="text"
                        value={resourceForm.title}
                        onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                        placeholder="e.g., React Documentation"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        URL *
                      </label>
                      <input
                        type="url"
                        value={resourceForm.url}
                        onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Type
                      </label>
                      <select
                        value={resourceForm.type}
                        onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="link">🔗 Link</option>
                        <option value="video">🎥 Video</option>
                        <option value="article">📄 Article</option>
                        <option value="document">📋 Document</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md"
                    >
                      ✅ Add Resource
                    </button>
                  </motion.form>
                )}

                {!group.resources || group.resources.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <div className="text-6xl mb-4">📚</div>
                    <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      No resources shared yet
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                      Start sharing helpful study materials with the group!
                    </p>
                    <button
                      onClick={() => setShowResourceForm(true)}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all"
                    >
                      Share First Resource
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {group.resources.map((resource, idx) => (
                      <motion.a
                        key={idx}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-md">
                                {resource.type === 'video' ? '🎥' : resource.type === 'article' ? '📄' : '🔗'}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {resource.title}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                  {resource.url}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mt-3">
                              <span className="flex items-center space-x-1">
                                <span>👤</span>
                                <span>{resource.uploadedBy?.name || 'Unknown'}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span>📅</span>
                                <span>{new Date(resource.uploadedAt).toLocaleDateString()}</span>
                              </span>
                            </div>
                          </div>
                          
                          <div className="ml-4 flex items-center space-x-2">
                            <div className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm group-hover:bg-indigo-700 transition-all shadow-md">
                              Open →
                            </div>
                          </div>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sidebar - Members */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg sticky top-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                👥 Members ({group.members?.length || 0})
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {group.members?.map((member) => {
                  const memberId = typeof member.user === 'object' ? member.user._id : member.user
                  const memberName = typeof member.user === 'object' ? member.user.name : 'Member'
                  const isOnline = onlineMembers.includes(memberId)
                  
                  return (
                    <div
                      key={memberId}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {memberName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {memberName || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {member.role === 'admin' && '👑 Admin'}
                          {member.role === 'moderator' && '⭐ Moderator'}
                          {member.role === 'member' && isOnline && '🟢 Online'}
                          {member.role === 'member' && !isOnline && '⚪ Offline'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Group Info */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Created:</span>
                    <span className="text-slate-900 dark:text-white font-semibold">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Invite Code:</span>
                    <span className="text-slate-900 dark:text-white font-mono font-semibold">
                      {group.inviteCode}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
