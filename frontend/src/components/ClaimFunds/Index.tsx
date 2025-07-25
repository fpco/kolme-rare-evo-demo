import { useState } from 'react';
import { claimFunds } from '../../kolmeclient';

const ClaimFunds = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleClaimFunds = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const block = await claimFunds();
      setMessage('Funds claimed successfully!');
      console.log('Claim funds transaction:', block);
    } catch (error) {
      console.error('Error claiming funds:', error);
      setMessage('Failed to claim funds. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={handleClaimFunds}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
      >
        {isLoading ? 'Claiming...' : 'Claim Funds'}
      </button>
      {message && (
        <p className={`text-xs ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default ClaimFunds;
