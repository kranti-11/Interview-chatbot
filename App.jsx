import React, { useState } from 'react';

const InterviewApp = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const nextStep = (data) => {
    setFormData({ ...formData, ...data });
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        
        {/* Step 1: Student Type */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-4">Are you a...</h2>
            <button onClick={() => nextStep({ type: 'Engineering' })} className="w-full mb-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Engineering Student</button>
            <button onClick={() => nextStep({ type: 'BCC' })} className="w-full p-3 border border-blue-600 text-blue-600 rounded-lg">BCC Student</button>
          </div>
        )}

        {/* Step 2: Year Selection */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Select your Year</h2>
            {['1st', '2nd', '3rd', '4th'].map(year => (
              <button key={year} onClick={() => nextStep({ year })} className="w-full mb-2 p-3 bg-gray-50 hover:bg-gray-200 rounded-lg text-left">
                {year} Year
              </button>
            ))}
          </div>
        )}

        {/* Step 6: Instructions (The critical part) */}
        {step === 6 && (
          <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
            <h2 className="text-xl font-bold text-yellow-800">⚠️ Interview Instructions</h2>
            <ul className="mt-4 space-y-2 text-sm text-yellow-700">
              <li>• Duration: 45 Minutes</li>
              <li>• No tab switching (Anti-cheating active)</li>
              <li>• Keep your camera on if in Serious Mode</li>
            </ul>
            <button onClick={() => setStep(7)} className="mt-6 w-full bg-black text-white p-3 rounded-lg">
              Start Interview
            </button>
          </div>
        )}

        {/* Step 7: Question Interface */}
        {step === 7 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-red-500 font-mono">Time Left: 44:59</span>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg italic">
              "Explain how you would optimize a bubble sort algorithm?"
            </div>
            <textarea className="w-full mt-4 p-3 border rounded-lg h-32" placeholder="Type your answer here..."></textarea>
            <button className="mt-4 w-full bg-green-600 text-white p-3 rounded-lg">Submit Answer</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default InterviewApp;
