import urllib.request
import json
import re
import os

def fetch_github_stats(username):
    try:
        token = os.environ.get('GITHUB_TOKEN')
        headers = {'User-Agent': 'Mozilla/5.0'}
        if token:
            headers['Authorization'] = f'token {token}'

        # Fetch public user stats
        user_url = f"https://api.github.com/users/{username}"
        req = urllib.request.Request(user_url, headers=headers)
        with urllib.request.urlopen(req) as response:
            user_data = json.loads(response.read().decode('utf-8'))
            
        public_repos = user_data.get('public_repos', 0)
        followers = user_data.get('followers', 0)
        
        # Fetch repos for stargazers count
        repos_url = f"https://api.github.com/users/{username}/repos?per_page=100"
        req_repos = urllib.request.Request(repos_url, headers=headers)
        with urllib.request.urlopen(req_repos) as response:
            repos_data = json.loads(response.read().decode('utf-8'))
            
        stars = sum(repo.get('stargazers_count', 0) for repo in repos_data)
        
        # Fetch search commits Author count
        commits_url = f"https://api.github.com/search/commits?q=author:{username}"
        commits_headers = headers.copy()
        commits_headers['Accept'] = 'application/vnd.github.cloak-preview'
        req_commits = urllib.request.Request(commits_url, headers=commits_headers)
        commits = 0
        try:
            with urllib.request.urlopen(req_commits) as response:
                commits_data = json.loads(response.read().decode('utf-8'))
                commits = commits_data.get('total_count', 0)
        except Exception as search_err:
            print("Commits search failed, using fallback:", search_err)
            commits = 640
            
        return {
            'repos': public_repos,
            'followers': followers,
            'stars': stars,
            'commits': commits
        }
    except Exception as e:
        print("Error fetching stats:", e)
        return None

def update_svg():
    username = "sujithputta02"
    stats = fetch_github_stats(username)
    if not stats:
        print("Failed to fetch stats. Skipping update.")
        return
        
    print("Fetched Stats:", stats)
    
    # Update retro_stats.svg
    svg_path = "public/retro_stats.svg"
    if os.path.exists(svg_path):
        with open(svg_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Replace placeholders
        content = re.sub(r'id="val-commits">[^<]+<', f'id="val-commits">{stats["commits"]}<', content)
        content = re.sub(r'id="val-stars">[^<]+<', f'id="val-stars">{stats["stars"]}<', content)
        content = re.sub(r'id="val-repos">[^<]+<', f'id="val-repos">{stats["repos"]}<', content)
        content = re.sub(r'id="val-followers">[^<]+<', f'id="val-followers">{stats["followers"]}<', content)
        
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated public/retro_stats.svg with latest stats!")
        
    # Update header.svg HUD values (optional contributions count)
    header_path = "public/header.svg"
    if os.path.exists(header_path):
        with open(header_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Update SUJITH score (formatted to 6 digits)
        score_str = f'{stats["commits"]:06d}'
        content = re.sub(r'(<text x="50" y="45" class="hud-value">)[^<]+(</text>)', rf'\g<1>{score_str}\g<2>', content)
        # Update coins
        coins_str = f'x{stats["stars"]:02d}'
        content = re.sub(r'(<text x="280" y="45" class="hud-value">)[^<]+(</text>)', rf'\g<1>{coins_str}\g<2>', content)
        
        with open(header_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated public/header.svg with latest HUD stats!")

if __name__ == "__main__":
    update_svg()
