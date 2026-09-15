with open("src/components/admin/AdminShell.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_shell = """  const { user, isAdmin, adminRole, authLoading, logout } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/account/register?redirect=" + pathname);
      return;
    }
  }, [authLoading, user, isAdmin, router, pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  // Not an admin but logged in
  if (!isAdmin || !adminRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiShield size={24} />
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">Access Denied</h2>
          <p className="text-[14px] text-neutral-500 mb-8 leading-relaxed">
            This account is not authorized for the admin dashboard.
          </p>"""

new_shell = """  const { user, isAdmin, adminRole, isFrozen, authLoading, logout } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/account/register?redirect=" + pathname);
      return;
    }
  }, [authLoading, user, isAdmin, router, pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  // Frozen Admin
  if (isFrozen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiShield size={24} />
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">Account Frozen</h2>
          <p className="text-[14px] text-neutral-500 mb-8 leading-relaxed">
            Your account has been frozen by Super Admin.
          </p>
          <button
            onClick={logout}
            className="w-full bg-black text-white rounded-xl py-3 text-[13px] font-bold tracking-[1px] uppercase hover:bg-neutral-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Not an admin but logged in
  if (!isAdmin || !adminRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiShield size={24} />
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">Access Denied</h2>
          <p className="text-[14px] text-neutral-500 mb-8 leading-relaxed">
            This account is not authorized for the admin dashboard.
          </p>"""

content = content.replace(old_shell, new_shell)

with open("src/components/admin/AdminShell.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated AdminShell")
