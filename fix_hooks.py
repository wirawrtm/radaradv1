import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# We need to move `if (!isOpen) return null;` from its current place down below all hooks.

target_code = """    }
  }, [item, isAdd, userLevel, userData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {"""

replacement_code = """    }
  }, [item, isAdd, userLevel, userData]);

  const handleSubmit = (e) => {"""

if target_code in content:
    content = content.replace(target_code, replacement_code)
    
    # Now find where to reinsert `if (!isOpen) return null;`
    target_insert = """  });

  return (
    <div className="fixed inset-0 z-[110]"""
    
    replacement_insert = """  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110]"""
    
    if target_insert in content:
        content = content.replace(target_insert, replacement_insert)
        with open("src/App.tsx", "w") as f:
            f.write(content)
        print("Fixed hook order!")
    else:
        print("Could not find insert target")
else:
    print("Could not find target_code")

