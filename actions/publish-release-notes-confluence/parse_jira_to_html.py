import html
import json
from datetime import datetime


def parse(release, jira_issues):
    release, issues = json.loads(release), json.loads(jira_issues)
    time = datetime.fromtimestamp(release["timestamp"]).strftime(
        "%d/%m/%Y %H:%M")

    header = '<h1>{}</h1><sub>({})</sub>'.format(
        generate_header_text(release["version"]), time)

    links = [generate_issue_link(v) for v in issues]

    if len(issues) == 0:
        body = "<h2>No new features</h2>"
    else:
        body = "<h2>New Features</h2><ul>"
        body += "".join(links) + "</ul>"

    return html.escape('<div class="release"><div class="release-header">{}</div><div class="release-body">{}</div><br /><br /></div>'.format(
        header, body))


def generate_header_text(release_label):
    return 'Changes for Version <span class="version">{}</span>'.format(
        release_label)


def generate_issue_link(data):
    formatted_text = html.escape(data["summary"])
    issue_id = data["id"]

    return '<li><a href="https://atc.bmwgroup.net/jira/browse/{0}">{0}</a>: {1}.</li>'.format(
        issue_id, formatted_text)
