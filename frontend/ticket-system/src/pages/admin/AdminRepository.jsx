import { useCallback, useState } from "react";
import Topbar from "../../components/Topbar";
import GitRepositoryCard from "../../components/GitRepositoryCard";
import RepositoryEditor from "../../components/RepositoryEditor";

/** Admin-only GitHub connection and source editor for this organization. */
export default function AdminRepository() {
  const [githubAuthorizationExpired, setGithubAuthorizationExpired] = useState(false);
  const markGitHubAuthorizationExpired = useCallback(() => setGithubAuthorizationExpired(true), []);

  return (
    <>
      <Topbar eyebrow="GitHub" title="Repository" />
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">
          <GitRepositoryCard externalAuthExpired={githubAuthorizationExpired} />
          <RepositoryEditor onGitHubAuthExpired={markGitHubAuthorizationExpired} />
        </div>
      </div>
    </>
  );
}
