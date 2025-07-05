"use client";

import { useState, useEffect } from 'react';
import { getAllRegistrations, FirebaseRegistration } from '@/services/registrationService';
import { BarChart3, Users, Calendar, GraduationCap, Loader, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsDashboard() {
  const [registrations, setRegistrations] = useState<FirebaseRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await getAllRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate insights
  const totalMembers = registrations.reduce((total, reg) => {
    return total + (reg.teamSize || 1);
  }, 0);

  // Event analytics
  const eventAnalytics = registrations.reduce((analytics, reg) => {
    // Technical Events
    reg.selectedEvents.forEach(event => {
      const eventTitle = typeof event === 'object' && event.title ? event.title : `Event ${event}`;
      const eventId = typeof event === 'object' && event.id ? event.id : event;
      if (!analytics.events[eventId]) {
        analytics.events[eventId] = { title: eventTitle, count: 0, members: 0 };
      }
      analytics.events[eventId].count += 1;
      analytics.events[eventId].members += (reg.teamSize || 1);
    });

    // Workshops
    reg.selectedWorkshops.forEach(workshop => {
      const workshopTitle = typeof workshop === 'object' && workshop.title ? workshop.title : `Workshop ${workshop}`;
      const workshopId = typeof workshop === 'object' && workshop.id ? workshop.id : workshop;
      if (!analytics.workshops[workshopId]) {
        analytics.workshops[workshopId] = { title: workshopTitle, count: 0, members: 0 };
      }
      analytics.workshops[workshopId].count += 1;
      analytics.workshops[workshopId].members += (reg.teamSize || 1);
    });

    // Non-Tech Events
    reg.selectedNonTechEvents.forEach(event => {
      const eventTitle = typeof event === 'object' && event.title ? event.title : `Non-Tech Event ${event}`;
      const eventId = typeof event === 'object' && event.id ? event.id : event;
      if (!analytics.nonTech[eventId]) {
        analytics.nonTech[eventId] = { title: eventTitle, count: 0, members: 0 };
      }
      analytics.nonTech[eventId].count += 1;
      analytics.nonTech[eventId].members += (reg.teamSize || 1);
    });

    return analytics;
  }, { events: {} as Record<string, {title: string, count: number, members: number}>, 
       workshops: {} as Record<string, {title: string, count: number, members: number}>, 
       nonTech: {} as Record<string, {title: string, count: number, members: number}> });

  // College analytics
  const collegeAnalytics = registrations.reduce((analytics, reg) => {
    if (!analytics[reg.college]) {
      analytics[reg.college] = { registrations: 0, members: 0 };
    }
    analytics[reg.college].registrations += 1;
    analytics[reg.college].members += (reg.teamSize || 1);
    return analytics;
  }, {} as Record<string, {registrations: number, members: number}>);

  // Department analytics
  const departmentAnalytics = registrations.reduce((analytics, reg) => {
    if (!analytics[reg.department]) {
      analytics[reg.department] = { registrations: 0, members: 0 };
    }
    analytics[reg.department].registrations += 1;
    analytics[reg.department].members += (reg.teamSize || 1);
    return analytics;
  }, {} as Record<string, {registrations: number, members: number}>);

  // Year-wise analytics
  const yearAnalytics = registrations.reduce((analytics, reg) => {
    if (!analytics[reg.year]) {
      analytics[reg.year] = { registrations: 0, members: 0 };
    }
    analytics[reg.year].registrations += 1;
    analytics[reg.year].members += (reg.teamSize || 1);
    return analytics;
  }, {} as Record<string, {registrations: number, members: number}>);

  // Team vs Individual analytics
  const teamAnalytics = registrations.reduce((analytics, reg) => {
    if (reg.isTeamEvent && (reg.teamSize || 0) > 1) {
      analytics.team.registrations += 1;
      analytics.team.members += (reg.teamSize || 1);
    } else {
      analytics.individual.registrations += 1;
      analytics.individual.members += 1;
    }
    return analytics;
  }, { team: { registrations: 0, members: 0 }, individual: { registrations: 0, members: 0 } });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <Loader className="h-6 w-6 animate-spin" />
          Loading analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Tech Fiesta 2025 - Analytics Dashboard</h1>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-blue-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Total Registrations</h3>
                <p className="text-3xl font-bold">{registrations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-cyan-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Total Members</h3>
                <p className="text-3xl font-bold">{totalMembers}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Confirmed</h3>
                <p className="text-3xl font-bold">
                  {registrations.filter(r => r.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Pending</h3>
                <p className="text-3xl font-bold">
                  {registrations.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-purple-600 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold">Payment Verified</h3>
                <p className="text-3xl font-bold">
                  {registrations.filter(r => r.paymentStatus === 'verified').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Event Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Technical Events Analytics */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-green-400">Technical Events</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(eventAnalytics.events)
                .sort(([,a], [,b]) => b.count - a.count)
                .map(([eventId, data]) => (
                <div key={eventId} className="flex justify-between items-center text-sm bg-gray-700 p-3 rounded">
                  <div className="flex-1 truncate pr-2">
                    <p className="font-medium">{data.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400">{data.count} reg</p>
                    <p className="text-cyan-400 text-xs">{data.members} members</p>
                  </div>
                </div>
              ))}
              {Object.keys(eventAnalytics.events).length === 0 && (
                <p className="text-gray-400 text-sm">No technical events registered</p>
              )}
            </div>
          </div>

          {/* Workshops Analytics */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-purple-400">Workshops</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(eventAnalytics.workshops)
                .sort(([,a], [,b]) => b.count - a.count)
                .map(([workshopId, data]) => (
                <div key={workshopId} className="flex justify-between items-center text-sm bg-gray-700 p-3 rounded">
                  <div className="flex-1 truncate pr-2">
                    <p className="font-medium">{data.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400">{data.count} reg</p>
                    <p className="text-cyan-400 text-xs">{data.members} members</p>
                  </div>
                </div>
              ))}
              {Object.keys(eventAnalytics.workshops).length === 0 && (
                <p className="text-gray-400 text-sm">No workshops registered</p>
              )}
            </div>
          </div>

          {/* Non-Tech Events Analytics */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-yellow-400">Non-Tech Events</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(eventAnalytics.nonTech)
                .sort(([,a], [,b]) => b.count - a.count)
                .map(([eventId, data]) => (
                <div key={eventId} className="flex justify-between items-center text-sm bg-gray-700 p-3 rounded">
                  <div className="flex-1 truncate pr-2">
                    <p className="font-medium">{data.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400">{data.count} reg</p>
                    <p className="text-cyan-400 text-xs">{data.members} members</p>
                  </div>
                </div>
              ))}
              {Object.keys(eventAnalytics.nonTech).length === 0 && (
                <p className="text-gray-400 text-sm">No non-tech events registered</p>
              )}
            </div>
          </div>
        </div>

        {/* Demographic Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* College Analytics */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-orange-400 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              College-wise Registration
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(collegeAnalytics)
                .sort(([,a], [,b]) => b.registrations - a.registrations)
                .map(([college, data]) => (
                <div key={college} className="bg-gray-700 p-4 rounded">
                  <p className="font-medium truncate">{college}</p>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-orange-400">{data.registrations} reg</span>
                    <span className="text-cyan-400">{data.members} members</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Analytics */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-indigo-400">Department-wise Registration</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(departmentAnalytics)
                .sort(([,a], [,b]) => b.registrations - a.registrations)
                .map(([department, data]) => (
                <div key={department} className="bg-gray-700 p-4 rounded">
                  <p className="font-medium">{department}</p>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-indigo-400">{data.registrations} reg</span>
                    <span className="text-cyan-400">{data.members} members</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Year-wise Analytics */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-pink-400">Year-wise Registration</h3>
            <div className="space-y-3">
              {Object.entries(yearAnalytics)
                .sort(([,a], [,b]) => b.registrations - a.registrations)
                .map(([year, data]) => (
                <div key={year} className="bg-gray-700 p-4 rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium">{year} Year</p>
                    <div className="flex gap-4 text-sm mt-1">
                      <span className="text-pink-400">{data.registrations} registrations</span>
                      <span className="text-cyan-400">{data.members} members</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-pink-400">{Math.round((data.registrations / registrations.length) * 100)}%</div>
                    <div className="text-xs text-gray-400">of total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team vs Individual */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-teal-400">Team vs Individual</h3>
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="font-medium text-teal-400 mb-2">Team Registrations</h4>
                <div className="flex justify-between">
                  <span>Registrations: {teamAnalytics.team.registrations}</span>
                  <span>Members: {teamAnalytics.team.members}</span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Avg team size: {teamAnalytics.team.registrations > 0 ? 
                    Math.round((teamAnalytics.team.members / teamAnalytics.team.registrations) * 100) / 100 : 0}
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="font-medium text-cyan-400 mb-2">Individual Registrations</h4>
                <div className="flex justify-between">
                  <span>Registrations: {teamAnalytics.individual.registrations}</span>
                  <span>Members: {teamAnalytics.individual.members}</span>
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded">
                <h4 className="font-medium text-gray-300 mb-2">Overview</h4>
                <div className="text-sm space-y-1">
                  <div>Team preference: {Math.round((teamAnalytics.team.registrations / registrations.length) * 100)}%</div>
                  <div>Individual preference: {Math.round((teamAnalytics.individual.registrations / registrations.length) * 100)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
