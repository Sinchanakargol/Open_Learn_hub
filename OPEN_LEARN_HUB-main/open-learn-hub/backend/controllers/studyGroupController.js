// Create study group
export async function createStudyGroup(req, res) {
  const StudyGroup = (await import('../models/StudyGroup.js')).default
  try {
    const { name, description, course, maxMembers, isPrivate } = req.body
    
    const group = await StudyGroup.create({
      name,
      description,
      course,
      creator: req.user.id,
      maxMembers,
      isPrivate,
      members: [{
        user: req.user.id,
        role: 'admin',
        joinedAt: new Date()
      }]
    })
    
    await group.populate('course', 'title')
    await group.populate('members.user', 'name email')
    
    res.status(201).json(group)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get all study groups
export async function getStudyGroups(req, res) {
  const StudyGroup = (await import('../models/StudyGroup.js')).default
  try {
    const { course, search } = req.query
    const query = { isPrivate: false }
    
    if (course) query.course = course
    if (search) query.name = { $regex: search, $options: 'i' }
    
    const groups = await StudyGroup.find(query)
      .populate('course', 'title')
      .populate('creator', 'name')
      .select('-resources -sessions')
      .sort({ createdAt: -1 })
    
    res.json(groups)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get my study groups
export async function getMyStudyGroups(req, res) {
  const StudyGroup = (await import('../models/StudyGroup.js')).default
  try {
    const groups = await StudyGroup.find({
      'members.user': req.user.id
    })
      .populate('course', 'title')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 })
    
    res.json(groups)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get study group by ID
export async function getStudyGroup(req, res) {
  const StudyGroup = (await import('../models/StudyGroup.js')).default
  try {
    const group = await StudyGroup.findById(req.params.id)
      .populate('course', 'title')
      .populate('members.user', 'name email')
      .populate('resources.uploadedBy', 'name')
      .populate('sessions.createdBy', 'name')
    
    if (!group) {
      return res.status(404).json({ message: 'Study group not found' })
    }
    
    // Check if user is member (for private groups)
    if (group.isPrivate) {
      const isMember = group.members.some(m => m.user._id.toString() === req.user.id.toString())
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied' })
      }
    }
    
    res.json(group)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Join study group
export async function joinStudyGroup(req, res) {
  const StudyGroup = (await import('../models/StudyGroup.js')).default
  try {
    const { inviteCode } = req.body
    const group = await StudyGroup.findOne({
      $or: [
        { _id: req.params.id },
        { inviteCode }
      ]
    })
    
    if (!group) {
      return res.status(404).json({ message: 'Study group not found' })
    }
    
    // Check if already member
    const isMember = group.members.some(m => m.user.toString() === req.user.id.toString())
    if (isMember) {
      return res.status(400).json({ message: 'Already a member' })
    }
    
    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: 'Group is full' })
    }
    
    group.members.push({
      user: req.user.id,
      role: 'member',
      joinedAt: new Date()
    })
    
    await group.save()
    await group.populate('members.user', 'name email')
    
    res.json(group)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Leave study group
export async function leaveStudyGroup(req, res) {
  const StudyGroup = (await import('../models/StudyGroup.js')).default
  try {
    const group = await StudyGroup.findById(req.params.id)
    
    if (!group) {
      return res.status(404).json({ message: 'Study group not found' })
    }
    
    // Check if creator
    if (group.creator.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: 'Creator cannot leave. Transfer ownership or delete group.' })
    }
    
    group.members = group.members.filter(m => m.user.toString() !== req.user.id.toString())
    await group.save()
    
    res.json({ message: 'Left study group successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Add resource to group
export async function addResource(req, res) {
  const StudyGroup = (await import('../models/StudyGroup.js')).default
  try {
    const group = await StudyGroup.findById(req.params.id)
    
    if (!group) {
      return res.status(404).json({ message: 'Study group not found' })
    }
    
    // Check if member
    const isMember = group.members.some(m => m.user.toString() === req.user.id.toString())
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' })
    }
    
    group.resources.push({
      ...req.body,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    })
    
    await group.save()
    await group.populate('resources.uploadedBy', 'name')
    
    res.json(group)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Schedule session
export async function scheduleSession(req, res) {
  const StudyGroup = (await import('../models/StudyGroup.js')).default
  try {
    const group = await StudyGroup.findById(req.params.id)
    
    if (!group) {
      return res.status(404).json({ message: 'Study group not found' })
    }
    
    // Check if admin/moderator
    const member = group.members.find(m => m.user.toString() === req.user.id.toString())
    if (!member || (member.role !== 'admin' && member.role !== 'moderator')) {
      return res.status(403).json({ message: 'Only admins/moderators can schedule sessions' })
    }
    
    group.sessions.push({
      ...req.body,
      createdBy: req.user.id
    })
    
    group.stats.totalSessions++
    
    await group.save()
    await group.populate('sessions.createdBy', 'name')
    
    res.json(group)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Update member role
export async function updateMemberRole(req, res) {
  const StudyGroup = (await import('../models/StudyGroup.js')).default
  try {
    const { userId, role } = req.body
    const group = await StudyGroup.findById(req.params.id)
    
    if (!group) {
      return res.status(404).json({ message: 'Study group not found' })
    }
    
    // Check if requester is admin
    const requester = group.members.find(m => m.user.toString() === req.user.id.toString())
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update roles' })
    }
    
    const member = group.members.find(m => m.user.toString() === userId)
    if (!member) {
      return res.status(404).json({ message: 'Member not found' })
    }
    
    member.role = role
    await group.save()
    
    res.json(group)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Delete study group
export async function deleteStudyGroup(req, res) {
  const StudyGroup = (await import('../models/StudyGroup.js')).default
  try {
    const group = await StudyGroup.findById(req.params.id)
    
    if (!group) {
      return res.status(404).json({ message: 'Study group not found' })
    }
    
    // Check if creator
    if (group.creator.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Only creator can delete group' })
    }
    
    await group.deleteOne()
    
    res.json({ message: 'Study group deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
