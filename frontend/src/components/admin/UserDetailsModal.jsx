export default function UserDetailsModal({ user, onClose }) {
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4 overlay-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7 modal-pop-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">User Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>

        <div className="flex items-center gap-4 mt-5">
          <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{user.full_name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Role</span>
            <span className="text-slate-800 capitalize font-medium">{user.role}</span>
          </div>
          {user.office && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Office</span>
              <span className="text-slate-800">{user.office}</span>
            </div>
          )}
          {user.position && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Position</span>
              <span className="text-slate-800">{user.position}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Status</span>
            <span className={`font-medium ${user.is_active ? 'text-green-600' : 'text-slate-400'}`}>
              ● {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Date Joined</span>
            <span className="text-slate-800">
              {new Date(user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}