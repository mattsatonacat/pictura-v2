"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Share2, RefreshCw, Mail, MessageSquare, Phone } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"

const MOCK_LANDMARKS = [
  { id: 1, name: 'Eiffel Tower', country: 'France', image: 'https://media.istockphoto.com/id/1449138519/photo/eiffel-tower-in-winter-paris-france.jpg?s=2048x2048&w=is&k=20&c=kn93tDRb2pW3FP3p_hHmJoOMqZjQk78vMJkChaw3Z_s=', lat: 48.8584, lon: 2.2945 },
  { id: 2, name: 'Taj Mahal', country: 'India', image: 'https://rlzjlvyqwxgqzjvjwxzj.supabase.co/storage/v1/object/public/images/taj-mahal.jpg', lat: 27.1751, lon: 78.0421 },
  { id: 3, name: 'Statue of Liberty', country: 'United States', image: '/placeholder.svg?height=300&width=300', lat: 40.6892, lon: -74.0445 },
  { id: 4, name: 'Machu Picchu', country: 'Peru', image: '/placeholder.svg?height=300&width=300', lat: -13.1631, lon: -72.5450 },
  { id: 5, name: 'Great Wall of China', country: 'China', image: '/placeholder.svg?height=300&width=300', lat: 40.4319, lon: 116.5704 },
]

const MAX_GUESSES = 6
const PIXELATION_LEVELS = [30, 25, 20, 15, 10, 5, 0]

const COUNTRY_COORDINATES = {
  'Afghanistan': { lat: 33.93911, lon: 67.709953 },
  'Albania': { lat: 41.153332, lon: 20.168331 },
  'Algeria': { lat: 28.033886, lon: 1.659626 },
  'Andorra': { lat: 42.546245, lon: 1.601554 },
  'Angola': { lat: -11.202692, lon: 17.873887 },
  'Argentina': { lat: -38.416097, lon: -63.616672 },
  'Australia': { lat: -25.274398, lon: 133.775136 },
  'Austria': { lat: 47.516231, lon: 14.550072 },
  'Brazil': { lat: -14.235004, lon: -51.92528 },
  'Canada': { lat: 56.130366, lon: -106.346771 },
  'China': { lat: 35.86166, lon: 104.195397 },
  'Egypt': { lat: 26.820553, lon: 30.802498 },
  'France': { lat: 46.227638, lon: 2.213749 },
  'Germany': { lat: 51.165691, lon: 10.451526 },
  'India': { lat: 20.593684, lon: 78.96288 },
  'Italy': { lat: 41.87194, lon: 12.56738 },
  'Japan': { lat: 36.204824, lon: 138.252924 },
  'Mexico': { lat: 23.634501, lon: -102.552784 },
  'New Zealand': { lat: -40.900557, lon: 174.885971 },
  'Peru': { lat: -9.189967, lon: -75.015152 },
  'Russia': { lat: 61.52401, lon: 105.318756 },
  'South Africa': { lat: -30.559482, lon: 22.937506 },
  'Spain': { lat: 40.463667, lon: -3.74922 },
  'United Kingdom': { lat: 55.378051, lon: -3.435973 },
  'United States': { lat: 37.09024, lon: -95.712891 },
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function getDirection(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = (lon2 - lon1) * Math.PI / 180
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180)
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon)
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return directions[Math.round(bearing / 45) % 8]
}

