import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create temp directory for code execution
const TEMP_DIR = path.join(__dirname, '..', 'temp')

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.access(TEMP_DIR)
  } catch {
    await fs.mkdir(TEMP_DIR, { recursive: true })
  }
}

// Clean up old temp files
async function cleanupTempFiles(filePath) {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}

export const executeCode = async (req, res) => {
  const { language, code } = req.body

  if (!language || !code) {
    return res.status(400).json({ error: 'Language and code are required' })
  }

  const supportedLanguages = ['python', 'java', 'javascript']
  if (!supportedLanguages.includes(language)) {
    return res.status(400).json({ error: 'Unsupported language' })
  }

  await ensureTempDir()

  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(7)
  let filePath, command, className

  try {
    switch (language) {
      case 'python':
        filePath = path.join(TEMP_DIR, `code_${timestamp}_${randomId}.py`)
        await fs.writeFile(filePath, code)
        command = `python "${filePath}"`
        break

      case 'java':
        // Extract class name from code and create unique class name
        const classMatch = code.match(/public\s+class\s+(\w+)/)
        const originalClassName = classMatch ? classMatch[1] : 'Main'
        className = `Code_${timestamp}_${randomId}`
        
        // Replace the original class name with our unique class name
        const modifiedCode = code.replace(
          new RegExp(`public\\s+class\\s+${originalClassName}`, 'g'),
          `public class ${className}`
        )
        
        filePath = path.join(TEMP_DIR, `${className}.java`)
        await fs.writeFile(filePath, modifiedCode)
        
        // Compile first
        const compileCommand = `javac "${filePath}"`
        await execAsync(compileCommand, { timeout: 10000 })
        
        // Run compiled class
        command = `java -cp "${TEMP_DIR}" ${className}`
        break

      case 'javascript':
        filePath = path.join(TEMP_DIR, `code_${timestamp}_${randomId}.js`)
        await fs.writeFile(filePath, code)
        command = `node "${filePath}"`
        break

      default:
        return res.status(400).json({ error: 'Unsupported language' })
    }

    // Execute the code with timeout
    const { stdout, stderr } = await execAsync(command, {
      timeout: 5000, // 5 second timeout
      maxBuffer: 1024 * 1024 // 1MB buffer
    })

    // Clean up files
    await cleanupTempFiles(filePath)
    if (language === 'java') {
      const classFile = filePath.replace('.java', '.class')
      await cleanupTempFiles(classFile)
    }

    res.json({
      success: true,
      output: stdout || stderr || 'Code executed successfully'
    })

  } catch (error) {
    // Clean up files on error
    if (filePath) {
      await cleanupTempFiles(filePath)
      if (language === 'java') {
        const classFile = filePath.replace('.java', '.class')
        await cleanupTempFiles(classFile)
      }
    }

    console.error('Code execution error:', error)

    let errorMessage = 'Code execution failed'
    if (error.killed) {
      errorMessage = 'Execution timeout: Code took too long to execute'
    } else if (error.stderr) {
      errorMessage = error.stderr
    } else if (error.message) {
      errorMessage = error.message
    }

    res.json({
      success: false,
      error: errorMessage
    })
  }
}
