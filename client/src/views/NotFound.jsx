import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFound() {
    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-20 text-center space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
            <SEO title="404 - Page Not Found" description="The page you are looking for does not exist." noindex={true} />
            <AlertTriangle className="w-16 h-16 text-[#D97706] mx-auto opacity-50" />
            <h1 className="text-4xl font-heading font-bold text-[#3A2E1F]">404 - Page Not Found</h1>
            <p className="text-[#3A2E1F]/70">The page you are looking for does not exist or has been moved.</p>
            <Link to="/" className="inline-block px-8 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] font-bold rounded-full">
                Return to Home
            </Link>
        </div>
    );
}
