import re

path = 'src/context/AppContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """        const synced = await syncAuthToBackend(firebaseUser);
        setUserProfile(synced.profile);
        setIsAdmin(synced.isAdmin);
        setAdminRole(synced.adminRole || null);

        // Fetch wishlist items
        try {
          const token = await firebaseUser.getIdToken();
          const wRes = await fetch("/api/wishlist", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (wRes.ok) {
            const wData = await wRes.json();
            setWishlist(wData.wishlists.map((w: any) => w.productId));
          }
        } catch (e) {
          console.error("Failed to load wishlist", e);
        }"""

new = """        const token = await firebaseUser.getIdToken();
        const [synced, wRes] = await Promise.all([
          syncAuthToBackend(firebaseUser),
          fetch("/api/wishlist", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
        ]);

        setUserProfile(synced.profile);
        setIsAdmin(synced.isAdmin);
        setAdminRole(synced.adminRole || null);

        if (wRes && wRes.ok) {
          const wData = await wRes.json();
          setWishlist(wData.wishlists?.map((w: any) => w.productId) || []);
        }"""

content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
