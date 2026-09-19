import { useEffect, useRef, useState } from 'react'
import * as monaco from 'monaco-editor'
import { io } from 'socket.io-client'

export default function CodeRoom({ roomId='demo' }){
  const editorRef = useRef(null)
  const [socket] = useState(()=> io(import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000'))

  useEffect(()=>{
    const el = document.createElement('div')
    el.style.height = '400px'
    editorRef.current.appendChild(el)
    const editor = monaco.editor.create(el, { value: '// Start coding', language: 'javascript', theme: 'vs-dark' })
    socket.emit('joinRoom', roomId)
    const sub = editor.onDidChangeModelContent(()=>{
      socket.emit('codeChange', { room: roomId, code: editor.getValue() })
    })
    socket.on('codeChange', (code)=>{ if (code !== editor.getValue()) editor.setValue(code) })
    return ()=>{ sub.dispose(); editor.dispose(); socket.disconnect() }
  }, [])

  return (
    <div className="rounded-xl overflow-hidden border" ref={editorRef}></div>
  )
}
