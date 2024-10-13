import sys


def create_confluence_page(confluenceAPI, page_conf, body):
    print('Confluence::create_confluence_page: start')
    response = confluenceAPI.update_or_create(page_conf["parent_id"],
                                              page_conf["page_title"],
                                              body)

    if response.get("statusCode", 200) != 200:
        sys.exit('Failed Confluence page update.')


def update_confluence_page(confluenceAPI, page_conf, body):
    space = confluenceAPI.get_page_space(page_conf["parent_id"])

    page = confluenceAPI.get_page_by_title(space, page_conf["page_title"],
                                           expand="body.storage")

    response = confluenceAPI.prepend_page(page["id"], page_conf["page_title"],
                                          body)
    if response.get("statusCode", 200) != 200:
        sys.exit('Failed Confluence page update.')


def is_page_created(confluenceAPI, page_conf):
    space = confluenceAPI.get_page_space(page_conf["parent_id"])

    return confluenceAPI.page_exists(space, page_conf["page_title"])


def get_page(confluenceAPI, page_conf):
    space = confluenceAPI.get_page_space(page_conf["parent_id"])

    page = confluenceAPI.get_page_by_title(space, page_conf["page_title"],
                                           expand="body.storage")

    return page["body"]["storage"]["value"]
