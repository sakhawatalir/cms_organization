'use client';

import React, { useState, useEffect } from 'react';

// Mock data for appointments
const mockAppointments = [
  {
    id: 1,
    time: '9:00 AM',
    type: 'Meeting',
    client: 'Tech Corp',
    job: 'Senior Developer',
    references: ['Stephanie Marcus', 'Sophia Esposito'],
    owner: 'Devi Arnold'
  },
  {
    id: 2,
    time: '9:30 AM',
    type: 'Meeting',
    client: 'Startup Inc',
    job: 'Product Manager',
    references: ['Toni Arruda', 'Allison Silva', 'Devi Arnold', 'Klaudia Gajda', 'Jennifer Michaels'],
    owner: 'Briana Dozois'
  },
  {
    id: 3,
    time: '10:00 AM',
    type: 'Meeting',
    client: 'Consulting Firm',
    job: 'Business Analyst',
    references: ['Evan Waicberg', 'Rachel Howell'],
    owner: 'Justin Shields'
  },
  {
    id: 4,
    time: '10:30 AM',
    type: 'Meeting',
    client: 'Finance Co',
    job: 'Financial Advisor',
    references: ['Evan Waicberg', 'Rachel Howell'],
    owner: 'Devi Arnold'
  },
  {
    id: 5,
    time: '11:00 AM',
    type: 'Meeting',
    client: 'Marketing Agency',
    job: 'Creative Director',
    references: ['Stephanie Marcus', 'Sophia Esposito'],
    owner: 'Briana Dozois'
  }
];

// Mock data for calendar days with appointment counts
const getCalendarData = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Generate mock appointment counts for each day
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarData = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const appointmentCount = Math.floor(Math.random() * 25); // Random count 0-24
    calendarData.push({
      day,
      appointmentCount,
      isCurrentMonth: true,
      isToday: day === today.getDate()
    });
  }
  
  return calendarData;
};

const Planners = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewType, setViewType] = useState('Month');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const calendarData = getCalendarData();
  const selectedDayAppointments = mockAppointments; // In real app, filter by selected date
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };
  
  const totalAppointments = calendarData.reduce((sum, day) => sum + day.appointmentCount, 0);
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center space-x-4">
            {/* Calendar Icon */}
            <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Month Navigation */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => navigateMonth('prev')}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-lg font-medium text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button 
                onClick={() => navigateMonth('next')}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Total Appointments */}
            <div className="text-sm text-gray-600">
              {totalAppointments} APPOINTMENTS
            </div>
          </div>
          
          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Add Button */}
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>ADD</span>
            </button>
            
            {/* Dropdowns */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Types (9)</span>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span>Users (145)</span>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* View Type Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['Month', 'Week', 'Day', 'List'].map((view) => (
                <button
                  key={view}
                  onClick={() => setViewType(view)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    viewType === view
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
            
            {/* List Icon */}
            <button className="p-2 text-gray-600 hover:text-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="px-6 py-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((dayData, index) => (
            <div
              key={index}
              className={`min-h-[80px] border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 ${
                dayData.isToday ? 'bg-blue-100 border-blue-300' : ''
              }`}
              onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayData.day))}
            >
              <div className="flex flex-col h-full">
                <div className={`text-sm ${
                  dayData.isToday ? 'text-blue-600 font-semibold' : 'text-gray-500'
                }`}>
                  {dayData.day}
                </div>
                <div className={`text-lg font-bold underline mt-1 ${
                  dayData.isToday ? 'text-blue-600' : 'text-blue-500'
                }`}>
                  {dayData.appointmentCount}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Appointment Details Section */}
      <div className="px-6 pb-6">
        {/* Selected Day Header */}
        <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold">
              {selectedDate.getDate()} {dayNames[selectedDate.getDay()]}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span>{selectedDayAppointments.length} Appointments</span>
            <div className="flex items-center space-x-1">
              <button className="px-2 py-1 text-blue-200 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="px-2 py-1 bg-white text-blue-600 rounded font-medium">1</button>
              <button className="px-2 py-1 text-blue-200 hover:text-white">2</button>
              <button className="px-2 py-1 text-blue-200 hover:text-white">3</button>
              <button className="px-2 py-1 text-blue-200 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Items Per Page */}
        <div className="bg-gray-50 px-4 py-2 border-x border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>ITEMS PER PAGE:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        
        {/* Appointments Table */}
        <div className="bg-white border border-gray-200 rounded-b-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Job</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">References</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Owner</th>
              </tr>
            </thead>
            <tbody>
              {selectedDayAppointments.map((appointment, index) => (
                <tr key={appointment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        VIEW
                      </button>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{appointment.time}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{appointment.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{appointment.client}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{appointment.job}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {appointment.references.map((reference, refIndex) => (
                        <div key={refIndex} className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            refIndex === 0 ? 'bg-green-500' : 'bg-orange-500'
                          }`}></div>
                          <span className="text-blue-600 hover:text-blue-800 underline text-sm">
                            {reference}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{appointment.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Planners;