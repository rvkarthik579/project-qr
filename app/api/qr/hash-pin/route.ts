import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'Invalid PIN format' }, { status: 400 })
    }
    const hash = await bcrypt.hash(pin, 10)
    return NextResponse.json({ hash })
  } catch {
    return NextResponse.json({ error: 'Hashing failed' }, { status: 500 })
  }
}
