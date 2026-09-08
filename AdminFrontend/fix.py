import sys

file_path = "/Users/ongsaem/JointLiving/Frontend/src/components/GroupBuyAdminView.tsx"
with open(file_path, "rb") as f:
    content = f.read()

text_content = content.decode("utf-8", errors="replace")

start_str = "name: '',\n    category: '"
start_idx = text_content.find(start_str)

if start_idx != -1:
    end_str = "  // --- Loading / Error / API States ---"
    end_idx = text_content.find(end_str, start_idx)
    
    if end_idx != -1:
        replacement = "name: '',\n    category: '',\n    price: 0,\n    stock: 0,\n    description: ''\n  });\n\n" + end_str
        new_text = text_content[:start_idx] + replacement + text_content[end_idx + len(end_str):]
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_text)
        print("Successfully repaired.")
    else:
        print("End string not found.")
else:
    print("Start string not found.")
