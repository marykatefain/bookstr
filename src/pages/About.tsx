
import React from "react";
import { Layout } from "@/components/layout/Layout";
import { ExternalLink, Book, Shield, Users, Database, Library } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <Layout>
      <div className="container px-4 md:px-6 max-w-screen-lg mx-auto py-8 md:py-12">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-bookverse-ink mb-4">About Bookstr</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A decentralized platform for book lovers built on the Nostr protocol
            </p>
          </div>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-bookverse-ink">What is Bookstr?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="mb-4">
                  Bookstr is a decentralized social reading platform that allows readers to track their reading progress, 
                  discover new books, and connect with other book lovers in a censorship-resistant environment.
                </p>
                <p>
                  Unlike traditional corporate-owned reading platforms, Bookstr puts you in control of your data and 
                  your reading experience. We believe that what you read and how you discuss books should remain private 
                  and free from algorithmic manipulation or corporate oversight.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <Book className="h-32 w-32 text-bookverse-accent opacity-80" />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-bookverse-ink">Core Features</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-bookverse-cream/30">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="bg-bookverse-cream rounded-full p-3">
                      <Library className="h-6 w-6 text-bookverse-accent" />
                    </div>
                    <h3 className="font-medium text-lg">Personal Library</h3>
                    <p className="text-sm text-muted-foreground">
                      Track the books you've read, are currently reading, and want to read in your personal library.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-bookverse-cream/30">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="bg-bookverse-cream rounded-full p-3">
                      <Users className="h-6 w-6 text-bookverse-accent" />
                    </div>
                    <h3 className="font-medium text-lg">Reader Community</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect with other readers, share reviews, and discover books through recommendations.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-bookverse-cream/30">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="bg-bookverse-cream rounded-full p-3">
                      <Database className="h-6 w-6 text-bookverse-accent" />
                    </div>
                    <h3 className="font-medium text-lg">Decentralized Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Your reading data belongs to you alone, stored on the decentralized Nostr network.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-bookverse-ink">What is Nostr?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="mb-4">
                  Nostr (Notes and Other Stuff Transmitted by Relays) is a simple, open protocol that enables global,
                  decentralized, and censorship-resistant social media.
                </p>
                
                <div className="space-y-2 mb-4">
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
                  </ul>
                </div>
                
                <p className="flex items-center">
                  Learn more:
                  <a 
                    href="https://nostr.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center ml-2 text-bookverse-accent hover:text-bookverse-highlight"
                  >
                    nostr.com <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </p>
              </div>
              <div className="bg-bookverse-cream/30 p-6 rounded-lg flex flex-col space-y-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-bookverse-accent" />
                  <h3 className="text-lg font-medium">Why Nostr for Books?</h3>
                </div>
                <p className="text-sm">
                  Reading is a deeply personal activity. What we read, how we interpret literature, and the notes we take
                  are private expressions of our thoughts and beliefs. When we use corporate platforms to track our reading,
                  we surrender control over this personal data.
                </p>
                <p className="text-sm">
                  With Bookstr on Nostr, your reading data isn't locked into a proprietary system. You own your keys,
                  which means you own your data, and can use it across any Nostr-compatible application.
                </p>
              </div>
            </div>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-bookverse-ink">Why Choose Bookstr?</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 bg-bookverse-cream/30 rounded-lg">
                <h3 className="text-xl font-medium text-bookverse-ink">Freedom from Corporate Control</h3>
                <p>
                  Your reading habits and discussions aren't monitored by corporate algorithms designed to maximize
                  engagement and ad revenue. On Bookstr, you're not the product.
                </p>
              </div>
              
              <div className="space-y-3 p-4 bg-bookverse-cream/30 rounded-lg">
                <h3 className="text-xl font-medium text-bookverse-ink">Own Your Data</h3>
                <p>
                  Your reading list, reviews, and connections are cryptographically yours. No company can delete your
                  account or remove access to your reading history.
                </p>
              </div>
              
              <div className="space-y-3 p-4 bg-bookverse-cream/30 rounded-lg">
                <h3 className="text-xl font-medium text-bookverse-ink">Censorship Resistance</h3>
                <p>
                  Discuss any book freely without fear of platform censorship. Bookstr allows for open literary
                  discourse without corporate moderation policies.
                </p>
              </div>
              
              <div className="space-y-3 p-4 bg-bookverse-cream/30 rounded-lg">
                <h3 className="text-xl font-medium text-bookverse-ink">Community First</h3>
                <p>
                  Built by readers for readers, Bookstr prioritizes creating a genuine community of book lovers
                  rather than maximizing profits through advertising.
                </p>
              </div>
            </div>
          </section>
          
          <section className="space-y-4 bg-bookverse-cream/30 p-6 rounded-lg">
            <h2 className="text-2xl font-serif font-bold text-bookverse-ink">Getting Started</h2>
            <p>
              To use Bookstr, you'll need a Nostr key pair. You can create one through browser extensions like
              Nos2x, Alby, or a Nostr-enabled wallet. Once you have your keys, simply connect to Bookstr and
              start building your digital library.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button asChild>
                <Link to="/">Start Exploring</Link>
              </Button>
              <Button variant="outline" asChild>
                <a 
                  href="https://nostr.how" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  Learn How to Use Nostr <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default About;
