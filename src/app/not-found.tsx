export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">404 - Not Found</h1>
      <p className="mb-8 text-gray-600 dark:text-gray-300 text-center">Sorry, the page you are looking for does not exist.</p>
      <a
        href="/"
        className="inline-block w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 text-center text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
      >
        Go to Home
      </a>
    </div>
  );
}
