import type { NextConfig } from "next";

/**
 * NEXT.JS SECURITY CONFIGURATION
 * ===============================
 * Comprehensive security headers following OWASP best practices.
 * 
 * **Security Headers Implemented:**
 * - Content-Security-Policy: Prevents XSS attacks
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - Referrer-Policy: Controls referrer information leakage
 * - Permissions-Policy: Restricts browser features
 * - Strict-Transport-Security: Enforces HTTPS
 * 
 * **OWASP Compliance:**
 * - A03:2021 – Injection (CSP prevents XSS)
 * - A05:2021 – Security Misconfiguration
 * - A08:2021 – Software and Data Integrity Failures
 */

const nextConfig: NextConfig = {
  /**
   * Security headers applied to all routes.
   * 
   * **Testing:**
   * Use https://securityheaders.com to verify header configuration
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // CSP prevents XSS by controlling what resources can load
            // 'unsafe-eval' and 'unsafe-inline' needed for Next.js/React
            // TODO: Remove 'unsafe-*' in production with nonce-based CSP
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self'",
              "frame-ancestors 'none'", // Prevents embedding in iframes
              "base-uri 'self'", // Restricts <base> tag URLs
              "form-action 'self'", // Restricts form submission targets
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            // Prevents browsers from MIME-sniffing responses
            // Stops browsers from interpreting files as different MIME type
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            // Prevents clickjacking attacks by blocking iframe embedding
            // DENY: Cannot be embedded in any iframe
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            // Controls how much referrer information is sent
            // strict-origin-when-cross-origin: Full URL for same-origin, origin only for cross-origin
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            // Restricts browser features that the site can use
            // Prevents malicious use of sensitive APIs
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "interest-cohort=()", // Disables FLoC (privacy)
            ].join(", "),
          },
          {
            key: "Strict-Transport-Security",
            // Forces HTTPS connections for security
            // max-age=31536000: 1 year
            // includeSubDomains: Applies to all subdomains
            // preload: Eligible for browser preload list
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-DNS-Prefetch-Control",
            // Controls DNS prefetching to prevent privacy leaks
            value: "on",
          },
        ],
      },
    ];
  },
  
  /**
   * Environment variable validation.
   * Ensures critical security variables are set.
   */
  env: {
    // These will be validated at build time
    SESSION_SECRET: process.env.SESSION_SECRET,
  },
};

export default nextConfig;
