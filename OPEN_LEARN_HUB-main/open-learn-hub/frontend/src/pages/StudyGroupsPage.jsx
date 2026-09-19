import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function StudyGroupsPage() {
  const [groups, setGroups] = useState([])
  const [myGroups, setMyGroups] = useState([])
  const [activeTab, setActiveTab] = useState('browse')
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    maxMembers: 50,
    isPrivate: false
  })
  const navigate = useNavigate()

  useEffect(() => {
    if (activeTab === 'browse') loadGroups()
    else loadMyGroups()
  }, [activeTab])

  const loadGroups = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/study-groups')
      setGroups(data)
    } catch (err) {
      console.error('Failed to load groups:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMyGroups = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/study-groups/my-groups')
      setMyGroups(data)
    } catch (err) {
      console.error('Failed to load my groups:', err)
    } finally {
      setLoading(false)
    }
  }

  const joinGroup = async (groupId) => {
    try {
      await api.post(`/study-groups/${groupId}/join`)
      alert('✅ Joined group successfully!')
      loadGroups()
    } catch (err) {
      alert('Failed to join group')
    }
  }

  const createGroup = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/study-groups', createForm)
      setCreateForm({ name: '', description: '', maxMembers: 50, isPrivate: false })
      setShowCreateForm(false)
      alert('✅ Group created successfully!')
      loadGroups()
      navigate(`/study-groups/${data._id}`)
    } catch (err) {
      alert('Failed to create group')
    }
  }

  const GroupCard = ({ group, showJoin }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{group.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {group.members?.length || 0} members
          </p>
        </div>
        {group.isPrivate && (
          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded">
            🔒 Private
          </span>
        )}
      </div>
      
      <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
        {group.description}
      </p>
      
      <div className="flex space-x-2">
        <button
          onClick={() => navigate(`/study-groups/${group._id}`)}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all"
        >
          {showJoin ? 'View & Join' : 'Open Group'}
        </button>
      </div>
    </motion.div>
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">👥 Study Groups</h1>
            <p className="text-green-100">Learn together, grow together</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-all shadow-lg"
          >
            {showCreateForm ? 'Cancel' : '+ Create Group'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={createGroup}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg mb-6 space-y-4"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Create New Study Group</h3>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g., JavaScript Study Group"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="What will you study together?"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Max Members
              </label>
              <input
                type="number"
                value={createForm.maxMembers}
                onChange={(e) => setCreateForm({ ...createForm, maxMembers: parseInt(e.target.value) })}
                min="2"
                max="500"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-3 pt-8">
              <input
                type="checkbox"
                id="isPrivate"
                checked={createForm.isPrivate}
                onChange={(e) => setCreateForm({ ...createForm, isPrivate: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="isPrivate" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                🔒 Private Group
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
          >
            Create Study Group
          </button>
        </motion.form>
      )}

      <div className="flex space-x-2 mb-6 bg-white dark:bg-slate-800 p-2 rounded-lg shadow">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'browse' 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          Browse Groups
        </button>
        <button
          onClick={() => setActiveTab('mygroups')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'mygroups' 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          My Groups
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-600 dark:text-slate-400">Loading...</div>
      ) : (activeTab === 'browse' ? groups : myGroups).length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl">
          <span className="text-6xl">👥</span>
          <p className="text-slate-500 dark:text-slate-400 mt-4">
            {activeTab === 'browse' ? 'No public groups available yet.' : 'You haven\'t joined any groups yet.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(activeTab === 'browse' ? groups : myGroups).map(group => (
            <GroupCard key={group._id} group={group} showJoin={activeTab === 'browse'} />
          ))}
        </div>
      )}
    </div>
  )
}
