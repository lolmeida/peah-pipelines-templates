import argparse
import html
import re
from datetime import datetime

BOARD_HTML_CLASS = 'multi-service-release-versions-board'

SERVICE_TEMPLATE = '''
    <tr class="{service_name}">
        <th rowspan="2" style="vertical-align: middle;">{service_name}</th> 
        <td>E2E</td> 
        <td class="{service_name}-emea-e2e">--</td> 
        <td class="{service_name}-us-e2e">--</td> 
        <td class="{service_name}-cn-e2e">--</td> 
   </tr>
   <tr> 
        <td>PROD</td> 
        <td class="{service_name}-emea-prod">--</td> 
        <td class="{service_name}-us-prod">--</td> 
        <td class="{service_name}-cn-prod">--</td> 
   </tr>
'''


def parse_args():
    parser = argparse.ArgumentParser()

    parser.add_argument('--service-name', type=str,
                        help='The name of the service', required=False,
                        default=' ')
    parser.add_argument('--region', type=str,
                        help='The region of the version', required=True)
    parser.add_argument('--environment', type=str,
                        help='The environment of the version', required=True)
    parser.add_argument('--release-version', type=str,
                        help='The release tag to generate de release notes to',
                        required=True)
    parser.add_argument('--current-body', type=str,
                        help='the current body',
                        required=True)

    return parser.parse_args()


def update_board_cell(content_to_update, region, environment, release_version,
    service_name):
    substitution_template = '<td class="{}"><label class="release-version">{}</label><br /><sup class="release-date">({})</sup></td>'

    cell_class_id = service_name + '-' + region + '-' + environment
    current_time = datetime.now().strftime("%d/%m/%Y %H:%M")

    expression_to_find = r'<td class="' + cell_class_id + '">.*?</td>'
    substitution = substitution_template.format(cell_class_id, release_version,
                                                current_time)

    updated_content = re.sub(expression_to_find, substitution,
                             content_to_update)

    return updated_content


def update_board_rows(content_to_update, service_name):
    substitution = '<tbody class="' + BOARD_HTML_CLASS + '">' + SERVICE_TEMPLATE.format(
        service_name=service_name)

    expression_to_find = r'<tbody class="' + BOARD_HTML_CLASS + '">'

    updated_content = re.sub(expression_to_find, substitution,
                             content_to_update)
    return updated_content


# tbody element with class is used to differentiate from the previous tables
# A new table will be created with the new structure
# Old one will not be changed. Allowing a smooth transition
EMPTY_BOARD = '''<table class="''' + BOARD_HTML_CLASS + '''"> 
        <thead>
            <tr>
                <th></th>
                <th>Environment</th>
                <th>EMEA</th>
                <th>US</th>
                <th>CN</th>
            </tr>
        </thead> 
        <tbody class="''' + BOARD_HTML_CLASS + '''">
        </tbody>
    </table>
    '''

if __name__ == "__main__":
    args = parse_args()

    body = html.unescape(args.current_body)
    BOARD_IDENTIFIER = BOARD_HTML_CLASS
    SERVICE_IDENTIFIER = 'class="{}"'.format(args.service_name)

    content = body or EMPTY_BOARD
    content = content.replace("production", "prod")
    content = content if BOARD_IDENTIFIER in content else content + EMPTY_BOARD
    updated_services = content if SERVICE_IDENTIFIER in content else update_board_rows(
        content, args.service_name)

    updated_release_version_board = update_board_cell(updated_services,
                                                      args.region,
                                                      args.environment,
                                                      args.release_version,
                                                      args.service_name)

    escaped_html = html.escape(updated_release_version_board).replace('\n', '')
    print(f'::set-output name=release_board::{escaped_html}')
