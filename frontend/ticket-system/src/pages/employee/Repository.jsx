import Topbar from "../../components/Topbar";
import RepositoryEditor from "../../components/RepositoryEditor";

// Employees can edit source files only after an admin has connected the
// organization repository. Connection management remains admin-only.
export default function EmployeeRepository() {
  return (
    <>
      <Topbar eyebrow="Workspace" title="Repository" />
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-[1600px]">
          <RepositoryEditor />
        </div>
      </div>
    </>
  );
}
