import os

def fix_encoding():
    file_path = '.env.local'
    content = None
    
    # Try reading with different encodings
    encodings = ['utf-16', 'utf-16-le', 'utf-16-be', 'utf-8', 'cp1252', 'latin1']
    
    for enc in encodings:
        try:
            with open(file_path, 'r', encoding=enc) as f:
                content = f.read()
            # If we see expected key, we found the right encoding
            if 'MONGODB_URI' in content:
                print(f"Success reading with {enc}")
                break
        except Exception as e:
            continue
            
    if content:
        # Clean up null bytes if any
        content = content.replace('\x00', '')
        # Write back as standard utf-8
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content.strip())
        print("Fixed .env.local encoding to UTF-8")
        # Print content to verify (masking password)
        print("Content prefix:", content.split('://')[0] + '://' + '***' + '@' + content.split('@')[-1] if '@' in content else content)
    else:
        print("Could not read file with any standard encoding.")

if __name__ == "__main__":
    fix_encoding()
