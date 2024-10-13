import argparse
import html
from time import sleep
from atlassian import Confluence

import confluence


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--username', type=str,
                        help='The atlassian platform username', required=True)
    parser.add_argument('--password', type=str,
                        help='The atlassian platform password', required=True)
    parser.add_argument('--action', type=str,
                        choices=['GET', 'PREPEND', 'REPLACE'],
                        default='PREPEND',
                        help='The confluence document change strategy')
    parser.add_argument('--body', type=str,
                        help='The body', required=False)
    parser.add_argument('--parent-id', type=str,
                        help='The id of the confluence page\'s parent',
                        required=True)
    parser.add_argument('--page-title', type=str,
                        help='The title of the confluence page', required=True)

    return parser.parse_args()


def get_configs(args):
    return ({k: getattr(args, k) for k in ("username", "password")},
            {k: getattr(args, k) for k in ("parent_id", "page_title")})


def call(page_conf, action, body):
    if action == "GET":
        content = confluence.get_page(confluenceApi,
                                      page_conf) if confluence.is_page_created(
            confluenceApi,
            page_conf) else ""
        content = html.escape(content).replace('\n', '')
        print(f'::set-output name=html::{content}')
    else:
        body = html.unescape(body)
        update_existing_page = action == "PREPEND" and confluence.is_page_created(
            confluenceApi, page_conf)

        if update_existing_page:
            confluence.update_confluence_page(confluenceApi,
                                              page_conf, body)
        else:
            confluence.create_confluence_page(confluenceApi,
                                              page_conf, body)


if __name__ == "__main__":
    args = parse_args()
    project_conf, page_conf = get_configs(args)
    confluenceApi = Confluence(url='https://atc.bmwgroup.net/confluence',
                               username=project_conf["username"],
                               password=project_conf["password"])
    retry = 10
    success = True
    while success == False and retry < 0:
        try:
            call(page_conf, args.action, args.body)
        except ValueError:
            success = False
            sleep(30)
            print("Oops!  That was no valid number. Try again...")
