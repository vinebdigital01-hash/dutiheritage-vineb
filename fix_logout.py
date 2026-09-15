path = "src/context/AppContext.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """  const logout = React.useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  }, []);"""

new_logic = """  const logout = React.useCallback(async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out", error);
    }
  }, []);"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
else:
    print("Could not find old_logic")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
