import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const REPO = "1111philo/1111-slack";
const BRANCH = "main";
const API = "https://api.github.com";

let token;

async function getToken() {
  if (token) return token;
  const ssm = new SSMClient();
  const res = await ssm.send(
    new GetParameterCommand({
      Name: process.env.GITHUB_TOKEN_PARAM,
      WithDecryption: true,
    })
  );
  token = res.Parameter.Value;
  return token;
}

/** Commit a file to the repo via the GitHub Contents API. */
export async function commitFile(path, content, message) {
  const ghToken = await getToken();
  const headers = {
    Authorization: `Bearer ${ghToken}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  // Check if file already exists (need its SHA to update)
  let sha;
  const getRes = await fetch(`${API}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, { headers });
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  const body = {
    message,
    content: Buffer.from(content).toString("base64"),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(`${API}/repos/${REPO}/contents/${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error(`GitHub API error (${putRes.status}): ${err}`);
  }
}
