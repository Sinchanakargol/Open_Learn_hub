import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import api from '../../services/api'

export default function DiscussionForum() {
  const { user } = useSelector(s => s.auth)
  const [discussions, setDiscussions] = useState([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')

  // Generate consistent color for user avatar based on name
  const getAvatarColor = (name) => {
    if (!name) return 'from-gray-500 to-slate-500'
    const colors = [
      'from-red-500 to-pink-500',
      'from-orange-500 to-yellow-500',
      'from-green-500 to-emerald-500',
      'from-blue-500 to-cyan-500',
      'from-indigo-500 to-purple-500',
      'from-purple-500 to-pink-500',
      'from-pink-500 to-rose-500',
      'from-teal-500 to-green-500'
    ]
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  useEffect(() => {
    fetchDiscussions()
  }, [])

  const fetchDiscussions = async () => {
    try {
      const { data } = await api.get('/discussions')
      setDiscussions(data)
    } catch (error) {
      console.error('Failed to fetch discussions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async (e) => {
    e.preventDefault()
    if (!newPost.trim()) return

    try {
      const { data } = await api.post('/discussions', { content: newPost })
      setDiscussions([data, ...discussions])
      setNewPost('')
    } catch (error) {
      alert('Failed to post discussion')
    }
  }

  const handleReply = async (discussionId) => {
    if (!replyContent.trim()) return

    try {
      const { data } = await api.post(`/discussions/${discussionId}/reply`, { 
        content: replyContent 
      })
      
      // Update the discussion with the new reply
      setDiscussions(discussions.map(d => 
        d._id === discussionId ? data : d
      ))
      
      setReplyContent('')
      setReplyingTo(null)
    } catch (error) {
      alert('Failed to post reply')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Discussion Forum
      </h1>

      <form onSubmit={handlePost} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(user?.name)} flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0`}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white mb-4"
            />
            <button 
              type="submit" 
              disabled={!newPost.trim()}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post Discussion
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {discussions.map((post, idx) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
          >
            {/* Main Post */}
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(post.author?.name)} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                {post.author?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {post.author?.name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-3">{post.content}</p>
                
                {/* Reply Button */}
                <button
                  onClick={() => setReplyingTo(replyingTo === post._id ? null : post._id)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  💬 Reply {post.replies?.length > 0 && `(${post.replies.length})`}
                </button>
              </div>
            </div>

            {/* Replies */}
            {post.replies && post.replies.length > 0 && (
              <div className="mt-4 ml-16 space-y-3">
                {post.replies.map((reply, replyIdx) => (
                  <motion.div
                    key={replyIdx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: replyIdx * 0.05 }}
                    className="flex items-start space-x-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50"
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(reply.author?.name)} flex items-center justify-center text-white font-bold shadow-md`}>
                      {reply.author?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {reply.author?.name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{reply.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Reply Form */}
            {replyingTo === post._id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 ml-16"
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(user?.name)} flex items-center justify-center text-white font-bold shadow-md`}>
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your reply..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm mb-2"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleReply(post._id)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg transition-all"
                      >
                        Post Reply
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyContent('')
                        }}
                        className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
