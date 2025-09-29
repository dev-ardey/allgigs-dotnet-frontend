import React from 'react';
import CRMButton from './CRMButton';

const CRMDemo: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">AllGigs CRM Demo</h1>
                    <p className="text-gray-600">Click the CRM button below to open the contact management system</p>
                </div>
                
                <div className="flex justify-center">
                    <CRMButton />
                </div>
                
                <div className="mt-12 bg-white rounded-xl p-6 shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Features</h2>
                    <ul className="space-y-2 text-gray-600">
                        <li>• Add new contacts with date, name, phone, email, company, and source</li>
                        <li>• Edit existing contact information</li>
                        <li>• Delete contacts</li>
                        <li>• Add notes for each contact</li>
                        <li>• Responsive design that works on all devices</li>
                        <li>• Matches the AllGigs design system</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CRMDemo;
