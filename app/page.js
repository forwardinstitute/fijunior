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
    const newTotal = coinsEarned > 0
      ? player.total_coins_earned + coinsEarned
      : player.total_coins_earned

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
    <div className="min-h-screen bg-day">
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-day to-forest/10 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <img src="https://a.storyblok.com/f/286772795909088/1172x1172/8547317449/fi-icon.png" alt="Forward HQ" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-forest">Forward HQ</h1>
          <p className="text-gray-600 mt-2">Your work experience adventure starts here</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-forest text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Signing in...' : 'Enter Forward HQ'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-earth/20 border border-earth rounded-lg">
            <p className="text-earth text-center">{error}</p>
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest to-forest/80 flex items-center justify-center text-white font-bold text-lg shrink-0">
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
            className="px-4 py-2 bg-earth/20 text-earth rounded-lg hover:bg-earth/30 transition font-medium"
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
  const level = calculateLevel(player.total_coins_earned)
  const nextLevelCoins = getNextLevelThreshold(player.total_coins_earned)
  const progressPercent = Math.round((player.total_coins_earned / nextLevelCoins) * 100)

  const rooms = [
    {
      id: 'desk',
      title: 'Your Desk',
      emoji: '🏢',
      color: 'from-forest to-forest/80',
      description: 'Customize your workspace and check your progress',
      category: 'personal'
    },
    {
      id: 'classifier',
      title: 'Contact Classifier',
      emoji: '👥',
      color: 'from-earth to-earth/80',
      description: 'Classify business contacts by type and relationship',
      locked: player.age < 12,
      category: 'work',
      earnsCoins: true
    },
    {
      id: 'logohunt',
      title: 'Logo Hunt',
      emoji: '🔍',
      color: 'from-sky to-sky/80',
      description: 'Find and capture company logos',
      category: 'work',
      earnsCoins: true
    },
    {
      id: 'arcade',
      title: 'The Arcade',
      emoji: '🎮',
      color: 'from-sunshine to-yellow-400',
      description: 'Play games and rack up coins',
      category: 'fun'
    },
    {
      id: 'breakroom',
      title: 'The Break Room',
      emoji: '☕',
      color: 'from-pink-400 to-pink-500',
      description: 'Relax with word games and puzzles',
      category: 'fun'
    },
    {
      id: 'boardroom',
      title: 'The Boardroom',
      emoji: '📊',
      color: 'from-forest to-forest/80',
      description: 'Check the leaderboard and see how you rank',
      category: 'personal'
    },
    {
      id: 'shop',
      title: 'The Shop',
      emoji: '🛍️',
      color: 'from-purple-400 to-purple-500',
      description: 'Spend your coins on cool desk items',
      category: 'personal'
    },
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 animate-fade-in">
      {/* Welcome Banner with Level Progress */}
      <div className="bg-gradient-to-r from-forest to-forest/80 text-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Forward HQ, {player.name}! 🏢</h1>
            <p className="text-day/90">Ready to earn coins and climb the ranks?</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{level}</p>
            <p className="text-sm text-day/70">Your current rank</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2 mb-2">
          <div
            className="bg-sunshine h-2 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <p className="text-xs text-day/70">{player.total_coins_earned} / {nextLevelCoins} coins to next level</p>
      </div>

      {/* Room Cards Grouped by Category */}
      <div>
        <h2 className="text-xl font-bold text-night mb-4">Real Work Rooms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {rooms.filter(r => r.category === 'work').map((room) => (
            <button
              key={room.id}
              onClick={() => !room.locked && onNavigate(room.id)}
              disabled={room.locked}
              className={`p-6 rounded-xl text-white font-bold text-xl transition transform hover:scale-105 ${
                room.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'
              } bg-gradient-to-br ${room.color}`}
            >
              <div className="text-5xl mb-3">{room.emoji}</div>
              <div className="text-left">
                <h3 className="font-bold text-lg">{room.title}</h3>
                <p className="text-sm text-white/80 mt-1">{room.description}</p>
              </div>
              {room.earnsCoins && <div className="text-xs mt-3 bg-white/20 px-2 py-1 rounded-full inline-block">💰 Earns coins</div>}
              {room.locked && <div className="text-sm mt-3">🔒 Age 12+</div>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-night mb-4">Fun & Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {rooms.filter(r => r.category === 'fun').map((room) => (
            <button
              key={room.id}
              onClick={() => !room.locked && onNavigate(room.id)}
              disabled={room.locked}
              className={`p-6 rounded-xl text-white font-bold text-xl transition transform hover:scale-105 ${
                room.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'
              } bg-gradient-to-br ${room.color}`}
            >
              <div className="text-5xl mb-3">{room.emoji}</div>
              <div className="text-left">
                <h3 className="font-bold text-lg">{room.title}</h3>
                <p className="text-sm text-white/80 mt-1">{room.description}</p>
              </div>
              {room.locked && <div className="text-sm mt-3">🔒 Age 12+</div>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-night mb-4">Personal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.filter(r => r.category === 'personal').map((room) => (
            <button
              key={room.id}
              onClick={() => !room.locked && onNavigate(room.id)}
              disabled={room.locked}
              className={`p-6 rounded-xl text-white font-bold text-xl transition transform hover:scale-105 ${
                room.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'
              } bg-gradient-to-br ${room.color}`}
            >
              <div className="text-5xl mb-3">{room.emoji}</div>
              <div className="text-left">
                <h3 className="font-bold text-lg">{room.title}</h3>
                <p className="text-sm text-white/80 mt-1">{room.description}</p>
              </div>
              {room.locked && <div className="text-sm mt-3">🔒 Age 12+</div>}
            </button>
          ))}
        </div>
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
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
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
                      className="flex-1 bg-forest text-white py-2 rounded-lg hover:opacity-90 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setCropMode(false)
                        setAvatarPreview('')
                      }}
                      className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-forest to-forest/80 flex items-center justify-center text-white font-bold text-5xl overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      player.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleImageSearch}
                      className="flex-1 px-4 py-2 bg-day text-forest rounded-lg hover:bg-gray-200 transition text-sm"
                    >
                      🔍 Search
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 px-4 py-2 bg-forest text-white rounded-lg hover:opacity-90 transition text-sm"
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
              <div className="bg-day p-4 rounded-lg">
                <p className="text-sm text-gray-600">Level</p>
                <p className="text-2xl font-bold text-forest">{level}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Coins</p>
                <p className="text-2xl font-bold text-sunshine">{player.total_coins_earned}</p>
              </div>
              <div className="bg-day p-4 rounded-lg">
                <p className="text-sm text-gray-600">Coins Available</p>
                <p className="text-2xl font-bold text-forest">{player.coins}</p>
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

  const CONTACT_TYPES = ['Person', 'Organisation', 'Government', 'Charity']
  const RELATIONSHIPS = ['Executive', 'Manager', 'Employee', 'Founder', 'Investor', 'Partner', 'Other']

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
      setSuggestion(null)
      setSelectedType('')
      setSelectedRel('')
    } catch (e) {
      console.error('Failed to load contacts:', e)
    }
  }

  const currentContact = contacts[currentIndex]

  const getAISuggestion = async () => {
    if (!currentContact) return

    setLoadingSuggestion(true)
    setSuggestion(null)
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentContact.title,
          orgName: currentContact.org_name,
          sector: currentContact.org_sector,
          industry: currentContact.org_industry,
          companySize: currentContact.company_size,
        }),
      })

      const data = await res.json()

      // Check for error or missing data - use fallback
      if (data.error || !data.contactType) {
        setSuggestion({ contactType: 'Organisation', relationship: 'Other', reasoning: 'Could not get AI suggestion - please classify manually.' })
        setSelectedType('Organisation')
        setSelectedRel('Other')
      } else {
        setSuggestion(data)
        setSelectedType(data.contactType || 'Organisation')
        setSelectedRel(data.relationship || 'Other')
      }
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
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
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
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Contact Classifier</h1>
          <div className="flex gap-4 text-sm">
            <span className="bg-day px-3 py-1 rounded-full font-semibold text-forest">
              {currentIndex + 1}/{contacts.length}
            </span>
            <span className="bg-sunshine/20 px-3 py-1 rounded-full font-semibold text-sunshine">
              {stats.completed} completed
            </span>
            <span className="bg-day px-3 py-1 rounded-full font-semibold text-forest">
              Streak: {stats.streak}
            </span>
          </div>
        </div>

        {currentContact && (
          <div className="space-y-6">
            <div className="bg-day p-6 rounded-lg border-l-4 border-earth">
              <h2 className="text-2xl font-bold text-night mb-4">{currentContact.title}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Organization</p>
                  <p className="font-semibold text-gray-900">{currentContact.org_name || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Sector</p>
                  <p className="font-semibold text-gray-900">{currentContact.org_sector || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Industry</p>
                  <p className="font-semibold text-gray-900">{currentContact.org_industry || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Company Size</p>
                  <p className="font-semibold text-gray-900">{currentContact.company_size || '-'}</p>
                </div>
              </div>
            </div>

            {/* AI Suggestion or Manual Classification */}
            {suggestion && (
              <div className="bg-sky/20 border border-sky rounded-lg p-4">
                <p className="text-sm font-semibold text-sky mb-2">AI Suggestion:</p>
                <p className="text-gray-700">{suggestion.reasoning}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Contact Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-3 border border-forest/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
                >
                  <option value="">Select type...</option>
                  {CONTACT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Relationship</label>
                <select
                  value={selectedRel}
                  onChange={(e) => setSelectedRel(e.target.value)}
                  className="w-full p-3 border border-forest/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
                >
                  <option value="">Select relationship...</option>
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              {!suggestion && (
                <button
                  onClick={getAISuggestion}
                  disabled={loadingSuggestion}
                  className="flex-1 bg-sky text-white py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition"
                >
                  {loadingSuggestion ? 'Thinking... 🤔' : 'Get AI Suggestion 💡'}
                </button>
              )}
              <button
                onClick={submitClassification}
                disabled={!selectedType || !selectedRel}
                className="flex-1 bg-forest text-white py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition"
              >
                Submit Classification ✓
              </button>
              <button
                onClick={skipContact}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-400 transition"
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
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
        .eq('logo_found', false)
        .limit(20)
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
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(currentOrg.name + ' logo')}`, '_blank')
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
    try {
      await supabase
        .from('organisations')
        .update({ logo_url: dataUrl, logo_found: true })
        .eq('id', currentOrg.id)

      onUpdateCoins(40)

      if (currentIndex < organisations.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        loadOrganisations()
      }
    } catch (e) {
      console.error('Failed to upload logo:', e)
    }
  }

  const skipOrg = () => {
    if (currentIndex < organisations.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      loadOrganisations()
    }
  }

  if (!currentOrg) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
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
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-gray-900">Logo Hunt Progress</h2>
          <span className="text-lg font-bold text-earth">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-earth h-4 rounded-full transition-all"
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
              <div className="bg-day p-4 rounded-lg">
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-semibold text-gray-900">{currentOrg.name}</p>
              </div>
              <div className="bg-day p-4 rounded-lg">
                <p className="text-sm text-gray-600">Sector</p>
                <p className="text-lg font-semibold text-gray-900">{currentOrg.sector}</p>
              </div>
              <div className="bg-day p-4 rounded-lg">
                <p className="text-sm text-gray-600">Industry</p>
                <p className="text-lg font-semibold text-gray-900">{currentOrg.industry}</p>
              </div>
              {currentOrg.website && (
                <div className="bg-day p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Website</p>
                  <p className="text-lg font-semibold text-forest truncate">{currentOrg.website}</p>
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
                    className="flex-1 bg-forest text-white py-2 rounded-lg hover:opacity-90 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setCropMode(false)
                      setLogoPreview('')
                    }}
                    className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-300 transition"
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
                    className="flex-1 px-4 py-3 bg-sky/20 text-sky rounded-lg hover:bg-sky/30 transition font-semibold"
                  >
                    🔍 Search
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-4 py-3 bg-sky text-white rounded-lg hover:opacity-90 transition font-semibold"
                  >
                    📤 Upload
                  </button>
                </div>
                <button
                  onClick={skipOrg}
                  className="w-full mt-3 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
                >
                  Skip
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
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      {!game ? (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🎮 The Arcade</h1>
            <p className="text-gray-600">Play games and earn coins!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setGame('speedtyper')}
              className="bg-gradient-to-br from-sky to-sky/80 text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <div className="text-5xl mb-4">⌨️</div>
              <h3 className="text-2xl font-bold mb-2">Speed Typer</h3>
              <p className="text-sky/90">Type sentences as fast as you can!</p>
            </button>
            <button
              onClick={() => setGame('memory')}
              className="bg-gradient-to-br from-pink-400 to-pink-500 text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <div className="text-5xl mb-4">🧠</div>
              <h3 className="text-2xl font-bold mb-2">Memory Match</h3>
              <p className="text-pink-100">Test your memory with emoji pairs!</p>
            </button>
          </div>
        </div>
      ) : game === 'speedtyper' ? (
        <SpeedTyperGame onBack={() => setGame(null)} onUpdateCoins={onUpdateCoins} />
      ) : game === 'memory' ? (
        <MemoryGame onBack={() => setGame(null)} onUpdateCoins={onUpdateCoins} />
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
  const [coinsPaid, setCoinsPaid] = useState(false)
  const inputRef = useRef(null)
  const fetchedRef = useRef(false)

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

  // Use ref guard to prevent double-fetch in strict mode
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchSentence(1)
    }
  }, [])

  // Pause timer while loading new sentence
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

  // Pay coins exactly once when game ends
  useEffect(() => {
    if (gameOver && !coinsPaid) {
      setCoinsPaid(true)
      if (completedRounds === 0) {
        onUpdateCoins(2)
      } else {
        onUpdateCoins(totalCoins)
      }
    }
  }, [gameOver])

  if (gameOver) {
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

  const [flipped, setFlipped] = useState(new Set())
  const [matched, setMatched] = useState(new Set())
  const [moves, setMoves] = useState(0)

  const handleClick = (i) => {
    if (matched.has(i) || flipped.has(i)) return

    const newFlipped = new Set(flipped)
    newFlipped.add(i)
    setFlipped(newFlipped)

    if (newFlipped.size === 2) {
      const [first, second] = Array.from(newFlipped)
      setMoves(moves + 1)

      if (deck[first] === deck[second]) {
        const newMatched = new Set(matched)
        newMatched.add(first)
        newMatched.add(second)
        setMatched(newMatched)
        setFlipped(new Set())

        if (newMatched.size === deck.length) {
          // Game won, pay coins
          onUpdateCoins(Math.max(10, 50 - moves))
        }
      } else {
        setTimeout(() => setFlipped(new Set()), 600)
      }
    }
  }

  const gameWon = matched.size === deck.length

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
          <h2 className="text-3xl font-bold text-night mb-4">Perfect!</h2>
          <p className="text-2xl font-bold text-forest mb-2">{moves} moves</p>
          <p className="text-lg text-gray-600 mb-6">{Math.max(10, 50 - moves)} coins earned!</p>
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
          <h1 className="text-2xl font-bold text-night">Memory Match: {theme.name}</h1>
          <span className="bg-day px-3 py-1 rounded-full font-semibold text-forest">Moves: {moves}</span>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {deck.map((emoji, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`aspect-square text-4xl rounded-lg transition transform hover:scale-110 ${
                matched.has(i)
                  ? 'bg-sky/30 cursor-default'
                  : flipped.has(i)
                    ? 'bg-sky text-white'
                    : 'bg-day hover:bg-gray-200 cursor-pointer'
              }`}
            >
              {flipped.has(i) || matched.has(i) ? emoji : '?'}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-600">
          {matched.size / 2} / {deck.length / 2} pairs found
        </p>
      </div>
    </div>
  )
}

// BREAK ROOM SCREEN
function BreakRoomScreen({ player, onNavigate, onUpdateCoins }) {
  const [game, setGame] = useState(null)

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      {!game ? (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">☕ The Break Room</h1>
            <p className="text-gray-600">Relax with word games and puzzles!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setGame('scramble')}
              className="bg-gradient-to-br from-purple-400 to-purple-500 text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <div className="text-5xl mb-4">🔤</div>
              <h3 className="text-2xl font-bold mb-2">Word Scramble</h3>
              <p className="text-purple-100">Unscramble business words!</p>
            </button>
          </div>
        </div>
      ) : game === 'scramble' ? (
        <WordScrambleGame onBack={() => setGame(null)} onUpdateCoins={onUpdateCoins} />
      ) : null}
    </div>
  )
}

// Word Scramble Game
function WordScrambleGame({ onBack, onUpdateCoins }) {
  const words = ['MANAGER', 'OFFICE', 'MEETING', 'PROJECT', 'BUSINESS', 'EMPLOYEE', 'COMPANY']
  const [round, setRound] = useState(1)
  const [currentWord, setCurrentWord] = useState('')
  const [input, setInput] = useState('')
  const [correct, setCorrect] = useState(0)

  // Generate scrambled word that doesn't match the original
  const generateScrambledWord = (word) => {
    let scrambled
    do {
      scrambled = word.split('').sort(() => Math.random() - 0.5).join('')
    } while (scrambled === word)
    return scrambled
  }

  // Update current word whenever round changes
  useEffect(() => {
    setCurrentWord(generateScrambledWord(words[round - 1]))
  }, [round])

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
          <p className="text-2xl font-bold text-forest mb-2">{correct}/7 Correct</p>
          <button
            onClick={onBack}
            className="bg-forest text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition"
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Word Scramble</h1>
        <p className="text-gray-600 mb-6">
          Round {round}/7 - Correct: {correct}
        </p>

        <div className="bg-gradient-to-br from-forest/20 to-forest/10 p-6 rounded-lg mb-6 text-center">
          <p className="text-4xl font-bold text-emerald-100 tracking-widest">{currentWord}</p>
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
          className="w-full p-4 border-2 border-forest rounded-lg focus:outline-none focus:ring-2 focus:ring-forest mb-4 text-lg"
          placeholder="Type the answer..."
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-forest text-white py-3 rounded-lg font-bold hover:opacity-90 transition"
        >
          Submit
        </button>
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
        .order('total_coins_earned', { ascending: false })
        .limit(50)

      setPlayers(data || [])
    } catch (e) {
      console.error('Failed to load players:', e)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-forest to-forest/80 p-6">
          <h1 className="text-3xl font-bold text-white">🏆 Leaderboard</h1>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-day border-b">
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
                      isCurrentPlayer ? 'bg-yellow-50 font-bold' : 'hover:bg-day'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-forest to-forest/80 flex items-center justify-center text-white font-bold text-xs">
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
                    <td className="px-6 py-4 text-sm font-semibold text-sunshine">{p.total_coins_earned}</td>
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

    // Call onUpdateCoins with negative amount and updated desk items
    onUpdateCoins(-item.price, updatedDesk)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🛍️ The Shop</h1>
          <p className="text-gray-600">Spend your coins on cool desk items!</p>
        </div>
        <div className="bg-day px-6 py-3 rounded-lg">
          <p className="text-sm text-gray-600">Your Balance</p>
          <p className="text-2xl font-bold text-forest">{player.coins} 💰</p>
        </div>
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
              <p className="text-2xl font-bold text-sunshine mb-4">{item.price} 💰</p>

              <button
                onClick={() => handleBuy(item)}
                disabled={owned || !canAfford}
                className={`w-full py-2 rounded-lg font-bold transition ${
                  owned
                    ? 'bg-day text-forest cursor-default'
                    : canAfford
                      ? 'bg-forest text-white hover:opacity-90'
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

function getNextLevelThreshold(totalCoins) {
  if (totalCoins >= 1500) return 2000
  if (totalCoins >= 700) return 1500
  if (totalCoins >= 300) return 700
  if (totalCoins >= 100) return 300
  return 100
}
