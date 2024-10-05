"use client"; 
import React, { useState } from 'react';
import { useCodeStore } from '@/store/code-store';

const Output = () => {
    const { code, language, input } = useCodeStore(); // Get the current code from Zustand store
    const [output, setOutput] = useState<string | null>(null);
    const [isError, setIsError] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false); // State for loading
    const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false); // State for button disabled
    
    const handleRunCode = async () => {
        // console.log("code: ", code); // Logged the code for debugging
        setLoading(true); // Set loading state to true
        setIsButtonDisabled(true); // Disable the button

        try {
            const response = await fetch('/api/runCode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code, language, input }), // Send the current code
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setOutput(data.stdout || data.stderr); // Display stdout or stderr from the response
            
            setError(null); // Clear any previous error
            setIsError(false)
            if(data.stderr) {
              setIsError(true)
              setError(data.stderr)
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message); // Set error message if it's an instance of Error
            } else {
                setError('An unknown error occurred'); // Fallback for unknown errors
            }
            setOutput(null); // Clear output on error
        } finally {
            setLoading(false); // Reset loading state
            setIsButtonDisabled(false); // Re-enable the button after execution
        }
    };

    return (
        <div className="p-4">
            <button 
                onClick={handleRunCode} 
                disabled={isButtonDisabled} 
                className={`px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-wait transition duration-200`}
            >
                {loading ? 'Running...' : 'Run Code'}
            </button>
            <div className="mt-4">
               
                {isError ? (
                    <div className="w-3/4 h-3/5 bg-red-100 border border-red-400 text-red-700 p-4 rounded mt-2 overflow-scroll">
                        <h2 className="font-bold">Error:</h2>
                        <pre className='overflow-x'>{error}</pre>
                    </div>
                ) :   (
                  <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded">
                      <h2 className="font-bold">Output:</h2>
                      <pre>{output}</pre>
                  </div>
              )}
            </div>
        </div>
    );
};

export default Output;