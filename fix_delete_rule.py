import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add delete function
delete_func = """  const toggleAccessRule = (position: string, page: string) => {
"""
new_delete_func = """  const removeAccessRule = (position: string) => {
    setAccessRules((prev: Record<string, Record<string, boolean>>) => {
      const currentRules = { ...prev };
      delete currentRules[position];
      return currentRules;
    });
  };

  const toggleAccessRule = (position: string, page: string) => {
"""
content = content.replace(delete_func, new_delete_func)

# Add column header
th_target = """<th className="px-5 py-3 text-[10px] font-bold text-[#8E94B7] uppercase tracking-wider border-b border-[#f1f5f9]">Access Menu</th>"""
new_th = th_target + """\n                    <th className="px-5 py-3 text-[10px] font-bold text-[#8E94B7] uppercase tracking-wider border-b border-[#f1f5f9] text-right">Aksi</th>"""
content = content.replace(th_target, new_th)

# Add column cell with delete button
td_target = """<td className="px-5 py-4">{renderAccessCheckbox(position, 'access')}</td>"""
new_td = td_target + """\n                      <td className="px-5 py-4 text-right">
                        <button onClick={() => removeAccessRule(position)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Hapus Rule">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </td>"""
content = content.replace(td_target, new_td)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Added delete rule feature")
