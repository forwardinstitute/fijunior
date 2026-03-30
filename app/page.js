'use client'

import React, { useState, useEffect, useRef } from 'react'
import supabase from '../lib/supabase'

export default function App() {
  const [screen, setScreen] = useState('signin')
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [coinAnimation, setCoinAnimation] = useState(false)
  const coinTimeoutRef = useRef(null)

  // SIGN-IN LOGIC
  const handleSignIn = async (name) => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('players')
        .select('*')
        .ilike('name', name)
        .single()

      if (err || !data) {
        setError('Ask Kieran to set you up!')
        setLoading(false)
        return
      }

      setPlayer(data)
      setScreen('hub')
    } catch (e) {
      setError('Connection issue. Try again.')
      console.error(e)
    }
    setLoading(false)
  }

  const handleSignOut = () => {
    setPlayer(null)
    setScreen('signin')
    setError('')
  }

  const updatePlayerCoins = async (coinsEarned, updatedDesks = null) => {
    if (!player) return

    const newBalance = player.coins + coinsEarned
    const newTotal = player.total_coins_earned + coinsEarned

    const updateData = {
      coins: newBalance,
      total_coins_earned: newTotal,
    }

    if (updatedDesks) {
      updateData.desk_items = updatedDesks
    }

    try {
      const { data } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', player.id)
        .select()
        .single()

      if (data) {
        setPlayer(data)
        triggerCoinAnimation()
      }
    } catch (e) {
      console.error('Failed to update coins:', e)
    }
  }

  const triggerCoinAnimation = () => {
    setCoinAnimation(true)
    if (coinTimeoutRef.current) clearTimeout(coinTimeoutRef.current)
    coinTimeoutRef.current = setTimeout(() => setCoinAnimation(false), 600)
  }

  if (!player) {
    return <SignInScreen onSignIn={handleSignIn} loading={loading} error={error} />
  }

  return (
    <div className="min-h-screen bg-[#fcf2e3]">
      <TopBar player={player} coinAnimation={coinAnimation} onSignOut={handleSignOut} />

      {screen === 'hub' && (
        <HubScreen player={player} onNavigate={setScreen} />
      )}
      {screen === 'desk' && (
        <DeskScreen player={player} onNavigate={setScreen} onUpdateCoins={updatePlayerCoins} />
      )}
      {screen === 'classifier' && (
        <ClassifierScreen player={player} onNavigate={setScreen} onUpdateCoins={updatePlayerCoins} />
      )}
      {screen === 'logohunt' && (
        <LogoHuntScreen player={player} onNavigate={setScreen} onUpdateCoins={updatePlayerCoins} />
      )}
      {screen === 'arcade' && (
        <ArcadeScreen player={player} onNavigate={setScreen} onUpdateCoins={updatePlayerCoins} />
      )}
      {screen === 'breakroom' && (
        <BreakRoomScreen player={player} onNavigate={setScreen} onUpdateCoins={updatePlayerCoins} />
      )}
      {screen === 'boardroom' && (
        <BoardroomScreen player={player} onNavigate={setScreen} />
      )}
      {screen === 'shop' && (
        <ShopScreen player={player} onNavigate={setScreen} onUpdateCoins={updatePlayerCoins} />
      )}
    </div>
  )
}

