'use client'
import { useEffect, useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Send, LogOut, Bell, BellOff, MoreVertical } from 'lucide-react'
import Pusher from 'pusher-js'

interface Message {
  _id: string
  username: string
  message: string
  timestamp: string
}

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pusherRef = useRef<Pusher | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      // Initialize Pusher
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
      })

      // Subscribe to chat channel
      const chatChannel = pusherRef.current.subscribe('chat')
      chatChannel.bind('new-message', (data: Message) => {
        setMessages(prev => [...prev, data])
      })

      // Subscribe to user-specific notifications
      const userChannel = pusherRef.current.subscribe(`user-${(session.user as any).username}`)
      userChannel.bind('notification', (data: any) => {
        if (notificationsEnabled && 'Notification' in window) {
          new Notification(data.title, {
            body: data.body,
            icon: '/icon-192x192.png'
          })
        }
      })

      // Load existing messages
      fetchMessages()

      return () => {
        if (pusherRef.current) {
          pusherRef.current.unsubscribe('chat')
          pusherRef.current.unsubscribe(`user-${(session.user as any).username}`)
          pusherRef.current.disconnect()
        }
      }
    }
  }, [session, notificationsEnabled])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages')
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setLoading(true)
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      })
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!session) return null

  const currentUser = (session.user as any).username

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {currentUser === 'lisban' ? 'J' : 'L'}
              </span>
            </div>
            <div>
              <h1 className="text-gray-900 font-medium text-lg">
                {currentUser === 'lisban' ? 'Jenisa' : 'Lisban'}
              </h1>
              <p className="text-green-500 text-xs">Online</p>
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <button
                  onClick={() => {
                    requestNotificationPermission()
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  {notificationsEnabled ? (
                    <Bell className="w-4 h-4" />
                  ) : (
                    <BellOff className="w-4 h-4" />
                  )}
                  <span>
                    {notificationsEnabled ? 'Disable' : 'Enable'} Notifications
                  </span>
                </button>
                <button
                  onClick={() => {
                    signOut()
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((message, index) => {
          const isCurrentUser = message.username === currentUser
          const showTime = index === 0 || 
            new Date(message.timestamp).getTime() - new Date(messages[index - 1]?.timestamp || 0).getTime() > 300000

          return (
            <div key={message._id} className="space-y-1">
              {showTime && (
                <div className="flex justify-center">
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              )}
              
              <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  isCurrentUser 
                    ? 'bg-blue-500 text-white rounded-br-md' 
                    : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                }`}>
                  <p className="text-sm leading-5">{message.message}</p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="iMessage"
              className="w-full px-4 py-3 bg-gray-100 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="p-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-all transform hover:scale-105 active:scale-95"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </form>
    </div>
  )
}
