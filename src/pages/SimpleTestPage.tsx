import React from 'react';

const SimpleTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            🧪 Simple Test Page
          </h1>
          
          <div className="space-y-4">
            <p>This is a simple test page to verify the app is working.</p>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-2">✅ App Status</h2>
              <p className="text-green-700">
                If you can see this page, the React app is working correctly.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">🔗 Navigation Links</h2>
              <div className="space-y-2">
                <div>
                  <a 
                    href="/buscador/veiculos/todos" 
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    → Go to Vehicles Page
                  </a>
                </div>
                <div>
                  <a 
                    href="/buscador/imoveis/todos" 
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    → Go to Properties Page
                  </a>
                </div>
                <div>
                  <a 
                    href="/debug/brands" 
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    → Go to Brands Debug Page
                  </a>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Troubleshooting</h2>
              <p className="text-yellow-700">
                If the vehicles page is not loading, check the browser console for errors.
                Press F12 and look at the Console tab for any red error messages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTestPage;
