import Image from "next/image";
import Link from "next/link";
import { Users, BarChart3, Calendar, Settings } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900/50 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Calendar className="h-12 w-12 text-white" />
            <h1 className="text-5xl font-bold text-white">
              Tech Fiesta 2025
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Administrative Dashboard for Registration Management and Analytics
          </p>
        </header>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Admin Dashboard Card */}
          <Link href="/admin" className="group">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white rounded-lg group-hover:bg-gray-200 transition-colors">
                  <Users className="h-8 w-8 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
              </div>
              <p className="text-gray-300 mb-6">
                Manage registrations, update status, view participant details, and export data.
              </p>
              <div className="flex items-center text-white group-hover:text-gray-300">
                <span className="font-medium">Access Dashboard</span>
                <svg className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Analytics Dashboard Card */}
          <Link href="/admin/analytics" className="group">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white rounded-lg group-hover:bg-gray-200 transition-colors">
                  <BarChart3 className="h-8 w-8 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
              </div>
              <p className="text-gray-300 mb-6">
                View detailed insights, event analytics, demographic data, and participation trends.
              </p>
              <div className="flex items-center text-white group-hover:text-gray-300">
                <span className="font-medium">View Analytics</span>
                <svg className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Registration Management</h3>
            <p className="text-gray-400">Manage participant registrations, update status, and handle payments</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Advanced Analytics</h3>
            <p className="text-gray-400">Comprehensive insights into event popularity and participation trends</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Easy Management</h3>
            <p className="text-gray-400">Intuitive interface for efficient event administration</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-400">
          <p>&copy; 2025 Tech Fiesta Admin Dashboard. Built with Next.js and Firebase.</p>
        </footer>
      </div>
    </div>
  );
}
