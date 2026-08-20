import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileCode2, GitBranch, Save } from "lucide-react";
import Button from "./Button";
import LoadingState from "./LoadingState";
import CodeEditor from "./CodeEditor";
import { getRepositoryFile, getRepositoryFiles, saveRepositoryFile } from "../lib/api";

export default function RepositoryEditor() {
  const [repository, setRepository] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [file, setFile] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getRepositoryFiles()
      .then((result) => {
        setRepository(result.repository);
        setFiles(result.files || []);
      })
      .catch((err) => setError(err.message || "Could not load the connected repository."))
      .finally(() => setLoading(false));
  }, []);

  const visibleFiles = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle ? files.filter((item) => item.path.toLowerCase().includes(needle)) : files;
  }, [files, search]);

  const openFile = async (path) => {
    setSelectedPath(path);
    setLoadingFile(true);
    setError("");
    setNotice("");
    try {
      const result = await getRepositoryFile(path);
      setFile(result);
      setContent(result.content);
      setRepository(result.repository);
    } catch (err) {
      setFile(null);
      setError(err.message || "Could not open this file.");
    } finally {
      setLoadingFile(false);
    }
  };

  const save = async () => {
    if (!file) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await saveRepositoryFile({ path: file.path, content, sha: file.sha });
      setFile((current) => ({ ...current, sha: result.sha || current.sha }));
      setNotice("Saved to the connected GitHub repository.");
    } catch (err) {
      setError(err.message || "Could not save this file.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState rows={4} />;
  if (error && !repository) return <p className="text-[12.5px] text-danger">{error}</p>;

  return (
    <div className="w-full rounded-lg border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink"><GitBranch className="size-4" /> Connected repository</h3>
          <p className="mt-1 text-[12px] text-ink-faint">Changes are committed directly to this organization&apos;s admin-connected GitHub repository.</p>
        </div>
        {repository?.htmlUrl && <a href={repository.htmlUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">Open on GitHub <ExternalLink className="size-3.5" /></a>}
      </div>

      {repository && <div className="mt-3 flex items-center gap-2 rounded-md bg-surface-alt px-3 py-2 text-[12px] text-ink"><span className="font-medium">{repository.fullName}</span><span className="text-ink-faint">·</span><span className="font-mono text-ink-faint">{repository.branch}</span></div>}

      <div className="mt-4 grid min-h-[34rem] gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="min-w-0">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter files…" className="mb-2 h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-[12px] outline-none" />
          <div className="h-[30rem] overflow-y-auto rounded-md border border-line bg-surface-alt/40 p-1">
            {visibleFiles.length ? visibleFiles.map((item) => <button key={item.path} type="button" onClick={() => openFile(item.path)} className={`flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left font-mono text-[11px] ${selectedPath === item.path ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-surface-alt"}`}><FileCode2 className="size-3 shrink-0" /> <span className="truncate">{item.path}</span></button>) : <p className="p-2 text-[11.5px] text-ink-faint">No supported source files found.</p>}
          </div>
        </div>
        <div className="min-w-0">
          {!file && !loadingFile && <p className="rounded-md border border-dashed border-line p-5 text-[12.5px] text-ink-faint">Choose a source file to view or edit it.</p>}
          {loadingFile && <LoadingState rows={5} />}
          {file && !loadingFile && <>
            <div className="mb-2 flex items-center justify-end gap-3"><Button variant="primary" size="sm" icon={Save} onClick={save} loading={saving}>Save to GitHub</Button></div>
            <CodeEditor value={content} onChange={setContent} path={file.path} disabled={saving} />
          </>}
        </div>
      </div>
      {notice && <p className="mt-3 text-[12px] text-success">{notice}</p>}
      {error && repository && <p className="mt-3 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