// SIGN-IN SCREEN
function SignInScreen({ onSignIn, loading, error }) {
  const [name, setName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      onSignIn(name.trim())
      setName('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fcf2e3] to-[#e8f0e8] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <img src="https://a.storyblok.com/f/286772795909088/1172x1172/8547317449/fi-icon.png" alt="Forward Institute" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900">Forward Institute</h1>
          <p className="text-gray-600 mt-2">Work Experience Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#195e47]"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-[#195e47] text-white py-3 rounded-lg font-semibold hover:bg-[#124a38] disabled:opacity-50 transition"
          >
            {loading ? 'Signing in...' : 'Enter Forward Institute'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// TOP BAR
function TopBar({ player, coinAnimation, onSignOut }) {
  const level = calculateLevel(player.total_coins_earned)

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="https://a.storyblok.com/f/286772795909088/1172x1172/8547317449/fi-icon.png" alt="Forward Institute" className="h-10 w-10" />
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#195e47] to-[#124a38] flex items-center justify-center text-white font-bold text-lg shrink-0">
            {player.avatar_url ? (
              <img src={player.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              player.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{player.name}</h2>
            <p className="text-sm text-gray-600">{level}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 ${coinAnimation ? 'animate-coin-bounce' : ''}`}>
            <span className="text-2xl">💰</span>
            <span className="font-bold text-gray-900 text-lg">{player.coins}</span>
          </div>
          <button
            onClick={onSignOut}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

// HUB SCREEN
function HubScreen({ player, onNavigate }) {
  const rooms = [
    { id: 'desk', title: 'Your Desk', emoji: '🏢', color: 'from-[#195e47] to-[#124a38]' },
    {
      id: 'classifier',
      title: 'Contact Classifier',
      emoji: '👥',
      color: 'from-[#dd6945] to-[#c45a3a]',
      locked: player.age < 12,
    },
    { id: 'logohunt', title: 'Logo Hunt', emoji: '🔍', color: 'from-[#85d1e3] to-[#5bb8cc]' },
    { id: 'arcade', title: 'The Arcade', emoji: '🎮', color: 'from-[#ffcc12] to-[#e6b800]' },
    { id: 'breakroom', title: 'The Break Room', emoji: '☕', color: 'from-[#dd6945] to-[#c45a3a]' },
    { id: 'boardroom', title: 'The Boardroom', emoji: '📊', color: 'from-[#195e47] to-[#124a38]' },
    { id: 'shop', title: 'The Shop', emoji: '🛍️', color: 'from-[#85d1e3] to-[#5bb8cc]' },
  ]

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome to Forward Institute, {player.name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => !room.locked && onNavigate(room.id)}
            disabled={room.locked}
            className={`p-6 rounded-xl text-white font-bold text-xl transition transform hover:scale-105 ${
              room.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'
            } bg-gradient-to-br ${room.color}`}
          >
            <div className="text-5xl mb-3">{room.emoji}</div>
            <div>{room.title}</div>
            {room.locked && <div className="text-sm mt-2">🔒 Age 12+</div>}
          </button>
        ))}
      </div>
    </div>
  )
}

// YOUR DESK SCREEN
function DeskScreen({ player, onNavigate, onUpdateCoins }) {
  const [avatarPreview, setAvatarPreview] = useState(player.avatar_url || '')
  const [cropMode, setCropMode] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const imageRef = useRef(null)

  const level = calculateLevel(player.total_coins_earned)

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatarPreview(event.target.result)
      setCropMode(true)
    }
    reader.readAsDataURL(file)
  }

  const handleImageSearch = () => {
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(player.name + ' logo')}`, '_blank')
  }

  const saveCroppedImage = () => {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current) return

    const ctx = canvas.getContext('2d')
    const img = imageRef.current

    canvas.width = 200
    canvas.height = 200

    const sourceSize = Math.min(img.naturalWidth, img.naturalHeight)
    const sourceX = (img.naturalWidth - sourceSize) / 2
    const sourceY = (img.naturalHeight - sourceSize) / 2

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 200, 200)

    const dataUrl = canvas.toDataURL('image/png')

    updatePlayerAvatar(dataUrl)
    setCropMode(false)
  }

  const updatePlayerAvatar = async (dataUrl) => {
    try {
      await supabase
        .from('players')
        .update({ avatar_url: dataUrl })
        .eq('id', player.id)

      setAvatarPreview(dataUrl)
      if (!player.achievements?.includes('Picture Perfect')) {
        onUpdateCoins(50)
      }
    } catch (e) {
      console.error('Failed to save avatar:', e)
    }
  }

  const SHOP_ITEMS = {
    '🌱': 'Plant', '☕': 'Coffee Mug', '⭐': 'Laptop Sticker', '💡': 'Desk Lamp',
    '🏆': 'Trophy', '📛': 'Name Plate', '🎧': 'Headphones', '🦆': 'Rubber Duck',
  }
  const ownedItems = (player.desk_items || []).map((emoji) => ({ emoji, name: SHOP_ITEMS[emoji] || 'Item' }))

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Desk</h1>

        {/* Avatar Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-1">
            <h3 className="font-bold text-gray-900 mb-4">Profile Photo</h3>

            <div className="relative">
              {cropMode ? (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      ref={imageRef}
                      src={avatarPreview}
                      alt="Crop"
                      className="w-full h-full object-cover"
                      style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center',
                      }}
                      onLoad={() => {
                        if (imageRef.current) {
                          const ratio = imageRef.current.offsetWidth / imageRef.current.naturalWidth
                          setZoom(1 / ratio)
                        }
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full mt-4"
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={saveCroppedImage}
                      className="flex-1 bg-[#195e47] text-white py-2 rounded-lg hover:bg-[#124a38] transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setCropMode(false)
                        setAvatarPreview('')
                      }}
                      className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-[#fcf2e3]0 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-[#195e47] to-[#124a38] flex items-center justify-center text-white font-bold text-5xl overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      player.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleImageSearch}
                      className="flex-1 px-4 py-2 bg-[#e8f5ef] text-[#124a38] rounded-lg hover:bg-[#dceae4] transition text-sm"
                    >
                      🔍 Search
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 px-4 py-2 bg-[#195e47] text-white rounded-lg hover:bg-[#124a38] transition text-sm"
                    >
                      📤 Upload
                    </button>
                  </div>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Stats Section */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#fcf2e3] p-4 rounded-lg">
                <p className="text-sm text-gray-600">Level</p>
                <p className="text-2xl font-bold text-[#195e47]">{level}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Coins</p>
                <p className="text-2xl font-bold text-yellow-600">{player.total_coins_earned}</p>
              </div>
              <div className="bg-[#fcf2e3] p-4 rounded-lg">
                <p className="text-sm text-gray-600">Coins Available</p>
                <p className="text-2xl font-bold text-[#195e47]">{player.coins}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Tasks Completed</p>
                <p className="text-2xl font-bold text-purple-600">{player.tasks_completed || 0}</p>
              </div>
            </div>

            {ownedItems.length > 0 && (
              <div className="bg-day p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">Your Desk Items</p>
                <div className="grid grid-cols-4 gap-2">
                  {ownedItems.map((item, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 text-center shadow-sm">
                      <div className="text-2xl mb-1">{item.emoji}</div>
                      <p className="text-xs text-gray-600">{item.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        <div>
          <h3 className="font-bold text-gray-900 mb-4">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: '📸', title: 'Picture Perfect', unlocked: player.achievements?.includes('Picture Perfect') },
              { emoji: '🏆', title: 'First Classifier', unlocked: player.achievements?.includes('First Classifier') },
              { emoji: '🔥', title: 'On Fire', unlocked: player.achievements?.includes('On Fire') },
              { emoji: '💎', title: 'Whale', unlocked: player.achievements?.includes('Whale') },
            ].map((achievement, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg text-center transition ${
                  achievement.unlocked
                    ? 'bg-yellow-100 border-2 border-yellow-400'
                    : 'bg-gray-100 opacity-50'
                }`}
              >
                <div className="text-3xl mb-2">{achievement.emoji}</div>
                <p className="text-sm font-semibold text-gray-900">{achievement.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// CONTACT CLASSIFIER SCREEN
function ClassifierScreen({ player, onNavigate, onUpdateCoins }) {
  const [contacts, setContacts] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [suggestion, setSuggestion] = useState(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [selectedRel, setSelectedRel] = useState('')
  const [stats, setStats] = useState({ completed: 0, streak: 0, coinsThisSession: 0 })

  const CONTACT_TYPES = [
    'Organisation',
    'Human Resources',
    'Speaker',
    'Supplier',
    'FI Friend',
    'FI Staff Member',
    'FI Facilitator',
    'FI Faculty',
    'FI Board Member',
    'Fellow',
    'Exchange Participant',
  ]

  const RELATIONSHIPS = [
    'Personal Assistant',
    'Line Manager',
    'Senior Leader',
    'Stakeholder',
    'Senior HR',
    'Key HR',
    'Chief Executive Officer',
    'Head of Talent',
    'Head of People',
    'Head of Leadership',
    'Board Member',
    'Founder',
    'HR Contact',
    'Dinner Host',
    'Cross-Programme',
    'Discovery Session',
    'Events Supplier',
    'Other',
  ]

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('status', 'pending')
        .limit(20)

      setContacts(data || [])
      setCurrentIndex(0)
    } catch (e) {
      console.error('Failed to load contacts:', e)
    }
  }

  const currentContact = contacts[currentIndex]

  // Auto-fetch AI suggestion when contact changes
  useEffect(() => {
    if (currentContact) {
      getSuggestion(currentContact)
    }
  }, [currentIndex, contacts])

  const getSuggestion = async (contact) => {
    if (!contact) return

    setLoadingSuggestion(true)
    setSuggestion(null)
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: contact.title,
          orgName: contact.org_name,
          sector: contact.org_sector,
          industry: contact.org_industry,
          companySize: contact.company_size,
        }),
      })

      const data = await res.json()
      setSuggestion(data)
      setSelectedType(data.contactType || 'Organisation')
      setSelectedRel(data.relationship || 'Other')
    } catch (e) {
      console.error('Failed to get suggestion:', e)
      setSuggestion({ contactType: 'Organisation', relationship: 'Other', reasoning: 'Could not get AI suggestion - please classify manually.' })
      setSelectedType('Organisation')
      setSelectedRel('Other')
    }
    setLoadingSuggestion(false)
  }

  const submitClassification = async () => {
    if (!selectedType || !selectedRel || !currentContact) return

    try {
      await supabase
        .from('contacts')
        .update({
          contact_type: selectedType,
          relationship: selectedRel,
          status: 'completed',
          completed_by: player.name,
        })
        .eq('id', currentContact.id)

      const newStats = {
        completed: stats.completed + 1,
        streak: stats.streak + 1,
        coinsThisSession: stats.coinsThisSession + 25,
      }

      const streakBonus = newStats.streak % 5 === 0 ? 25 : 0
      const totalCoins = 25 + streakBonus

      setStats(newStats)
      onUpdateCoins(totalCoins)

      if (currentIndex < contacts.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setSuggestion(null)
        setSelectedType('')
        setSelectedRel('')
      } else {
        loadContacts()
      }
    } catch (e) {
      console.error('Failed to submit classification:', e)
    }
  }

  const skipContact = () => {
    if (currentIndex < contacts.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSuggestion(null)
      setSelectedType('')
      setSelectedRel('')
    } else {
      loadContacts()
    }
  }

  if (!currentContact && contacts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => onNavigate('hub')}
          className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back to Hub
        </button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-lg text-gray-600">No pending contacts to classify.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#e8f5ef] p-4 rounded-lg">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-[#195e47]">{stats.completed}</p>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Streak</p>
          <p className="text-2xl font-bold text-orange-600">{stats.streak}</p>
        </div>
        <div className="bg-[#e8f5ef] p-4 rounded-lg">
          <p className="text-sm text-gray-600">Session Coins</p>
          <p className="text-2xl font-bold text-[#195e47]">{stats.coinsThisSession}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Bonus at 5</p>
          <p className="text-2xl font-bold text-purple-600">+25</p>
        </div>
      </div>

      {currentContact && (
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div className="bg-[#fcf2e3] p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact #{currentIndex + 1}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Job Title</p>
                <p className="text-lg font-semibold text-gray-900">{currentContact.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Organisation</p>
                <p className="text-lg font-semibold text-gray-900">{currentContact.org_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sector</p>
                <p className="text-lg font-semibold text-gray-900">{currentContact.org_sector || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Industry</p>
                <p className="text-lg font-semibold text-gray-900">{currentContact.org_industry || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {loadingSuggestion && (
            <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-lg text-center">
              <p className="text-gray-700 font-medium">Asking AI for a suggestion...</p>
              <div className="mt-2 animate-pulse text-2xl">🤔</div>
            </div>
          )}

          {suggestion && !loadingSuggestion && (
            <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">AI thinks...</h3>
              <p className="text-gray-700 mb-4">{suggestion.reasoning}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded">
                  <p className="text-gray-600">Type</p>
                  <p className="font-semibold">{suggestion.contactType}</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-gray-600">Relationship</p>
                  <p className="font-semibold">{suggestion.relationship}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">You can change the dropdowns below if you disagree!</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#195e47]"
              >
                <option value="">Select...</option>
                {CONTACT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship</label>
              <select
                value={selectedRel}
                onChange={(e) => setSelectedRel(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#195e47]"
              >
                <option value="">Select...</option>
                {RELATIONSHIPS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={submitClassification}
              disabled={!selectedType || !selectedRel}
              className="flex-1 bg-[#195e47] text-white py-3 rounded-lg font-bold hover:bg-[#124a38] disabled:opacity-50 transition"
            >
              ✓ Submit
            </button>
            <button
              onClick={skipContact}
              className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold hover:bg-[#fcf2e3]0 transition"
            >
              → Skip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// LOGO HUNT SCREEN
function LogoHuntScreen({ player, onNavigate, onUpdateCoins }) {
  const [organisations, setOrganisations] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [logoPreview, setLogoPreview] = useState('')
  const [cropMode, setCropMode] = useState(false)
  const [zoom, setZoom] = useState(1)
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const imageRef = useRef(null)

  useEffect(() => {
    loadOrganisations()
  }, [])

  const loadOrganisations = async () => {
    try {
      const { data } = await supabase
        .from('organisations')
        .select('*')
        .is('logo_url', null)
        .limit(50)

      setOrganisations(data || [])
      setCurrentIndex(0)
    } catch (e) {
      console.error('Failed to load organisations:', e)
    }
  }

  const currentOrg = organisations[currentIndex]

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setLogoPreview(event.target.result)
      setCropMode(true)
    }
    reader.readAsDataURL(file)
  }

  const handleImageSearch = () => {
    window.open(
      `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(currentOrg.name + ' logo')}`,
      '_blank'
    )
  }

  const saveCroppedLogo = () => {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current) return

    const ctx = canvas.getContext('2d')
    const img = imageRef.current

    canvas.width = 200
    canvas.height = 200

    const sourceSize = Math.min(img.naturalWidth, img.naturalHeight)
    const sourceX = (img.naturalWidth - sourceSize) / 2
    const sourceY = (img.naturalHeight - sourceSize) / 2

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 200, 200)

    const dataUrl = canvas.toDataURL('image/png')

    uploadLogo(dataUrl)
    setCropMode(false)
  }

  const skipOrg = async () => {
    try {
      await supabase
        .from('organisations')
        .update({ logo_url: 'skipped' })
        .eq('id', currentOrg.id)

      setLogoPreview('')
      setCropMode(false)

      if (currentIndex < organisations.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        loadOrganisations()
      }
    } catch (e) {
      console.error('Failed to skip org:', e)
    }
  }

  const uploadLogo = async (dataUrl) => {
    if (!currentOrg) return

    try {
      await supabase
        .from('organisations')
        .update({ logo_url: dataUrl })
        .eq('id', currentOrg.id)

      setLogoPreview('')
      onUpdateCoins(15)

      if (currentIndex < organisations.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        loadOrganisations()
      }
    } catch (e) {
      console.error('Failed to upload logo:', e)
    }
  }

  if (!currentOrg) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => onNavigate('hub')}
          className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back to Hub
        </button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-lg text-gray-600">All logos found! Great work!</p>
        </div>
      </div>
    )
  }

  const progress = organisations.length > 0 ? Math.round(((currentIndex + 1) / organisations.length) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-gray-900">Logo Hunt Progress</h2>
          <span className="text-lg font-bold text-orange-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-orange-500 h-4 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Find This Logo</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Org Details</h3>
            <div className="space-y-4">
              <div className="bg-[#fcf2e3] p-4 rounded-lg">
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-semibold text-gray-900">{currentOrg.name}</p>
              </div>
              <div className="bg-[#fcf2e3] p-4 rounded-lg">
                <p className="text-sm text-gray-600">Sector</p>
                <p className="text-lg font-semibold text-gray-900">{currentOrg.sector}</p>
              </div>
              <div className="bg-[#fcf2e3] p-4 rounded-lg">
                <p className="text-sm text-gray-600">Industry</p>
                <p className="text-lg font-semibold text-gray-900">{currentOrg.industry}</p>
              </div>
              {currentOrg.website && (
                <div className="bg-[#fcf2e3] p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Website</p>
                  <p className="text-lg font-semibold text-[#195e47] truncate">{currentOrg.website}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            {cropMode ? (
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    ref={imageRef}
                    src={logoPreview}
                    alt="Logo Crop"
                    className="w-full h-full object-cover"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center',
                    }}
                    onLoad={() => {
                      if (imageRef.current) {
                        const ratio = imageRef.current.offsetWidth / imageRef.current.naturalWidth
                        setZoom(1 / ratio)
                      }
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full mt-4"
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={saveCroppedLogo}
                    className="flex-1 bg-[#195e47] text-white py-2 rounded-lg hover:bg-[#124a38] transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setCropMode(false)
                      setLogoPreview('')
                    }}
                    className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-[#fcf2e3]0 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                  <span className="text-4xl">🔍</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleImageSearch}
                    className="flex-1 px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition font-semibold"
                  >
                    🔍 Search
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
                  >
                    📤 Upload
                  </button>
                </div>
                <button
                  onClick={skipOrg}
                  className="w-full mt-3 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
                >
                  Skip this one (defunct / can't find)
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

// ARCADE SCREEN
function ArcadeScreen({ player, onNavigate, onUpdateCoins }) {
  const [game, setGame] = useState(null)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      {!game ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setGame('speedtyper')}
            className="bg-gradient-to-br from-pink-400 to-pink-600 text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            <div className="text-5xl mb-4">⌨️</div>
            <h3 className="text-2xl font-bold mb-2">Speed Typer</h3>
            <p className="text-pink-100">Type sentences as fast as you can!</p>
          </button>
          <button
            onClick={() => setGame('memory')}
            className="bg-gradient-to-br from-[#195e47] to-[#124a38] text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-2xl font-bold mb-2">Memory Match</h3>
            <p className="text-[#e8f5ef]">Match pairs of office emojis!</p>
          </button>
          <button
            onClick={() => setGame('scramble')}
            className="bg-gradient-to-br from-[#195e47] to-[#124a38] text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            <div className="text-5xl mb-4">🔤</div>
            <h3 className="text-2xl font-bold mb-2">Word Scramble</h3>
            <p className="text-[#195e47]">Unscramble business words!</p>
          </button>
        </div>
      ) : game === 'speedtyper' ? (
        <SpeedTyperGame onBack={() => setGame(null)} onUpdateCoins={onUpdateCoins} />
      ) : game === 'memory' ? (
        <MemoryGame onBack={() => setGame(null)} onUpdateCoins={onUpdateCoins} />
      ) : game === 'scramble' ? (
        <WordScrambleGame onBack={() => setGame(null)} onUpdateCoins={onUpdateCoins} />
      ) : null}
    </div>
  )
}

// Speed Typer Game
function SpeedTyperGame({ onBack, onUpdateCoins }) {
  const FALLBACK_SENTENCES = [
    ['Hello and welcome to our team.', 'We work together every day.', 'The office is a busy place.'],
    ['Good leaders listen to their teams.', 'Working together helps everyone succeed.', 'The best ideas come from teamwork.'],
    ['Leadership means helping other people grow and develop.', 'The Forward Institute brings leaders from different sectors together.'],
    ['Responsible leadership requires understanding different perspectives and making thoughtful decisions.', 'The most effective organisations build cultures of trust and collaboration.'],
    ['Building a more responsible future requires leaders who can navigate complexity with both courage and compassion.'],
  ]

  const [sentence, setSentence] = useState('')
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(60)
  const [gameOver, setGameOver] = useState(false)
  const [round, setRound] = useState(0)
  const [difficulty, setDifficulty] = useState(1)
  const [totalWords, setTotalWords] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [roundStart, setRoundStart] = useState(null)
  const [completedRounds, setCompletedRounds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [perfectRound, setPerfectRound] = useState(false)
  const inputRef = useRef(null)

  const fetchSentence = async (diff) => {
    setLoading(true)
    try {
      const res = await fetch('/api/typing-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: diff }),
      })
      const data = await res.json()
      if (data.sentence) {
        setSentence(data.sentence)
      } else {
        throw new Error('No sentence')
      }
    } catch {
      const level = Math.min(5, Math.max(1, diff)) - 1
      const fallbacks = FALLBACK_SENTENCES[level] || FALLBACK_SENTENCES[0]
      setSentence(fallbacks[Math.floor(Math.random() * fallbacks.length)])
    }
    setLoading(false)
    setRoundStart(Date.now())
    setInput('')
    setPerfectRound(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  useEffect(() => {
    fetchSentence(1)
  }, [])

  useEffect(() => {
    if (gameOver || loading) return
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameOver(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameOver, loading])

  const completeRound = () => {
    const elapsed = (Date.now() - roundStart) / 1000
    const words = sentence.trim().split(/\s+/).length
    setTotalWords((w) => w + words)
    setTotalTime((t) => t + elapsed)
    setCompletedRounds((r) => r + 1)

    // Check if it was perfect (no mistakes at time of completion)
    const wasPerfect = input.trim() === sentence.trim()
    if (wasPerfect) {
      setPerfectRound(true)
      setStreak((s) => s + 1)
    } else {
      setStreak(0)
    }

    // Adaptive difficulty
    const wpmThisRound = words / (elapsed / 60)
    let newDiff = difficulty
    if (wasPerfect && wpmThisRound > 30) {
      newDiff = Math.min(5, difficulty + 1)
    } else if (!wasPerfect || wpmThisRound < 15) {
      newDiff = Math.max(1, difficulty - 1)
    }
    setDifficulty(newDiff)
    setRound((r) => r + 1)

    // Brief celebration then next sentence
    setTimeout(() => {
      fetchSentence(newDiff)
    }, 800)
  }

  const handleInput = (e) => {
    const val = e.target.value
    setInput(val)
    // Auto-complete when they've typed the full sentence
    if (val.trim() === sentence.trim()) {
      completeRound()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim().length > 0) {
      completeRound()
    }
  }

  // Calculate final stats
  const finalWPM = totalTime > 0 ? Math.round(totalWords / (totalTime / 60)) : 0
  const totalCoins = Math.min(30, Math.max(5, completedRounds * 3 + Math.round(finalWPM / 10)))

  // Render character-by-character comparison
  const renderSentence = () => {
    if (!sentence) return null
    return (
      <p className="text-2xl text-center font-mono leading-relaxed">
        {sentence.split('').map((char, i) => {
          let colour = 'text-gray-400'
          if (i < input.length) {
            colour = input[i] === char ? 'text-forest font-bold' : 'text-earth font-bold underline'
          }
          return (
            <span key={i} className={colour}>
              {char}
            </span>
          )
        })}
      </p>
    )
  }

  if (gameOver) {
    if (completedRounds === 0) {
      onUpdateCoins(2) // Participation coins
    } else {
      onUpdateCoins(totalCoins)
    }

    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition"
        >
          ← Back
        </button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">⌨️</div>
          <h2 className="text-3xl font-bold text-night mb-4">Time's Up!</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-day rounded-lg p-4">
              <p className="text-3xl font-bold text-forest">{finalWPM}</p>
              <p className="text-sm text-gray-600">Words per minute</p>
            </div>
            <div className="bg-day rounded-lg p-4">
              <p className="text-3xl font-bold text-forest">{completedRounds}</p>
              <p className="text-sm text-gray-600">Sentences completed</p>
            </div>
            <div className="bg-day rounded-lg p-4">
              <p className="text-3xl font-bold text-sunshine">{totalCoins}</p>
              <p className="text-sm text-gray-600">Coins earned</p>
            </div>
            <div className="bg-day rounded-lg p-4">
              <p className="text-3xl font-bold text-sky">Level {difficulty}</p>
              <p className="text-sm text-gray-600">Difficulty reached</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="bg-forest text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition"
          >
            Back to Arcade
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition"
      >
        ← Back
      </button>
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-night">Speed Typer</h1>
          <div className="flex gap-4 text-sm">
            <span className="bg-day px-3 py-1 rounded-full">Round {round + 1}</span>
            <span className="bg-day px-3 py-1 rounded-full">Level {difficulty}/5</span>
            <span className={`px-3 py-1 rounded-full font-bold ${timeLeft <= 10 ? 'bg-earth text-white' : 'bg-forest text-white'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {streak > 1 && (
          <div className="bg-sunshine/20 border border-sunshine rounded-lg px-4 py-2 mb-4 text-center text-sm font-bold text-night">
            {streak} perfect streak! 🔥
          </div>
        )}

        {loading ? (
          <div className="bg-day p-8 rounded-lg mb-6 min-h-24 flex items-center justify-center">
            <p className="text-gray-500">AI is thinking up a sentence... 🤔</p>
          </div>
        ) : (
          <>
            {perfectRound && (
              <div className="bg-green-50 border border-green-300 rounded-lg px-4 py-3 mb-4 text-center text-green-700 font-bold animate-pulse">
                Perfect! ✨ Next sentence coming...
              </div>
            )}
            <div className="bg-day p-6 rounded-lg mb-6 min-h-24 flex items-center justify-center">
              {renderSentence()}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              autoFocus
              disabled={perfectRound}
              className="w-full p-4 border-2 border-forest/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest text-lg mb-3"
              placeholder="Start typing... (press Enter when done)"
            />

            <p className="text-xs text-gray-400 text-center">
              Type the sentence above. It auto-submits when perfect, or press Enter to submit early.
              {completedRounds > 0 && ` Sentences done: ${completedRounds}`}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// Memory Match Game
function MemoryGame({ onBack, onUpdateCoins }) {
  const THEMES = [
    { name: 'Office Life', emojis: ['🏢', '💼', '📊', '👔', '🎯', '📈', '💰', '🏆'] },
    { name: 'Nature', emojis: ['🌳', '🌻', '🦋', '🌈', '🍄', '🐝', '🌸', '🦊'] },
    { name: 'Space', emojis: ['🚀', '🌙', '⭐', '🪐', '👽', '🛸', '☄️', '🌍'] },
    { name: 'Food', emojis: ['🍕', '🍩', '🧁', '🍣', '🌮', '🍦', '🥐', '🍪'] },
    { name: 'Sport', emojis: ['⚽', '🏀', '🎾', '🏈', '🏓', '🎳', '🥊', '🏄'] },
    { name: 'Music', emojis: ['🎵', '🎸', '🥁', '🎹', '🎺', '🎻', '🎤', '🎧'] },
    { name: 'Animals', emojis: ['🐶', '🐱', '🐼', '🦁', '🐸', '🦄', '🐙', '🦜'] },
    { name: 'Travel', emojis: ['✈️', '🗼', '🏖️', '🎡', '🚂', '⛵', '🏔️', '🎪'] },
  ]

  // Pick a random theme and shuffle ONCE on mount
  const [theme] = useState(() => THEMES[Math.floor(Math.random() * THEMES.length)])
  const [deck] = useState(() => {
    const pairs = [...theme.emojis, ...theme.emojis]
    // Fisher-Yates shuffle for proper randomisation
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]]
    }
    return pairs
  })

  const [revealed, setRevealed] = useState(new Array(16).fill(false))
  const [matched, setMatched] = useState(new Array(16).fill(false))
  const [firstCard, setFirstCard] = useState(null)
  const [secondCard, setSecondCard] = useState(null)
  const [locked, setLocked] = useState(false)
  const [time, setTime] = useState(0)
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)

  useEffect(() => {
    if (gameWon) return
    const timer = setInterval(() => setTime((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [gameWon])

  useEffect(() => {
    if (matched.every(Boolean)) {
      setGameWon(true)
      const coins = Math.max(10, 30 - Math.floor(time / 5))
      onUpdateCoins(coins)
    }
  }, [matched])

  const handleCardClick = (idx) => {
    if (locked || revealed[idx] || matched[idx]) return

    if (firstCard === null) {
      const newRevealed = [...revealed]
      newRevealed[idx] = true
      setRevealed(newRevealed)
      setFirstCard(idx)
    } else if (secondCard === null && idx !== firstCard) {
      setLocked(true)
      setMoves((m) => m + 1)
      const newRevealed = [...revealed]
      newRevealed[idx] = true
      setRevealed(newRevealed)
      setSecondCard(idx)

      if (deck[firstCard] === deck[idx]) {
        const newMatched = [...matched]
        newMatched[firstCard] = true
        newMatched[idx] = true
        setTimeout(() => {
          setMatched(newMatched)
          setFirstCard(null)
          setSecondCard(null)
          setLocked(false)
        }, 300)
      } else {
        setTimeout(() => {
          const newRevealed2 = [...newRevealed]
          newRevealed2[firstCard] = false
          newRevealed2[idx] = false
          setRevealed(newRevealed2)
          setFirstCard(null)
          setSecondCard(null)
          setLocked(false)
        }, 800)
      }
    }
  }

  if (gameWon) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition"
        >
          ← Back
        </button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-3xl font-bold text-night mb-2">You Won!</h2>
          <p className="text-sm text-gray-500 mb-4">Theme: {theme.name}</p>
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-xs mx-auto">
            <div className="bg-day rounded-lg p-3">
              <p className="text-2xl font-bold text-forest">{time}s</p>
              <p className="text-xs text-gray-600">Time</p>
            </div>
            <div className="bg-day rounded-lg p-3">
              <p className="text-2xl font-bold text-forest">{moves}</p>
              <p className="text-xs text-gray-600">Moves</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="bg-forest text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition"
          >
            Back to Arcade
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition"
      >
        ← Back
      </button>
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-night">Memory Match</h1>
          <span className="text-sm bg-day px-3 py-1 rounded-full">{theme.name}</span>
        </div>
        <div className="flex gap-4 text-sm text-gray-600 mb-6">
          <span>Time: {time}s</span>
          <span>Moves: {moves}</span>
          <span>Pairs: {matched.filter(Boolean).length / 2}/8</span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {deck.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => handleCardClick(idx)}
              className={`aspect-square text-4xl rounded-lg font-bold transition-all duration-300 ${
                matched[idx]
                  ? 'bg-green-100 text-gray-900 scale-95'
                  : revealed[idx]
                    ? 'bg-day text-gray-900 scale-105'
                    : 'bg-gradient-to-br from-forest to-[#124a38] text-day hover:scale-110 cursor-pointer'
              }`}
            >
              {revealed[idx] || matched[idx] ? emoji : '?'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Word Scramble Game
function WordScrambleGame({ onBack, onUpdateCoins }) {
  const words = ['MANAGER', 'OFFICE', 'MEETING', 'PROJECT', 'BUSINESS', 'EMPLOYEE', 'COMPANY']
  const [round, setRound] = useState(1)
  const [currentWord] = useState(
    words[round - 1].split('').sort(() => Math.random() - 0.5).join('')
  )
  const [input, setInput] = useState('')
  const [correct, setCorrect] = useState(0)

  const handleSubmit = () => {
    if (input.toUpperCase() === words[round - 1]) {
      setCorrect(correct + 1)
      onUpdateCoins(3)
    }

    if (round < words.length) {
      setRound(round + 1)
      setInput('')
    }
  }

  if (round > words.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back
        </button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🔤</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete!</h2>
          <p className="text-2xl font-bold text-[#195e47] mb-2">{correct}/7 Correct</p>
          <button
            onClick={onBack}
            className="bg-[#195e47] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#124a38] transition"
          >
            Back to Games
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back
      </button>
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Word Scramble</h1>
        <p className="text-gray-600 mb-6">
          Round {round}/7 - Correct: {correct}
        </p>

        <div className="bg-[#e8f5ef] p-6 rounded-lg mb-6 text-center">
          <p className="text-4xl font-bold text-[#195e47] tracking-widest">{currentWord}</p>
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
          className="w-full p-4 border-2 border-[#195e47] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#195e47] mb-4 text-lg"
          placeholder="Type the answer..."
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-[#195e47] text-white py-3 rounded-lg font-bold hover:bg-[#124a38] transition"
        >
          Submit
        </button>
      </div>
    </div>
  )
}

// BREAK ROOM SCREEN
function BreakRoomScreen({ player, onNavigate, onUpdateCoins }) {
  const [game, setGame] = useState(null)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      {!game ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setGame('trivia')}
            className="bg-gradient-to-br from-[#195e47] to-[#124a38] text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            <div className="text-5xl mb-4">❓</div>
            <h3 className="text-2xl font-bold mb-2">Office Trivia</h3>
            <p className="text-[#e8f5ef]">Test your business knowledge!</p>
          </button>
          <button
            onClick={() => setGame('oddone')}
            className="bg-gradient-to-br from-orange-400 to-orange-600 text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            <div className="text-5xl mb-4">👀</div>
            <h3 className="text-2xl font-bold mb-2">Spot the Odd One</h3>
            <p className="text-orange-100">Find what doesn't belong!</p>
          </button>
        </div>
      ) : game === 'trivia' ? (
        <TriviaGame onBack={() => setGame(null)} onUpdateCoins={onUpdateCoins} />
      ) : game === 'oddone' ? (
        <OddOneGame onBack={() => setGame(null)} onUpdateCoins={onUpdateCoins} />
      ) : null}
    </div>
  )
}

// Trivia Game
function TriviaGame({ onBack, onUpdateCoins }) {
  const [questions, setQuestions] = useState([])
  const [question, setQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [answered, setAnswered] = useState(null)
  const [showFact, setShowFact] = useState(false)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/trivia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5 }),
      })
      const data = await res.json()
      if (data.questions?.length) {
        setQuestions(data.questions)
      } else {
        throw new Error('No questions')
      }
    } catch {
      setQuestions([
        { q: 'In what year was the NHS founded?', options: ['1939', '1948', '1955', '1962'], correct: 1, funFact: 'The NHS was founded by Aneurin Bevan on 5 July 1948.' },
        { q: 'What is the tallest building in London?', options: ['The Gherkin', 'Canary Wharf', 'The Shard', 'BT Tower'], correct: 2, funFact: 'The Shard stands at 310 metres tall.' },
        { q: 'Which planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Mars', 'Earth'], correct: 1, funFact: 'Mercury orbits the Sun in just 88 Earth days.' },
        { q: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyper Transfer Mail Language'], correct: 0, funFact: 'HTML was created by Tim Berners-Lee in 1991.' },
        { q: 'Which UK city has the most canals?', options: ['London', 'Manchester', 'Birmingham', 'Leeds'], correct: 2, funFact: 'Birmingham has more canals than Venice!' },
      ])
    }
    setLoading(false)
  }

  const handleAnswer = (idx) => {
    if (answered !== null) return
    setAnswered(idx)
    if (idx === questions[question].correct) {
      setScore(score + 1)
      onUpdateCoins(5)
    }
    setShowFact(true)

    setTimeout(() => {
      setAnswered(null)
      setShowFact(false)
      if (question < questions.length - 1) {
        setQuestion(question + 1)
      } else {
        setFinished(true)
      }
    }, 2500)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition">← Back</button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-pulse text-2xl mb-4">🧠</div>
          <p className="text-gray-600">AI is writing quiz questions...</p>
        </div>
      </div>
    )
  }

  if (finished) {
    const totalCoins = score * 5
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition">← Back</button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">{score >= 4 ? '🏆' : score >= 2 ? '👏' : '🤔'}</div>
          <h2 className="text-3xl font-bold text-night mb-2">Quiz Complete!</h2>
          <p className="text-4xl font-bold text-forest mb-1">{score}/{questions.length}</p>
          <p className="text-gray-600 mb-2">correct answers</p>
          <p className="text-lg font-bold text-sunshine mb-6">{totalCoins} coins earned</p>
          <button onClick={onBack} className="bg-forest text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition">
            Back to Break Room
          </button>
        </div>
      </div>
    )
  }

  const q = questions[question]
  if (!q) return null

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="mb-6 px-4 py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition">← Back</button>
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-night">Trivia</h1>
          <div className="flex gap-3 text-sm">
            <span className="bg-day px-3 py-1 rounded-full">Q{question + 1}/{questions.length}</span>
            <span className="bg-forest text-white px-3 py-1 rounded-full">{score} correct</span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-night mb-6">{q.q}</h2>

        <div className="space-y-3">
          {q.options.map((option, idx) => {
            let style = 'bg-day text-night hover:bg-gray-200'
            if (answered !== null) {
              if (idx === q.correct) {
                style = 'bg-green-100 text-green-800 border-2 border-green-400 font-bold'
              } else if (idx === answered && idx !== q.correct) {
                style = 'bg-red-100 text-red-800 border-2 border-red-300'
              } else {
                style = 'bg-gray-100 text-gray-400'
              }
            }
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered !== null}
                className={`w-full p-4 rounded-lg transition font-semibold text-lg text-left ${style}`}
              >
                {option}
              </button>
            )
          })}
        </div>

        {showFact && q.funFact && (
          <div className="mt-4 bg-sky/20 border border-sky rounded-lg p-4 text-sm text-night">
            <strong>Fun fact:</strong> {q.funFact}
          </div>
        )}
      </div>
    </div>
  )
}

// Odd One Out Game
function OddOneGame({ onBack, onUpdateCoins }) {
  const [sets, setSets] = useState([])
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [answered, setAnswered] = useState(null)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    fetchSets()
  }, [])

  const fetchSets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/odd-one-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5 }),
      })
      const data = await res.json()
      if (data.sets?.length) {
        setSets(data.sets)
      } else {
        throw new Error('No sets')
      }
    } catch {
      setSets([
        { items: ['Salmon', 'Trout', 'Tuna', 'Penguin'], odd: 'Penguin', hint: 'Three are fish, one is a bird' },
        { items: ['Mars', 'Jupiter', 'Moon', 'Saturn'], odd: 'Moon', hint: 'Three are planets, one orbits a planet' },
        { items: ['Python', 'Cobra', 'Java', 'Ruby'], odd: 'Cobra', hint: 'Three are programming languages, one is just a snake' },
        { items: ['Violin', 'Trumpet', 'Cello', 'Viola'], odd: 'Trumpet', hint: 'Three are string instruments, one is brass' },
        { items: ['Thames', 'Ben Nevis', 'Severn', 'Mersey'], odd: 'Ben Nevis', hint: 'Three are rivers, one is a mountain' },
      ])
    }
    setLoading(false)
  }

  const handleChoice = (item) => {
    if (answered !== null) return
    setAnswered(item)
    if (item === sets[round].odd) {
      setScore(score + 1)
      onUpdateCoins(5)
    }
    setShowHint(true)

    setTimeout(() => {
      setAnswered(null)
      setShowHint(false)
      if (round < sets.length - 1) {
        setRound(round + 1)
      } else {
        setFinished(true)
      }
    }, 2500)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition">← Back</button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-pulse text-2xl mb-4">👀</div>
          <p className="text-gray-600">AI is creating puzzles...</p>
        </div>
      </div>
    )
  }

  if (finished) {
    const totalCoins = score * 5
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-6 px-4 py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition">← Back</button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">{score >= 4 ? '🧠' : score >= 2 ? '👍' : '😅'}</div>
          <h2 className="text-3xl font-bold text-night mb-2">Complete!</h2>
          <p className="text-4xl font-bold text-earth mb-1">{score}/{sets.length}</p>
          <p className="text-gray-600 mb-2">correct answers</p>
          <p className="text-lg font-bold text-sunshine mb-6">{totalCoins} coins earned</p>
          <button onClick={onBack} className="bg-earth text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition">
            Back to Break Room
          </button>
        </div>
      </div>
    )
  }

  const currentSet = sets[round]
  if (!currentSet) return null

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="mb-6 px-4 py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition">← Back</button>
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-night">Odd One Out</h1>
          <div className="flex gap-3 text-sm">
            <span className="bg-day px-3 py-1 rounded-full">Round {round + 1}/{sets.length}</span>
            <span className="bg-earth text-white px-3 py-1 rounded-full">{score} correct</span>
          </div>
        </div>

        <h2 className="text-lg font-bold text-night mb-6">Which one doesn't belong with the others?</h2>

        <div className="grid grid-cols-2 gap-4">
          {currentSet.items.map((item, idx) => {
            let style = 'bg-day text-night hover:bg-earth/10 hover:border-earth border-2 border-transparent'
            if (answered !== null) {
              if (item === currentSet.odd) {
                style = 'bg-green-100 text-green-800 border-2 border-green-400 font-bold'
              } else if (item === answered && item !== currentSet.odd) {
                style = 'bg-red-100 text-red-800 border-2 border-red-300'
              } else {
                style = 'bg-gray-100 text-gray-400 border-2 border-transparent'
              }
            }
            return (
              <button
                key={idx}
                onClick={() => handleChoice(item)}
                disabled={answered !== null}
                className={`p-6 rounded-lg transition font-semibold text-xl text-center ${style}`}
              >
                {item}
              </button>
            )
          })}
        </div>

        {showHint && currentSet.hint && (
          <div className="mt-4 bg-earth/10 border border-earth/30 rounded-lg p-4 text-sm text-night">
            <strong>Why?</strong> {currentSet.hint}
          </div>
        )}
      </div>
    </div>
  )
}

