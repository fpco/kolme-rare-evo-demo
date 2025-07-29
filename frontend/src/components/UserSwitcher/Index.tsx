import { useState } from 'react'
import { setEncryptionKey } from '../../kolmeclient'

const UserSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [newUserKey, setNewUserKey] = useState('')

  const handleSwitchUser = async () => {
    if (newUserKey.trim()) {
      await setEncryptionKey(newUserKey.trim())
    }
  }

  const quickSwitchUser = async (userKey: string) => {
    await setEncryptionKey(userKey)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:opacity-90 hover:cursor-pointer text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
      >
        Switch User
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-10 bg-black/90 border border-gray-600 rounded-lg p-4 min-w-64 z-50">
          <div className="text-white text-sm mb-3">
            <div className="font-semibold mb-2">Switch to different user:</div>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['alice', 'bob', 'charlie', 'diana', 'eve', 'frank'].map((user) => (
                <button
                  key={user}
                  onClick={() => quickSwitchUser(user)}
                  className="bg-fpblock hover:bg-fpblock/80 text-white text-xs px-2 py-1 rounded transition-colors"
                >
                  {user}
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-600 pt-3">
              <input
                type="text"
                placeholder="Enter custom user key..."
                value={newUserKey}
                onChange={(e) => setNewUserKey(e.target.value)}
                className="w-full bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600 mb-2"
              />
              <button
                onClick={handleSwitchUser}
                disabled={!newUserKey.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs px-2 py-1 rounded transition-colors"
              >
                Switch User
              </button>
            </div>
            
            <div className="text-xs text-gray-400 mt-2">
              Note: Switching user will reload the page
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserSwitcher
