'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Swagger UI with no SSR
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocumentation() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSpec = async () => {
      try {
        // Fetch the OpenAPI spec from the API route
        const response = await fetch('/api/docs');
        if (!response.ok) {
          throw new Error(`Failed to load API documentation: ${response.status} ${response.statusText}`);
        }
        const spec = await response.json();
        setSpec(spec);
      } catch (err) {
        console.error('Error loading API documentation:', err);
        setError('Failed to load API documentation. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadSpec();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 max-w-md mx-auto bg-red-50 rounded-lg">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Documentation</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
            <p className="mt-1 text-sm text-gray-500">
              Interactive documentation for the Scope Platform API
            </p>
          </div>
          <div className="p-4">
            {spec ? (
              <SwaggerUI 
                spec={spec} 
                docExpansion="list"
                defaultModelExpandDepth={3}
                displayOperationId={true}
                filter={true}
                showExtensions={true}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No API documentation available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
