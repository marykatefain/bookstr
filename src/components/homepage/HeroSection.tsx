import React from "react";
import { Link } from "react-router-dom";
import { Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NostrLogin } from "@/components/NostrLogin";
import { isLoggedIn } from "@/lib/nostr";
export function HeroSection() {
  return <section className="relative py-16 bg-gradient-to-b from-bookverse-paper to-bookverse-cream">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-bookverse-ink">Escape the Algorithm, Embrace the Story.</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-[700px] mx-auto">Discover, track, and share your reading journey on the decentralized Nostr network. No corporations. No ads. No data tracking. Just books.</p>
          </div>
          
          {!isLoggedIn() && <div className="w-full max-w-md mt-4">
              <NostrLogin />
            </div>}
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/books">
              <Button size="lg" className="bg-bookverse-accent hover:bg-bookverse-highlight">
                <Book className="mr-2 h-5 w-5" />
                Discover Books
              </Button>
            </Link>
            {isLoggedIn() && <Link to="/profile">
                <Button size="lg" variant="outline">
                  <Book className="mr-2 h-5 w-5" />
                  Your Library
                </Button>
              </Link>}
          </div>
        </div>
      </div>
    </section>;
}