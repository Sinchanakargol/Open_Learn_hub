import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'

const LANGUAGE_TEMPLATES = {
  python: `# Python Code
print("Hello, World!")

# Example: Calculate sum
def sum_numbers(a, b):
    return a + b

result = sum_numbers(5, 3)
print(f"Sum: {result}")`,
  
  java: `// Java Code
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Example: Calculate sum
        int result = sumNumbers(5, 3);
        System.out.println("Sum: " + result);
    }
    
    public static int sumNumbers(int a, int b) {
        return a + b;
    }
}`,
  
  javascript: `// JavaScript Code
console.log("Hello, World!");

// Example: Calculate sum
function sumNumbers(a, b) {
    return a + b;
}

const result = sumNumbers(5, 3);
console.log(\`Sum: \${result}\`);

// Example: Array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled:", doubled);`
}

const LANGUAGE_INFO = {
  python: { name: 'Python', icon: '🐍', color: 'from-blue-500 to-cyan-500' },
  java: { name: 'Java', icon: '☕', color: 'from-orange-500 to-red-500' },
  javascript: { name: 'JavaScript', icon: '⚡', color: 'from-yellow-500 to-orange-500' }
}

export default function CodeLab() {
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(LANGUAGE_TEMPLATES.python)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    setCode(LANGUAGE_TEMPLATES[newLang])
    setOutput('')
    setError('')
  }

  const handleRunCode = async () => {
    if (!code.trim()) {
      setError('Please write some code first!')
      return
    }

    setRunning(true)
    setOutput('')
    setError('')

    try {
      const { data } = await api.post('/codelab/execute', {
        language,
        code
      })

      if (data.success) {
        setOutput(data.output || 'Code executed successfully with no output.')
      } else {
        setError(data.error || 'Execution failed')
      }
    } catch (err) {
      console.error('Code execution error:', err)
      setError(err.response?.data?.error || 'Failed to execute code. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  const handleClearCode = () => {
    setCode(LANGUAGE_TEMPLATES[language])
    setOutput('')
    setError('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Code Lab
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Write and execute code in Python, Java, or JavaScript
        </p>
      </motion.div>

      {/* Language Selector */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 mb-6"
      >
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Select Language</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(LANGUAGE_INFO).map(([lang, info]) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`p-4 rounded-xl font-medium transition-all ${
                language === lang
                  ? `bg-gradient-to-r ${info.color} text-white shadow-lg scale-105`
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <div className="text-3xl mb-2">{info.icon}</div>
              <div className="font-bold">{info.name}</div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Code Editor and Output */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Code Editor */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{LANGUAGE_INFO[language].icon}</span>
              <h3 className="font-bold text-slate-900 dark:text-white">
                {LANGUAGE_INFO[language].name} Editor
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearCode}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleRunCode}
                disabled={running}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>{running ? '⏳' : '▶️'}</span>
                <span>{running ? 'Running...' : 'Run Code'}</span>
              </button>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-[500px] p-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none resize-none"
            placeholder="Write your code here..."
            spellCheck={false}
          />
        </motion.div>

        {/* Output Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">Output</h3>
            {(output || error) && (
              <button
                onClick={() => {
                  setOutput('')
                  setError('')
                }}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Clear Output
              </button>
            )}
          </div>
          <div className="p-4 h-[500px] overflow-auto">
            {running ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400">Executing code...</p>
                </div>
              </div>
            ) : output ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Execution Successful
                  </span>
                </div>
                <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-sm font-mono text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words">
                  {output}
                </pre>
              </div>
            ) : error ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-red-600 dark:text-red-400 text-xl">✗</span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Execution Failed
                  </span>
                </div>
                <pre className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-sm font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap break-words">
                  {error}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <div className="text-6xl mb-4">💻</div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Write your code and click "Run Code" to see the output here
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">💡 Tips</h3>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li>• Use <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">print()</code> in Python to display output</li>
          <li>• Use <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">System.out.println()</code> in Java</li>
          <li>• Use <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">console.log()</code> in JavaScript</li>
          <li>• Code execution has a timeout limit to ensure system stability</li>
          <li>• JavaScript runs on Node.js with full ES6+ support</li>
        </ul>
      </motion.div>
    </div>
  )
}
