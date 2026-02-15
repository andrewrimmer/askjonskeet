export default function About() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">About Ask Jon Skeet</h2>

      <div className="prose prose-gray max-w-none space-y-4 text-gray-600 leading-relaxed">
        <p>
          <a
            href="https://stackoverflow.com/"
            className="text-skeet-orange hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stack Overflow
          </a>{' '}
          is the world's largest Q&A site for programmers. It has a reputation system
          that rewards quality contributions, creating a vast knowledge base of programming
          questions and answers.
        </p>

        <p>
          And then there's{' '}
          <a
            href="https://stackoverflow.com/users/22656/jon-skeet"
            className="text-skeet-orange hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jon Skeet
          </a>
          .
        </p>

        <p>
          Jon Skeet is a Google software engineer and the all-time #1 reputation holder
          on Stack Overflow. His answers are legendary not just for their volume but for
          their consistent, almost reference-level quality. Whether it's C#, Java, .NET,
          date/time handling, or any of dozens of other topics, his answers have a clarity
          and depth that make them genuinely educational.
        </p>

        <p>
          This site was first built around 2009 as a playful{' '}
          <a
            href="https://en.wikipedia.org/wiki/Ask_Jeeves"
            className="text-skeet-orange hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ask Jeeves
          </a>
          -style search engine specifically for Jon Skeet's Stack Overflow answers. The
          original version was an ASP.NET app using Lucene to spider Stack Overflow and
          build searchable indexes. It was a side project, built out of genuine appreciation
          for the quality of his contributions.
        </p>

        <p>
          In 2026, the site was reengineered as a modern .NET 10 application
          with a React frontend. It still uses Lucene under the hood, but now
          powered by Lucene.NET with a full index of every Jon Skeet answer.
          A background service keeps the index fresh from the Stack Exchange API,
          so searches are fast and comprehensive.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 pt-2">The Legend</h3>

        <p>
          Jon Skeet occupies a unique place in programming culture. His Stack Overflow
          contributions are so prolific and so consistently excellent that he's
          become something of an internet legend, spawning the{' '}
          <a
            href="https://meta.stackexchange.com/questions/9134/jon-skeet-facts"
            className="text-skeet-orange hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            "Jon Skeet Facts"
          </a>{' '}
          thread (in the style of Chuck Norris facts). This site leans into that
          legend, but it's also genuinely useful. His answers form a remarkably
          high-quality knowledge base that has real value.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 pt-2">Resources</h3>

        <ul className="list-disc pl-5 space-y-1">
          <li>
            <a
              href="https://csharpindepth.com/"
              className="text-skeet-orange hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              C# in Depth
            </a>{' '}
            &mdash; Jon's book, a deep and accessible exploration of C#
          </li>
          <li>
            <a
              href="https://codeblog.jonskeet.uk/"
              className="text-skeet-orange hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Jon's Blog
            </a>{' '}
            &mdash; coding adventures, NodaTime, and more
          </li>
          <li>
            <a
              href="https://stackoverflow.com/users/22656/jon-skeet"
              className="text-skeet-orange hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Jon Skeet on Stack Overflow
            </a>{' '}
            &mdash; the source of it all
          </li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 pt-2">Credits</h3>

        <p>
          Built by{' '}
          <a
            href="https://outofmemory.co.uk/links/"
            className="text-skeet-orange hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Andrew Rimmer
          </a>{' '}
          as a side project. This site is not affiliated with or endorsed by Jon Skeet.
          Powered by the{' '}
          <a
            href="https://api.stackexchange.com/"
            className="text-skeet-orange hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stack Exchange API
          </a>
          .
        </p>
      </div>
    </div>
  )
}
