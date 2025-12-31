import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/shared/Button';
import { TrendingUp } from 'lucide-react';

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const signIn = useAuthStore(state => state.signIn);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signIn();
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center">
            <TrendingUp size={40} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">TradeZen</h1>
          <p className="text-text-secondary">
            Your personal trading journal
          </p>
        </div>

        {/* Features */}
        <div className="card mb-8 space-y-4">
          <Feature text="Track every trade with ease" />
          <Feature text="Analyze performance over time" />
          <Feature text="Sync across all your devices" />
          <Feature text="Never lose your data" />
        </div>

        {/* Sign In Button */}
        <Button
          onClick={handleSignIn}
          loading={loading}
          className="w-full"
          size="lg"
        >
          Sign in with Google
        </Button>

        {error && (
          <p className="text-loss text-sm text-center mt-4">{error}</p>
        )}

        {/* Privacy Note */}
        <p className="text-text-tertiary text-xs text-center mt-6">
          Your data is stored in your personal Google Drive.
          <br />
          Only you have access to it.
        </p>
      </div>
    </div>
  );
};

const Feature = ({ text }) => (
  <div className="flex items-center gap-3">
    <div className="w-6 h-6 rounded-full bg-profit/20 flex items-center justify-center flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-profit"></div>
    </div>
    <p className="text-text-secondary text-sm">{text}</p>
  </div>
);

export default SignIn;
