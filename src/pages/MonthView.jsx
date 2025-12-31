import React from 'react';
import { Header } from '@/components/layout/Header';

const MonthView = () => {
  return (
    <>
      <Header title="Month View" showBack />
      <div className="p-4 max-w-7xl mx-auto">
        <div className="card text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Calendar View</h2>
          <p className="text-text-secondary">
            Month calendar view coming soon...
          </p>
        </div>
      </div>
    </>
  );
};

export default MonthView;
