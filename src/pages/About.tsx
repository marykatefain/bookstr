
import React from "react";
import { Layout } from "@/components/layout/Layout";
import { ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const About = () => {
  return (
    <Layout>
      <div className="container px-4 md:px-6 max-w-screen-lg mx-auto py-8 md:py-12">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-bookverse-ink mb-4">About Bookstr</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A decentralized platform for booklovers built on the Nostr protocol
            </p>
          </div>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-bookverse-ink">What is Bookstr?</h2>
            <p>
              Bookstr is a decentralized social reading platform that allows readers to track their reading progress, discover new books, and connect with other booklovers in a censorship-resistant environment.
            </p>
            
            <p>
              Unlike traditional corporate-owned reading platforms, Bookstr puts you in control of your data and your reading experience. We believe that what you read and how you discuss books should remain private and free from algorithmic manipulation or corporate oversight.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-bookverse-ink">What is Nostr?</h2>
            <p>
              Nostr (Notes and Other Stuff Transmitted by Relays) is a simple, open protocol that enables global, decentralized, and censorship-resistant social media.
            </p>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Key features of Nostr:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Decentralized:</strong> No single entity controls the network. Anyone can run a relay server to help transmit messages.
                </li>
                <li>
                  <strong>User-owned data:</strong> Your content belongs to you through cryptographic key pairs that you control.
                </li>
                <li>
                  <strong>Censorship-resistant:</strong> With multiple relays, your content cannot be easily silenced or removed.
                </li>
                <li>
                  <strong>Privacy-focused:</strong> You can choose what information to share and with whom.
                </li>
                <li>
                  <strong>Open protocol:</strong> Anyone can build applications on top of Nostr without permission.
                </li>
              </ul>
            </div>
            
            <p>
              Learn more about Nostr:
              <a 
                href="https://nostr.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center ml-2 text-bookverse-accent hover:text-bookverse-highlight"
              >
                nostr.com <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-bookverse-ink">Why Choose Bookstr?</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 bg-bookverse-cream/30 rounded-lg">
                <h3 className="text-xl font-medium text-bookverse-ink">Freedom from Corporate Control</h3>
                <p>
                  Your reading habits and discussions aren't monitored by corporate algorithms designed to maximize engagement and ad revenue. On Bookstr, you're not the product.
                </p>
              </div>
              
              <div className="space-y-3 p-4 bg-bookverse-cream/30 rounded-lg">
                <h3 className="text-xl font-medium text-bookverse-ink">Own Your Data</h3>
                <p>
                  Your reading list, reviews, and connections are cryptographically yours. No company can delete your account or remove access to your reading history.
                </p>
              </div>
              
              <div className="space-y-3 p-4 bg-bookverse-cream/30 rounded-lg">
                <h3 className="text-xl font-medium text-bookverse-ink">Censorship Resistance</h3>
                <p>
                  Discuss any book freely without fear of platform censorship. Bookstr allows for open literary discourse without corporate moderation policies.
                </p>
              </div>
              
              <div className="space-y-3 p-4 bg-bookverse-cream/30 rounded-lg">
                <h3 className="text-xl font-medium text-bookverse-ink">Community First</h3>
                <p>
                  Built by readers for readers, Bookstr prioritizes creating a genuine community of book lovers rather than maximizing profits through advertising.
                </p>
              </div>
            </div>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-bookverse-ink">Getting Started</h2>
            <p>
              To use Bookstr, you'll need a Nostr key pair. You can create one through browser extensions like Nos2x, Alby, or a Nostr-enabled wallet. Once you have your keys, simply connect to Bookstr and start building your digital library.
            </p>
            <p>
              Join our community today and take back control of your reading experience!
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default About;
