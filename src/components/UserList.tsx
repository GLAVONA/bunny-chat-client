import type { UserListProps } from "../types";

function UserList({ users, currentUser }: UserListProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-200">
        Online Users ({users.length})
      </h2>
      <div id="userListContainer" className="flex-1 overflow-y-auto">
        {users.length === 0 ? (
          <p className="text-gray-500 italic">No other users online.</p>
        ) : (
          <ul className="space-y-2">
            {users.map((user: string, index: number) => (
              <li
                key={index}
                className={`flex items-center p-2 rounded-md ${
                  user === currentUser
                    ? "bg-blue-100 font-semibold text-blue-800"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full mr-2 ${
                    user === currentUser ? "bg-blue-500" : "bg-green-500"
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