// BOARDROOM SCREEN
function BoardroomScreen({ player, onNavigate }) {
  const [players, setPlayers] = useState([])

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    try {
      const { data } = await supabase
        .from('players')
        .select('*')
        .order('coins', { ascending: false })
        .limit(50)

      setPlayers(data || [])
    } catch (e) {
      console.error('Failed to load players:', e)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#195e47] to-[#124a38] p-6">
          <h1 className="text-3xl font-bold text-white">🏆 Leaderboard</h1>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#fcf2e3] border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Player</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Level</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">💰 Coins</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tasks</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, idx) => {
                const isCurrentPlayer = p.id === player.id
                const level = calculateLevel(p.total_coins_earned)
                return (
                  <tr
                    key={p.id}
                    className={`border-b transition ${
                      isCurrentPlayer ? 'bg-yellow-50 font-bold' : 'hover:bg-[#fcf2e3]'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#195e47] to-[#124a38] flex items-center justify-center text-white font-bold text-xs">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            p.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-gray-900">{p.name}</span>
                        {isCurrentPlayer && <span className="ml-2">👈 You</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{level}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-yellow-600">{p.coins}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{p.tasks_completed || 0}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// SHOP SCREEN
function ShopScreen({ player, onNavigate, onUpdateCoins }) {
  const items = [
    { id: 'plant', emoji: '🌱', name: 'Plant', price: 50 },
    { id: 'coffee', emoji: '☕', name: 'Coffee Mug', price: 30 },
    { id: 'sticker', emoji: '⭐', name: 'Laptop Sticker', price: 20 },
    { id: 'lamp', emoji: '💡', name: 'Desk Lamp', price: 80 },
    { id: 'trophy', emoji: '🏆', name: 'Trophy', price: 200 },
    { id: 'nameplate', emoji: '📛', name: 'Name Plate', price: 100 },
    { id: 'headphones', emoji: '🎧', name: 'Headphones', price: 150 },
    { id: 'duck', emoji: '🦆', name: 'Rubber Duck', price: 40 },
  ]

  const handleBuy = async (item) => {
    if (player.coins < item.price) return

    const newBalance = player.coins - item.price
    const updatedDesk = [...(player.desk_items || []), item.emoji]

    try {
      await supabase
        .from('players')
        .update({
          coins: newBalance,
          desk_items: updatedDesk,
        })
        .eq('id', player.id)

      onUpdateCoins(-item.price)
    } catch (e) {
      console.error('Failed to purchase item:', e)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">🛍️ The Shop</h1>
        <p className="text-gray-600">Spend your coins on cool desk items!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => {
          const owned = player.desk_items?.includes(item.emoji)
          const canAfford = player.coins >= item.price

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
            >
              <div className="text-5xl mb-4">{item.emoji}</div>
              <h3 className="font-bold text-gray-900 mb-2">{item.name}</h3>
              <p className="text-2xl font-bold text-yellow-600 mb-4">{item.price} 💰</p>

              <button
                onClick={() => handleBuy(item)}
                disabled={owned || !canAfford}
                className={`w-full py-2 rounded-lg font-bold transition ${
                  owned
                    ? 'bg-[#e8f5ef] text-[#124a38] cursor-default'
                    : canAfford
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                {owned ? '✓ Owned' : 'Buy'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// UTILITY FUNCTIONS
function calculateLevel(totalCoins) {
  if (totalCoins >= 1500) return 'CEO'
  if (totalCoins >= 700) return 'Director'
  if (totalCoins >= 300) return 'Manager'
  if (totalCoins >= 100) return 'Analyst'
  return 'Intern'
}
