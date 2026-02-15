export default function Footer() {
  return (
    <footer className="bg-skeet-dark text-gray-500 text-xs py-6 mt-auto">
      <div className="max-w-4xl mx-auto px-4 text-center space-y-1">
        <p>
          Built by{' '}
          <a
            href="https://outofmemory.co.uk/links/"
            className="text-gray-400 hover:text-skeet-orange transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Andrew Rimmer
          </a>
          {' '}as a fan project. Not affiliated with or endorsed by Jon Skeet.
        </p>
        <p>
          Powered by the{' '}
          <a
            href="https://api.stackexchange.com/"
            className="text-gray-400 hover:text-skeet-orange transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stack Exchange API
          </a>
          {' | '}
          <a
            href="https://lmajsfy.com/"
            className="text-gray-400 hover:text-skeet-orange transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            LMAJSFY
          </a>
          . First launched circa 2009. Reengineered 2026.
        </p>
      </div>
    </footer>
  )
}
