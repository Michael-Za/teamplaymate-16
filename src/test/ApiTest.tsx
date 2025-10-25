import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const testBackendConnection = async () => {
    setLoading(true);
    setError('');
    setStatus('');
    
    try {
      // Try to connect to the backend health endpoint
      const response = await axios.get('http://localhost:3008/health');
      setStatus(`✅ Backend is running: ${response.data.message}`);
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') {
        setError('❌ Cannot connect to backend. Make sure it is running on port 3008.');
      } else if (err.response) {
        setStatus(`✅ Backend responded with status ${err.response.status}`);
      } else {
        setError(`❌ Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testBackendConnection();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Integration Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Backend Connection Test</h2>
        
        {loading && (
          <div className="flex items-center mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
            <span>Testing connection...</span>
          </div>
        )}
        
        {status && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
            {status}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
        
        <button
          onClick={testBackendConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Make sure the backend is running on <code className="bg-gray-100 px-1 rounded">http://localhost:3008</code></li>
          <li>Check that the frontend is running on <code className="bg-gray-100 px-1 rounded">http://localhost:3009</code></li>
          <li>Verify that CORS is properly configured in the backend</li>
          <li>Ensure both services can communicate with each other</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTest;