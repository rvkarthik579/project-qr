import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_SIGNATURES: Record<string, number[][]> = {
  pdf: [[0x25, 0x50, 0x44, 0x46]],
  zip: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]],
  docx: [[0x50, 0x4B, 0x03, 0x04]],
  rar: [[0x52, 0x61, 0x72, 0x21]],
  jpg: [[0xFF, 0xD8, 0xFF]],
  jpeg: [[0xFF, 0xD8, 0xFF]],
  png: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  webp: [[0x52, 0x49, 0x46, 0x46]] // RIFF
}

function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, i) => bytes[i] === byte)
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const declaredExt = (formData.get('extension') as string)?.toLowerCase()

  if (!file || !declaredExt) {
    return NextResponse.json({ valid: false, error: 'Missing file or extension' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const bytes = new Uint8Array(buffer.slice(0, 8))

  const signatures = ALLOWED_SIGNATURES[declaredExt]
  if (!signatures) {
    return NextResponse.json({ valid: true }) // unknown type, skip check
  }

  const matches = signatures.some(sig => matchesSignature(bytes, sig))

  if (!matches) {
    return NextResponse.json({
      valid: false,
      error: `File content does not match its extension (.${declaredExt}). This file may be mislabeled or corrupted.`
    })
  }

  return NextResponse.json({ valid: true })
}
