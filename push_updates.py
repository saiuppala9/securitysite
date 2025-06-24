import subprocess
import os
import sys
from datetime import datetime

def run_command(command):
    """Runs a command in the shell and checks for errors."""
    try:
        result = subprocess.run(command, check=True, text=True, capture_output=True)
        print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        # Don't print an error if commit fails because there's nothing to commit.
        if "nothing to commit" in e.stderr:
            return None
        print(f"Error executing command: {' '.join(command)}", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        return None

def generate_commit_message():
    """Generates a commit message based on the staged changes."""
    try:
        result = subprocess.run(["git", "status", "--porcelain"], check=True, text=True, capture_output=True)
        status_lines = result.stdout.strip().split('\n')

        if not status_lines or (len(status_lines) == 1 and not status_lines[0]):
            return None  # No changes

        changes = {"Added": [], "Modified": [], "Deleted": [], "Renamed": []}
        for line in status_lines:
            if not line:
                continue
            status, path = line[:2], line[3:]
            if status.strip() == 'A':
                changes["Added"].append(path)
            elif status.strip() == 'M':
                changes["Modified"].append(path)
            elif status.strip() == 'D':
                changes["Deleted"].append(path)
            elif status.strip().startswith('R'):
                changes["Renamed"].append(path)

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        title = f"chore: Automated update at {timestamp}"
        
        body_parts = []
        for change_type, files in changes.items():
            if files:
                body_parts.append(f'\n{change_type}:\n' + '\n'.join(f'- {f}' for f in files))
        
        body = "\n".join(body_parts)
        return f"{title}\n{body}"

    except subprocess.CalledProcessError as e:
        print("Error getting git status.", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        return None

def main():
    """Main function to add, commit, and push changes to GitHub."""
    github_username = os.getenv("saivamshiuppala")
    github_token = os.getenv("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")

    if not github_username or not github_token:
        print("Error: GITHUB_USERNAME and GITHUB_TOKEN environment variables must be set.", file=sys.stderr)
        sys.exit(1)

    print("\n--- Staging all changes ---")
    if not run_command(["git", "add", "."]):
        sys.exit(1)

    print("\n--- Generating automated commit message ---")
    commit_message = generate_commit_message()

    if not commit_message:
        print("\n\033[93mNo changes to commit. Working tree is clean.\033[0m")
        sys.exit(0)
    
    print(f"\nGenerated commit message:\n{commit_message}")

    print("\n--- Committing changes ---")
    if not run_command(["git", "commit", "-m", commit_message]):
        print("Could not commit. This might be because there are no changes.")
        # Don't exit, as we might still need to push other commits.

    print("\n--- Pushing to GitHub ---")
    repo_name = "security-services-website"
    remote_url = f"https://{github_username}:{github_token}@github.com/{github_username}/{repo_name}.git"
    run_command(["git", "remote", "set-url", "origin", remote_url])
    
    if not run_command(["git", "push", "origin", "main"]):
        sys.exit(1)

    print("\n\033[92mSuccessfully pushed all changes to GitHub!\033[0m")

if __name__ == "__main__":
    main()
