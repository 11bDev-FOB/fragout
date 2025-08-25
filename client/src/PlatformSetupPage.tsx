import React from 'react';
import CredentialsForm from './CredentialsForm';
import CredentialManager from './CredentialManager';

export default function PlatformSetupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Platform Setup</h1>
        <CredentialsForm />
        <CredentialManager />
      </div>
    </main>
  );
}
