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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <img src="https://a.storyblok.com/f/286772795909088/1172x1172/8547317449/fi-icon.png" alt="Forward Institute" className="h-8 w-8 sm:h-10 sm:w-10 shrink-0" />
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-forest to-forest/80 flex items-center justify-center text-white font-bold text-sm sm:text-lg shrink-0">
            {player.avatar_url ? (
              <img src={player.avatar_url} alt="Avatar" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
            ) : (
              player.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 text-sm sm:text-base truncate">{player.name}</h2>
            <p className="text-xs sm:text-sm text-gray-600">{level}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          <div className={`flex items-center gap-1 sm:gap-2 ${coinAnimation ? 'animate-coin-bounce' : ''}`}>
            <span className="text-lg sm:text-2xl">💰</span>
            <span className="font-bold text-gray-900 text-sm sm:text-lg">{player.coins}</span>
          </div>
          <button
            onClick={onSignOut}
            className="px-2 py-1 sm:px-4 sm:py-2 bg-earth/20 text-earth rounded-lg hover:bg-earth/30 transition font-medium text-xs sm:text-base"
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

  // Fortune cookie - one per day based on date
  const FORTUNES = [
    { fact: 'The word "boss" comes from the Dutch word "baas", meaning master.', tip: 'Great leaders don\'t boss people around though!' },
    { fact: 'Teamwork makes the dream work! Geese fly 71% further in formation than alone.', tip: 'Find your flock and fly further.' },
    { fact: 'The average person spends 90,000 hours at work over their lifetime.', tip: 'Make every hour count!' },
    { fact: 'Google gives engineers 20% of their time to work on passion projects.', tip: 'Gmail was invented during 20% time!' },
    { fact: 'The first ever email was sent in 1971 by Ray Tomlinson.', tip: 'He couldn\'t remember what it said.' },
    { fact: 'Lego is the world\'s largest tyre manufacturer.', tip: 'Big things start with small bricks.' },
    { fact: 'The Post-it Note was invented by accident.', tip: 'Sometimes mistakes lead to the best ideas.' },
    { fact: 'Octopuses have 3 hearts and blue blood.', tip: 'Put your heart(s) into everything you do!' },
    { fact: 'The first computer programmer was Ada Lovelace, in the 1840s.', tip: 'She saw the potential before anyone else.' },
    { fact: 'A group of flamingos is called a "flamboyance".', tip: 'Be a flamboyance of one.' },
    { fact: 'Walt Disney was fired from a newspaper for "lacking imagination".', tip: 'Don\'t let anyone else define your potential.' },
    { fact: 'The paperclip was invented in Norway in 1899.', tip: 'Simple ideas can hold everything together.' },
    { fact: 'Bees make decisions democratically by dancing.', tip: 'Every voice matters in a great team.' },
    { fact: 'The Forward Institute works with leaders across 6 sectors.', tip: 'The best ideas come from mixing different perspectives.' },
  ]
  const todayFortune = FORTUNES[new Date().getDate() % FORTUNES.length]
  const [fortuneOpen, setFortuneOpen] = useState(false)

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
      locked: player.age < 10,
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
    <div className="max-w-7xl mx-auto p-3 sm:p-6 animate-fade-in">
      {/* Welcome Banner with Level Progress */}
      <div className="bg-gradient-to-r from-forest to-forest/80 text-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-8">
        <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">Welcome, {player.name}! 🏢</h1>
            <p className="text-day/90 text-sm sm:text-base">Ready to earn coins and climb the ranks?</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg sm:text-2xl font-bold">{level}</p>
            <p className="text-xs sm:text-sm text-day/70">Your rank</p>
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

      {/* Fortune Cookie */}
      <button
        onClick={() => setFortuneOpen(!fortuneOpen)}
        className="w-full mb-4 sm:mb-6 bg-white rounded-xl shadow-md p-3 sm:p-4 text-left hover:shadow-lg transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl sm:text-3xl shrink-0">🥠</span>
          {fortuneOpen ? (
            <div className="min-w-0 animate-fade-in">
              <p className="text-sm sm:text-base font-semibold text-night">{todayFortune.fact}</p>
              <p className="text-xs sm:text-sm text-forest mt-1">{todayFortune.tip}</p>
            </div>
          ) : (
            <p className="text-sm sm:text-base text-gray-500 font-medium">Today's Fortune Cookie - tap to open!</p>
          )}
        </div>
      </button>

      {/* Room Cards Grouped by Category */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-night mb-3 sm:mb-4">Real Work Rooms</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {rooms.filter(r => r.category === 'work').map((room) => (
            <button
              key={room.id}
              onClick={() => !room.locked && onNavigate(room.id)}
              disabled={room.locked}
              className={`p-3 sm:p-6 rounded-xl text-white font-bold transition transform hover:scale-105 ${
                room.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'
              } bg-gradient-to-br ${room.color}`}
            >
              <div className="text-3xl sm:text-5xl mb-2 sm:mb-3">{room.emoji}</div>
              <div className="text-left">
                <h3 className="font-bold text-sm sm:text-lg">{room.title}</h3>
                <p className="text-xs sm:text-sm text-white/80 mt-1 hidden sm:block">{room.description}</p>
              </div>
              {room.earnsCoins && <div className="text-xs mt-2 sm:mt-3 bg-white/20 px-2 py-0.5 sm:py-1 rounded-full inline-block">💰 Earns coins</div>}
              {room.locked && <div className="text-xs sm:text-sm mt-2 sm:mt-3">🔒 Age 10+</div>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg sm:text-xl font-bold text-night mb-3 sm:mb-4">Fun & Games</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {rooms.filter(r => r.category === 'fun').map((room) => (
            <button
              key={room.id}
              onClick={() => !room.locked && onNavigate(room.id)}
              disabled={room.locked}
              className={`p-3 sm:p-6 rounded-xl text-white font-bold transition transform hover:scale-105 ${
                room.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'
              } bg-gradient-to-br ${room.color}`}
            >
              <div className="text-3xl sm:text-5xl mb-2 sm:mb-3">{room.emoji}</div>
              <div className="text-left">
                <h3 className="font-bold text-sm sm:text-lg">{room.title}</h3>
                <p className="text-xs sm:text-sm text-white/80 mt-1 hidden sm:block">{room.description}</p>
              </div>
              {room.locked && <div className="text-xs sm:text-sm mt-2 sm:mt-3">🔒 Age 10+</div>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg sm:text-xl font-bold text-night mb-3 sm:mb-4">Personal</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {rooms.filter(r => r.category === 'personal').map((room) => (
            <button
              key={room.id}
              onClick={() => !room.locked && onNavigate(room.id)}
              disabled={room.locked}
              className={`p-3 sm:p-6 rounded-xl text-white font-bold transition transform hover:scale-105 ${
                room.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'
              } bg-gradient-to-br ${room.color}`}
            >
              <div className="text-3xl sm:text-5xl mb-2 sm:mb-3">{room.emoji}</div>
              <div className="text-left">
                <h3 className="font-bold text-sm sm:text-lg">{room.title}</h3>
                <p className="text-xs sm:text-sm text-white/80 mt-1 hidden sm:block">{room.description}</p>
              </div>
              {room.locked && <div className="text-xs sm:text-sm mt-2 sm:mt-3">🔒 Age 10+</div>}
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

  // Default positions for desk items (used when no custom position saved)
  const DEFAULT_POSITIONS = {
    '🌱': { top: 8, left: 2 }, '☕': { top: 52, left: 68 }, '⭐': { top: 28, left: 38 },
    '💡': { top: 12, left: 75 }, '🏆': { top: 6, left: 88 }, '📛': { top: 58, left: 30 },
    '🎧': { top: 18, left: 55 }, '🦆': { top: 48, left: 18 }, '🐠': { top: 5, left: 15 },
    '🪩': { top: 3, left: 45 }, '📚': { top: 8, left: 90 }, '🍪': { top: 55, left: 85 },
    '🌍': { top: 4, left: 70 }, '✨': { top: 10, left: 35 }, '🧸': { top: 50, left: 5 },
    '🎨': { top: 15, left: 8 }, '🪴': { top: 52, left: 50 }, '🕰️': { top: 3, left: 60 },
    '🎀': { top: 22, left: 90 }, '🔮': { top: 48, left: 78 },
  }
  const DESK_ITEM_META = {
    '🌱': { name: 'Plant', size: 'text-3xl sm:text-4xl' },
    '☕': { name: 'Coffee Mug', size: 'text-2xl sm:text-3xl' },
    '⭐': { name: 'Laptop Sticker', size: 'text-xl sm:text-2xl' },
    '💡': { name: 'Desk Lamp', size: 'text-3xl sm:text-4xl' },
    '🏆': { name: 'Trophy', size: 'text-3xl sm:text-4xl' },
    '📛': { name: 'Name Plate', size: 'text-xl sm:text-2xl' },
    '🎧': { name: 'Headphones', size: 'text-2xl sm:text-3xl' },
    '🦆': { name: 'Rubber Duck', size: 'text-2xl sm:text-3xl' },
    '🐠': { name: 'Fish Tank', size: 'text-3xl sm:text-4xl' },
    '🪩': { name: 'Disco Ball', size: 'text-3xl sm:text-4xl' },
    '📚': { name: 'Bookshelf', size: 'text-2xl sm:text-3xl' },
    '🍪': { name: 'Snack Bowl', size: 'text-2xl sm:text-3xl' },
    '🌍': { name: 'Globe', size: 'text-3xl sm:text-4xl' },
    '✨': { name: 'Fairy Lights', size: 'text-2xl sm:text-3xl' },
    '🧸': { name: 'Teddy Bear', size: 'text-3xl sm:text-4xl' },
    '🎨': { name: 'Art Easel', size: 'text-2xl sm:text-3xl' },
    '🪴': { name: 'Bonsai Tree', size: 'text-2xl sm:text-3xl' },
    '🕰️': { name: 'Desk Clock', size: 'text-2xl sm:text-3xl' },
    '🎀': { name: 'Bow', size: 'text-xl sm:text-2xl' },
    '🔮': { name: 'Crystal Ball', size: 'text-2xl sm:text-3xl' },
  }
  const ownedEmojis = player.desk_items || []
  const [positions, setPositions] = useState(player.desk_positions || {})
  const [dragging, setDragging] = useState(null)
  const deskRef = useRef(null)
  const saveTimeout = useRef(null)

  const getItemPos = (emoji) => {
    if (positions[emoji]) return positions[emoji]
    if (DEFAULT_POSITIONS[emoji]) return DEFAULT_POSITIONS[emoji]
    return { top: 50, left: 50 }
  }

  const savePositions = async (newPositions) => {
    // Debounce saves - wait 500ms after last drag
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      try {
        await supabase
          .from('players')
          .update({ desk_positions: newPositions })
          .eq('id', player.id)
      } catch (e) {
        console.error('Failed to save positions:', e)
      }
    }, 500)
  }

  const handleDragStart = (emoji, e) => {
    e.preventDefault()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setDragging({ emoji, startX: clientX, startY: clientY, startPos: getItemPos(emoji) })
  }

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const rect = deskRef.current?.getBoundingClientRect()
      if (!rect) return

      const dx = ((clientX - dragging.startX) / rect.width) * 100
      const dy = ((clientY - dragging.startY) / rect.height) * 100

      const newTop = Math.max(0, Math.min(85, dragging.startPos.top + dy))
      const newLeft = Math.max(0, Math.min(92, dragging.startPos.left + dx))

      const newPositions = { ...positions, [dragging.emoji]: { top: newTop, left: newLeft } }
      setPositions(newPositions)
    }
    const handleEnd = () => {
      savePositions(positions)
      setDragging(null)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleEnd)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [dragging, positions])

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 animate-fade-in">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
      >
        ← Back to Hub
      </button>

      {/* Visual Desk Illustration */}
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <h1 className="text-xl sm:text-3xl font-bold text-night truncate">{player.name}'s Desk</h1>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <span className="text-xs sm:text-sm bg-forest text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">{level}</span>
            <span className="text-xs sm:text-sm bg-sunshine text-night px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">{player.coins} 💰</span>
          </div>
        </div>

        <div ref={deskRef} className="relative w-full rounded-xl overflow-hidden select-none touch-none" style={{ aspectRatio: '16/9' }}>
          {/* Room background - wall */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky/30 to-sky/10"></div>

          {/* Window */}
          <div className="absolute top-4 left-4 w-16 sm:w-28 h-14 sm:h-24 bg-sky/40 rounded border-2 sm:border-4 border-white/80 shadow-inner">
            <div className="w-full h-1/2 border-b-2 border-white/50"></div>
          </div>

          {/* Desk surface */}
          <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-b from-amber-700 to-amber-800 rounded-t-sm">
            <div className="absolute top-3 left-0 right-0 h-px bg-amber-600/40"></div>
            <div className="absolute top-8 left-0 right-0 h-px bg-amber-900/20"></div>
            <div className="absolute top-0 left-0 right-0 h-2 bg-amber-900/30 rounded-t"></div>
          </div>

          {/* Monitor */}
          <div className="absolute" style={{ top: '12%', left: '30%', width: '40%' }}>
            <div className="bg-gray-800 rounded-lg p-0.5 sm:p-1 shadow-xl">
              <div className="bg-gradient-to-br from-forest/80 to-forest rounded aspect-video flex items-center justify-center">
                <div className="text-center text-white">
                  <p className="text-[8px] sm:text-xs font-bold opacity-80">FORWARD HQ</p>
                  <p className="text-sm sm:text-lg">👋</p>
                  <p className="text-[8px] sm:text-xs opacity-60">{player.name}</p>
                </div>
              </div>
            </div>
            <div className="mx-auto w-4 sm:w-8 h-1.5 sm:h-3 bg-gray-700"></div>
            <div className="mx-auto w-8 sm:w-16 h-0.5 sm:h-1 bg-gray-600 rounded-b"></div>
          </div>

          {/* Keyboard */}
          <div className="absolute bg-gray-300 rounded shadow-md" style={{ top: '62%', left: '32%', width: '28%', height: '8%' }}>
            <div className="absolute inset-0.5 sm:inset-1 bg-gray-200 rounded"></div>
          </div>

          {/* Mouse */}
          <div className="absolute bg-gray-300 rounded-full shadow" style={{ top: '64%', left: '65%', width: '3%', height: '5%' }}></div>

          {/* Chair back */}
          <div className="absolute bg-gray-700 rounded-t-xl shadow-lg" style={{ bottom: '44%', left: '40%', width: '20%', height: '15%' }}>
            <div className="absolute inset-1 sm:inset-2 rounded-t bg-gray-600"></div>
          </div>

          {/* Photo frame on wall */}
          <div className="absolute bg-amber-900 rounded shadow-md p-0.5 sm:p-1" style={{ top: '5%', left: '55%', width: '10%', maxWidth: '60px' }}>
            <div className="bg-white rounded-sm aspect-square flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base sm:text-2xl">🖼️</span>
              )}
            </div>
          </div>

          {/* Draggable owned items */}
          {ownedEmojis.map((emoji) => {
            const meta = DESK_ITEM_META[emoji]
            if (!meta) return null
            const pos = getItemPos(emoji)
            const isDragging = dragging?.emoji === emoji
            return (
              <div
                key={emoji}
                className={`absolute group ${isDragging ? 'z-50 scale-110' : 'z-10'} cursor-grab active:cursor-grabbing`}
                style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
                onMouseDown={(e) => handleDragStart(emoji, e)}
                onTouchStart={(e) => handleDragStart(emoji, e)}
                title={`${meta.name} - drag to move`}
              >
                <span className={`${meta.size} drop-shadow-lg inline-block transition-transform ${isDragging ? '' : 'hover:scale-125'}`}>
                  {emoji}
                </span>
                {!isDragging && (
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-night/80 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {meta.name}
                  </div>
                )}
              </div>
            )
          })}

          {/* Empty desk message */}
          {ownedEmojis.length === 0 && (
            <div className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 text-center">
              <p className="text-amber-200 text-xs sm:text-sm font-medium bg-amber-900/60 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">
                Your desk is empty! Visit the Shop to buy items
              </p>
            </div>
          )}

          {/* Drag hint */}
          {ownedEmojis.length > 0 && !dragging && (
            <div className="absolute bottom-1 right-2 text-[10px] sm:text-xs text-amber-300/70">
              Drag items to rearrange
            </div>
          )}
        </div>
      </div>

      {/* Profile & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Profile Photo */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="font-bold text-night mb-4">Profile Photo</h3>
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
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-forest to-forest/80 flex items-center justify-center text-white font-bold text-4xl overflow-hidden shadow-lg">
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

        {/* Stats */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-night mb-4">Your Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-day p-4 rounded-lg">
              <p className="text-sm text-gray-600">Level</p>
              <p className="text-2xl font-bold text-forest">{level}</p>
            </div>
            <div className="bg-sunshine/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Coins Earned</p>
              <p className="text-2xl font-bold text-sunshine">{player.total_coins_earned}</p>
            </div>
            <div className="bg-day p-4 rounded-lg">
              <p className="text-sm text-gray-600">Coins to Spend</p>
              <p className="text-2xl font-bold text-forest">{player.coins}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Tasks Completed</p>
              <p className="text-2xl font-bold text-purple-600">{player.tasks_completed || 0}</p>
            </div>
          </div>

          {/* Desk items inventory */}
          {ownedEmojis.length > 0 && (
            <div className="mt-4 bg-day p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Items on your desk ({ownedEmojis.length}/20)</p>
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {ownedEmojis.map((emoji, i) => (
                  <span key={i} className="text-xl sm:text-2xl" title={DESK_ITEM_META[emoji]?.name}>{emoji}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="font-bold text-night mb-3 sm:mb-4">Achievement Badges</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
          {[
            { emoji: '📸', title: 'Selfie Star', desc: 'Upload a profile photo', unlocked: !!player.avatar_url },
            { emoji: '🪙', title: 'First Coin', desc: 'Earn your first coin', unlocked: player.total_coins_earned >= 1 },
            { emoji: '💰', title: 'Money Maker', desc: 'Earn 100 coins', unlocked: player.total_coins_earned >= 100 },
            { emoji: '🤑', title: 'Coin Collector', desc: 'Earn 500 coins', unlocked: player.total_coins_earned >= 500 },
            { emoji: '👑', title: 'Coin Royalty', desc: 'Earn 1000 coins', unlocked: player.total_coins_earned >= 1000 },
            { emoji: '🛒', title: 'First Purchase', desc: 'Buy your first item', unlocked: ownedEmojis.length >= 1 },
            { emoji: '🛍️', title: 'Shopaholic', desc: 'Buy 5 items', unlocked: ownedEmojis.length >= 5 },
            { emoji: '🏠', title: 'Interior Designer', desc: 'Buy 10 items', unlocked: ownedEmojis.length >= 10 },
            { emoji: '💎', title: 'Collector', desc: 'Own every item', unlocked: ownedEmojis.length >= 20 },
            { emoji: '📊', title: 'Hard Worker', desc: 'Complete a task', unlocked: (player.tasks_completed || 0) >= 1 },
            { emoji: '🔥', title: 'On Fire', desc: 'Complete 10 tasks', unlocked: (player.tasks_completed || 0) >= 10 },
            { emoji: '⚡', title: 'Unstoppable', desc: 'Complete 25 tasks', unlocked: (player.tasks_completed || 0) >= 25 },
            { emoji: '🎯', title: 'Analyst', desc: 'Reach Analyst rank', unlocked: player.total_coins_earned >= 100 },
            { emoji: '📈', title: 'Manager', desc: 'Reach Manager rank', unlocked: player.total_coins_earned >= 300 },
            { emoji: '🏢', title: 'Director', desc: 'Reach Director rank', unlocked: player.total_coins_earned >= 700 },
            { emoji: '👔', title: 'CEO', desc: 'Reach CEO rank', unlocked: player.total_coins_earned >= 1500 },
            { emoji: '🌟', title: 'Day One', desc: 'Sign in for the first time', unlocked: true },
            { emoji: '🐠', title: 'Fancy', desc: 'Buy a legendary item', unlocked: ['🐠','🪩','🌍','🔮'].some(e => ownedEmojis.includes(e)) },
          ].map((badge, idx) => (
            <div
              key={idx}
              className={`p-2 sm:p-3 rounded-lg text-center transition ${
                badge.unlocked
                  ? 'bg-sunshine/20 border border-sunshine/50'
                  : 'bg-gray-50 opacity-40'
              }`}
              title={badge.desc}
            >
              <div className="text-2xl sm:text-3xl mb-1">{badge.emoji}</div>
              <p className="text-[10px] sm:text-xs font-semibold text-night leading-tight">{badge.title}</p>
              {badge.unlocked && <p className="text-[8px] sm:text-[10px] text-forest mt-0.5">Unlocked!</p>}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          {[true, player.total_coins_earned >= 1, player.total_coins_earned >= 100, player.total_coins_earned >= 500, player.total_coins_earned >= 1000, ownedEmojis.length >= 1, ownedEmojis.length >= 5, ownedEmojis.length >= 10, ownedEmojis.length >= 20, (player.tasks_completed || 0) >= 1, (player.tasks_completed || 0) >= 10, (player.tasks_completed || 0) >= 25, player.total_coins_earned >= 100, player.total_coins_earned >= 300, player.total_coins_earned >= 700, player.total_coins_earned >= 1500, !!player.avatar_url, ['🐠','🪩','🌍','🔮'].some(e => ownedEmojis.includes(e))].filter(Boolean).length} / 18 badges unlocked
        </p>
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

  // Dependent picklist from Salesforce - Relationship options depend on Contact Type
  const DEPENDENT_PICKLIST = {
    'Organisation': [
      'Board Member', 'Budget Holder', 'Chief Executive Officer', 'Decision Maker',
      'Founder', 'Line Manager', 'Organisation', 'Other', 'Senior Leader', 'Stakeholder',
    ],
    'Human Resources': [
      'Head of Leadership', 'Head of Learning', 'Head of People', 'Head of Talent',
      'HR Contact', 'Key HR', 'Line Manager', 'Senior HR',
    ],
  }
  const CONTACT_TYPES = Object.keys(DEPENDENT_PICKLIST)
  const RELATIONSHIPS = selectedType ? (DEPENDENT_PICKLIST[selectedType] || []) : []

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
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center">
          <p className="text-lg text-gray-600">No pending contacts to classify.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 animate-fade-in">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
      >
        ← Back to Hub
      </button>

      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact Classifier</h1>
          <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap">
            <span className="bg-day px-2 sm:px-3 py-1 rounded-full font-semibold text-forest">
              {currentIndex + 1}/{contacts.length}
            </span>
            <span className="bg-sunshine/20 px-2 sm:px-3 py-1 rounded-full font-semibold text-sunshine">
              {stats.completed} done
            </span>
            <span className="bg-day px-2 sm:px-3 py-1 rounded-full font-semibold text-forest">
              Streak: {stats.streak}
            </span>
          </div>
        </div>

        {currentContact && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-day p-4 sm:p-6 rounded-lg border-l-4 border-earth">
              <h2 className="text-lg sm:text-2xl font-bold text-night mb-3 sm:mb-4">{currentContact.title}</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Contact Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => { setSelectedType(e.target.value); setSelectedRel('') }}
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
                  <option value="">{selectedType ? 'Select relationship...' : 'Pick a contact type first...'}</option>
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {!suggestion && (
                <button
                  onClick={getAISuggestion}
                  disabled={loadingSuggestion}
                  className="flex-1 bg-sky text-white py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base hover:opacity-90 disabled:opacity-50 transition"
                >
                  {loadingSuggestion ? 'Thinking... 🤔' : 'AI Suggestion 💡'}
                </button>
              )}
              <button
                onClick={submitClassification}
                disabled={!selectedType || !selectedRel}
                className="flex-1 bg-forest text-white py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base hover:opacity-90 disabled:opacity-50 transition"
              >
                Submit ✓
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
      <div className="max-w-4xl mx-auto p-3 sm:p-6 animate-fade-in">
        <button
          onClick={() => onNavigate('hub')}
          className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
        >
          ← Back to Hub
        </button>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center">
          <p className="text-base sm:text-lg text-gray-600">All logos found! Great work!</p>
        </div>
      </div>
    )
  }

  const progress = organisations.length > 0 ? Math.round(((currentIndex + 1) / organisations.length) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 animate-fade-in">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
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

      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Find This Logo</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
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
    <div className="max-w-4xl mx-auto p-3 sm:p-6 animate-fade-in">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
      >
        ← Back to Hub
      </button>

      {!game ? (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🎮 The Arcade</h1>
            <p className="text-gray-600">Play games and earn coins!</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <button
              onClick={() => setGame('speedtyper')}
              className="bg-gradient-to-br from-sky to-sky/80 text-white p-4 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">⌨️</div>
              <h3 className="text-base sm:text-2xl font-bold mb-1 sm:mb-2">Speed Typer</h3>
              <p className="text-sky/90 text-xs sm:text-base hidden sm:block">Type sentences as fast as you can!</p>
            </button>
            <button
              onClick={() => setGame('memory')}
              className="bg-gradient-to-br from-pink-400 to-pink-500 text-white p-4 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">🧠</div>
              <h3 className="text-base sm:text-2xl font-bold mb-1 sm:mb-2">Memory Match</h3>
              <p className="text-pink-100 text-xs sm:text-base hidden sm:block">Test your memory with emoji pairs!</p>
            </button>
          </div>
        </div>
      ) : game === 'speedtyper' ? (
        <SpeedTyperGame onBack={() => setGame(null)} onUpdateCoins={onUpdateCoins} playerAge={player.age} />
      ) : game === 'memory' ? (
        <MemoryGame onBack={() => setGame(null)} onUpdateCoins={onUpdateCoins} playerAge={player.age} />
      ) : null}
    </div>
  )
}

// Speed Typer Game
function SpeedTyperGame({ onBack, onUpdateCoins, playerAge = 12 }) {
  const startingDifficulty = playerAge >= 13 ? 3 : playerAge >= 10 ? 2 : 1
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
  const [difficulty, setDifficulty] = useState(startingDifficulty)
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
      fetchSentence(startingDifficulty)
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

    // Adaptive difficulty - progress after every 2 completed rounds, regress only on very slow typing
    const wpmThisRound = words / (elapsed / 60)
    let newDiff = difficulty
    // Check accuracy: how close was the input to the sentence?
    const accuracy = input.trim().length / Math.max(1, sentence.trim().length)
    if (accuracy > 0.8 && wpmThisRound > 15) {
      // Good enough effort - increase difficulty every 2 rounds
      if ((completedRounds + 1) % 2 === 0) {
        newDiff = Math.min(5, difficulty + 1)
      }
    } else if (wpmThisRound < 10) {
      // Only drop if really struggling
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
  // Younger players get a small coin boost to keep things fun
  const ageBonus = playerAge >= 13 ? 1 : playerAge >= 10 ? 1.2 : 1.4
  const totalCoins = Math.round(Math.min(40, Math.max(5, (completedRounds * 3 + Math.round(finalWPM / 10)) * ageBonus)))

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
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center">
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
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-2xl font-bold text-night">Speed Typer</h1>
          <div className="flex gap-1.5 sm:gap-4 text-xs sm:text-sm">
            <span className="bg-day px-2 sm:px-3 py-1 rounded-full">Round {round + 1}</span>
            <span className="bg-day px-2 sm:px-3 py-1 rounded-full">Level {difficulty}/5</span>
            <span className={`px-2 sm:px-3 py-1 rounded-full font-bold ${timeLeft <= 10 ? 'bg-earth text-white' : 'bg-forest text-white'}`}>
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
            <div className="bg-day p-3 sm:p-6 rounded-lg mb-4 sm:mb-6 min-h-16 sm:min-h-24 flex items-center justify-center">
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
              className="w-full p-3 sm:p-4 border-2 border-forest/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest text-base sm:text-lg mb-2 sm:mb-3"
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
function MemoryGame({ onBack, onUpdateCoins, playerAge = 12 }) {
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
          const ageBonus = playerAge >= 13 ? 1 : playerAge >= 10 ? 1.2 : 1.4
          onUpdateCoins(Math.round(Math.max(10, 50 - moves) * ageBonus))
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
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center">
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
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-2xl font-bold text-night">Memory Match: {theme.name}</h1>
          <span className="bg-day px-2 sm:px-3 py-1 rounded-full font-semibold text-forest text-xs sm:text-sm">Moves: {moves}</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mb-4 sm:mb-6">
          {deck.map((emoji, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`aspect-square text-2xl sm:text-4xl rounded-lg transition transform hover:scale-110 ${
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
    <div className="max-w-4xl mx-auto p-3 sm:p-6 animate-fade-in">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
      >
        ← Back to Hub
      </button>

      {!game ? (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">☕ The Break Room</h1>
            <p className="text-gray-600">Relax with word games and puzzles!</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            <button
              onClick={() => setGame('scramble')}
              className="bg-gradient-to-br from-purple-400 to-purple-500 text-white p-4 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">🔤</div>
              <h3 className="text-base sm:text-2xl font-bold mb-1 sm:mb-2">Word Scramble</h3>
              <p className="text-purple-100 text-xs sm:text-base hidden sm:block">Unscramble business words!</p>
            </button>
            <button
              onClick={() => setGame('trivia')}
              className="bg-gradient-to-br from-sky to-sky/80 text-white p-4 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">🧠</div>
              <h3 className="text-base sm:text-2xl font-bold mb-1 sm:mb-2">Office Trivia</h3>
              <p className="text-sky-100 text-xs sm:text-base hidden sm:block">Test your knowledge!</p>
            </button>
            <button
              onClick={() => setGame('oddoneout')}
              className="bg-gradient-to-br from-earth to-earth/80 text-white p-4 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition col-span-2 md:col-span-1"
            >
              <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">🔍</div>
              <h3 className="text-base sm:text-2xl font-bold mb-1 sm:mb-2">Odd One Out</h3>
              <p className="text-orange-100 text-xs sm:text-base hidden sm:block">Spot the one that doesn't belong!</p>
            </button>
          </div>
        </div>
      ) : game === 'scramble' ? (
        <WordScrambleGame onBack={() => setGame(null)} onUpdateCoins={onUpdateCoins} playerAge={player.age} />
      ) : game === 'trivia' ? (
        <TriviaGame onBack={() => setGame(null)} onUpdateCoins={onUpdateCoins} playerAge={player.age} />
      ) : game === 'oddoneout' ? (
        <OddOneOutGame onBack={() => setGame(null)} onUpdateCoins={onUpdateCoins} playerAge={player.age} />
      ) : null}
    </div>
  )
}

// Word Scramble Game
function WordScrambleGame({ onBack, onUpdateCoins, playerAge = 12 }) {
  const difficulty = playerAge >= 13 ? 'hard' : playerAge >= 10 ? 'medium' : 'easy'

  const FALLBACK_WORDS = {
    easy: ['TEAM', 'PLAN', 'LEAD', 'GOAL', 'WORK', 'IDEA', 'GROW'],
    medium: ['LEADER', 'OFFICE', 'GROWTH', 'CHANGE', 'VALUES', 'IMPACT', 'VISION'],
    hard: ['STRATEGY', 'TEAMWORK', 'PROGRESS', 'BUSINESS', 'CREATIVE', 'AMBITION', 'DECISION'],
  }

  const [words, setWords] = useState([])
  const [round, setRound] = useState(1)
  const [currentWord, setCurrentWord] = useState('')
  const [input, setInput] = useState('')
  const [correct, setCorrect] = useState(0)
  const [loading, setLoading] = useState(true)
  const [answered, setAnswered] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)

  const generateScrambledWord = (word) => {
    if (!word || word.length <= 1) return word
    let scrambled
    let attempts = 0
    do {
      scrambled = word.split('').sort(() => Math.random() - 0.5).join('')
      attempts++
    } while (scrambled === word && attempts < 20)
    return scrambled
  }

  useEffect(() => {
    fetchWords()
  }, [])

  const fetchWords = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/word-scramble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 7, difficulty }),
      })
      const data = await res.json()
      if (data.words?.length) {
        setWords(data.words)
        setCurrentWord(generateScrambledWord(data.words[0]))
      } else {
        throw new Error('No words')
      }
    } catch {
      const fallback = FALLBACK_WORDS[difficulty] || FALLBACK_WORDS.medium
      setWords(fallback)
      setCurrentWord(generateScrambledWord(fallback[0]))
    }
    setLoading(false)
  }

  useEffect(() => {
    if (words.length > 0 && round <= words.length) {
      setCurrentWord(generateScrambledWord(words[round - 1]))
    }
  }, [round, words])

  const handleSubmit = () => {
    if (answered !== null || !words[round - 1]) return
    const isCorrect = input.toUpperCase().trim() === words[round - 1]
    setAnswered(isCorrect)
    setShowAnswer(true)

    if (isCorrect) {
      setCorrect(correct + 1)
      // Base coins by difficulty, with age bonus for younger players
      const baseCoins = difficulty === 'hard' ? 8 : difficulty === 'medium' ? 5 : 3
      const ageBonus = playerAge >= 13 ? 1 : playerAge >= 10 ? 1.3 : 1.5
      onUpdateCoins(Math.round(baseCoins * ageBonus))
    }

    setTimeout(() => {
      setAnswered(null)
      setShowAnswer(false)
      setInput('')
      if (round < words.length) {
        setRound(round + 1)
      } else {
        setRound(round + 1) // triggers finished state
      }
    }, 1800)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition text-sm sm:text-base">← Back</button>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center">
          <div className="animate-pulse text-2xl mb-4">🔤</div>
          <p className="text-gray-600">AI is picking words ({difficulty} mode)...</p>
        </div>
      </div>
    )
  }

  if (round > words.length) {
    const baseCoins = difficulty === 'hard' ? 8 : difficulty === 'medium' ? 5 : 3
    const ageBonus = playerAge >= 13 ? 1 : playerAge >= 10 ? 1.3 : 1.5
    const totalCoins = Math.round(correct * baseCoins * ageBonus)
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition text-sm sm:text-base">← Back</button>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center">
          <div className="text-6xl mb-4">{correct >= 5 ? '🏆' : correct >= 3 ? '👏' : '💪'}</div>
          <h2 className="text-3xl font-bold text-night mb-2">Complete!</h2>
          <p className="text-4xl font-bold text-forest mb-1">{correct}/{words.length}</p>
          <p className="text-gray-600 mb-2">correct answers</p>
          <p className="text-sm text-gray-500 mb-2">Difficulty: {difficulty}</p>
          <p className="text-lg font-bold text-sunshine mb-6">{totalCoins} coins earned</p>
          <button onClick={onBack} className="bg-forest text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition">
            Back to Break Room
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition text-sm sm:text-base">← Back</button>
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-night">Word Scramble</h1>
          <div className="flex gap-3 text-sm">
            <span className="bg-day px-3 py-1 rounded-full">Round {round}/{words.length}</span>
            <span className="bg-forest text-white px-3 py-1 rounded-full">{correct} correct</span>
          </div>
        </div>

        <div className="bg-night p-8 rounded-xl mb-6 text-center">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Unscramble this word</p>
          <p className="text-4xl font-bold text-sunshine tracking-widest font-mono">{currentWord}</p>
          <p className="text-xs text-gray-500 mt-2">{words[round - 1]?.length} letters</p>
        </div>

        {showAnswer && (
          <div className={`mb-4 p-3 rounded-lg text-center font-bold ${answered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {answered ? 'Correct! ✨' : `Not quite - it was ${words[round - 1]}`}
          </div>
        )}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
          disabled={answered !== null}
          className="w-full p-4 border-2 border-forest/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest mb-4 text-lg uppercase tracking-wider"
          placeholder="Type the answer..."
        />

        <button
          onClick={handleSubmit}
          disabled={answered !== null || !input.trim()}
          className="w-full bg-forest text-white py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition"
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
    <div className="max-w-6xl mx-auto p-3 sm:p-6 animate-fade-in">
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
                <th className="px-2 sm:px-6 py-2 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">#</th>
                <th className="px-2 sm:px-6 py-2 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Player</th>
                <th className="px-2 sm:px-6 py-2 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Level</th>
                <th className="px-2 sm:px-6 py-2 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">💰</th>
                <th className="px-2 sm:px-6 py-2 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">Tasks</th>
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
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-900">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-forest to-forest/80 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="Avatar" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover" />
                          ) : (
                            p.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-gray-900 truncate">{p.name}</span>
                        {isCurrentPlayer && <span className="ml-1 text-xs">👈</span>}
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-700">{level}</td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-semibold text-sunshine">{p.total_coins_earned}</td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-700 hidden sm:table-cell">{p.tasks_completed || 0}</td>
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

// TRIVIA GAME
function TriviaGame({ onBack, onUpdateCoins, playerAge = 12 }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [coinsPaid, setCoinsPaid] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/trivia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 7 }),
      })
      const data = await res.json()
      setQuestions(data.questions || [])
    } catch (e) {
      console.error('Failed to fetch trivia:', e)
    }
    setLoading(false)
  }

  const handleAnswer = (index) => {
    if (selected !== null) return
    setSelected(index)
    if (index === questions[current].correct) {
      setScore(score + 1)
    }
  }

  const nextQuestion = () => {
    if (current + 1 >= questions.length) {
      setGameOver(true)
    } else {
      setCurrent(current + 1)
      setSelected(null)
    }
  }

  const ageBonus = playerAge >= 13 ? 1 : playerAge >= 10 ? 1.2 : 1.4
  const totalCoins = Math.round(score * 5 * ageBonus)

  useEffect(() => {
    if (gameOver && !coinsPaid) {
      setCoinsPaid(true)
      onUpdateCoins(totalCoins > 0 ? totalCoins : 2)
    }
  }, [gameOver])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition text-sm sm:text-base">← Back</button>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center">
          <div className="animate-pulse text-4xl mb-4">🧠</div>
          <p className="text-gray-600">AI is creating trivia questions...</p>
        </div>
      </div>
    )
  }

  if (gameOver) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition text-sm sm:text-base">← Back</button>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center">
          <div className="text-6xl mb-4">{score >= 5 ? '🏆' : score >= 3 ? '🌟' : '💪'}</div>
          <h2 className="text-3xl font-bold text-night mb-2">Trivia Complete!</h2>
          <p className="text-xl text-gray-600 mb-2">{score} / {questions.length} correct</p>
          <p className="text-lg font-bold text-sunshine mb-6">{totalCoins} coins earned</p>
          <button onClick={onBack} className="px-6 py-3 bg-forest text-white rounded-lg font-bold hover:opacity-90 transition">Back to Break Room</button>
        </div>
      </div>
    )
  }

  if (!questions.length) return null
  const q = questions[current]

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition text-sm sm:text-base">← Back</button>
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-semibold text-forest bg-day px-3 py-1 rounded-full">Question {current + 1}/{questions.length}</span>
          <span className="text-sm font-semibold text-sunshine bg-sunshine/20 px-3 py-1 rounded-full">Score: {score}</span>
        </div>

        <h2 className="text-xl font-bold text-night mb-6">{q.q}</h2>

        <div className="grid grid-cols-1 gap-3 mb-6">
          {q.options.map((option, i) => {
            let classes = 'w-full text-left p-4 rounded-lg font-semibold transition border-2 '
            if (selected === null) {
              classes += 'border-gray-200 hover:border-forest hover:bg-day cursor-pointer'
            } else if (i === q.correct) {
              classes += 'border-green-500 bg-green-50 text-green-800'
            } else if (i === selected) {
              classes += 'border-red-400 bg-red-50 text-red-700'
            } else {
              classes += 'border-gray-200 opacity-50'
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null} className={classes}>
                {option}
              </button>
            )
          })}
        </div>

        {selected !== null && (
          <div className="animate-fade-in">
            {q.funFact && <p className="text-sm text-gray-600 bg-day p-3 rounded-lg mb-4">💡 {q.funFact}</p>}
            <button onClick={nextQuestion} className="w-full py-3 bg-forest text-white rounded-lg font-bold hover:opacity-90 transition">
              {current + 1 >= questions.length ? 'See Results' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ODD ONE OUT GAME
function OddOneOutGame({ onBack, onUpdateCoins, playerAge = 12 }) {
  const [sets, setSets] = useState([])
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [loading, setLoading] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [coinsPaid, setCoinsPaid] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchSets()
  }, [])

  const fetchSets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/odd-one-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 7 }),
      })
      const data = await res.json()
      setSets(data.sets || [])
    } catch (e) {
      console.error('Failed to fetch odd one out:', e)
    }
    setLoading(false)
  }

  const handlePick = (item) => {
    if (selected !== null) return
    setSelected(item)
    if (item === sets[current].odd) {
      setScore(score + 1)
    }
  }

  const nextRound = () => {
    if (current + 1 >= sets.length) {
      setGameOver(true)
    } else {
      setCurrent(current + 1)
      setSelected(null)
      setShowHint(false)
    }
  }

  const ageBonus = playerAge >= 13 ? 1 : playerAge >= 10 ? 1.2 : 1.4
  const totalCoins = Math.round(score * 6 * ageBonus)

  useEffect(() => {
    if (gameOver && !coinsPaid) {
      setCoinsPaid(true)
      onUpdateCoins(totalCoins > 0 ? totalCoins : 2)
    }
  }, [gameOver])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition text-sm sm:text-base">← Back</button>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center">
          <div className="animate-pulse text-4xl mb-4">🔍</div>
          <p className="text-gray-600">AI is creating puzzles...</p>
        </div>
      </div>
    )
  }

  if (gameOver) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition text-sm sm:text-base">← Back</button>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center">
          <div className="text-6xl mb-4">{score >= 5 ? '🏆' : score >= 3 ? '🌟' : '💪'}</div>
          <h2 className="text-3xl font-bold text-night mb-2">Odd One Out Complete!</h2>
          <p className="text-xl text-gray-600 mb-2">{score} / {sets.length} correct</p>
          <p className="text-lg font-bold text-sunshine mb-6">{totalCoins} coins earned</p>
          <button onClick={onBack} className="px-6 py-3 bg-forest text-white rounded-lg font-bold hover:opacity-90 transition">Back to Break Room</button>
        </div>
      </div>
    )
  }

  if (!sets.length) return null
  const puzzle = sets[current]

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-day text-night rounded-lg hover:bg-gray-200 transition text-sm sm:text-base">← Back</button>
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-semibold text-forest bg-day px-3 py-1 rounded-full">Puzzle {current + 1}/{sets.length}</span>
          <span className="text-sm font-semibold text-sunshine bg-sunshine/20 px-3 py-1 rounded-full">Score: {score}</span>
        </div>

        <h2 className="text-xl font-bold text-night mb-2">Which one doesn't belong?</h2>
        <p className="text-gray-500 text-sm mb-6">Tap the odd one out</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {puzzle.items.map((item, i) => {
            let classes = 'p-6 rounded-xl text-center font-bold text-lg transition border-3 cursor-pointer '
            if (selected === null) {
              classes += 'border-2 border-gray-200 hover:border-forest hover:bg-day'
            } else if (item === puzzle.odd) {
              classes += 'border-2 border-green-500 bg-green-50 text-green-800'
            } else if (item === selected) {
              classes += 'border-2 border-red-400 bg-red-50 text-red-700'
            } else {
              classes += 'border-2 border-gray-200 opacity-50'
            }
            return (
              <button key={i} onClick={() => handlePick(item)} disabled={selected !== null} className={classes}>
                {item}
              </button>
            )
          })}
        </div>

        {selected === null && !showHint && (
          <button onClick={() => setShowHint(true)} className="text-sm text-sky underline hover:text-sky/80 transition">Need a hint?</button>
        )}

        {showHint && selected === null && (
          <p className="text-sm text-sky bg-sky/10 p-3 rounded-lg animate-fade-in">💡 {puzzle.hint}</p>
        )}

        {selected !== null && (
          <div className="animate-fade-in">
            <p className="text-sm text-gray-600 bg-day p-3 rounded-lg mb-4">
              {selected === puzzle.odd ? '✅ Correct!' : `❌ It was ${puzzle.odd}.`} {puzzle.hint}
            </p>
            <button onClick={nextRound} className="w-full py-3 bg-forest text-white rounded-lg font-bold hover:opacity-90 transition">
              {current + 1 >= sets.length ? 'See Results' : 'Next Puzzle →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// SHOP SCREEN
function ShopScreen({ player, onNavigate, onUpdateCoins }) {
  // Price multiplier based on age - younger kids get cheaper prices so they can afford things faster
  const priceMultiplier = player.age >= 13 ? 1 : player.age >= 10 ? 0.7 : 0.5

  const baseItems = [
    // Starter items
    { id: 'sticker', emoji: '⭐', name: 'Laptop Sticker', basePrice: 20, tier: 'starter' },
    { id: 'coffee', emoji: '☕', name: 'Coffee Mug', basePrice: 30, tier: 'starter' },
    { id: 'duck', emoji: '🦆', name: 'Rubber Duck', basePrice: 40, tier: 'starter' },
    { id: 'plant', emoji: '🌱', name: 'Plant', basePrice: 50, tier: 'starter' },
    { id: 'bow', emoji: '🎀', name: 'Bow', basePrice: 35, tier: 'starter' },
    // Mid-range items
    { id: 'lamp', emoji: '💡', name: 'Desk Lamp', basePrice: 80, tier: 'mid' },
    { id: 'nameplate', emoji: '📛', name: 'Name Plate', basePrice: 100, tier: 'mid' },
    { id: 'snacks', emoji: '🍪', name: 'Snack Bowl', basePrice: 90, tier: 'mid' },
    { id: 'bonsai', emoji: '🪴', name: 'Bonsai Tree', basePrice: 110, tier: 'mid' },
    { id: 'clock', emoji: '🕰️', name: 'Desk Clock', basePrice: 120, tier: 'mid' },
    { id: 'bookshelf', emoji: '📚', name: 'Bookshelf', basePrice: 130, tier: 'mid' },
    // Premium items
    { id: 'headphones', emoji: '🎧', name: 'Headphones', basePrice: 150, tier: 'premium' },
    { id: 'trophy', emoji: '🏆', name: 'Trophy', basePrice: 200, tier: 'premium' },
    { id: 'fairylights', emoji: '✨', name: 'Fairy Lights', basePrice: 180, tier: 'premium' },
    { id: 'teddy', emoji: '🧸', name: 'Teddy Bear', basePrice: 175, tier: 'premium' },
    { id: 'easel', emoji: '🎨', name: 'Art Easel', basePrice: 200, tier: 'premium' },
    // Legendary items
    { id: 'fishtank', emoji: '🐠', name: 'Fish Tank', basePrice: 300, tier: 'legendary' },
    { id: 'discoball', emoji: '🪩', name: 'Disco Ball', basePrice: 350, tier: 'legendary' },
    { id: 'globe', emoji: '🌍', name: 'Globe', basePrice: 400, tier: 'legendary' },
    { id: 'crystalball', emoji: '🔮', name: 'Crystal Ball', basePrice: 500, tier: 'legendary' },
  ]

  const items = baseItems.map(item => ({
    ...item,
    price: Math.round(item.basePrice * priceMultiplier),
  }))

  const handleBuy = async (item) => {
    if (player.coins < item.price) return

    const newBalance = player.coins - item.price
    const updatedDesk = [...(player.desk_items || []), item.emoji]

    // Call onUpdateCoins with negative amount and updated desk items
    onUpdateCoins(-item.price, updatedDesk)
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 animate-fade-in">
      <button
        onClick={() => onNavigate('hub')}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Hub
      </button>

      <div className="mb-4 sm:mb-6 flex justify-between items-center gap-2">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🛍️ The Shop</h1>
          <p className="text-gray-600 text-sm sm:text-base">Spend your coins on desk items!</p>
        </div>
        <div className="bg-day px-3 sm:px-6 py-2 sm:py-3 rounded-lg shrink-0">
          <p className="text-xs sm:text-sm text-gray-600">Balance</p>
          <p className="text-lg sm:text-2xl font-bold text-forest">{player.coins} 💰</p>
        </div>
      </div>

      {[
        { tier: 'starter', label: 'Starter', color: 'text-forest' },
        { tier: 'mid', label: 'Office Essentials', color: 'text-sky' },
        { tier: 'premium', label: 'Premium', color: 'text-earth' },
        { tier: 'legendary', label: 'Legendary', color: 'text-purple-600' },
      ].map(({ tier, label, color }) => {
        const tierItems = items.filter(i => i.tier === tier)
        return (
          <div key={tier} className="mb-4 sm:mb-8">
            <h2 className={`text-base sm:text-lg font-bold ${color} mb-2 sm:mb-3`}>
              {tier === 'legendary' ? '⭐ ' : ''}{label}
              {tier === 'legendary' ? ' ⭐' : ''}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
              {tierItems.map((item) => {
                const owned = player.desk_items?.includes(item.emoji)
                const canAfford = player.coins >= item.price
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl shadow-md p-2.5 sm:p-4 hover:shadow-lg transition ${tier === 'legendary' ? 'ring-1 ring-purple-200' : ''}`}
                  >
                    <div className="text-2xl sm:text-4xl mb-1.5 sm:mb-3 text-center">{item.emoji}</div>
                    <h3 className="font-bold text-gray-900 mb-0.5 sm:mb-1 text-xs sm:text-sm text-center">{item.name}</h3>
                    <p className="text-sm sm:text-lg font-bold text-sunshine mb-1.5 sm:mb-3 text-center">{item.price} 💰</p>
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={owned || !canAfford}
                      className={`w-full py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition ${
                        owned
                          ? 'bg-day text-forest cursor-default'
                          : canAfford
                            ? 'bg-forest text-white hover:opacity-90'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
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
      })}
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
