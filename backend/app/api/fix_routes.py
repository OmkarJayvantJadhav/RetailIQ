import glob
import os

for f in glob.glob('d:/RetailIQ/backend/app/api/*.py'):
    with open(f, 'r') as file:
        content = file.read()
    
    content = content.replace('router.get("",', 'router.get("",')
    content = content.replace('router.post("",', 'router.post("",')
    
    with open(f, 'w') as file:
        file.write(content)
    
print("All files updated successfully.")
