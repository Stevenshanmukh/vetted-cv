export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-white text-2xl">description</span>
        </div>
        <p className="text-text-secondary dark:text-text-secondary-dark">Loading...</p>
      </div>
    </div>
  );
}

