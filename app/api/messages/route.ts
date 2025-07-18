import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await clientPromise
  const db = client.db('secret-chat')
  const messages = await db.collection('messages')
    .find({})
    .sort({ timestamp: 1 })
    .toArray()

  return NextResponse.json(messages)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message } = await request.json()
  const username = (session.user as any).username

  const messageData = {
    username,
    message,
    timestamp: new Date()
  }

  const client = await clientPromise
  const db = client.db('secret-chat')
  await db.collection('messages').insertOne(messageData)

  // Trigger real-time update
  await pusher.trigger('chat', 'new-message', messageData)

  // Send notification to the other user
  const recipient = username === 'lisban' ? 'jenisa' : 'lisban'
  await pusher.trigger(`user-${recipient}`, 'notification', {
    title: 'Big saving on the new sale',
    body: 'Check out our latest deals!',
    timestamp: new Date()
  })

  return NextResponse.json({ success: true })
}
