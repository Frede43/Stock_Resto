import re

def test_youtube_url():
    url = 'https://www.youtube.com/watch?v=BQKfAxFgi-E'
    
    patterns = [
        r'(?:youtube\.com\/watch\?v=)([^&\n?#]+)',
        r'(?:youtu\.be\/)([^&\n?#]+)',
        r'(?:youtube\.com\/embed\/)([^&\n?#]+)',
        r'(?:youtube\.com\/v\/)([^&\n?#]+)'
    ]
    
    print(f"Testing URL: {url}")
    
    for i, pattern in enumerate(patterns):
        match = re.search(pattern, url)
        if match:
            video_id = match.group(1)
            embed_url = f'https://www.youtube.com/embed/{video_id}'
            print(f"✅ Pattern {i+1} matched: {pattern}")
            print(f"   Video ID: {video_id}")
            print(f"   Embed URL: {embed_url}")
            return embed_url
        else:
            print(f"❌ Pattern {i+1} failed: {pattern}")
    
    print("No pattern matched")
    return None

if __name__ == "__main__":
    test_youtube_url()
