#!/usr/bin/env python3
"""
Script to remove background from boy2.png using Remove.bg API
"""
import requests
import os

def remove_background(input_path, output_path, api_key):
    """Remove background from image using Remove.bg API"""
    
    if not os.path.exists(input_path):
        print(f"Error: Input file {input_path} not found")
        return False
    
    print(f"Processing {input_path}...")
    
    try:
        with open(input_path, 'rb') as image_file:
            response = requests.post(
                'https://api.remove.bg/v1.0/removebg',
                files={'image_file': image_file},
                data={'size': 'auto'},
                headers={'X-Api-Key': api_key},
                timeout=30
            )
        
        if response.status_code == 200:
            with open(output_path, 'wb') as out_file:
                out_file.write(response.content)
            print(f"✅ Success! Background removed and saved to {output_path}")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return False

if __name__ == "__main__":
    # Configuration
    API_KEY = input("Enter your Remove.bg API key: ").strip()
    INPUT_FILE = "web/public/stories/zoo/char/boy2.png"
    OUTPUT_FILE = "web/public/stories/zoo/char/boy2_transparent.png"
    
    if not API_KEY:
        print("❌ API key is required")
        exit(1)
    
    # Remove background
    success = remove_background(INPUT_FILE, OUTPUT_FILE, API_KEY)
    
    if success:
        print("\n🎉 Background removal complete!")
        print(f"Original file: {INPUT_FILE}")
        print(f"New file: {OUTPUT_FILE}")
        print("\nYou can now:")
        print(f"1. Review the result: {OUTPUT_FILE}")
        print(f"2. If satisfied, replace the original: mv {OUTPUT_FILE} {INPUT_FILE}")
    else:
        print("\n❌ Background removal failed")