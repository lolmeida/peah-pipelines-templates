import argparse

import parse_jira_to_html


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--release', type=str,
                        help='The release data',
                        required=True)
    parser.add_argument('--jira-issues', type=str,
                        help='The list of jira issues',
                        required=True)

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    # generate release notes html
    body = parse_jira_to_html.parse(args.release, args.jira_issues).replace(
        '\n', '')
    print(f'::set-output name=release_notes::{body}')
