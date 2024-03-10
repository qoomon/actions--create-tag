import * as github from '@actions/github'

/**
 * Create a commit authored and committed by octokit token identity.
 * In case of octokit token identity is a GitHub App the commit will be signed as well.
 * @param octokit - GitHub client
 * @param repository - target repository
 * @param args - commit details and file content reader
 * @returns created commit
 */
export async function createTag(octokit: ReturnType<typeof github.getOctokit>, repository: {
  owner: string,
  repo: string
}, args: CreateTagArgs) {
  console.debug('creating commit ...')
  const tag = await octokit.rest.git.createTag({
    ...repository,
    type: 'commit',
    object: args.sha,
    tag: args.tag,
    message: args.message,
    // DO NOT set tagger otherwise tag will not be verified
    // author: {
    //   name: localTag.tagger.name,
    //   email: localTag.tagger.email,
    //   date: localTag.tagger.date.toISOString(),
    // },

    // If used with GitHub Actions GITHUB_TOKEN following values are used
    // tagger.name:     github-actions[bot]
    // tagger.email:    41898282+github-actions[bot]@users.noreply.github.com

  }).then(({data}) => data)
  console.debug('tag', '>', tag.sha)

  // TODO probably remove
  // await octokit.rest.git.createRef({
  //   ...repository,
  //   ref: `refs/tags/${tag.tag}`,
  //   sha: tag.sha,
  // }).then(({data}) => data)

  return tag
}

/**
 * Get repository owner and name from url.
 * @param url - repository url
 * @returns repository owner and name
 */
export function parseRepositoryFromUrl(url: string) {
  // git@github.com:qoomon/sandbox.git
  // https://github.com/qoomon/sandbox.git
  const urlMatch = url.trim().match(/.*?(?<owner>[^/:]+)\/(?<repo>[^/]+?)(?:\.git)?$/)
  if (!urlMatch) throw new Error(`Invalid github repository url: ${url}`)
  return {
    owner: urlMatch.groups!.owner!,
    repo: urlMatch.groups!.repo!,
  }
}

export type CreateTagArgs = {
  tag: string
  message: string
  sha: string,
}
