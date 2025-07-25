import { type JSX } from "react";
import { GithubLogo, ChevronLeft } from "../icons/Icons";

interface Project {
  name: string;
  slug: string;
  description: string;
  repository?: string;
  status: string;
  url: string;
  tags: string[];
}

const Projects = (): JSX.Element => {
  const projects: Project[] = [
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
      name: "Cheno",
      slug: "cheno",
      description: "Iron artist.",
      status: "published",
      repository: "https://github.com/uplg/cheno-website",
      url: "https://www.cheno.fr",
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
      description:
        "Export every secret easily from Google Authenticator (Authy in another repo too.).",
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
      url: "https://t.me/FujinCryptoBot",
      tags: ["NodeJS", "Telegram", "Bot", "OPML", "RSS"],
    },
    {
      name: "BricksSDK",
      slug: "bricks-sdk",
      description: "An SDK to access Bricks.co.",
      repository: "https://github.com/uplg/bricks_sdk",
      status: "archived",
      url: "https://www.npmjs.com/package/@uplg/bricks_sdk",
      tags: ["NodeJS", "Typescript", "Zod", "Undici"],
    },
    {
      name: "MonpetitplacementSDK",
      slug: "mpp-sdk",
      description: "An SDK to access MonPetitPlacement.",
      repository: "https://github.com/uplg/monpetitplacement_sdk",
      status: "archived",
      url: "https://www.npmjs.com/package/@uplg/monpetitplacement_sdk",
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
                {project.repository && (
                  <a
                    href={project.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GithubLogo />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      <a className="back-home flex-link justify-end" href="/">
        <ChevronLeft />
        Home
      </a>
    </div>
  );
};

export default Projects;
