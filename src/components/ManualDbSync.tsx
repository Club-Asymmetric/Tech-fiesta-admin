"use client";

import { useState } from 'react';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc, Firestore } from 'firebase/firestore';
import { Loader2, Copy, AlertCircle, CheckCircle, Database } from 'lucide-react';

// --- Interfaces and Helper Components ---

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const CustomButton = ({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
  >
    {children}
  </button>
);

const CustomTextarea = ({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder: string; }) => (
  <textarea
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full p-3 bg-gray-800 border-gray-600 border rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 transition-colors h-48"
  />
);

const CustomAlert = ({ type, title, message, details }: { type: 'success' | 'error'; title: string; message: string; details?: string[] }) => {
  const isSuccess = type === 'success';
  return (
    <div className={`p-4 border-l-4 rounded-md ${isSuccess ? 'bg-green-900/50 border-green-500 text-green-200' : 'bg-red-900/50 border-red-500 text-red-200'}`} role="alert">
      <div className="flex">
        <div className="py-1">
          {isSuccess ? <CheckCircle className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
        </div>
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm">{message}</p>
          {details && details.length > 0 && (
            <ul className="mt-2 text-sm list-disc list-inside">
              {details.map((detail, i) => <li key={i}>{detail}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Core Sync Logic ---

/**
 * Syncs a single collection from a source database to a destination database.
 * @returns The number of documents synced.
 */
async function syncCollection(sourceDb: Firestore, destDb: Firestore, collectionName: string): Promise<number> {
  const sourceCollectionRef = collection(sourceDb, collectionName);
  const snapshot = await getDocs(sourceCollectionRef);

  if (snapshot.empty) {
    return 0; // Nothing to sync
  }

  const allDocs = snapshot.docs;
  const chunkSize = 400; // Firestore batch limit is 500
  let processedCount = 0;

  for (let i = 0; i < allDocs.length; i += chunkSize) {
    const chunk = allDocs.slice(i, i + chunkSize);
    const batch = writeBatch(destDb);

    chunk.forEach((sourceDoc) => {
      const destDocRef = doc(destDb, collectionName, sourceDoc.id);
      batch.set(destDocRef, sourceDoc.data());
    });

    await batch.commit();
    processedCount += chunk.length;
  }
  return processedCount;
}


// --- Main Sync Component ---

export default function ManualDbSync() {
  const [sourceConfig, setSourceConfig] = useState('');
  const [destinationConfig, setDestinationConfig] = useState('');
  const [collectionsToSync, setCollectionsToSync] = useState<string[]>(['registrations']);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string[];
  } | null>(null);

  const handleCheckboxChange = (collectionName: string) => {
    setCollectionsToSync(prev =>
      prev.includes(collectionName)
        ? prev.filter(c => c !== collectionName)
        : [...prev, collectionName]
    );
  };

  const handleSync = async () => {
    setIsLoading(true);
    setStatus(null);

    let sourceApp: FirebaseApp | null = null;
    let destApp: FirebaseApp | null = null;

    try {
      let sourceJson: FirebaseConfig;
      let destJson: FirebaseConfig;
      try {
        sourceJson = JSON.parse(sourceConfig);
        destJson = JSON.parse(destinationConfig);
      } catch (e) {
        throw new Error('Invalid JSON format. Please copy the full firebaseConfig object.');
      }

      sourceApp = initializeApp(sourceJson, `source-sync-${Date.now()}`);
      destApp = initializeApp(destJson, `dest-sync-${Date.now()}`);

      const sourceDb = getFirestore(sourceApp);
      const destDb = getFirestore(destApp);
      
      const syncDetails: string[] = [];

      for (const collectionName of collectionsToSync) {
        const count = await syncCollection(sourceDb, destDb, collectionName);
        syncDetails.push(`Synced ${count} documents from '${collectionName}'.`);
      }

      setStatus({
        type: 'success',
        message: 'Sync process completed successfully.',
        details: syncDetails,
      });

    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'An unknown error occurred.' });
    } finally {
      if (sourceApp) await deleteApp(sourceApp);
      if (destApp) await deleteApp(destApp);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700">
      <div className="text-center mb-6">
        <Database className="mx-auto h-12 w-12 text-blue-400" />
        <h2 className="text-2xl font-bold mt-4">Manual Database Sync</h2>
        <p className="text-gray-400 mt-2">
          Select collections to copy from a source database to a destination database.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="sourceDb" className="block text-sm font-medium mb-2">Source Config (Copy From)</label>
          <CustomTextarea id="sourceDb" value={sourceConfig} onChange={(e) => setSourceConfig(e.target.value)} placeholder='Paste source firebaseConfig object here.' />
        </div>
        <div>
          <label htmlFor="destDb" className="block text-sm font-medium mb-2">Destination Config (Copy To)</label>
          <CustomTextarea id="destDb" value={destinationConfig} onChange={(e) => setDestinationConfig(e.target.value)} placeholder='Paste destination firebaseConfig object here.' />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-center">Collections to Sync</h3>
        <div className="flex justify-center items-center gap-6 bg-gray-800 p-4 rounded-md">
            {['registrations', 'payment_orders'].map(name => (
                <label key={name} className="flex items-center gap-2 cursor-pointer text-lg">
                    <input
                        type="checkbox"
                        checked={collectionsToSync.includes(name)}
                        onChange={() => handleCheckboxChange(name)}
                        className="h-5 w-5 rounded bg-gray-700 border-gray-500 text-blue-500 focus:ring-blue-600"
                    />
                    {name}
                </label>
            ))}
        </div>
      </div>

      <div className="text-center mb-6">
        <CustomButton
          onClick={handleSync}
          disabled={isLoading || !sourceConfig || !destinationConfig || collectionsToSync.length === 0}
        >
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Copy className="mr-2 h-5 w-5" />}
          {isLoading ? 'Syncing...' : `Sync ${collectionsToSync.length} Collection(s)`}
        </CustomButton>
      </div>

      {status && (
        <CustomAlert
            type={status.type}
            title={status.type === 'success' ? 'Sync Complete' : 'Error'}
            message={status.message}
            details={status.details}
        />
      )}
    </div>
  );
}
