import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, TrendingUp, Package, User, 
  Shield, Settings, HelpCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Market trends', href: '/prices', icon: TrendingUp },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'My profile', href: '/profile', icon: User },
  ];

  const adminNavigation = [
    { name: 'Administration', href: '/admin', icon: Shield },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white border-r border-gray-200 pt-16 pb-4 overflow-y-auto">
        <div className="flex-1 flex flex-col">
          <nav className="flex-1 px-4 space-y-2">
            {/* Main Navigation */}
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-green-50 text-green-700 border-r-2 border-green-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon 
                      className={clsx(
                        'mr-3 h-5 w-5 transition-colors',
                        isActive(item.href) ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'
                      )} 
                    />
                    {item.name}
                    {isActive(item.href) && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 w-1 h-8 bg-green-600 rounded-r-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Admin Navigation */}
            {user?.role === 'admin' && (
              <div className="pt-6">
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Administration
                  </h3>
                </div>
                <div className="space-y-1">
                  {adminNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={clsx(
                          'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                          isActive(item.href)
                            ? 'bg-red-50 text-red-700 border-r-2 border-red-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <Icon 
                          className={clsx(
                            'mr-3 h-5 w-5 transition-colors',
                            isActive(item.href) ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-500'
                          )} 
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Secondary Navigation */}
            <div className="pt-6 border-t border-gray-200">
              <div className="space-y-1">
                <Link
                  to="/settings"
                  className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Settings
                </Link>
                <Link
                  to="/help"
                  className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <HelpCircle className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Help
                </Link>
              </div>
            </div>
          </nav>

          {/* User Info Card */}
          <div className="px-4 py-4">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role} • {user?.region}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;