import Link from "next/link"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"

export function UnderDevelopmentView() {
    return (
        <div className="bg-white w-full p-10 rounded-2xl shadow-xl text-center min-h-[60vh] flex justify-center items-center">
            <div className="max-w-md">
                <Typography as="span" font="heading" className="text-6xl mb-6 block animate-bounce">
                    🚧
                </Typography>

                <Typography as="h1" font="heading" className="text-2xl font-bold text-slate-800 mb-4">
                    Page Under Development
                </Typography>

                <Typography font="text" className="text-gray-600 mb-8 leading-relaxed">
                    The module inside the dashboard is currently under construction. We are working hard to bring it to you soon!
                </Typography>

                <Button asChild className="bg-brand-byzantine hover:bg-brand-byzantine/80">
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        </div>
    )
}