export default function PicturaGame() {
  const [currentLandmark, setCurrentLandmark] = useState(MOCK_LANDMARKS[0])
  const [guesses, setGuesses] = useState<string[]>([])
  const [guess, setGuess] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const [streak, setStreak] = useState(0)
  const [pixelationIndex, setPixelationIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    const storedStreak = localStorage.getItem('picturaStreak')
    if (storedStreak) {
      setStreak(parseInt(storedStreak))
    }

    const preloadImage = () => {
      const img = document.createElement('img')
      img.onload = () => {
        setImageLoaded(true)
        setImageError(false)
      }
      img.onerror = () => {
        setImageError(true)
        setImageLoaded(false)
        console.error('Failed to load image:', currentLandmark.image)
      }
      img.src = currentLandmark.image
    }

    preloadImage()

    const timeoutId = setTimeout(() => {
      if (!imageLoaded) {
        setImageError(true)
        console.error('Image load timed out:', currentLandmark.image)
      }
    }, 10000) // 10 seconds timeout

    return () => clearTimeout(timeoutId)
  }, [currentLandmark.image, imageLoaded])

  const handleGuess = () => {
    if (guess.toLowerCase() === currentLandmark.country.toLowerCase()) {
      setGameOver(true)
      const newStreak = streak + 1
      setStreak(newStreak)
      localStorage.setItem('picturaStreak', newStreak.toString())
      setPixelationIndex(PIXELATION_LEVELS.length - 1)
      setShowShareModal(true)
    } else {
      setGuesses([...guesses, guess])
      setPixelationIndex(Math.min(pixelationIndex + 1, PIXELATION_LEVELS.length - 1))
      if (guesses.length + 1 >= MAX_GUESSES) {
        setGameOver(true)
        localStorage.setItem('picturaStreak', '0')
        setPixelationIndex(PIXELATION_LEVELS.length - 1)
      }
      const guessedCountry = COUNTRY_COORDINATES[guess as keyof typeof COUNTRY_COORDINATES]
      if (guessedCountry) {
        const distance = calculateDistance(currentLandmark.lat, currentLandmark.lon, guessedCountry.lat, guessedCountry.lon)
        const direction = getDirection(currentLandmark.lat, currentLandmark.lon, guessedCountry.lat, guessedCountry.lon)
        setFeedback(`Your guess is ${Math.round(distance)} km ${direction} of the correct location.`)
      } else {
        setFeedback("Country not found in our database. Please try another guess.")
      }
    }
    setGuess('')
  }

  const pixelSize = PIXELATION_LEVELS[pixelationIndex]

  const shareResults = async (method: string) => {
    const result = `I guessed today's Pictura in ${guesses.length + 1} tries!`
    const shareText = `${result}\nPlay Pictura: https://pictura-game.com`

    switch (method) {
      case 'email':
        window.location.href = `mailto:?subject=Pictura Game Results&body=${encodeURIComponent(shareText)}`
        break
      case 'sms':
        window.location.href = `sms:?body=${encodeURIComponent(shareText)}`
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
        break
      default:
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Pictura Game Results',
              text: shareText,
              url: 'https://pictura-game.com',
            })
            toast({
              title: "Shared successfully!",
              description: "Your results have been shared.",
            })
          } catch (error) {
            console.error('Error sharing:', error)
            fallbackShare(shareText)
          }
        } else {
          fallbackShare(shareText)
        }
    }
    setShowShareModal(false)
  }

  const fallbackShare = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard!",
        description: "Your results have been copied. You can now paste them anywhere.",
      })
    }).catch(err => {
      console.error('Failed to copy: ', err)
      toast({
        title: "Sharing failed",
        description: "Unable to share or copy results. Please try again.",
        variant: "destructive",
      })
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Pictura</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative w-full h-64 bg-gray-200 overflow-hidden">
            {imageError ? (
              <div className="absolute inset-0 flex items-center justify-center text-red-500">
                Error loading image. Please try refreshing the page.
              </div>
            ) : imageLoaded ? (
              <div 
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${currentLandmark.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: `blur(${pixelSize / 2}px)`,
                  transition: 'filter 0.5s ease-out',
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Input 
              type="text" 
              placeholder="Guess the country" 
              value={guess} 
              onChange={(e) => setGuess(e.target.value)}
              disabled={gameOver}
            />
            <Button onClick={handleGuess} disabled={gameOver || !guess}>
              Guess
            </Button>
          </div>
          {feedback && <div className="text-sm text-blue-600">{feedback}</div>}
          <div className="text-sm">
            Guesses: {guesses.length} / {MAX_GUESSES}
          </div>
          <div className="text-sm">
            Streak: {streak}
          </div>
          {gameOver && !showShareModal && (
            <div className="text-center">
              <p className="font-bold">
                {guesses.length < MAX_GUESSES ? 'Congratulations!' : `The correct answer was ${currentLandmark.country}`}
              </p>
              <Button onClick={() => setShowShareModal(true)} className="mt-2">
                Share Results
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center">Share Your Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-center">You guessed correctly in {guesses.length + 1} tries!</p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={() => shareResults('email')} aria-label="Share via Email">
                    <Mail className="w-6 h-6" />
                  </Button>
                  <Button onClick={() => shareResults('sms')} aria-label="Share via SMS">
                    <MessageSquare className="w-6 h-6" />
                  </Button>
                  <Button onClick={() => shareResults('whatsapp')} aria-label="Share via WhatsApp">
                    <Phone className="w-6 h-6" />
                  </Button>
                  <Button onClick={() => shareResults('other')} aria-label="Other sharing options">
                    <Share2 className="w-6 h-6" />
                  </Button>
                </div>
                <Button onClick={() => window.location.reload()} className="w-full">
                  New Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
}
