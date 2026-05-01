import Link from 'next/link';

// TypeScript interface for dynamic route parameters
interface PageProps {
    params: {
        unknown: string;
    };
}

export default async function Page({ params }: PageProps) {
    // URL me se route ka naam extract kar ke clean karna
    const requestedRoute = await params.unknown;

    return (
        <div className="bg-white w-full p-10 rounded-2xl shadow-xl text-center min-h-screen flex justify-center items-center">

            {/* Animated Construction Icon */}
            <div className='max-w-md'>
                <div className="text-6xl mb-6 animate-bounce">
                    🚧
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-4">
                    Page Under Development
                </h1>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    The module inside the dashboard is currently under construction. We are working hard to bring it to you soon!
                </p>

                {/* Back to Dashboard Button */}
                <Link
                    href="/dashboard"
                    className="inline-block bg-brand-byzantine hover:bg-bg-brand-byzantine/80 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    Back to Dashboard
                </Link>
            </div>

        </div>
    );
}