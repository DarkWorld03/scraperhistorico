async function subirAGithub({ repo, path, content, message, token }) {
    const { Octokit } = await import("@octokit/rest");
    const octokit = new Octokit({ auth: token });
  
    const [owner, repoName] = repo.split("/");
  
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path,
      });
      sha = data.sha;
    } catch (err) {
      if (err.status !== 404) {
        console.error("❌ Error buscando archivo:", err);
        throw err;
      }
    }
  
    const resultado = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      sha,
    });
  
    return resultado;
  }
  
  module.exports = subirAGithub;
  