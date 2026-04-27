import "./globals.css";

export const metadata = {
  title: "Sentinel Market Intelligence",
  description: "Trading Hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-black min-h-full font-sans antialiased">
        {children}
      </body>
    </html>
  );
}