export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (
      url.pathname === '/.well-known/apple-app-site-association' ||
      url.pathname === '/apple-app-site-association'
    ) {
      const aasaContent = {
        applinks: {
          details: [
            {
              appIDs: ['A98NTM7WMG.com.app.alice.learn'],
              components: [
                {
                  '/': '/verify/*',
                  comment: 'Handles verification links',
                },
              ],
            },
          ],
        },
      };
      return new Response(JSON.stringify(aasaContent), {
        headers: {
          'Content-Type': 'application/json', // Important: Apple expects this, not text/plain
        },
      });
    }
    if (url.pathname === '/verify') {
      const otp = url.searchParams.get('otp'); // Extract from query
      const email = url.searchParams.get('email'); // Extract from query

      console.log('otp', otp);
      console.log('email', email);

      if (!otp || !email) {
        // Return error HTML directly
        return new Response(
          `
        <html>
          <body>
            <h1>Verification Error</h1>
            <p>Invalid link. Please try again or request a new verification email.</p>
            <a href="https://appalice.com">Back to App</a>
          </body>
        </html>
      `,
          { headers: { 'Content-Type': 'text/html' } },
        );
      }
      try {
        // Make POST to your API
        const apiResponse = await fetch(
          'http://localhost:3000/api/v1/auth/email',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp, email }),
          },
        );
        console.log('apiResponse', apiResponse);
        if (!apiResponse.ok) {
          throw new Error('API verification failed');
        }

        // On success, return success HTML
        return new Response(
          `
        <html>
          <body>
            <h1>Verification Successful!</h1>
            <p>Your email has been verified. You can now return to the app.</p>
            <a href="yourapp://success">Open App</a>  <!-- Or use script for auto-open -->
            <script>
              // Optional: Auto-redirect to deep link after a delay
              setTimeout(() => { window.location.href = 'yourapp://success'; }, 2000);
            </script>
          </body>
        </html>
      `,
          { headers: { 'Content-Type': 'text/html' } },
        );
      } catch (error) {
        // Return error HTML on failure
        return new Response(
          `
        <html>
          <body>
            <h1>Verification Failed</h1>
            <p>There was an issue verifying your email: ${error.message}. Please try again.</p>
            <a href="https://appalice.com/retry">Request New Link</a>
          </body>
        </html>
      `,
          { headers: { 'Content-Type': 'text/html' } },
        );
      }
    }

    // Fallback for other paths (or leave empty if separate Worker)
    return new Response('Not Found', { status: 404 });
  },
};
