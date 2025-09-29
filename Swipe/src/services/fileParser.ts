// Client-side file parsing fallback when backend is unavailable
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export interface ParsedResume {
  name?: string
  email?: string
  phone?: string
  rawText: string
}

export const parsePDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n'
    }

    return fullText
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('Failed to parse PDF file')
  }
}

export const parseDOCX = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  } catch (error) {
    console.error('DOCX parsing error:', error)
    throw new Error('Failed to parse DOCX file')
  }
}

export const extractFieldsFromText = (text: string): ParsedResume => {
  // Email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  const emailMatch = text.match(emailRegex)
  
  // Phone regex
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
  const phoneMatch = text.match(phoneRegex)
  
  // Name extraction (heuristic - first line that looks like a name)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  let name: string | undefined
  
  for (const line of lines.slice(0, 5)) {
    const words = line.split(' ')
    if (words.length >= 2 && words.length <= 4) {
      // Check if all words start with capital letters
      if (words.every(word => /^[A-Z]/.test(word))) {
        // Skip common resume headers
        const skipWords = ['resume', 'cv', 'curriculum', 'vitae', 'profile', 'summary']
        if (!skipWords.some(skip => line.toLowerCase().includes(skip))) {
          name = line
          break
        }
      }
    }
  }

  return {
    name,
    email: emailMatch ? emailMatch[0] : undefined,
    phone: phoneMatch ? phoneMatch[0] : undefined,
    rawText: text
  }
}

export const parseResumeFile = async (file: File): Promise<ParsedResume> => {
  const fileExtension = file.name.toLowerCase().split('.').pop()
  
  let text: string
  
  if (fileExtension === 'pdf') {
    text = await parsePDF(file)
  } else if (fileExtension === 'docx') {
    text = await parseDOCX(file)
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.')
  }
  
  if (!text || text.trim().length < 50) {
    throw new Error('Could not extract meaningful text from the file.')
  }
  
  return extractFieldsFromText(text)
}
