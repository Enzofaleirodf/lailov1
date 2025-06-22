import React from 'react';
import { BrandsDebugComponent } from '../components/debug/BrandsDebugComponent';

const DebugBrandsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            🔧 Vehicle Brands Debug Page
          </h1>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Purpose</h2>
            <p className="text-blue-700">
              This page tests the vehicle brands filter to diagnose why only brands up to letter C are showing.
              It tests multiple methods to identify where the truncation is happening.
            </p>
          </div>
          
          <BrandsDebugComponent />
        </div>
      </div>
    </div>
  );
};

export default DebugBrandsPage;
