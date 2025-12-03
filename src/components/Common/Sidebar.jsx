import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Upload, 
  Share2, 
  Settings, 
  LogOut,
  User,
  Lock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const menuItems = [
  { name: 'Dashboard', icon: Home, path: '/' },
  { name: 'My Records', icon: FileText, path: '/records' },
  { name: 'Upload', icon: Upload, path: '/upload' },
  { name: 'Shared', icon: Share2, path: '/shared' },
  { name: 'Profile', icon: User, path: '/profile' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar() {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">MedVault</h1>
          </div>
          <div className="flex flex-col flex-grow px-4">
            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </nav>
            
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={signOut}
                className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign out
              </button>
              <div className="flex items-center mt-4 text-xs text-gray-500 dark:text-gray-400">
                <Lock className="w-3 h-3 mr-1.5" />
                <span>End-to-end encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
