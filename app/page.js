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

  const deskItemsEmojis = (player.desk_items || []).slice(0, 8).join(' ')

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

            {deskItemsEmojis && (
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Desk Items</p>
                <p className="text-2xl">{deskItemsEmojis}</p>
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

  const getSuggestion = async () => {
    if (!currentContact) return

    setLoadingSuggestion(true)
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentContact.title,
          orgName: currentContact.organisation_name,
          sector: currentContact.sector,
          industry: currentContact.industry,
          companySize: currentContact.company_size,
        }),
      })

      const data = await res.json()
      setSuggestion(data)
      setSelectedType(data.contactType)
      setSelectedRel(data.relationship)
    } catch (e) {
      console.error('Failed to get suggestion:', e)
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
                <p className="text-lg font-semibold text-gray-900">{currentContact.organisation_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sector</p>
                <p className="text-lg font-semibold text-gray-900">{currentContact.sector}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Industry</p>
                <p className="text-lg font-semibold text-gray-900">{currentContact.industry}</p>
              </div>
            </div>
          </div>

          {suggestion && (
            <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">✨ AI Suggestion</h3>
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
            </div>
          )}

          <button
            onClick={getSuggestion}
            disabled={loadingSuggestion || !!suggestion}
            className="w-full bg-yellow-500 text-white py-3 rounded-lg font-bold hover:bg-yellow-600 disabled:opacity-50 transition"
          >
            {loadingSuggestion ? 'Getting suggestion...' : suggestion ? 'Got suggestion!' : 'Get AI Suggestion'}
          </button>

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
  const sentences = [
    'The quarterly business meeting was productive.',
    'Success requires focus and dedication.',
    'Innovation drives modern business forward.',
    'Teamwork makes the dream work.',
    'Customer satisfaction is our priority.',
  ]

  const [sentence] = useState(sentences[Math.floor(Math.random() * sentences.length)])
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameOver, setGameOver] = useState(false)
  const [wpm, setWpm] = useState(0)

  useEffect(() => {
    if (gameOver) return
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          calculateWPM()
          setGameOver(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameOver])

  const calculateWPM = () => {
    const words = input.trim().split(/\s+/).length
    const minutes = (30 - timeLeft) / 60
    const calculatedWPM = minutes > 0 ? Math.round(words / minutes) : 0
    setWpm(calculatedWPM)

    const coins = Math.min(20, Math.max(5, Math.round(calculatedWPM / 10)))
    onUpdateCoins(coins)
  }

  if (gameOver) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back
        </button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">⌨️</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Game Over!</h2>
          <p className="text-4xl font-bold text-pink-600 mb-2">{wpm} WPM</p>
          <p className="text-gray-600 mb-6">Words per minute</p>
          <button
            onClick={onBack}
            className="bg-pink-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-pink-700 transition"
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Speed Typer</h1>

        <div className="mb-6 text-center">
          <div className="text-5xl font-bold text-pink-600">{timeLeft}s</div>
        </div>

        <div className="bg-gray-100 p-6 rounded-lg mb-6 min-h-24 flex items-center justify-center">
          <p className="text-2xl text-gray-900 text-center">{sentence}</p>
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          className="w-full p-4 border-2 border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-lg"
          placeholder="Start typing..."
        />
      </div>
    </div>
  )
}

