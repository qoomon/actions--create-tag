# Create Tag

This action will create a new tag via GitHub API, tagger is related to token identity.
~~Tags are signed if a GitHub App token (`ghs_***`) is used and will be marked as `verified` in the GitHub web interface.~~
Although commits get signed, if created via GitHub api, unfortunately **tags are not signed by GitHub API**. [As of March 2024]


### Example

```yaml
jobs:
  example:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: qoomon/actions--setup-git-user@v1
      - run: |
          TAG_NAME=v1.0.0
          echo "TAG_NAME=${TAG_NAME}" >> $GITHUB_ENV

      - name: Sign tag ${{ env.TAG_NAME }}
        uses: qoomon/actions--create-tag@v1
        with:
          name: ${{ env.TAG_NAME }}

      - run: git push origin "${TAG_NAME}"
```

### Inputs

```yaml
inputs:
  name:
    description: 'The annotated tag name'
    required: true
  message:
    description: 'The annotated tag message'

  token:
    description: 'A GitHub access token'
    required: true
    default: ${{ github.token }}
  working-directory:
    description: 'The working directory'
    required: true
    default: '.'
  remoteName:
    description: 'The remote name to create the tag at.'
    required: true
    default: 'origin'
```

## Development

### Release New Action Version

Trigger [Release Version workflow](/actions/workflows/action-release.yaml)
