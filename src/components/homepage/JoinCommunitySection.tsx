import React from "react";
import { NostrLogin } from "@/components/NostrLogin";
import { isLoggedIn } from "@/lib/nostr";
export function JoinCommunitySection() {
  return <section className="py-12 bg-bookverse-cream">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-4 md:w-1/2">
            <h2 className="text-3xl font-bold font-serif text-bookverse-ink">Join the decentralized reading community</h2>
            <p className="text-muted-foreground">Bookstr connects readers through the Nostr network, giving you full control over your data while building meaningful connections with fellow book lovers.</p>
            {!isLoggedIn() && <div className="w-full max-w-md">
                <NostrLogin />
              </div>}
          </div>
          <div className="md:w-1/2 flex justify-center md:justify-end">
            <div className="relative w-full max-w-sm">
              <div className="absolute -top-2 -left-2 w-full h-full bg-bookverse-accent rounded-lg"></div>
              <div className="absolute -bottom-2 -right-2 w-full h-full bg-bookverse-highlight rounded-lg"></div>
              <div className="relative bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold font-serif mb-3">Why Bookstr?</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                    <span>Own your reading data on the Nostr network</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                    <span>Connect with other readers without algorithms</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                    <span>Track your reading journey your way</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 mt-1 text-bookverse-accent">✓</span>
                    <span>No ads, no tracking, no data harvesting</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}