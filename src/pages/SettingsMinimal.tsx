import React from 'react';

const SettingsMinimal: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '24px', marginBottom: '20px' }}>
        Settings Page - Working!
      </h1>
      <p style={{ color: '#666', fontSize: '16px' }}>
        This is a minimal settings page to test if the route is working properly.
      </p>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e0f7e0', border: '1px solid #4caf50', borderRadius: '5px' }}>
        <strong>✅ Success:</strong> The Settings route is functional!
      </div>
      <div style={{ marginTop: '20px' }}>
        <p><strong>Current URL:</strong> {window.location.href}</p>
        <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default SettingsMinimal;