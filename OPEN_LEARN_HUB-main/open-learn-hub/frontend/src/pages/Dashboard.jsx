import { useSelector } from 'react-redux'
import AdminDashboard from '../components/admin/AdminDashboard'
import InstructorDashboard from '../components/instructor/InstructorDashboard'
import ModernStudentDashboard from '../components/student/ModernStudentDashboard'

export default function Dashboard(){
  const { user, role } = useSelector(s=>s.auth)
  
  // Render role-based dashboard
  if (role === 'admin') {
    return <AdminDashboard />
  }
  
  if (role === 'instructor') {
    return <InstructorDashboard />
  }
  
  return <ModernStudentDashboard />
}
