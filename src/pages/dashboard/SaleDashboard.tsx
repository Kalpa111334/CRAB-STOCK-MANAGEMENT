import React from 'react'

const SaleDashboard: React.FC = () => {
  console.log('SaleDashboard: Component is rendering!')
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f0f0', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          color: '#333', 
          fontSize: '32px', 
          marginBottom: '10px',
          borderBottom: '3px solid #007bff',
          paddingBottom: '10px'
        }}>
          🦀 Sale Dashboard Test
        </h1>
        
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          border: '2px solid #28a745', 
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#155724', marginBottom: '10px' }}>
            ✅ Component Status Check
          </h2>
          <ul style={{ color: '#155724', fontSize: '16px' }}>
            <li>✅ SaleDashboard component is loading</li>
            <li>✅ React is working</li>
            <li>✅ Route is accessible</li>
            <li>✅ Basic rendering is functional</li>
          </ul>
        </div>

        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '2px solid #ffc107', 
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '10px' }}>
            🔍 Debug Information
          </h3>
          <p style={{ color: '#856404', marginBottom: '5px' }}>
            <strong>Timestamp:</strong> {new Date().toLocaleString()}
          </p>
          <p style={{ color: '#856404', marginBottom: '5px' }}>
            <strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...
          </p>
          <p style={{ color: '#856404', marginBottom: '5px' }}>
            <strong>Window Size:</strong> {window.innerWidth} x {window.innerHeight}
          </p>
          <p style={{ color: '#856404' }}>
            <strong>URL:</strong> {window.location.href}
          </p>
        </div>

        <div style={{ 
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <button 
            onClick={() => alert('Button click works!')}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Test Button Click
          </button>
        </div>
      </div>
    </div>
  )
}

export default SaleDashboard