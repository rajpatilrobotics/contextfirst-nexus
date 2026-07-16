"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-[#F5F7F6] px-4 py-8 text-[#14212B] sm:px-6">
          <section
            aria-labelledby="global-error-heading"
            className="mx-auto grid max-w-3xl gap-4 rounded-[10px] border border-[#B42318] bg-white p-5"
            role="alert"
          >
            <p className="text-sm font-semibold uppercase text-[#B42318]">Application recovery</p>
            <h1 className="text-3xl font-semibold leading-10" id="global-error-heading" ref={headingRef} tabIndex={-1}>
              The workspace needs a safe reload
            </h1>
            <p>
              This error view does not expose technical diagnostics, source text, provider responses, account details, credentials, or stack traces.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="min-h-11 rounded-[6px] border border-[#5948B8] bg-[#5948B8] px-4 py-2 text-sm font-semibold text-white"
                onClick={reset}
                type="button"
              >
                Retry application
              </button>
              <Link
                className="inline-flex min-h-11 items-center rounded-[6px] border border-[#64748B] bg-white px-4 py-2 text-sm font-semibold text-[#14212B] no-underline"
                href="/"
              >
                Return home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
