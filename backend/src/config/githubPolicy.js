const REPO_ANALYZABLE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp", ".h", ".hpp",
  ".html", ".css", ".json", ".md", ".sql", ".go", ".rs", ".rb", ".php", ".xml", ".yml", ".yaml"
]);
const IGNORED_PATH_PARTS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".next", ".nuxt", "vendor", "target", "bin", "obj", "__pycache__", ".venv", "venv"]);
const MAX_TREE_ENTRIES = 10000;
const MAX_CANDIDATE_FILES = 10;
const MAX_SOURCE_FILE_BYTES = 200 * 1024;
const MAX_TOTAL_SOURCE_CHARS = 120000;
module.exports = { REPO_ANALYZABLE_EXTENSIONS, IGNORED_PATH_PARTS, MAX_TREE_ENTRIES, MAX_CANDIDATE_FILES, MAX_SOURCE_FILE_BYTES, MAX_TOTAL_SOURCE_CHARS };
