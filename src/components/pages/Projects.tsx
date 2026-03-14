import { type JSX, useState, useEffect } from "react";
import { GithubLogo, StarIcon } from "../icons/Icons";
import { t, type Locale, type TranslationKey } from "../../i18n";

interface Project {
  name: string;
  slug: string;
  descriptionKey: TranslationKey;
  repository?: string;
  private?: boolean;
  status: string;
  url: string;
  tags: string[];
}

const getRepoInfo = (url: string): { owner: string; repo: string } | null => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
};

interface ProjectsProps {
  locale?: Locale;
}

const Projects = ({ locale = "en" }: ProjectsProps): JSX.Element => {
  const [stars, setStars] = useState<Record<string, number | null>>({});
  const projects: Project[] = [
    {
      name: "Maison",
      slug: "maison",
      descriptionKey: "project.maison.desc",
      status: "published",
      repository: "https://github.com/uplg/maison",
      url: "https://github.com/uplg/maison",
      tags: ["Rust", "React", "Tuya local API", "BLE", "IoT", "Hue", "Typescript"],
    },
    {
      name: "Dobrunia Design",
      slug: "dobrunia",
      descriptionKey: "project.dobrunia.desc",
      status: "published",
      repository: "https://github.com/uplg/dobrunia-design",
      url: "https://www.dobruniadesign.com",
      tags: ["Astro", "GraphQL", "Wordpress"],
    },
    {
      name: "Mula(n)",
      slug: "mulan",
      descriptionKey: "project.mulan.desc",
      status: "published",
      private: false,
      repository: "https://github.com/uplg/mulan",
      url: "https://github.com/uplg/mulan",
      tags: ["Python", "MLX", "HeartMuLa", "FastAPI", "React", "Typescript"],
    },
    {
      name: "Art min\u00e9ral",
      slug: "art-mineral",
      descriptionKey: "project.art-mineral.desc",
      status: "published",
      private: true,
      repository: "https://github.com/uplg/art-mineral",
      url: "https://artmineral.fr",
      tags: ["Astro", "Strapi", "E-commerce", "Typescript"],
    },
    {
      name: "Asahi Map",
      slug: "asahi-map",
      descriptionKey: "project.asahi-map.desc",
      status: "published",
      repository: "https://github.com/uplg/asahi-map",
      url: "https://github.com/uplg/asahi-map",
      tags: ["Go", "Keyboard mappings", "Asahi Linux"],
    },
    {
      name: "Portfolio",
      slug: "portfolio",
      descriptionKey: "project.portfolio.desc",
      repository: "https://github.com/uplg/astro-portfolio",
      status: "published",
      url: "https://uplg.xyz",
      tags: ["Astro", "React", "WebGPU", "WebGL2", "no-js"],
    },
    {
      name: "Teeter",
      slug: "teeter",
      descriptionKey: "project.teeter.desc",
      status: "published",
      repository: "https://github.com/uplg/teeter",
      url: "https://github.com/uplg/teeter",
      tags: ["Kotlin"],
    },
    {
      name: "Backup tool",
      slug: "backup-tool",
      descriptionKey: "project.backup-tool.desc",
      repository: "https://github.com/uplg/backup-tool",
      status: "published",
      url: "https://github.com/uplg/backup-tool",
      tags: ["Gzip", "MySQL", "MySQLDump", "Docker", "SFTP", "FTP(ES)"],
    },
    {
      name: "SummarySwift",
      slug: "summary-swift",
      descriptionKey: "project.summary-swift.desc",
      status: "published",
      repository: "https://github.com/uplg/summary-swift",
      url: "https://github.com/uplg/summary-swift",
      tags: ["MLX", "Whisper", "Gemma 3n", "SwiftUI"],
    },

    {
      name: "Cheno",
      slug: "cheno",
      descriptionKey: "project.cheno.desc",
      status: "published",
      repository: "https://github.com/uplg/cheno-website",
      private: true,
      url: "https://www.cheno.fr",
      tags: ["Astro", "Instagram Private API", "Hono", "Typescript"],
    },
    {
      name: "Video summarizer",
      slug: "video-summarizer",
      descriptionKey: "project.video-summarizer.desc",
      repository: "https://github.com/uplg/video-summarize",
      status: "published",
      url: "https://github.com/uplg/video-summarize",
      tags: ["MLX", "Whisper", "Gemma", "FastAPI", "React", "Python"],
    },
    {
      name: "Thiweb",
      slug: "thiweb",
      descriptionKey: "project.thiweb.desc",
      repository: "https://github.com/uplg/thiweb-crypt-n-decrypt",
      status: "published",
      url: "https://forum.thiweb.com",
      tags: ["PhpBB", "Typescript", "NodeJS", "AWS", "WebExtension"],
    },
    {
      name: "Google Authenticator Export",
      slug: "ga-export",
      descriptionKey: "project.ga-export.desc",
      repository: "https://github.com/uplg/gauth-export",
      status: "published",
      url: "https://ga.uplg.xyz",
      tags: ["OTPAuth", "Material"],
    },
    {
      name: "Persin Conseil",
      slug: "persin",
      descriptionKey: "project.persin.desc",
      repository: "https://github.com/uplg/persin-conseil",
      url: "https://www.persin.fr",
      status: "published",
      tags: ["Lit", "Offline ready", "no-js handling"],
    },
    {
      name: "Fujin",
      slug: "fujin",
      descriptionKey: "project.fujin.desc",
      repository: "https://github.com/uplg/fujin",
      status: "archived",
      url: "https://github.com/uplg/fujin",
      tags: ["NodeJS", "Telegram", "Bot", "OPML", "RSS"],
    },
    {
      name: "BricksSDK",
      slug: "bricks-sdk",
      descriptionKey: "project.bricks-sdk.desc",
      repository: "https://github.com/uplg/bricks_sdk",
      status: "archived",
      url: "https://github.com/uplg/bricks_sdk",
      tags: ["NodeJS", "Typescript", "Zod", "Undici"],
    },
    {
      name: "MonpetitplacementSDK",
      slug: "mpp-sdk",
      descriptionKey: "project.mpp-sdk.desc",
      repository: "https://github.com/uplg/monpetitplacement_sdk",
      status: "archived",
      url: "https://github.com/uplg/monpetitplacement_sdk",
      tags: ["NodeJS", "Typescript", "Zod", "Undici"],
    },
    {
      name: "PDFFormsFiller",
      slug: "pdf-forms-filler",
      descriptionKey: "project.pdf-forms-filler.desc",
      repository: "https://github.com/uplg/PDFFormsFiller",
      status: "archived",
      url: "https://github.com/uplg/PDFFormsFiller",
      tags: ["PHP", "FPDF/FPDI", "PHPUnit"],
    },
  ];

  useEffect(() => {
    const fetchStars = async () => {
      const publicRepos = projects.filter((p) => p.repository && !p.private);

      const starsData: Record<string, number | null> = {};

      await Promise.all(
        publicRepos.map(async (project) => {
          const repoInfo = getRepoInfo(project.repository!);
          // @tool: debug when gh rate-limit
          // starsData[project.slug] = 1;

          if (!repoInfo) return;

          try {
            const response = await fetch(
              `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`,
            );
            if (response.ok) {
              const data = await response.json();
              starsData[project.slug] = data.stargazers_count;
            }
          } catch {
            // Silently fail for individual repos
          }
        }),
      );

      setStars(starsData);
    };

    fetchStars();
  }, []);

  return (
    <div id="page" className="page" role="main">
      <div className="content-section-header">
        <h1>{t(locale, "projects.title")}</h1>
      </div>

      <section className="projects">
        {projects.map((project) => (
          <div key={project.slug} className="project">
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              {project.name}
            </a>
            <div className="excerpt">
              <p>{t(locale, project.descriptionKey)}</p>
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
                <div className="repo-info">
                  {project.repository && !project.private && (
                    <>
                      {stars[project.slug] !== undefined &&
                        stars[project.slug] !== null &&
                        stars[project.slug]! > 0 && (
                          <span className="stars-count">
                            <StarIcon />
                            {stars[project.slug]}
                          </span>
                        )}
                      <a href={project.repository} target="_blank" rel="noopener noreferrer">
                        <GithubLogo />
                      </a>
                    </>
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
          </div>
        ))}
      </section>
    </div>
  );
};

export default Projects;
