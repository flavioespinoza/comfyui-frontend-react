// API route handlers

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    name: 'ComfyUI Frontend API',
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle different API actions
    const { action, data } = body

    switch (action) {
      case 'ping':
        return NextResponse.json({ status: 'pong' })

      case 'save-workflow':
        // Handle workflow save (could integrate with local storage or database)
        return NextResponse.json({ success: true, message: 'Workflow saved' })

      case 'load-workflow':
        // Handle workflow load
        return NextResponse.json({ success: true, workflow: data })

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
