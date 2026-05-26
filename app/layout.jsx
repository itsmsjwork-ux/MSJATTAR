import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://itsmsjwork-ux.github.io/MSJATTAR/"),
  title: "MSJ Attar | Premium Traditional Attars",
  description:
    "MSJ Attar by Mohammed Shahid Joshiddi, a premium traditional attar brand blending heritage, natural ingredients, and luxurious fragrance rituals.",
  openGraph: {
    title: "MSJ Attar | Premium Traditional Attars",
    description: "Premium alcohol-free attars with oud, musk, floral, spice, and fresh collections.",
    images: ["/assets/msj-logo.svg"]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
