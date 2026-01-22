
'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                    <div className="max-w-md text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Something went wrong!
                        </h1>
                        <p className="text-gray-600 mb-6">
                            A critical error occurred while loading the application.
                        </p>
                        <button
                            onClick={() => reset()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
