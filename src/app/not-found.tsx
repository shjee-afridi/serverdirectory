export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
      <p className="mb-8">Sorry, the page you are looking for does not exist.</p>
      <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded">Go Home</a>
    </div>
  );
}
