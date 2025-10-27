/**
 * Simplified Transactions Test Page
 * Use this to debug if the main Transactions page isn't working
 */

import React from 'react';

const TransactionsTest = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Transactions Test Page</h1>
        <p className="text-gray-600 mb-8">
          If you can see this, the route is working correctly.
        </p>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>React Router is working</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Component is rendering</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Tailwind CSS is loaded</span>
            </li>
          </ul>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Next steps:</strong> Check browser console for any errors,
              then gradually add components back to identify the issue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsTest;
