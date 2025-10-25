import React from 'react';

const VercelTest: React.FC = () => {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Vercel Deployment Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Deployment Status</h2>
        <p className="mb-4">This page confirms that the frontend is properly configured for Vercel deployment.</p>
        
        <div className="bg-green-100 text-green-800 p-4 rounded mb-4">
          <p>✅ Vercel configuration is ready</p>
        </div>
        
        <h3 className="text-lg font-medium mb-2">Next Steps:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Push your code to a Git repository</li>
          <li>Import the project to Vercel</li>
          <li>Set the required environment variables</li>
          <li>Deploy the application</li>
        </ol>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
        <p className="mb-4">Make sure to set these environment variables in your Vercel project:</p>
        
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
          {`VITE_API_URL=https://your-backend-domain.com
BACKEND_URL=https://your-backend-domain.com`}
        </pre>
        
        <p className="mt-4">Replace <code>your-backend-domain.com</code> with your actual backend URL.</p>
      </div>
    </div>
  );
};

export default VercelTest;