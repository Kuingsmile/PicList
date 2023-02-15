import { Octokit } from '@octokit/rest'

export default class GithubApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { fileName, hash, config: { repo, token, branch, path } } = configMap
    const owner = repo.split('/')[0]
    const repoName = repo.split('/')[1]
    const octokit = new Octokit({
      auth: token
    })
    let key
    if (path === '/' || !path) {
      key = fileName
    } else {
      key = `${path.replace(/^\//, '').replace(/\/$/, '')}/${fileName}`
    }
    try {
      const result = await octokit.rest.repos.deleteFile({
        owner,
        repo: repoName,
        path: key,
        message: `delete ${fileName} by PicList`,
        sha: hash,
        branch
      })
      return result.status === 200
    } catch (error) {
      return false
    }
  }
}
