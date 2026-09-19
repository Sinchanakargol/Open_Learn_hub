// Study Group Socket.IO handlers
// Store active users in each group
const groupMembers = new Map() // groupId -> Set of userIds

export function setupStudyGroupSocket(io) {
  io.on('connection', (socket) => {
    // Join a study group room
    socket.on('join-study-group', (groupId) => {
      if (!socket.user?.id) return
      
      socket.join(`group-${groupId}`)
      
      // Track online members
      if (!groupMembers.has(groupId)) {
        groupMembers.set(groupId, new Set())
      }
      groupMembers.get(groupId).add(socket.user.id)
      
      // Broadcast updated member list
      io.to(`group-${groupId}`).emit('study-group-members', Array.from(groupMembers.get(groupId)))
      
      console.log(`User ${socket.user.id} joined group ${groupId}`)
    })
    
    // Leave a study group room
    socket.on('leave-study-group', (groupId) => {
      if (!socket.user?.id) return
      
      socket.leave(`group-${groupId}`)
      
      // Remove from online members
      if (groupMembers.has(groupId)) {
        groupMembers.get(groupId).delete(socket.user.id)
        
        // Broadcast updated member list
        io.to(`group-${groupId}`).emit('study-group-members', Array.from(groupMembers.get(groupId)))
      }
      
      console.log(`User ${socket.user.id} left group ${groupId}`)
    })
    
    // Send message to group
    socket.on('study-group-message', (data) => {
      const { groupId, text, userId, userName } = data
      
      const message = {
        userId,
        userName,
        text,
        timestamp: new Date()
      }
      
      // Broadcast to all members in the group (including sender)
      io.to(`group-${groupId}`).emit('study-group-message', message)
      
      console.log(`Message sent to group ${groupId}:`, text)
    })
    
    // Typing indicator
    socket.on('study-group-typing', (data) => {
      const { groupId, userName } = data
      socket.to(`group-${groupId}`).emit('study-group-typing', { userName })
    })
    
    // Stop typing
    socket.on('study-group-stop-typing', (data) => {
      const { groupId } = data
      socket.to(`group-${groupId}`).emit('study-group-stop-typing')
    })
    
    // Handle disconnection
    socket.on('disconnect', () => {
      if (!socket.user?.id) return
      
      // Remove user from all groups
      for (const [groupId, members] of groupMembers.entries()) {
        if (members.has(socket.user.id)) {
          members.delete(socket.user.id)
          io.to(`group-${groupId}`).emit('study-group-members', Array.from(members))
        }
      }
      
      console.log('User disconnected from study groups:', socket.user?.id)
    })
  })
}
