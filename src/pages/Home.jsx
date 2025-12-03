import { Link } from 'react-router-dom';
import { FileText, Upload, Shield, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
          Your Health Records, Securely Stored
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-300">
          Access and manage your medical records anytime, anywhere, with complete privacy and security.
        </p>
        
        <div className="mt-10 flex justify-center gap-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/upload"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <Upload className="-ml-1 mr-2 h-5 w-5" />
            Upload Records
          </Link>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
          Secure Health Record Management
        </h2>
        <div className="mt-10">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'Secure Storage',
                description: 'Your health records are encrypted and stored securely in the cloud, accessible only by you.',
                icon: Lock,
              },
              {
                name: 'Easy Access',
                description: 'View and manage your health records from any device, anytime you need them.',
                icon: FileText,
              },
              {
                name: 'Share Securely',
                description: 'Share specific records with healthcare providers using secure, time-limited links.',
                icon: Shield,
              },
            ].map((feature) => (
              <div
                key={feature.name}
                className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {feature.name}
                    </h3>
                  </div>
                </div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
