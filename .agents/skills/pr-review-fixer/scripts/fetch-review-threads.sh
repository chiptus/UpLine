#!/usr/bin/env bash
# Fetches unresolved PR review threads, non-empty review bodies, and issue
# comments for the current branch's PR, pre-filtered with jq so resolved
# threads and empty bodies never reach the model's context.
set -euo pipefail

pr_json=$(gh pr view --json number,url)
number=$(jq -r '.number' <<<"$pr_json")
url=$(jq -r '.url' <<<"$pr_json")
owner=$(cut -d/ -f4 <<<"$url")
repo=$(cut -d/ -f5 <<<"$url")

threads_and_reviews=$(gh api graphql -f query='
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            path
            line
            startLine
            comments(first: 10) {
              nodes { author { login } body createdAt }
            }
          }
        }
        reviews(first: 50) {
          nodes { id author { login } body state submittedAt }
        }
      }
    }
  }' -F owner="$owner" -F repo="$repo" -F number="$number" \
  --jq '{
    threads: [.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)],
    reviews: [.data.repository.pullRequest.reviews.nodes[] | select((.body // "") != "")]
  }')

issue_comments=$(gh api "repos/$owner/$repo/issues/$number/comments" \
  --jq '[.[] | {author: .user.login, body, createdAt: .created_at}]')

jq -n --argjson tr "$threads_and_reviews" --argjson ic "$issue_comments" \
  '{threads: $tr.threads, reviews: $tr.reviews, issueComments: $ic}'
