import type { UserListProps } from "../types";

function UserList({ users, currentUser }: UserListProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-gray-100 mb-4 pb-2 border-b border-slate-500">
        Online Users ({users.length})
      </h2>
      <div id="userListContainer" className="flex-1 overflow-y-auto">
        {users.length === 0 ? (
          <p className="text-gray-300 italic">No other users online.</p>
        ) : (
          <ul className="space-y-2">
            {users.map((user: string, index: number) => (
              <li
                key={index}
                className={`flex items-center p-2 rounded-md ${
                  user === currentUser
                    ? "bg-indigo-500/30 font-semibold text-indigo-100"
                    : "text-gray-100 hover:bg-slate-600/30"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full mr-2 ${
                    user === currentUser ? "bg-indigo-300" : "bg-emerald-300"
                  }`}
                ></span>
                {user} {user === currentUser && "(You)"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default UserList;
