import { Octokit } from '@octokit/rest'

interface IConfigMap {
  fileName: string
  hash: string
  config: {
    repo: string
    token: string
    branch: string
    path?: string
  }
}

export default class GithubApi {
  private static createOctokit (token: string) {
    return new Octokit({
      auth: token
    })
  }

  private static createKey (path: string | undefined, fileName: string): string {
    return path && path !== '/'
      ? `${path.replace(/^\//, '').replace(/\/$/, '')}/${fileName}`
      : fileName
  }

  static async delete (configMap: IConfigMap): Promise<boolean> {
    const { fileName, hash, config: { repo, token, branch, path } } = configMap
    const [owner, repoName] = repo.split('/')
    const octokit = GithubApi.createOctokit(token)
    const key = GithubApi.createKey(path, fileName)
    try {
      const { status } = await octokit.rest.repos.deleteFile({
        owner,
        repo: repoName,
        path: key,
        message: `delete ${fileName} by PicList`,
        sha: hash,
        branch
      })
      return status === 200
    } catch (error) {
      console.error(error)
      return false
    }
  }
}
