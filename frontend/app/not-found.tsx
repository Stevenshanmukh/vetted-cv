
import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="max-w-md text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h2>
                <p className="text-gray-600 mb-6">Could not find requested resource</p>
                <Link href="/dashboard">
                    <Button variant="primary">Return Home</Button>
                </Link>
            </div>
        </div>
    );
}
