import nextra from "nextra";

// Set up Nextra with its configuration
const withNextra = nextra({
  // ... Add Nextra-specific options here
});

// Export the final Next.js config with Nextra included
export default withNextra({
  async redirects() {
    return [
      {
        source: "/",
        destination: "/structure",
        permanent: true,
      },
    ];
  },
});
