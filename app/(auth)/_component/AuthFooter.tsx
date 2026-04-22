import { Home } from "lucide-react";
import Link from "next/link";
import { Typography } from "@/components/shared/Typography";
import { Button } from "@/components/ui/button";

const AuthFooter = () => (
  <footer className="bg-brand-primary">
    
    {/* Top Section */}
    <div className="py-10 sm:py-16 px-4 sm:px-8 lg:px-24">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
        
        {/* Social */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-white text-center sm:text-left">
          <Typography as="p" font="text" className="whitespace-nowrap">
            Follow Us on
          </Typography>

          <div className="flex gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Home />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Home />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Home />
              </Button>
            </Link>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-right">
          <Typography
            as="p"
            font="text"
            className="text-brand-bright cursor-pointer"
          >
            Terms Of Services
          </Typography>
          <Typography
            as="p"
            font="text"
            className="text-brand-bright cursor-pointer"
          >
            Privacy Policy
          </Typography>
        </div>

      </div>
    </div>

    {/* Bottom Section */}
    <div className="border-t border-white/20 py-6 px-4 sm:px-8 lg:px-24">
      <Typography
        as="p"
        font="text"
        className="text-center text-brand-bright text-sm sm:text-base"
      >
        © 2026 Fachhochschule des Mittelstands (FHM)
      </Typography>
    </div>

  </footer>
);

export { AuthFooter };