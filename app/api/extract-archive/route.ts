import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const fileName = file.name.toLowerCase()
    const files: { name: string; path: string; size: number }[] = []

    if (fileName.endsWith('.zip')) {
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(arrayBuffer)
      
      Object.keys(zip.files).forEach(path => {
        const zipFile = zip.files[path]
        if (!zipFile.dir && !path.startsWith('__MACOSX') && !path.includes('.DS_Store')) {
          const parts = path.split('/')
          files.push({
            name: parts[parts.length - 1],
            path: path,
            size: 0
          })
        }
      })
    }

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Extraction error:', error)
    return NextResponse.json({ error: 'Failed to extract archive' }, { status: 500 })
  }
}
