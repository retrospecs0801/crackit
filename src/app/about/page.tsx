'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { SOCIAL_LINKS } from '@/components/layout/SocialIcons';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col pt-[56px] bg-canvas text-text-primary">
      <Navbar onCreateRoom={() => router.push('/')} />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-3xl mx-auto text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors self-start sm:self-center mb-10"
        >
          ← Back to CrackIt
        </Link>

        <div className="w-12 h-12 rounded-2xl border border-border-default bg-surface shadow-sm flex items-center justify-center mb-6 overflow-hidden">
          <img src="/logo.jpg" alt="CrackIt Logo" className="w-full h-full object-cover" />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-text-primary tracking-tight leading-[1.2] mb-8">
          About CrackIt
        </h1>

        <div className="p-8 sm:p-10 rounded-2xl border border-border-default bg-surface/60 backdrop-blur-sm shadow-sm max-w-2xl text-left sm:text-center relative overflow-hidden">
          <p className="font-sans text-[16px] sm:text-[18px] text-text-primary leading-relaxed sm:leading-loose">
            <span className="font-semibold">Crackit.live</span> is built on a single premise: studying shouldn&apos;t be a lonely journey. We break isolation by providing real-time peer-to-peer digital environments, interactive focus tracking, and structured countdown sessions designed to help you cross the finish line confidently.
          </p>
        </div>

        <div className="mt-14 flex flex-col items-center gap-4">
          <span className="font-sans text-[11px] uppercase tracking-[0.16em] font-semibold text-text-secondary">
            Follow us on
          </span>
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                title={social.name}
                aria-label={social.name}
                className="flex items-center justify-center w-12 h-12 rounded-full border border-border-default bg-surface hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
