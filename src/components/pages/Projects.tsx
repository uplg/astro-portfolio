import { type JSX } from "react";
import { GithubLogo } from "../icons/Icons";

interface Project {
  name: string;
  slug: string;
  description: string;
  repository?: string;
  private?: boolean;
  status: string;
  url: string;
  tags: string[];
}

const Projects = (): JSX.Element => {
  const projects: Project[] = [
    {
      name: "SummarySwift",
      slug: "summary-swift",
      description: "Summarize videos locally with AI on a native app!",
      status: "published",
      repository: "https://github.com/uplg/summary-swift",
      url: "https://github.com/uplg/summary-swift",
      tags: ["MLX", "Whisper", "Gemma 3n", "SwiftUI"],
    },
    {
      name: "Cat API",
      slug: "cat-api",
      description: "Control your Tuya-based cat (IoT) devices locally.",
      status: "published",
      repository: "https://github.com/uplg/cat-api",
      url: "https://github.com/uplg/cat-api",
      tags: ["ElysiaJS", "Tuya local API", "Typescript"],
    },
    {
      name: "Cheno",
      slug: "cheno",
      description: "Iron artist.",
      status: "published",
      repository: "https://github.com/uplg/cheno-website",
      private: true,
      url: "https://www.cheno.fr",
      tags: ["Astro", "Instagram Private API", "Hono", "Typescript"],
    },
    {
      name: "Video summarizer",
      slug: "video-summarizer",
      description: "Summarize videos using AI.",
      repository: "https://github.com/uplg/video-summarize",
      status: "published",
      url: "https://github.com/uplg/video-summarize",
      tags: ["MLX", "Whisper", "Gemma", "FastAPI", "React", "Python"],
    },
    {
      name: "Portfolio",
      slug: "portfolio",
      description: "This website.",
      repository: "https://github.com/uplg/astro-portfolio",
      status: "published",
      url: "https://uplg.xyz",
      tags: ["Astro", "Typescript", "React", "no-js handling"],
    },
    {
      name: "Thiweb",
      slug: "thiweb",
      description: "Community.",
      repository: "https://github.com/uplg/thiweb-crypt-n-decrypt",
      status: "published",
      url: "https://forum.thiweb.com",
      tags: ["PhpBB", "Typescript", "NodeJS", "AWS", "WebExtension"],
    },
    {
      name: "Dobrunia Design",
      slug: "dobrunia",
      description: "Custom objects & interior design.",
      status: "published",
      repository: "https://github.com/uplg/dobrunia-design",
      url: "https://www.dobruniadesign.com",
      tags: ["Lit", "GraphQL", "Wordpress"],
    },

    {
      name: "Backup tool",
      slug: "backup-tool",
      description: "Multi-site, simple, backup in NodeJS.",
      repository: "https://github.com/uplg/backup-tool",
      status: "published",
      url: "https://github.com/uplg/backup-tool",
      tags: ["Gzip", "MySQL", "MySQLDump", "SFTP", "FTP(ES)"],
    },
    {
      name: "Google Authenticator Export",
      slug: "ga-export",
      description: "Export every secret easily from Google Authenticator.",
      repository: "https://github.com/uplg/gauth-export",
      status: "published",
      url: "https://ga.uplg.xyz",
      tags: ["OTPAuth", "Material"],
    },
    {
      name: "Persin Conseil",
      slug: "persin",
      description: "IT consulting and services.",
      repository: "https://github.com/uplg/persin-conseil",
      url: "https://www.persin.fr",
      status: "published",
      tags: ["Lit", "Offline ready", "no-js handling"],
    },
    {
      name: "Fujin",
      slug: "fujin",
      description: "Crypto / news Bot on Telegram.",
      repository: "https://github.com/uplg/fujin",
      status: "archived",
      url: "https://github.com/uplg/fujin",
      tags: ["NodeJS", "Telegram", "Bot", "OPML", "RSS"],
    },
    {
      name: "BricksSDK",
      slug: "bricks-sdk",
      description: "An SDK to access Bricks.co.",
      repository: "https://github.com/uplg/bricks_sdk",
      status: "archived",
      url: "https://github.com/uplg/bricks_sdk",
      tags: ["NodeJS", "Typescript", "Zod", "Undici"],
    },
    {
      name: "MonpetitplacementSDK",
      slug: "mpp-sdk",
      description: "An SDK to access MonPetitPlacement.",
      repository: "https://github.com/uplg/monpetitplacement_sdk",
      status: "archived",
      url: "https://github.com/uplg/monpetitplacement_sdk",
      tags: ["NodeJS", "Typescript", "Zod", "Undici"],
    },
    {
      name: "PDFFormsFiller",
      slug: "pdf-forms-filler",
      description: "Fill Acrobat forms easily using pure PHP ! 💪",
      repository: "https://github.com/uplg/PDFFormsFiller",
      status: "archived",
      url: "https://github.com/uplg/PDFFormsFiller",
      tags: ["PHP", "FPDF/FPDI", "PHPUnit"],
    },
  ];

  return (
    <div id="page" className="page" role="main">
      <div className="content-section-header">
        <h1>Projects</h1>
      </div>

      <section className="projects">
        {projects.map((project) => (
          <div key={project.slug} className="project">
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              {project.name}
            </a>
            <div className="excerpt">
              <p>{project.description}</p>
              <p className="tags">
                {project.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </p>
              <div className="extra">
                {project.status && (
                  <span className="state">
                    {project.status.charAt(0).toUpperCase() +
                      project.status.substring(1, project.status.length)}
                  </span>
                )}
                {project.repository && !project.private && (
                  <a
                    href={project.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GithubLogo />
                  </a>
                )}
                {project.private && (
                  <span className="private" title="Private repository">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-lock-icon lucide-lock"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Projects;
