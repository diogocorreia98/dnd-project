# D&D Character Builder

A static D&D character builder for choosing a character presentation, species, and sub-species.

## Run locally

From the repository root, serve the files over HTTP so the browser can load the local data files:

```powershell
py -m http.server 8000
```

Open <http://localhost:8000/>.

## Publish on GitHub Pages

1. Create an empty GitHub repository and push this project to its `main` branch.
2. In GitHub, open **Settings > Pages** and set **Source** to **GitHub Actions**.
3. The included workflow deploys the site after each push to `main`.

The root page redirects to `frontend/`, while the frontend keeps its existing relative paths to `backend/data` and `frontend/assets`.
