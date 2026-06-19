import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { pin, passwordHash } = await request.json()
  
  if (!pin || !passwordHash) {
    return NextResponse.json({ valid: false })
  }

  const valid = await bcrypt.compare(pin, passwordHash)
  return NextResponse.json({ valid })
}