// Memory Match Game
function MemoryGame({ onBack, onUpdateCoins }) {
  const emojis = ['🏢', '💼', '📊', '👔', '🎯', '📈', '💰', '🏆']
  const deck = [...emojis, ...emojis].sort(() => Math.random() - 0.5)

  const [revealed, setRevealed] = useState(new Array(16).fill(false))
  const [matched, setMatched] = useState(new Array(16).fill(false))
  const [firstCard, setFirstCard] = useState(null)
  const [secondCard, setSecondCard] = useState(null)
  const [time, setTime] = useState(0)
  const [gameWon, setGameWon] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (matched.every(Boolean)) {
      setGameWon(true)
      const coins = Math.max(10, 30 - Math.floor(time / 5))
      onUpdateCoins(coins)
    }
  }, [matched])

  const handleCardClick = (idx) => {
    if (revealed[idx] || matched[idx]) return
    if (firstCard === null) {
      const newRevealed = [...revealed]
      newRevealed[idx] = true
      setRevealed(newRevealed)
      setFirstCard(idx)
    } else if (secondCard === null) {
      const newRevealed = [...revealed]
      newRevealed[idx] = true
      setRevealed(newRevealed)
      setSecondCard(idx)

      if (deck[firstCard] === deck[idx]) {
        const newMatched = [...matched]
        newMatched[firstCard] = true
        newMatched[idx] = true
        setMatched(newMatched)
        setFirstCard(null)
        setSecondCard(null)
      } else {
        setTimeout(() => {
          const newRevealed = [...revealed]
          newRevealed[firstCard] = false
          newRevealed[idx] = false
          setRevealed(newRevealed)
          setFirstCard(null)
          setSecondCard(null)
        }, 600)
      }
    }
  }

  if (gameWon) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back
        </button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">You Won!</h2>
          <p className="text-2xl font-bold text-[#195e47] mb-2">{time}s</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Memory Match</h1>
        <p className="text-gray-600 mb-6">Time: {time}s</p>

        <div className="grid grid-cols-4 gap-3">
          {deck.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => handleCardClick(idx)}
              className={`aspect-square text-4xl rounded-lg font-bold transition transform hover:scale-110 ${
                revealed[idx] || matched[idx]
                  ? 'bg-[#dceae4] text-gray-900'
                  : 'bg-gradient-to-br from-[#195e47] to-[#124a38] text-[#dceae4]'
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
  const questions = [
    {
      q: 'What does CEO stand for?',
      options: ['Chief Executive Officer', 'Chief Equipment Owner', 'Central Employee Office'],
      correct: 0,
    },
    {
      q: 'What is a business meeting called where people discuss ideas?',
      options: ['Brainstorm', 'Football match', 'Playground'],
      correct: 0,
    },
    {
      q: 'What document lists a company\'s money coming in and going out?',
      options: ['Budget', 'Diary', 'Menu'],
      correct: 0,
    },
    {
      q: 'What is the place where people work together called?',
      options: ['Office', 'School', 'Hospital'],
      correct: 0,
    },
    {
      q: 'What skill is important for working in a team?',
      options: ['Communication', 'Gaming', 'Sleeping'],
      correct: 0,
    },
  ]

  const [question, setQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const handleAnswer = (idx) => {
    if (idx === questions[question].correct) {
      setScore(score + 1)
      onUpdateCoins(5)
    }

    if (question < questions.length - 1) {
      setQuestion(question + 1)
    } else {
      setFinished(true)
    }
  }

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back
        </button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h2>
          <p className="text-2xl font-bold text-[#195e47] mb-2">{score}/5 Correct</p>
          <button
            onClick={onBack}
            className="bg-[#195e47] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#124a38] transition"
          >
            Back to Break Room
          </button>
        </div>
      </div>
    )
  }

  const q = questions[question]

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back
      </button>
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Office Trivia</h1>
        <p className="text-gray-600 mb-6">
          Question {question + 1}/5
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{q.q}</h2>

        <div className="space-y-3">
          {q.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className="w-full bg-[#e8f5ef] text-[#124a38] p-4 rounded-lg hover:bg-[#dceae4] transition font-semibold text-lg"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Odd One Out Game
function OddOneGame({ onBack, onUpdateCoins }) {
  const sets = [
    { items: ['Manager', 'Doctor', 'Engineer'], odd: 'Doctor' },
    { items: ['Coffee', 'Email', 'Desk'], odd: 'Email' },
    { items: ['Lion', 'Manager', 'Director'], odd: 'Lion' },
    { items: ['Laptop', 'Dog', 'Mouse'], odd: 'Dog' },
    { items: ['Meeting', 'Picnic', 'Conference'], odd: 'Picnic' },
  ]

  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const handleChoice = (item) => {
    if (item === sets[round].odd) {
      setScore(score + 1)
      onUpdateCoins(3)
    }

    if (round < sets.length - 1) {
      setRound(round + 1)
    } else {
      setFinished(true)
    }
  }

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back
        </button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">👀</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete!</h2>
          <p className="text-2xl font-bold text-orange-600 mb-2">{score}/5 Correct</p>
          <button
            onClick={onBack}
            className="bg-orange-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-700 transition"
          >
            Back to Break Room
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Spot the Odd One Out</h1>
        <p className="text-gray-600 mb-6">Round {round + 1}/5 - Score: {score}</p>

        <h2 className="text-xl font-bold text-gray-900 mb-6">Which one doesn't belong?</h2>

        <div className="grid grid-cols-2 gap-4">
          {sets[round].items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleChoice(item)}
              className="bg-orange-100 text-orange-800 p-4 rounded-lg hover:bg-orange-200 transition font-semibold text-lg"
            >
              {item}
            </button>
          ))}
        </div>
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
